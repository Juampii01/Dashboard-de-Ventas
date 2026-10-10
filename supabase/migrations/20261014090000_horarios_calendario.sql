-- 1.0 Bloque 1 (Cristian, 11 oct 2026): horario y disponibilidad como los calendarios de GHL.
-- miembros_proyecto.horario pasa a { semana: { "1": [{desde, hasta}, …], … }, fechas: { "AAAA-MM-DD": [ … ] } }
-- (varios tramos por día; una fecha sin tramos = libre todo el día). Siempre en la hora del proyecto.

-- Los horarios de V2-11 ({ dias, desde, hasta }) se pasan al formato nuevo sin perder ninguno.
-- Un turno que pasaba de medianoche se parte: hasta las 24:00 y desde las 00:00 del día siguiente.
update public.miembros_proyecto m
set horario = jsonb_build_object('semana', s.semana, 'fechas', '{}'::jsonb)
from (
  select perfil_id, proyecto_id, jsonb_object_agg(dia::text, tramos) as semana
  from (
    select perfil_id, proyecto_id, dia, jsonb_agg(jsonb_build_object('desde', desde, 'hasta', hasta) order by desde) as tramos
    from (
      select mp.perfil_id, mp.proyecto_id, d::int as dia, mp.horario->>'desde' as desde,
             case when mp.horario->>'desde' < mp.horario->>'hasta' then mp.horario->>'hasta' else '24:00' end as hasta
      from public.miembros_proyecto mp, jsonb_array_elements_text(mp.horario->'dias') d
      where mp.horario ? 'dias'
      union all
      select mp.perfil_id, mp.proyecto_id, case when d::int = 7 then 1 else d::int + 1 end, '00:00', mp.horario->>'hasta'
      from public.miembros_proyecto mp, jsonb_array_elements_text(mp.horario->'dias') d
      where mp.horario ? 'dias' and mp.horario->>'desde' > mp.horario->>'hasta' and mp.horario->>'hasta' <> '00:00'
    ) t
    group by perfil_id, proyecto_id, dia
  ) por_dia
  group by perfil_id, proyecto_id
) s
where m.perfil_id = s.perfil_id and m.proyecto_id = s.proyecto_id and m.horario ? 'dias';

-- Ajustes de las llamadas de los closers (como un calendario de GHL), en minutos; max_dia null = sin máximo.
-- Los del proyecto valen para todos; el administrador puede ponerle a un closer los suyos.
alter table public.proyectos
  add column calendario jsonb not null default '{"duracion": 30, "descanso": 0, "aviso": 0, "max_dia": null}'::jsonb;
alter table public.miembros_proyecto add column calendario jsonb;
