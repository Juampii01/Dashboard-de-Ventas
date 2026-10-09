-- v2 · V2-3: calendario de GHL de cada closer (la app pregunta a GHL; funciona sin publicar).
-- El token es secreto: solo lo lee el servidor (RLS sin políticas) y nunca se envía al navegador.
alter table public.proyectos
  add column ghl_token text,
  add column ghl_location_id text,
  add column ghl_sincronizado_en timestamptz,
  add column ghl_ultimo_resultado text;

-- Calendario (o usuario) de GHL de cada closer en cada proyecto
alter table public.miembros_proyecto
  add column ghl_calendar_id text,
  add column ghl_user_id text;

-- Citas de GHL que no se han podido unir a un lead (para revisarlas a mano)
create table public.citas_sin_lead (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  ghl_cita_id text not null,
  ghl_contact_id text,
  closer_id uuid references public.perfiles (id) on delete set null,
  titulo text,
  fecha timestamptz,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'invalida', 'resuelta', 'descartada')),
  datos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  unique (proyecto_id, ghl_cita_id)
);
alter table public.citas_sin_lead enable row level security;
