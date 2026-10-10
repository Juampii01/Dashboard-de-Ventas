-- 1.0 Bloque 2 (Cristian, 11 oct 2026): reparto automático de leads al entrar (GHL, landings y CSV) con % por caller.
-- Sustituye a «a mano / rotativo / por horarios»: apagado = a mano; encendido = % por caller (tienen que sumar 100),
-- con la opción «solo a quien esté en su horario» (si en ese momento no hay nadie en su horario, se reparte igual
-- entre todos los que tienen %). Apagado y todo al 0 % por defecto: lo configuran los directores.
alter table public.proyectos
  add column reparto_auto boolean not null default false,
  add column reparto_solo_horario boolean not null default false;
alter table public.proyectos drop constraint if exists proyectos_modo_reparto_check;
alter table public.proyectos drop column modo_reparto;
alter table public.proyectos drop column rotacion_indice;
drop function if exists public.avanzar_rotacion(uuid, integer);

-- % de cada caller y cuántos leads le ha dado el reparto automático desde la última vez que se cambiaron los %
alter table public.miembros_proyecto
  add column reparto_pct numeric(5, 2) not null default 0 check (reparto_pct >= 0 and reparto_pct <= 100),
  add column reparto_cuenta integer not null default 0;

-- Elige a quién va cada uno de los n leads, entre los candidatos (callers con % > 0), según su peso: cada lead va a
-- quien tenga menos leads para su % ((cuenta + 1) / %; a igualdad, el primero de la lista del equipo). Bloquea las
-- filas de los candidatos mientras decide, así dos leads que llegan a la vez no se reparten con la misma cuenta.
create or replace function public.repartir_por_pct(p_proyecto uuid, p_n integer, p_candidatos uuid[])
returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  elegidos uuid[] := '{}';
  quien uuid;
begin
  perform 1 from miembros_proyecto
  where proyecto_id = p_proyecto and perfil_id = any (p_candidatos) and reparto_pct > 0
  order by perfil_id
  for update;
  for i in 1 .. greatest(p_n, 0) loop
    select perfil_id into quien from miembros_proyecto
    where proyecto_id = p_proyecto and perfil_id = any (p_candidatos) and reparto_pct > 0
    order by (reparto_cuenta + 1) / reparto_pct, orden, perfil_id
    limit 1;
    exit when quien is null;
    update miembros_proyecto set reparto_cuenta = reparto_cuenta + 1 where proyecto_id = p_proyecto and perfil_id = quien;
    elegidos := elegidos || quien;
  end loop;
  return elegidos;
end;
$$;
revoke execute on function public.repartir_por_pct(uuid, integer, uuid[]) from public, anon, authenticated;
grant execute on function public.repartir_por_pct(uuid, integer, uuid[]) to service_role;
