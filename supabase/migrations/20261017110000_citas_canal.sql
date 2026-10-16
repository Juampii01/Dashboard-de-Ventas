-- Plan GHL, fase 1 (Cristian, 16 oct 2026): saber de qué calendario y de qué canal viene cada cita.
-- Las citas se leen solo con la API de GHL (sin workflows). El canal sale del UTM de la página donde reservó
-- (`/agenda?utm_source=yt`…) o de la página vieja (`/agenda-yt`, `/agenda-ig`); sin UTM, «directo».
-- Idea tomada del commit a1fa7d8 de Juampi (columnas en `citas`), con el canal sacado del UTM.

-- canal: callers | yt | ig | email | biblioteca | webinar | dfy | directo (null = sin dato, citas de antes del 13 oct)
-- ghl_calendario: nombre del calendario de GHL · origen_url: página desde la que reservó (con su UTM)
alter table public.citas
  add column canal text,
  add column ghl_calendario text,
  add column origen_url text;
create index citas_canal_idx on public.citas (proyecto_id, canal);

-- Calendarios de GHL que lee la app (ids). Se cambian en Administración → Integraciones.
alter table public.proyectos add column ghl_calendarios text[] not null default '{}';

-- Maestria (16 oct): «0. Calendar Principal», «#2 Callers - Maestria» y «#1 Maestria founders»
update public.proyectos
set ghl_calendarios = array['X7qpsbS2ChORZkwO4O3f', 'GwExej8dLssPn2lprUzf', 'eYQg0BzILAvnzdwLNXGQ']
where ghl_location_id = 'ZGWJLBH58RJtl2iGhykp';
