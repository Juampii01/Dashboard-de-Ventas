-- Paso G (10 oct 2026): las pantallas de cifras cargan las filas de un proyecto ordenadas por id, de 1000 en 1000.
-- Sin estos índices la base ordenaba todas las filas del proyecto en cada página. No cambia ningún dato.
create index if not exists leads_proyecto_id_idx on public.leads (proyecto_id, id);
create index if not exists actividades_proyecto_id_idx on public.actividades (proyecto_id, id);
create index if not exists citas_proyecto_id_idx on public.citas (proyecto_id, id);
create index if not exists ventas_proyecto_id_idx on public.ventas (proyecto_id, id);
