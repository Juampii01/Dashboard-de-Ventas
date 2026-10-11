-- Esquema completo de Eternity (v1).
-- Seguridad: RLS activado en todas las tablas y SIN políticas.
-- Nadie accede desde el navegador; el servidor de la app usa la clave
-- secreta y comprueba el rol del usuario en cada acción.

-- ---------- Proyectos: campos extra ----------
alter table public.proyectos
  add column modo_reparto text not null default 'manual'
    check (modo_reparto in ('manual', 'rotativo')),
  add column rotacion_indice integer not null default 0,
  add column webhook_secreto text not null default encode(extensions.gen_random_bytes(18), 'hex'),
  add column aviso_webhook_url text,
  add column color text not null default '#2f55d4';

-- ---------- Perfiles (un perfil por usuario de Supabase Auth) ----------
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  email text not null,
  rol text not null check (rol in ('ceo', 'director', 'closer', 'caller')),
  telefono text,
  whatsapp text,
  admin_activo boolean not null default false, -- director con acceso al panel de admin
  onboarding_completo boolean not null default false,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table public.miembros_proyecto (
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  perfil_id uuid not null references public.perfiles (id) on delete cascade,
  orden integer not null default 0, -- orden en el reparto rotativo
  primary key (proyecto_id, perfil_id)
);

-- ---------- CRM: pipelines y columnas ----------
create table public.pipelines (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  nombre text not null,
  orden integer not null default 0,
  creado_en timestamptz not null default now()
);

create table public.etapas (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.pipelines (id) on delete cascade,
  nombre text not null,
  orden integer not null default 0,
  color text not null default '#64748b'
);

-- ---------- Leads ----------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  ghl_contact_id text,
  nombre text not null default '',
  apellido text not null default '',
  email text,
  telefono text,
  etiquetas text[] not null default '{}',
  respuestas jsonb not null default '[]'::jsonb, -- [{pregunta, respuesta}]
  origen text not null default 'manual' check (origen in ('csv', 'ghl', 'manual')),
  pipeline_id uuid references public.pipelines (id) on delete set null,
  etapa_id uuid references public.etapas (id) on delete set null,
  caller_id uuid references public.perfiles (id) on delete set null,
  closer_id uuid references public.perfiles (id) on delete set null,
  estado_caller text not null default 'nuevo'
    check (estado_caller in ('nuevo', 'no_contesta', 'llamar_luego', 'agendado', 'no_interesa', 'vendido')),
  llamar_en timestamptz,
  creado_en timestamptz not null default now(),
  ultima_actividad timestamptz,
  unique (proyecto_id, ghl_contact_id)
);
create index leads_proyecto_idx on public.leads (proyecto_id, creado_en desc);
create index leads_caller_idx on public.leads (caller_id);
create index leads_etapa_idx on public.leads (etapa_id);
create unique index leads_email_proyecto_idx on public.leads (proyecto_id, lower(email)) where email is not null and email <> '';

-- ---------- Actividad (historial de cada lead) ----------
create table public.actividades (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  perfil_id uuid references public.perfiles (id) on delete set null,
  tipo text not null check (tipo in ('llamada', 'whatsapp', 'nota', 'cambio_etapa', 'asignacion', 'cita', 'venta', 'importacion', 'webhook')),
  resultado text,
  nota text,
  creado_en timestamptz not null default now()
);
create index actividades_lead_idx on public.actividades (lead_id, creado_en desc);
create index actividades_proyecto_idx on public.actividades (proyecto_id, creado_en desc);

-- ---------- Citas (agendas de los closers) ----------
create table public.citas (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  closer_id uuid references public.perfiles (id) on delete set null,
  agendada_por uuid references public.perfiles (id) on delete set null,
  fecha timestamptz not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'confirmada', 'no_califica', 'cerrada', 'seguimiento', 'no_show', 'reagendada', 'cancelada', 'perdida')),
  origen text not null default 'manual' check (origen in ('manual', 'ghl')),
  ghl_cita_id text,
  nota text,
  creado_en timestamptz not null default now()
);
create index citas_proyecto_idx on public.citas (proyecto_id, fecha);

