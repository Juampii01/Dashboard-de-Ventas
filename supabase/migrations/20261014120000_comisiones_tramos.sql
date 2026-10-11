-- 1.0 Bloque 4 (Cristian, 10 y 11 oct 2026): comisiones por tramos mensuales.
-- Cada mes se suma la facturación de las ventas del mes de cada persona (caller: las de los leads que agendó y
-- cerró un closer + lo que vende él; closer: lo que vende). El % del tramo alcanzado vale para TODA esa
-- facturación; se reinicia cada mes; se paga sobre lo cobrado; lo cobrado después (cuotas) va con el % del mes
-- de la venta. Las ventas devueltas siguen contando para el tramo de su mes. Importes en la moneda del proyecto.
alter table public.proyectos
  add column tramos_comision jsonb not null default '{
    "caller": [{"desde": 0, "pct": 3}, {"desde": 10000, "pct": 3.5}, {"desde": 25000, "pct": 4}, {"desde": 50000, "pct": 4.5}, {"desde": 75000, "pct": 5}, {"desde": 100000, "pct": 5.5}],
    "closer": [{"desde": 0, "pct": 7}]
  }'::jsonb;

-- Quién manda en cada persona: «tramos» o «propio» (su % de siempre: persona, producto o rol).
-- null = lo de su rol: callers y closers, tramos; CEO y directores, su % propio.
alter table public.miembros_equipo
  add column comision_modo text check (comision_modo in ('tramos', 'propio'));

-- Casilla de cada producto: si cuenta para comisión. La que no cuenta no paga comisión a nadie ni suma para el
-- tramo. La Membresía, en «no» de momento (Cristian, 11 oct: lo revisará el equipo).
alter table public.productos add column cuenta_comision boolean not null default true;
update public.productos set cuenta_comision = false where modo_pago = 'mensual';

-- El tramo alcanzado en el mes, a la vista en Liquidaciones: { base, pct } (null si la persona no va por tramos)
alter table public.liquidaciones add column tramo jsonb;
