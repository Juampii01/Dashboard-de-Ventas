-- Fase 6 · Guion de llamadas (Cristian, 12 oct 2026): el guion del caller y el del closer de cada proyecto
-- (pasos con checklist y pistas, y objeciones con su respuesta). Lo editan el CEO y los directores.
create table public.guiones (
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  rol text not null check (rol in ('caller', 'closer')),
  contenido jsonb not null,
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid references public.perfiles (id) on delete set null,
  primary key (proyecto_id, rol)
);

-- Lo que marcó cada uno en cada llamada siguiendo el guion (para que el CEO y los directores lo revisen)
create table public.guion_marcas (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  perfil_id uuid references public.perfiles (id) on delete set null,
  rol text not null check (rol in ('caller', 'closer')),
  marcas jsonb not null default '{}'::jsonb,
  hechos integer not null default 0,
  total integer not null default 0,
  resultado text,
  creado_en timestamptz not null default now()
);
create index guion_marcas_proyecto_idx on public.guion_marcas (proyecto_id, creado_en desc);

-- Solo las usa el servidor (con la clave de servicio)
alter table public.guiones enable row level security;
alter table public.guion_marcas enable row level security;
