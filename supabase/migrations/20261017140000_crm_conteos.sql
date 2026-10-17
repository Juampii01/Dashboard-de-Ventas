-- Velocidad (17 oct 2026): los números de las pestañas del CRM en UNA consulta (antes, ~25 consultas a la vez:
-- una por pipeline en leads y otra por pipeline en tarjetas_extra; medido: 230-650 ms).
-- Por cada pipeline del proyecto (menos «Closers», que cuenta citas y sigue en la app):
--   leads    = leads del pipeline («Callers»: los que tienen caller), solo los de la persona si se pasa p_persona
--              (los que tiene como caller o como closer);
--   tarjetas = tarjetas 🔗 de otros pipelines (tarjetas_extra), sin filtrar por persona (como antes).
create or replace function public.crm_conteos(p_proyecto uuid, p_persona uuid default null)
returns table (pipeline_id uuid, leads bigint, tarjetas bigint)
language sql
stable
security definer
set search_path = public
as $$
  with de_la_persona as (
    select l.pipeline_id, l.caller_id
    from leads l
    where l.proyecto_id = p_proyecto
      and (p_persona is null or l.caller_id = p_persona or l.closer_id = p_persona)
  ),
  por_pipeline as (
    select d.pipeline_id, count(*) as n from de_la_persona d group by d.pipeline_id
  ),
  con_caller as (
    select count(*) as n from de_la_persona d where d.caller_id is not null
  ),
  extra as (
    select t.pipeline_id, count(*) as n from tarjetas_extra t where t.proyecto_id = p_proyecto group by t.pipeline_id
  )
  select
    p.id,
    case when p.tipo = 'callers' then (select n from con_caller) else coalesce(pp.n, 0) end,
    coalesce(e.n, 0)
  from pipelines p
  left join por_pipeline pp on pp.pipeline_id = p.id
  left join extra e on e.pipeline_id = p.id
  where p.proyecto_id = p_proyecto and p.tipo <> 'closers';
$$;
revoke execute on function public.crm_conteos(uuid, uuid) from public, anon, authenticated;
grant execute on function public.crm_conteos(uuid, uuid) to service_role;
