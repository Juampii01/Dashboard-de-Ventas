-- Velocidad (17 oct 2026, Cristian: «calcula el resumen de la Biblioteca dentro de la base»). KPIs → Biblioteca traía
-- todos los leads con todas sus respuestas (~1.600, medido ~160 ms) para contar en la app. Esta función hace en la
-- base lo pesado y devuelve las personas AGRUPADAS por lo que respondieron (unos cientos de filas pequeñas con «n»).
-- Las cuentas y porcentajes siguen en la app (src/lib/biblioteca.ts, resumenDeFilas), sin cambios.
-- Copia exacta de las reglas de src/lib/oferta.ts y src/lib/biblioteca.ts (si cambian allí, cambiar aquí):
--   · limpio(): minúsculas, sin acentos, sin ¿?¡!.,:;«»" y espacios simples (como `limpio` en oferta.ts)
--   · las 6 preguntas con sus nombres alternativos (PREGUNTAS_BIBLIOTECA)
--   · es de la Biblioteca: etiqueta «biblioteca recursos» o «recursos-ia», fuente «recursos» o alguna de las preguntas
--   · cada respuesta: la última no vacía de esa pregunta, sin espacios a los lados (respuestasBiblioteca)
--   · país por el prefijo del teléfono, solo si empieza por «+» (paisDeTelefono)

create or replace function public.limpio_pregunta(p text)
returns text
language sql
immutable
as $$
  select btrim(regexp_replace(
    regexp_replace(
      translate(lower(coalesce(p, '')), 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc'),
      '[¿?¡!.,:;«»"]', '', 'g'),
    '\s+', ' ', 'g'));
$$;

create or replace function public.biblioteca_filas(p_proyecto uuid)
returns table (situacion text, experiencia text, objetivo text, tiempo text, inversion text, inicio text, pais text, oferta text, n bigint)
language sql
stable
security definer
set search_path = public
as $$
  with nombres(nombre, clave) as (
    values
      ('¿En qué situación estás hoy?', 'situacion'), ('situación', 'situacion'), ('situacion', 'situacion'), ('quiz_situacion', 'situacion'),
      ('¿Qué experiencia tienes con IA?', 'experiencia'), ('experiencia ia', 'experiencia'), ('experiencia con ia', 'experiencia'), ('experiencia con ai', 'experiencia'), ('quiz_experiencia_ia', 'experiencia'),
      ('¿Qué quieres lograr en los próximos 90 días?', 'objetivo'), ('objetivo 90 días', 'objetivo'), ('objetivo 90 dias', 'objetivo'), ('objetivo a 90 días', 'objetivo'), ('quiz_objetivo_90_dias', 'objetivo'),
      ('¿Cuánto tiempo por semana le puedes dedicar?', 'tiempo'), ('tiempo semanal', 'tiempo'), ('tiempo por semana', 'tiempo'), ('quiz_tiempo_semanal', 'tiempo'),
      ('Si encuentras el programa correcto, ¿estás en condiciones de invertir en tu formación?', 'inversion'), ('inversión', 'inversion'), ('inversion', 'inversion'), ('puede invertir', 'inversion'), ('quiz_inversion', 'inversion'),
      ('¿Cuándo quieres empezar?', 'inicio'), ('inicio', 'inicio'), ('cuándo empezar', 'inicio'), ('cuando empezar', 'inicio'), ('quiz_inicio', 'inicio')
  ),
  mapa as (select distinct limpio_pregunta(nombre) as limpio, clave from nombres),
  respuestas as (
    select l.id, m.clave, x.ord, x.r ->> 'respuesta' as respuesta
    from leads l
    cross join lateral jsonb_array_elements(coalesce(l.respuestas, '[]'::jsonb)) with ordinality as x(r, ord)
    join mapa m on m.limpio = limpio_pregunta(x.r ->> 'pregunta')
    where l.proyecto_id = p_proyecto
  ),
  de_biblioteca as (
    select l.id, l.telefono, l.oferta
    from leads l
    where l.proyecto_id = p_proyecto
      and (
        exists (select 1 from unnest(coalesce(l.etiquetas, '{}')) t where lower(t) in ('biblioteca recursos', 'recursos-ia'))
        or lower(coalesce(l.fuente, '')) = 'recursos'
        or exists (select 1 from respuestas r where r.id = l.id)
      )
  ),
  ultima as (
    -- la última respuesta no vacía de cada pregunta (como el bucle de respuestasBiblioteca)
    select distinct on (r.id, r.clave) r.id, r.clave, btrim(r.respuesta) as valor
    from respuestas r
    where coalesce(r.respuesta, '') <> ''
    order by r.id, r.clave, r.ord desc
  ),
  por_lead as (
    select
      b.id,
      coalesce(max(u.valor) filter (where u.clave = 'situacion'), '') as situacion,
      coalesce(max(u.valor) filter (where u.clave = 'experiencia'), '') as experiencia,
      coalesce(max(u.valor) filter (where u.clave = 'objetivo'), '') as objetivo,
      coalesce(max(u.valor) filter (where u.clave = 'tiempo'), '') as tiempo,
      coalesce(max(u.valor) filter (where u.clave = 'inversion'), '') as inversion,
      coalesce(max(u.valor) filter (where u.clave = 'inicio'), '') as inicio,
      case
        when left(btrim(coalesce(b.telefono, '')), 1) <> '+' then 'Otro'
        else (
          select p.pais from (values
            (1, '593', 'Ecuador'), (2, '591', 'Bolivia'), (3, '595', 'Paraguay'), (4, '598', 'Uruguay'), (5, '502', 'Guatemala'),
            (6, '503', 'El Salvador'), (7, '504', 'Honduras'), (8, '505', 'Nicaragua'), (9, '506', 'Costa Rica'), (10, '507', 'Panamá'),
            (11, '34', 'España'), (12, '54', 'Argentina'), (13, '57', 'Colombia'), (14, '58', 'Venezuela'), (15, '52', 'México'),
            (16, '56', 'Chile'), (17, '51', 'Perú'), (18, '53', 'Cuba'), (19, '1', 'EE. UU./Canadá')
          ) as p(orden, prefijo, pais)
          where regexp_replace(b.telefono, '\D', '', 'g') like p.prefijo || '%'
          order by p.orden
          limit 1
        )
      end as pais,
      b.oferta
    from de_biblioteca b
    left join ultima u on u.id = b.id
    group by b.id, b.telefono, b.oferta
  )
  -- Ordenados por la primera persona (por id) de cada grupo: así, al repartirlos en la app, cada país aparece por
  -- primera vez en el mismo orden que con todos los leads ordenados por id (y los empates salen igual que antes)
  select situacion, experiencia, objetivo, tiempo, inversion, inicio, coalesce(pais, 'Otro'), oferta, count(*)
  from por_lead
  group by situacion, experiencia, objetivo, tiempo, inversion, inicio, coalesce(pais, 'Otro'), oferta
  order by (array_agg(id order by id))[1];
$$;
revoke execute on function public.biblioteca_filas(uuid) from public, anon, authenticated;
grant execute on function public.biblioteca_filas(uuid) to service_role;
