-- 1.0 Bloque 7 (Cristian, 10 y 11 oct 2026): reporte editable, onboarding de los closers y link de dossier.

-- Preguntas del reporte de fin de día, por rol: { caller: [ … ], closer: [ … ] }; null = las de siempre (lib/reportes).
-- Las cambian el CEO y los directores con Administración. Del closer, las 3 de las tasas no se pueden quitar.
alter table public.proyectos add column preguntas_reporte jsonb;
-- Cada reporte guarda las preguntas que tenía al enviarse (null = los de antes de este cambio: las de siempre)
alter table public.reportes add column preguntas jsonb;

-- Onboarding de los closers: checklist por cliente que marca el closer que le vendió (aparte del de clientes).
-- Los puntos los editan el CEO y los directores; por defecto, los 4 del plan (se crean al abrirlo la primera vez).
create table public.pasos_onboarding_closer (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  nombre text not null,
  orden integer not null default 0,
  unique (proyecto_id, nombre)
);
alter table public.pasos_onboarding_closer enable row level security;
alter table public.clientes add column onboarding_closer jsonb not null default '{}'::jsonb; -- {paso_id: fecha}

-- Link de dossier de cada producto (va encima del link de pago en Links y recursos)
alter table public.productos add column link_dossier text;
