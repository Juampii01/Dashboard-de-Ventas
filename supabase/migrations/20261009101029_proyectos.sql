-- Proyectos de la app (Maestria es el primero).
-- Cada proyecto tiene su moneda y su zona horaria.
create table public.proyectos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  moneda text not null default 'USD' check (moneda in ('USD', 'EUR')),
  zona_horaria text not null default 'America/New_York'
    check (zona_horaria in ('America/New_York', 'Europe/Madrid')),
  creado_en timestamptz not null default now()
);

-- Sin políticas todavía: solo el servidor (clave secreta) puede leer y escribir.
-- Los permisos por rol llegan en la Fase 2.
alter table public.proyectos enable row level security;
