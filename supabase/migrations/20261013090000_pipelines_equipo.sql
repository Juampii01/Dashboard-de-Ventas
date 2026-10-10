-- Paso 0 (decisiones de Cristian del 10 oct 2026): pipelines «Callers» y «Closers» en el CRM, como GHL.
-- Un lead está en su pipeline de origen y, si tiene caller, también en «Callers» (en la columna de su llamada).
-- «Closers» es Pre-call y Post-call juntos (citas y ventas). Cada pipeline tiene sus permisos (como GHL).

alter table public.pipelines
  add column tipo text not null default 'normal' check (tipo in ('normal', 'callers', 'closers'));
create unique index pipelines_tipo_unico on public.pipelines (proyecto_id, tipo) where tipo <> 'normal';

-- Columna de «Closers» unida a un estado de Pre-call o de Post-call (las libres, sin unir)
alter table public.etapas
  add column columna_cita text check (columna_cita in (
    'pendiente', 'confirmacion_pendiente', 'confirmada', 'no_califica',
    'pendientes', 'reagendadas', 'reserva', 'cuotas', 'cerradas', 'seguimiento', 'no_show', 'cancelada', 'perdida'));
create unique index etapas_cita_unica on public.etapas (pipeline_id, columna_cita) where columna_cita is not null;

-- Dónde está la tarjeta: el lead en «Callers»; la cita en «Closers» solo si se movió a una columna libre
alter table public.leads add column etapa_callers_id uuid references public.etapas (id) on delete set null;
alter table public.citas add column etapa_closers_id uuid references public.etapas (id) on delete set null;
create index leads_etapa_callers_idx on public.leads (etapa_callers_id);

-- Crea «Callers» y «Closers» de un proyecto (si no los tiene). Al final de las pestañas.
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
      (pc, 'Agendados', 3, '#2f55d4', 'agendado'),
      (pc, 'Cerrados', 4, '#16a34a', 'vendido'),
      (pc, 'Descartados', 5, '#dc2626', 'no_interesa');
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

-- Proyectos nuevos: los crea solos (desde la app o desde los scripts)
create or replace function public.proyecto_nuevo_pipelines() returns trigger
language plpgsql set search_path = public as $$
begin
  perform crear_pipelines_equipo(new.id);
  return new;
end $$;
create trigger proyectos_pipelines_equipo after insert on public.proyectos
  for each row execute function public.proyecto_nuevo_pipelines();

-- El lead va solo a la columna de «Callers» unida a su estado (botones del caller, webhooks, CSV…)
create or replace function public.lead_columna_callers() returns trigger
language plpgsql set search_path = public as $$
declare
  destino uuid;
begin
  if tg_op = 'INSERT' or new.estado_caller is distinct from old.estado_caller then
    select e.id into destino from etapas e join pipelines p on p.id = e.pipeline_id
      where p.proyecto_id = new.proyecto_id and p.tipo = 'callers' and e.estado_caller = new.estado_caller limit 1;
    if destino is not null then new.etapa_callers_id := destino; end if;
  end if;
  return new;
end $$;
create trigger leads_columna_callers before insert or update of estado_caller on public.leads
  for each row execute function public.lead_columna_callers();

-- Si cambia el estado de la cita, sale de la columna libre y vuelve a la suya
create or replace function public.cita_columna_closers() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.estado is distinct from old.estado and new.etapa_closers_id is not distinct from old.etapa_closers_id then
    new.etapa_closers_id := null;
  end if;
  return new;
end $$;
create trigger citas_columna_closers before update of estado on public.citas
  for each row execute function public.cita_columna_closers();

-- Los proyectos que ya existen
select public.crear_pipelines_equipo(id) from public.proyectos;
update public.leads l set etapa_callers_id = e.id
from public.etapas e join public.pipelines p on p.id = e.pipeline_id
where p.proyecto_id = l.proyecto_id and p.tipo = 'callers' and e.estado_caller = l.estado_caller;

-- Pipelines de origen como antes del H7 (Cristian): fuera «No contesta» y «Llamar luego» (sus leads vuelven a
-- la columna unida a «Nuevo» o a la primera) y sin uniones (los botones mueven por el nombre de la columna)
update public.leads l set etapa_id = coalesce(
    (select n.id from public.etapas n where n.pipeline_id = e.pipeline_id and n.estado_caller = 'nuevo'),
    (select n.id from public.etapas n where n.pipeline_id = e.pipeline_id and n.estado_caller is distinct from 'no_contesta' and n.estado_caller is distinct from 'llamar_luego' order by n.orden limit 1))
from public.etapas e join public.pipelines p on p.id = e.pipeline_id
where l.etapa_id = e.id and p.tipo = 'normal' and e.estado_caller in ('no_contesta', 'llamar_luego');
delete from public.etapas e using public.pipelines p
where p.id = e.pipeline_id and p.tipo = 'normal' and e.estado_caller in ('no_contesta', 'llamar_luego');
update public.etapas e set estado_caller = null from public.pipelines p where p.id = e.pipeline_id and p.tipo = 'normal';
-- Orden seguido otra vez (0, 1, 2…)
update public.etapas e set orden = x.n - 1
from (select id, row_number() over (partition by pipeline_id order by orden) as n from public.etapas) x
where x.id = e.id and e.orden <> x.n - 1;

-- Pre-call ya no se configura aparte: son las columnas de «Closers»
alter table public.proyectos drop column precall_columnas;

-- Permisos de cada pipeline (como GHL): por rol o por persona; manda la persona
create table public.permisos_pipeline (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.pipelines (id) on delete cascade,
  rol text check (rol in ('director', 'closer', 'caller')),
  perfil_id uuid references public.perfiles (id) on delete cascade,
  nivel text not null check (nivel in ('editar', 'ver', 'sin_acceso')),
  check ((rol is null) <> (perfil_id is null))
);
create unique index permisos_pipeline_rol on public.permisos_pipeline (pipeline_id, rol) where rol is not null;
create unique index permisos_pipeline_persona on public.permisos_pipeline (pipeline_id, perfil_id) where perfil_id is not null;
alter table public.permisos_pipeline enable row level security;
