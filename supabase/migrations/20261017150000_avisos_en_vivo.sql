-- Velocidad (17 oct 2026), tiempo real: cuando cambian leads, citas, tarjetas 🔗 o ventas de un proyecto, la base
-- manda un aviso al canal privado «proyecto:<id>» y las pantallas abiertas de ese proyecto se refrescan solas.
-- (Decisión de Cristian: avisos de la base SIN datos; ver docs/Mejorar-velocidad.md.)
--  · El aviso solo lleva el nombre de la tabla: ni nombres, ni teléfonos, ni emails.
--  · Un aviso por proyecto y por sentencia (no por fila): subir un CSV de 1.000 leads = 1 aviso.
--  · Una actualización que no cambia nada (p. ej. la lectura de GHL cada 30 s sin novedades) no avisa.
--  · Si el aviso falla, la escritura sigue (solo queda un WARNING en el registro de la base).
--  · Solo escuchan el canal los miembros activos del proyecto (y el CEO, que ve todos), con su sesión.

create or replace function public.avisar_cambio(p_proyectos uuid[], p_tabla text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid;
begin
  foreach pid in array coalesce(p_proyectos, '{}') loop
    begin
      perform realtime.send(jsonb_build_object('tabla', p_tabla), 'cambio', 'proyecto:' || pid::text, true);
    exception when others then
      raise warning 'avisar_cambio (%): %', p_tabla, sqlerrm;
    end;
  end loop;
end;
$$;
revoke execute on function public.avisar_cambio(uuid[], text) from public, anon, authenticated;

create or replace function public.avisar_insertadas()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform avisar_cambio(array(select distinct proyecto_id from nuevas where proyecto_id is not null), tg_table_name);
  exception when others then
    raise warning '%: %', tg_name, sqlerrm; -- la escritura sigue
  end;
  return null;
end;
$$;

create or replace function public.avisar_borradas()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform avisar_cambio(array(select distinct proyecto_id from viejas where proyecto_id is not null), tg_table_name);
  exception when others then
    raise warning '%: %', tg_name, sqlerrm; -- la escritura sigue
  end;
  return null;
end;
$$;

-- Solo las filas que de verdad cambian (fila nueva distinta de la vieja)
create or replace function public.avisar_cambiadas()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform avisar_cambio(
      array(
        select distinct n.proyecto_id from nuevas n join viejas v on v.id = n.id
        where n.proyecto_id is not null and n is distinct from v
        union
        select distinct v.proyecto_id from nuevas n join viejas v on v.id = n.id
        where v.proyecto_id is not null and n.proyecto_id is distinct from v.proyecto_id
      ),
      tg_table_name
    );
  exception when others then
    raise warning '%: %', tg_name, sqlerrm; -- la escritura sigue
  end;
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['leads', 'citas', 'tarjetas_extra', 'ventas'] loop
    execute format('drop trigger if exists aviso_insert on public.%I', t);
    execute format('drop trigger if exists aviso_update on public.%I', t);
    execute format('drop trigger if exists aviso_delete on public.%I', t);
    execute format('create trigger aviso_insert after insert on public.%I referencing new table as nuevas for each statement execute function public.avisar_insertadas()', t);
    execute format('create trigger aviso_update after update on public.%I referencing old table as viejas new table as nuevas for each statement execute function public.avisar_cambiadas()', t);
    execute format('create trigger aviso_delete after delete on public.%I referencing old table as viejas for each statement execute function public.avisar_borradas()', t);
  end loop;
end;
$$;

-- ¿Puede la persona con esta sesión escuchar este canal? (security definer: perfiles y miembros no tienen
-- permisos para los navegadores; aquí solo se responde sí o no)
create or replace function public.puede_oir_canal(p_topic text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_topic like 'proyecto:%' and exists (
    select 1 from perfiles p
    where p.id = auth.uid() and p.activo
      and (
        p.rol = 'ceo'
        or exists (select 1 from miembros_proyecto m where m.perfil_id = p.id and m.proyecto_id::text = substr(p_topic, 10))
      )
  );
$$;
revoke execute on function public.puede_oir_canal(text) from public, anon;
grant execute on function public.puede_oir_canal(text) to authenticated;

-- Permiso para recibir los avisos (solo si Realtime está instalado en esta base)
do $$
begin
  if to_regclass('realtime.messages') is not null then
    execute 'drop policy if exists "miembros reciben los avisos de su proyecto" on realtime.messages';
    execute $p$
      create policy "miembros reciben los avisos de su proyecto" on realtime.messages
      for select to authenticated
      using (realtime.messages.extension = 'broadcast' and public.puede_oir_canal((select realtime.topic())))
    $p$;
  else
    raise warning 'realtime.messages no existe: sin permiso de avisos (el tiempo real no llegará a nadie)';
  end if;
end;
$$;
