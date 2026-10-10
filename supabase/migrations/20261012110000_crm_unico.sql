-- Paso H7 (decisiones de Cristian del 10 oct 2026): un solo CRM para todos.
-- Cada columna de un pipeline se puede unir a un estado del lead (el resultado de llamada del caller):
-- los botones mueven la tarjeta a esa columna y arrastrar a esa columna cambia el estado.

alter table public.etapas
  add column estado_caller text check (estado_caller in ('nuevo', 'no_contesta', 'llamar_luego', 'agendado', 'no_interesa', 'vendido'));
-- Un estado, como mucho una columna por pipeline
create unique index etapas_estado_unico on public.etapas (pipeline_id, estado_caller) where estado_caller is not null;

-- Unir las columnas que ya existen por su nombre (lo que la app ya hacía al agendar, descartar o vender)
with candidatas as (
  select id, case lower(trim(nombre))
      when 'nuevos' then 'nuevo' when 'nuevo' then 'nuevo'
      when 'agendados' then 'agendado' when 'agendado' then 'agendado'
      when 'descartados' then 'no_interesa' when 'descartado' then 'no_interesa'
      when 'cerrados' then 'vendido' when 'cerrado' then 'vendido'
    end as estado,
    row_number() over (partition by pipeline_id, case lower(trim(nombre))
      when 'nuevos' then 'nuevo' when 'nuevo' then 'nuevo'
      when 'agendados' then 'agendado' when 'agendado' then 'agendado'
      when 'descartados' then 'no_interesa' when 'descartado' then 'no_interesa'
      when 'cerrados' then 'vendido' when 'cerrado' then 'vendido' end order by orden, id) as n
  from public.etapas
)
update public.etapas e set estado_caller = c.estado from candidatas c where c.id = e.id and c.estado is not null and c.n = 1;

-- Columnas nuevas «No contesta» y «Llamar luego» en cada pipeline, detrás de la unida a «Nuevo» (o al final)
do $$
declare
  p record;
  pos integer;
begin
  for p in select id from public.pipelines loop
    if exists (select 1 from public.etapas where pipeline_id = p.id and estado_caller = 'no_contesta') then
      continue;
    end if;
    select orden + 1 into pos from public.etapas where pipeline_id = p.id and estado_caller = 'nuevo';
    if pos is null then
      select coalesce(max(orden), -1) + 1 into pos from public.etapas where pipeline_id = p.id;
    end if;
    update public.etapas set orden = orden + 2 where pipeline_id = p.id and orden >= pos;
    insert into public.etapas (pipeline_id, nombre, orden, color, estado_caller) values
      (p.id, 'No contesta', pos, '#94a3b8', 'no_contesta'),
      (p.id, 'Llamar luego', pos + 1, '#d97706', 'llamar_luego');
  end loop;
end $$;

-- Sincronizar: los leads con ese estado que están en la columna «Nuevo» pasan a su columna (el resto no se toca)
update public.leads l set etapa_id = destino.id
from public.etapas nuevo, public.etapas destino
where l.etapa_id = nuevo.id and nuevo.estado_caller = 'nuevo'
  and destino.pipeline_id = nuevo.pipeline_id and destino.estado_caller = l.estado_caller
  and l.estado_caller in ('no_contesta', 'llamar_luego');

-- Nombre, color y orden de las 4 columnas de Pre-call (los estados de la cita no cambian). Vacío = los de siempre.
alter table public.proyectos add column precall_columnas jsonb;
