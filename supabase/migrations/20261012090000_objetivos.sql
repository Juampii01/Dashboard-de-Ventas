-- Paso H3 (decisiones de Cristian del 10 oct 2026): objetivos diarios, semanales, mensuales y de lanzamiento,
-- por rol o por persona (manda la persona). Solo se leen y escriben desde el servidor.

-- Lanzamiento = nombre + fechas (pueden coincidir con otros) + evento de los leads opcional
create table public.lanzamientos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  nombre text not null check (length(trim(nombre)) between 1 and 120),
  inicio date not null,
  fin date not null,
  evento text, -- si viene, solo cuentan los leads de ese evento
  creado_en timestamptz not null default now(),
  check (fin >= inicio)
);
create index lanzamientos_proyecto_idx on public.lanzamientos (proyecto_id, inicio desc);
alter table public.lanzamientos enable row level security;

-- Cada cambio es una fila nueva: así el histórico guarda el objetivo que había («vale desde esa semana»).
-- valor nulo = objetivo quitado desde ese momento.
create table public.objetivos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  rol text check (rol in ('caller', 'closer', 'director')),
  perfil_id uuid references public.perfiles (id) on delete cascade,
  periodo text not null check (periodo in ('dia', 'semana', 'mes', 'lanzamiento')),
  lanzamiento_id uuid references public.lanzamientos (id) on delete cascade,
  cifra text not null check (cifra in ('llamadas', 'contactados', 'agendas', 'citas_atendidas', 'asistencias', 'ventas', 'facturacion', 'cash')),
  valor numeric check (valor is null or valor > 0),
  dias smallint[] not null default '{1,2,3,4,5}', -- solo para el diario; 1 = lunes … 7 = domingo
  creado_por uuid references public.perfiles (id) on delete set null,
  creado_en timestamptz not null default now(),
  check ((rol is null) <> (perfil_id is null)),
  check ((periodo = 'lanzamiento') = (lanzamiento_id is not null))
);
create index objetivos_proyecto_idx on public.objetivos (proyecto_id, creado_en);
alter table public.objetivos enable row level security;
