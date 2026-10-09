-- v2 · V2-7: Clientes (= leads con al menos una venta). Respuestas de Cristian del 9 oct 2026.
-- La ficha de cliente se crea la primera vez que se toca (si no existe, el cliente está «activo» y sin nada más).
create table public.clientes (
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  estado text not null default 'activo' check (estado in ('activo', 'pausado', 'abandonado')), -- a mano
  proximo_contacto date, -- Seguimiento
  caso_exito boolean not null default false,
  caso_resultado text,
  caso_enlace text, -- vídeo o web del testimonio (solo https)
  caso_fecha date,
  onboarding jsonb not null default '{}'::jsonb, -- {paso_id: fecha en que se hizo}
  actualizado_en timestamptz not null default now(),
  primary key (proyecto_id, lead_id)
);

-- Notas de seguimiento de cada cliente
create table public.seguimientos_cliente (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  nota text not null,
  perfil_id uuid references public.perfiles (id) on delete set null,
  creado_en timestamptz not null default now()
);
create index seguimientos_cliente_idx on public.seguimientos_cliente (proyecto_id, lead_id, creado_en desc);

-- Pasos del onboarding (los edita quien tiene la sección)
create table public.pasos_onboarding (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  nombre text not null,
  orden integer not null default 0,
  unique (proyecto_id, nombre)
);

alter table public.clientes enable row level security;
alter table public.seguimientos_cliente enable row level security;
alter table public.pasos_onboarding enable row level security;