-- ---------- Productos y ventas ----------
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  nombre text not null,
  precio numeric(12, 2), -- null = personalizado
  link_pago text,
  vende_caller boolean not null default false,
  activo boolean not null default true,
  orden integer not null default 0
);

create table public.ventas (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  producto_id uuid references public.productos (id) on delete set null,
  vendedor_id uuid references public.perfiles (id) on delete set null,
  facturacion numeric(12, 2) not null check (facturacion >= 0),
  cash_collected numeric(12, 2) not null default 0 check (cash_collected >= 0),
  tipo_pago text not null default 'completo' check (tipo_pago in ('completo', 'reserva', 'cuotas')),
  num_cuotas integer,
  metodo text not null default 'stripe' check (metodo in ('stripe', 'transferencia', 'otro')),
  nota text,
  fecha timestamptz not null default now(),
  creado_en timestamptz not null default now()
);
create index ventas_proyecto_idx on public.ventas (proyecto_id, fecha);

-- Pagos posteriores (cuotas o resto de una reserva)
create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas (id) on delete cascade,
  importe numeric(12, 2) not null check (importe > 0),
  metodo text not null default 'stripe' check (metodo in ('stripe', 'transferencia', 'otro')),
  fecha timestamptz not null default now(),
  registrado_por uuid references public.perfiles (id) on delete set null
);

-- ---------- Recursos (PDF, enlaces, guiones, vídeos) ----------
create table public.recursos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  titulo text not null,
  tipo text not null check (tipo in ('pdf', 'enlace', 'guion', 'video')),
  url text,
  contenido text,
  archivo_path text,
  para_rol text not null default 'todos' check (para_rol in ('todos', 'caller', 'closer')),
  creado_por uuid references public.perfiles (id) on delete set null,
  creado_en timestamptz not null default now()
);

-- ---------- Reportes de fin de día ----------
create table public.reportes (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  perfil_id uuid not null references public.perfiles (id) on delete cascade,
  rol text not null,
  fecha date not null,
  respuestas jsonb not null,
  creado_en timestamptz not null default now()
);
create index reportes_proyecto_idx on public.reportes (proyecto_id, fecha desc);

-- ---------- Registro de webhooks recibidos de GHL ----------
create table public.webhook_eventos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid references public.proyectos (id) on delete cascade,
  tipo text,
  payload jsonb not null,
  procesado boolean not null default false,
  error text,
  recibido_en timestamptz not null default now()
);

-- ---------- RLS en todo ----------
alter table public.perfiles enable row level security;
alter table public.miembros_proyecto enable row level security;
alter table public.pipelines enable row level security;
alter table public.etapas enable row level security;
alter table public.leads enable row level security;
alter table public.actividades enable row level security;
alter table public.citas enable row level security;
alter table public.productos enable row level security;
alter table public.ventas enable row level security;
alter table public.pagos enable row level security;
alter table public.recursos enable row level security;
alter table public.reportes enable row level security;
alter table public.webhook_eventos enable row level security;

-- ---------- Archivos de recursos (PDF) ----------
insert into storage.buckets (id, name, public)
values ('recursos', 'recursos', false)
on conflict (id) do nothing;

-- ---------- Reparto rotativo atómico ----------
-- Devuelve el siguiente caller del proyecto y avanza el turno.
create or replace function public.siguiente_caller(p_proyecto uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_callers uuid[];
  v_indice integer;
begin
  select array_agg(m.perfil_id order by m.orden, p.nombre)
    into v_callers
    from miembros_proyecto m
    join perfiles p on p.id = m.perfil_id
   where m.proyecto_id = p_proyecto and p.rol = 'caller' and p.activo;

  if v_callers is null then
    return null;
  end if;

  update proyectos
     set rotacion_indice = rotacion_indice + 1
   where id = p_proyecto
  returning rotacion_indice - 1 into v_indice;

  return v_callers[(v_indice % array_length(v_callers, 1)) + 1];
end;
$$;
revoke execute on function public.siguiente_caller(uuid) from public, anon, authenticated;
