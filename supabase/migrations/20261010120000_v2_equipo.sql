-- v2 · V2-4: equipo (áreas, puestos, personas con o sin acceso) y comisiones. V2-8: permisos por sección.
-- Solo añade tablas; al final copia al equipo a la gente que ya está en cada proyecto.

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  nombre text not null,
  color text not null default '#64748b',
  orden integer not null default 0
);

create table public.puestos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  area_id uuid references public.areas (id) on delete set null,
  nombre text not null,
  rol_base text not null default 'otro' check (rol_base in ('ceo', 'director', 'closer', 'caller', 'otro'))
);

-- Una persona del equipo (puede no tener acceso a la app: «solo en el organigrama»)
create table public.miembros_equipo (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  perfil_id uuid references public.perfiles (id) on delete set null,
  nombre text not null,
  email text,
  area_id uuid references public.areas (id) on delete set null,
  puesto_id uuid references public.puestos (id) on delete set null,
  lider boolean not null default false,
  activo boolean not null default true,
  -- Comisión propia (si es null, usa la de su rol): { pct_venta, pct_agenda, por_producto: { producto_id: pct } }
  comision jsonb,
  creado_en timestamptz not null default now(),
  unique (proyecto_id, perfil_id)
);

-- Comisión por defecto de cada rol en cada proyecto (% sobre lo vendido; % del caller cuando el closer cierra su agenda)
create table public.comisiones_rol (
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  rol text not null check (rol in ('ceo', 'director', 'closer', 'caller')),
  pct_venta numeric(5, 2) not null default 0 check (pct_venta between 0 and 100),
  pct_agenda numeric(5, 2) not null default 0 check (pct_agenda between 0 and 100),
  primary key (proyecto_id, rol)
);

-- V2-8: qué secciones ve cada rol (el CEO lo ve todo siempre)
create table public.permisos_seccion (
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  rol text not null check (rol in ('director', 'closer', 'caller')),
  seccion text not null,
  permitido boolean not null default false,
  primary key (proyecto_id, rol, seccion)
);

alter table public.areas enable row level security;
alter table public.puestos enable row level security;
alter table public.miembros_equipo enable row level security;
alter table public.comisiones_rol enable row level security;
alter table public.permisos_seccion enable row level security;

-- Áreas iniciales de cada proyecto (se pueden renombrar, añadir o quitar)
insert into public.areas (proyecto_id, nombre, color, orden)
select p.id, a.nombre, a.color, a.orden
from public.proyectos p
cross join (values ('Dirección', '#b45309', 0), ('Ventas', '#15803d', 1), ('Operaciones', '#1d4ed8', 2), ('Producto', '#7c3aed', 3)) as a (nombre, color, orden);

-- Comisiones por defecto: caller 3 % cuando el closer cierra su agenda (dato de Cristian); el resto a 0 hasta que se pongan
insert into public.comisiones_rol (proyecto_id, rol, pct_venta, pct_agenda)
select p.id, r.rol, 0, case when r.rol = 'caller' then 3 else 0 end
from public.proyectos p
cross join (values ('ceo'), ('director'), ('closer'), ('caller')) as r (rol);

-- La gente que ya está en cada proyecto pasa al equipo: dirección (CEO y directores) o ventas (closers y callers)
insert into public.miembros_equipo (proyecto_id, perfil_id, nombre, email, area_id, activo)
select m.proyecto_id, p.id, p.nombre, p.email,
       (select a.id from public.areas a where a.proyecto_id = m.proyecto_id and a.nombre = case when p.rol in ('ceo', 'director') then 'Dirección' else 'Ventas' end limit 1),
       p.activo
from public.miembros_proyecto m
join public.perfiles p on p.id = m.perfil_id;
