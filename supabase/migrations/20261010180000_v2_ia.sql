-- v2 · V2-10: IA. Decisiones de Cristian (9 oct 2026): modelo Claude Sonnet 5.5, clave en el servidor
-- (ANTHROPIC_API_KEY, nunca en la base de datos) y cada llamada se analiza sola al conciliar su grabación.

-- «Configurar IA»: alcance general (producto_id vacío) o por producto, contexto del negocio y agentes
create table public.config_ia (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  producto_id uuid references public.productos (id) on delete cascade, -- null = general
  contexto text,
  agentes jsonb not null default '{}'::jsonb, -- {agente: {activo, instrucciones}}
  actualizado_en timestamptz not null default now()
);
create unique index config_ia_alcance on public.config_ia (proyecto_id, coalesce(producto_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Un análisis por grabación (se rehace con «Re-analizar»)
create table public.analisis_llamadas (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  grabacion_id uuid not null unique references public.grabaciones (id) on delete cascade,
  cita_id uuid references public.citas (id) on delete set null,
  closer_id uuid references public.perfiles (id) on delete set null,
  lead_id uuid references public.leads (id) on delete set null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'procesando', 'hecho', 'error')),
  modelo text,
  puntuacion integer,
  resultado text check (resultado in ('cerrado', 'no_cerrado', 'seguimiento')),
  resumen text,
  secciones jsonb not null default '{}'::jsonb, -- lo que dice cada agente
  autocompletado jsonb, -- {estado, estrellas, nota} que propone la IA para cerrar la cita
  autocompletado_estado text check (autocompletado_estado in ('pendiente', 'aceptado', 'rechazado')),
  tokens jsonb,
  error text,
  evaluacion_manual integer check (evaluacion_manual between 1 and 10),
  evaluacion_nota text,
  evaluado_por uuid references public.perfiles (id) on delete set null,
  evaluado_en timestamptz,
  empezado_en timestamptz,
  analizado_en timestamptz,
  creado_en timestamptz not null default now()
);
create index analisis_proyecto_idx on public.analisis_llamadas (proyecto_id, estado);

-- «Scoring IA»: puntos por respuesta del formulario que propone la IA a partir del estudio (sin datos personales)
create table public.scoring_ia (
  proyecto_id uuid primary key references public.proyectos (id) on delete cascade,
  pesos jsonb not null default '{}'::jsonb, -- {pregunta: {respuesta: puntos de -10 a 10}}
  explicacion text,
  modelo text,
  creado_en timestamptz not null default now()
);

alter table public.config_ia enable row level security;
alter table public.analisis_llamadas enable row level security;
alter table public.scoring_ia enable row level security;
