-- Fase 7 (Cristian, 12 oct 2026): varios links de pago por programa (un pago, 2 meses, 4 semanas…) y el link de
-- Reserva aparte, que vale para cualquier programa.
alter table public.productos add column links_pago jsonb not null default '[]'::jsonb;
alter table public.proyectos add column link_reserva text check (link_reserva is null or link_reserva ~ '^https://');

-- Los links de Stripe que pasó Cristian el 12 oct (proyecto Maestria)
update public.productos pr set links_pago = '[
  {"nombre": "Pago único (PIF) · 1.997 $", "url": "https://buy.stripe.com/7sYdR867Q32s3ro73Nbwk1L"},
  {"nombre": "1.020 $ × 2 meses", "url": "https://buy.stripe.com/fZu8wO7bU6eE4vsbk3bwk1M"},
  {"nombre": "510 $ × 4 semanas", "url": "https://buy.stripe.com/6oU14m7bU46w9PM87Rbwk1N"},
  {"nombre": "260 $ × 8 semanas", "url": "https://buy.stripe.com/cNi8wO8fY7iIe62bk3bwk1O"},
  {"nombre": "700 $/mes × 3 meses", "url": "https://buy.stripe.com/00w14m53M9qQ8LI4VFbwk1P"}
]'::jsonb
from public.proyectos p
where p.id = pr.proyecto_id and p.nombre = 'Maestria' and lower(trim(pr.nombre)) = 'grupal';

update public.productos pr set links_pago = '[
  {"nombre": "Pago único (PIF) · 4.997 $", "url": "https://buy.stripe.com/14A6oGfIqcD22nk2Nxbwk1Q"},
  {"nombre": "2.550 $ × 2 meses", "url": "https://buy.stripe.com/14AbJ02VE46w7HEafZbwk1R"},
  {"nombre": "1.275 $ × 4 semanas", "url": "https://buy.stripe.com/28E4gybsa6eEbXU3RBbwk1S"},
  {"nombre": "650 $ × 8 semanas", "url": "https://buy.stripe.com/3cI7sK2VE5aAaTQbk3bwk1T"},
  {"nombre": "1.735 $ × 3 meses", "url": "https://buy.stripe.com/bJe00i2VE0Uk7HEgEnbwk1U"}
]'::jsonb
from public.proyectos p
where p.id = pr.proyecto_id and p.nombre = 'Maestria' and lower(trim(pr.nombre)) = 'vip';

update public.proyectos set link_reserva = 'https://buy.stripe.com/4gM9AScwe5aA7HEgEnbwk1K' where nombre = 'Maestria';
