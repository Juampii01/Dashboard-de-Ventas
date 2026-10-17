-- Espejo de pipelines de GHL (Cristian, 17 oct 2026): en «2. Webinar 1» la app pone a cada lead en la misma columna
-- que su oportunidad de GHL y lo mueve cuando GHL la mueve. Aquí se guarda la última columna de GHL vista de cada
-- oportunidad: así la app solo mueve una tarjeta cuando cambia en GHL (y no deshace lo que mueva el equipo en la app).
create table public.ghl_espejo (
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  opp_id text not null,
  contact_id text,
  pipeline_ghl text not null,
  etapa_ghl text not null,
  actualizado_en timestamptz not null default now(),
  primary key (proyecto_id, opp_id)
);
-- Solo la usa el servidor (clave secreta): sin políticas
alter table public.ghl_espejo enable row level security;
