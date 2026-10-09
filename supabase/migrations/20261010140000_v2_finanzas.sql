-- v2 · V2-6: Finanzas. Solo añade tablas (las ventas, cobros y devoluciones siguen donde estaban).

-- Cuentas de dinero. La «por defecto» recibe los cobros cuyo método no está en otra cuenta.
create table public.cuentas (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  nombre text not null,
  metodos text[] not null default '{}', -- stripe / transferencia / otro
  por_defecto boolean not null default false,
  creado_en timestamptz not null default now()
);

create table public.categorias_finanzas (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  tipo text not null check (tipo in ('ingreso', 'egreso')),
  nombre text not null,
  en_profit boolean not null default true, -- si este gasto cuenta en el profit y el ROAS
  unique (proyecto_id, tipo, nombre)
);

-- Ingresos extra, gastos, transferencias y lo importado del banco
create table public.movimientos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  cuenta_id uuid references public.cuentas (id) on delete set null,
  cuenta_destino_id uuid references public.cuentas (id) on delete set null, -- solo transferencias
  tipo text not null check (tipo in ('ingreso', 'egreso', 'transferencia')),
  categoria_id uuid references public.categorias_finanzas (id) on delete set null,
  importe numeric(12, 2) not null check (importe > 0),
  fecha timestamptz not null default now(),
  descripcion text,
  origen text not null default 'manual' check (origen in ('manual', 'importado', 'liquidacion', 'programado')),
  conciliado boolean not null default true, -- lo importado del banco empieza sin conciliar
  creado_por uuid references public.perfiles (id) on delete set null,
  creado_en timestamptz not null default now()
);
create index movimientos_proyecto_idx on public.movimientos (proyecto_id, fecha);

-- Gastos que se repiten (alquiler, herramientas…)
create table public.egresos_programados (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  categoria_id uuid references public.categorias_finanzas (id) on delete set null,
  cuenta_id uuid references public.cuentas (id) on delete set null,
  descripcion text not null,
  importe numeric(12, 2) not null check (importe > 0),
  cada text not null default 'mes' check (cada in ('semana', 'mes', 'anio')),
  proxima date not null,
  activo boolean not null default true
);

-- Lo que falta por cobrar: plazos de una venta (reserva o cuotas) o un deudor puesto a mano
create table public.vencimientos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  venta_id uuid references public.ventas (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  nombre text, -- deudor a mano
  numero integer not null default 1,
  importe numeric(12, 2) not null check (importe > 0),
  vence_el date not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagado', 'no_paga')),
  pagado_en timestamptz,
  creado_en timestamptz not null default now()
);
create index vencimientos_proyecto_idx on public.vencimientos (proyecto_id, vence_el);

-- Comisiones de cada persona por mes (se paga sobre lo cobrado; se enseña también sobre lo facturado)
create table public.liquidaciones (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  perfil_id uuid not null references public.perfiles (id) on delete cascade,
  mes text not null check (mes ~ '^\d{4}-\d{2}$'),
  base_facturado numeric(12, 2) not null default 0,
  base_cobrado numeric(12, 2) not null default 0,
  comision_facturado numeric(12, 2) not null default 0,
  comision_cobrado numeric(12, 2) not null default 0, -- lo que se paga
  detalle jsonb not null default '[]'::jsonb,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagada')),
  pagada_en timestamptz,
  movimiento_id uuid references public.movimientos (id) on delete set null,
  calculada_en timestamptz not null default now(),
  unique (proyecto_id, perfil_id, mes)
);

-- Tipo de cambio puesto a mano (decisión de Cristian): cuántas unidades de la moneda son 1 USD
create table public.tipos_cambio (
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  moneda text not null check (moneda in ('EUR')),
  por_usd numeric(12, 6) not null check (por_usd > 0),
  actualizado_en timestamptz not null default now(),
  primary key (proyecto_id, moneda)
);

alter table public.cuentas enable row level security;
alter table public.categorias_finanzas enable row level security;
alter table public.movimientos enable row level security;
alter table public.egresos_programados enable row level security;
alter table public.vencimientos enable row level security;
alter table public.liquidaciones enable row level security;
alter table public.tipos_cambio enable row level security;

-- Lo que ya estaba vendido con dinero pendiente pasa a tener su vencimiento (a 30 días de la venta)
insert into public.vencimientos (proyecto_id, venta_id, lead_id, numero, importe, vence_el)
select v.proyecto_id, v.id, v.lead_id, 1,
       v.facturacion - v.cash_collected - coalesce((select sum(p.importe) from public.pagos p where p.venta_id = v.id), 0),
       (v.fecha + interval '30 days')::date
from public.ventas v
where v.facturacion - v.cash_collected - coalesce((select sum(p.importe) from public.pagos p where p.venta_id = v.id), 0) > 0.009;
