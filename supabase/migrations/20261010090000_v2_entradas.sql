-- v2 · Bloque V2-0: datos de entrada completos, estrellas y devoluciones.
-- Solo AÑADE columnas y una tabla: no cambia ni borra nada de lo que ya existe.

-- ---------- Leads: de dónde viene y todo lo que mandó ----------
alter table public.leads
  add column fuente text,                                   -- `source` de la landing (p. ej. «recursos»)
  add column evento text,                                   -- `event` (p. ej. «Masterclass AI 2026-10-15»)
  add column seguimiento jsonb not null default '{}'::jsonb, -- UTM, fbclid, gclid, ttclid, page_url, referrer
  add column quiz_score numeric,
  add column datos jsonb not null default '{}'::jsonb,       -- todos los campos recibidos, tal cual
  add column estrellas_caller smallint check (estrellas_caller between 1 and 5);
create index leads_evento_idx on public.leads (proyecto_id, evento);
create index leads_telefono_idx on public.leads (proyecto_id, telefono);

-- ---------- Citas: estrellas del caller (al agendar) y del closer (al cerrar la llamada) ----------
alter table public.citas
  add column estrellas_caller smallint check (estrellas_caller between 1 and 5),
  add column estrellas_closer smallint check (estrellas_closer between 1 and 5);

-- ---------- Ventas: devoluciones (la comisión ya pagada no se descuenta) ----------
alter table public.ventas
  add column devuelto numeric(12, 2) check (devuelto > 0),
  add column devuelto_en timestamptz,
  add column devolucion_nota text;

-- ---------- Entradas: una dirección por landing ----------
-- Reglas tipo GHL: [{ "campo", "operador": igual|contiene|existe|no_existe, "valor",
--                     "pipeline_id", "etapa_id", "etiqueta" }]
create table public.entradas (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  nombre text not null,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  pipeline_id uuid references public.pipelines (id) on delete set null,
  etapa_id uuid references public.etapas (id) on delete set null,
  reglas jsonb not null default '[]'::jsonb,
  activa boolean not null default true,
  creado_en timestamptz not null default now()
);
create index entradas_proyecto_idx on public.entradas (proyecto_id);
alter table public.entradas enable row level security;

-- Cada envío recibido queda guardado entero, unido a su entrada y a su lead
alter table public.webhook_eventos
  add column entrada_id uuid references public.entradas (id) on delete set null,
  add column lead_id uuid references public.leads (id) on delete set null;
create index webhook_eventos_entrada_idx on public.webhook_eventos (entrada_id, recibido_en desc);
