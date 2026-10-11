-- 4.4 · Agendar por link de GHL (Cristian, 11 oct 2026): el caller manda al lead el link del calendario de GHL y
-- en la app marca «Link enviado». La agenda cuenta cuando llega la cita de GHL, a nombre de quien envió el link
-- (o del caller del lead si nadie lo marcó). Si a los 2 días no ha llegado la cita, vuelve a la cola del caller.

-- Estado nuevo del lead
alter table public.leads drop constraint leads_estado_caller_check;
alter table public.leads add constraint leads_estado_caller_check
  check (estado_caller in ('nuevo', 'no_contesta', 'llamar_luego', 'link_enviado', 'agendado', 'no_interesa', 'vendido'));
alter table public.etapas drop constraint etapas_estado_caller_check;
alter table public.etapas add constraint etapas_estado_caller_check
  check (estado_caller in ('nuevo', 'no_contesta', 'llamar_luego', 'link_enviado', 'agendado', 'no_interesa', 'vendido'));

-- Quién y cuándo envió el link (para el mérito de la agenda y para devolverlo a la cola)
alter table public.leads add column link_enviado_por uuid references public.perfiles (id) on delete set null;
alter table public.leads add column link_enviado_en timestamptz;

-- El link del calendario de GHL del proyecto (lo pone un administrador)
alter table public.proyectos add column link_agenda text check (link_agenda is null or link_agenda ~ '^https://');

-- Columna «Link enviado» en el pipeline «Callers» que ya existe (detrás de «Llamar luego»)
update public.etapas e set orden = e.orden + 1
from public.pipelines p
where p.id = e.pipeline_id and p.tipo = 'callers'
  and e.orden >= coalesce((select l.orden + 1 from public.etapas l where l.pipeline_id = e.pipeline_id and l.estado_caller = 'llamar_luego'), 3)
  and not exists (select 1 from public.etapas x where x.pipeline_id = e.pipeline_id and x.estado_caller = 'link_enviado');
insert into public.etapas (pipeline_id, nombre, orden, color, estado_caller)
select p.id, 'Link enviado', coalesce((select l.orden + 1 from public.etapas l where l.pipeline_id = p.id and l.estado_caller = 'llamar_luego'), 3), '#0891b2', 'link_enviado'
from public.pipelines p
where p.tipo = 'callers' and not exists (select 1 from public.etapas x where x.pipeline_id = p.id and x.estado_caller = 'link_enviado');

-- Y en los proyectos nuevos
create or replace function public.crear_pipelines_equipo(p_proyecto uuid) returns void
language plpgsql set search_path = public as $$
declare
  pc uuid;
begin
  if not exists (select 1 from pipelines where proyecto_id = p_proyecto and tipo = 'callers') then
    insert into pipelines (proyecto_id, nombre, orden, tipo) values (p_proyecto, 'Callers', 1000, 'callers') returning id into pc;
    insert into etapas (pipeline_id, nombre, orden, color, estado_caller) values
      (pc, 'Nuevos', 0, '#64748b', 'nuevo'),
      (pc, 'No contesta', 1, '#94a3b8', 'no_contesta'),
      (pc, 'Llamar luego', 2, '#d97706', 'llamar_luego'),
      (pc, 'Link enviado', 3, '#0891b2', 'link_enviado'),
      (pc, 'Agendados', 4, '#2f55d4', 'agendado'),
      (pc, 'Cerrados', 5, '#16a34a', 'vendido'),
      (pc, 'Descartados', 6, '#dc2626', 'no_interesa');
  end if;
  if not exists (select 1 from pipelines where proyecto_id = p_proyecto and tipo = 'closers') then
    insert into pipelines (proyecto_id, nombre, orden, tipo) values (p_proyecto, 'Closers', 1001, 'closers') returning id into pc;
    insert into etapas (pipeline_id, nombre, orden, color, columna_cita) values
      (pc, 'Pendiente', 0, 'var(--aviso)', 'pendiente'),
      (pc, 'Confirmación pendiente', 1, 'var(--oro)', 'confirmacion_pendiente'),
      (pc, 'Confirmado', 2, 'var(--ok)', 'confirmada'),
      (pc, 'No califica', 3, 'var(--mal)', 'no_califica'),
      (pc, 'Pendientes (ya pasaron)', 4, 'var(--aviso)', 'pendientes'),
      (pc, 'Reagendadas', 5, 'var(--oro)', 'reagendadas'),
      (pc, 'Reserva', 6, 'var(--primario)', 'reserva'),
      (pc, 'Cuotas', 7, 'var(--morado)', 'cuotas'),
      (pc, 'Cerradas', 8, 'var(--ok)', 'cerradas'),
      (pc, 'En seguimiento', 9, 'var(--oro)', 'seguimiento'),
      (pc, 'No-show', 10, 'var(--mal)', 'no_show'),
      (pc, 'Canceladas', 11, 'var(--texto-3)', 'cancelada'),
      (pc, 'Perdidas', 12, 'var(--mal)', 'perdida');
  end if;
end $$;
