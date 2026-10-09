-- v2 · V2-11 (respuestas de Cristian del 9 oct 2026): reparto por horarios y llamadas de GHL grabadas y analizadas.

-- Turno de cada caller: {dias: [1..7] (1 = lunes), desde: "09:00", hasta: "14:00"} en la hora del proyecto
alter table public.miembros_proyecto add column horario jsonb;
alter table public.proyectos drop constraint if exists proyectos_modo_reparto_check;
alter table public.proyectos add constraint proyectos_modo_reparto_check check (modo_reparto in ('manual', 'rotativo', 'horarios'));

-- Llamadas de la subcuenta de GHL (todas las contestadas de más de 1 minuto): transcripción (GHL o Deepgram) y análisis
alter table public.proyectos add column ghl_llamadas_sincronizado_en timestamptz;
create table public.llamadas_ghl (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  ghl_message_id text not null,
  ghl_contact_id text,
  ghl_user_id text,
  lead_id uuid references public.leads (id) on delete set null,
  perfil_id uuid references public.perfiles (id) on delete set null, -- quien llamó (si su usuario de GHL está puesto)
  fecha timestamptz,
  duracion integer, -- segundos
  direccion text, -- inbound / outbound
  transcripcion jsonb, -- [{quien, inicio (s), texto}]
  fuente text check (fuente in ('ghl', 'deepgram')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'procesando', 'hecho', 'error', 'sin_audio')),
  error text,
  puntuacion integer,
  analisis jsonb, -- {resumen, interes, objeciones, coaching, siguiente_paso}
  empezado_en timestamptz,
  creado_en timestamptz not null default now(),
  unique (proyecto_id, ghl_message_id)
);
create index llamadas_ghl_idx on public.llamadas_ghl (proyecto_id, fecha desc);
alter table public.llamadas_ghl enable row level security;
