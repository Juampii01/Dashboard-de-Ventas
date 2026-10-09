-- v2 · V2-5: programas (= productos) con sus datos completos. Solo añade columnas.
alter table public.productos
  add column descripcion text,
  add column categoria text,
  add column color text not null default '#2f55d4',
  add column backend_offer boolean not null default false, -- su cobro cuenta como «back-end» en Finanzas
  add column modo_pago text not null default 'unico' check (modo_pago in ('unico', 'cuotas')),
  add column num_cuotas integer check (num_cuotas is null or num_cuotas between 2 and 60),
  add column precios_divisa jsonb, -- { "EUR": 1850 } si el precio cambia según la moneda
  add column comisiones jsonb; -- { closer, caller, director, ceo, caller_agenda } en %; vacío = la del rol
