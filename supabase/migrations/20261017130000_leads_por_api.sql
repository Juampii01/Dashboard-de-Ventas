-- Leads nuevos de GHL por la API (Cristian, 16 oct 2026): cada 30 s, junto a las citas, la app lee las
-- oportunidades nuevas de todos los pipelines de GHL y las mete en su pipeline (sin workflows).

-- Hasta dónde se ha leído (fecha de creación de la oportunidad más nueva vista). Vacío = aún no activado:
-- la primera lectura solo lo marca (lo anterior se trae una vez con scripts/igualar-ghl.mjs).
alter table public.proyectos add column ghl_leads_hasta timestamptz;

-- Oportunidades ya leídas (para no repetirlas y para completar las respuestas que llegan un poco después).
-- Se guardan 3 días.
create table public.ghl_oportunidades_vistas (
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  opp_id text not null,
  contact_id text,
  n_respuestas integer not null default 0,
  visto_en timestamptz not null default now(),
  primary key (proyecto_id, opp_id)
);
create index ghl_oportunidades_vistas_en on public.ghl_oportunidades_vistas (proyecto_id, visto_en);
-- Solo la usa el servidor (clave secreta): sin políticas
alter table public.ghl_oportunidades_vistas enable row level security;
