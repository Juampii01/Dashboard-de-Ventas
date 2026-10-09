-- v2 · V2-9: Fathom por API (decisión de Cristian). Cada closer añade su cuenta: nombre, API key y formato de título.
-- La API key solo se escribe: nunca vuelve al navegador.
create table public.cuentas_fathom (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  perfil_id uuid not null references public.perfiles (id) on delete cascade, -- closer dueño de las grabaciones
  nombre text not null,
  api_key text not null,
  formato_titulo text, -- p. ej. «{nombre cliente}: Sesión estratégica» para sacar el nombre del título
  sincronizado_en timestamptz,
  ultimo_resultado text,
  creado_en timestamptz not null default now()
);

-- Grabaciones traídas de Fathom (GET /meetings) y su conciliación con una cita
create table public.grabaciones (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  cuenta_id uuid references public.cuentas_fathom (id) on delete set null,
  closer_id uuid references public.perfiles (id) on delete set null,
  recording_id bigint not null,
  titulo text,
  url text,
  share_url text,
  inicio timestamptz, -- scheduled_start_time (o recording_start_time si no hay)
  fin timestamptz,
  invitados jsonb not null default '[]'::jsonb, -- calendar_invitees
  resumen text, -- default_summary.markdown_formatted
  transcripcion jsonb, -- transcript (para el análisis con IA, V2-10)
  cita_id uuid references public.citas (id) on delete set null,
  conciliacion text not null default 'pendiente' check (conciliacion in ('pendiente', 'auto', 'manual', 'descartada')),
  motivo text, -- cómo se concilió o por qué no
  creado_en timestamptz not null default now(),
  unique (proyecto_id, recording_id)
);
create index grabaciones_proyecto_idx on public.grabaciones (proyecto_id, inicio desc);

alter table public.cuentas_fathom enable row level security;
alter table public.grabaciones enable row level security;
