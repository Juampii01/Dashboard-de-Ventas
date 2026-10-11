-- 1.0 Bloque 3 (Cristian, 11 oct 2026): rotación de closers, como los calendarios con rotación de GHL.
-- % por closer (todos al 0 % = apagada) y cómo se elige el closer al agendar:
--   «elige»   = lo elige quien agenda (por defecto, como hasta ahora)
--   «propone» = lo propone la rotación y se puede cambiar
--   «decide»  = lo decide la rotación (el servidor pone el closer aunque se intente otro)
-- Toca el closer con menos citas para su % que esté libre a esa hora (bloque 1); las citas de GHL no cuentan.
alter table public.proyectos
  add column rotacion_modo text not null default 'elige' check (rotacion_modo in ('elige', 'propone', 'decide'));
alter table public.miembros_proyecto
  add column rotacion_pct numeric(5, 2) not null default 0 check (rotacion_pct >= 0 and rotacion_pct <= 100),
  add column rotacion_cuenta integer not null default 0;

-- Suma 1 a la cuenta de un closer (cada cita que se le da con la rotación encendida), en un solo paso
create or replace function public.sumar_rotacion(p_proyecto uuid, p_closer uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.miembros_proyecto set rotacion_cuenta = rotacion_cuenta + 1
  where proyecto_id = p_proyecto and perfil_id = p_closer and rotacion_pct > 0;
$$;
revoke execute on function public.sumar_rotacion(uuid, uuid) from public, anon, authenticated;
grant execute on function public.sumar_rotacion(uuid, uuid) to service_role;
