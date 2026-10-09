-- v2 · V2-2 y V2-3: estado «confirmación pendiente» (pre-call) y citas de GHL sin duplicados.
-- Solo amplía: no cambia ni borra datos.
alter table public.citas drop constraint citas_estado_check;
alter table public.citas add constraint citas_estado_check
  check (estado in ('pendiente', 'confirmacion_pendiente', 'confirmada', 'no_califica', 'cerrada', 'seguimiento', 'no_show', 'reagendada', 'cancelada', 'perdida'));

-- Una cita de GHL solo puede existir una vez por proyecto (webhook repetido o sincronización)
create unique index citas_ghl_unica on public.citas (proyecto_id, ghl_cita_id) where ghl_cita_id is not null;
