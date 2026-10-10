-- Bloque A (Cristian, 11 oct 2026): «Biblioteca» y oferta de cada lead; membresía mensual sin fin.

-- La oferta de cada lead según su formulario de la Biblioteca (la calcula la app al guardar; null = no es de la Biblioteca)
alter table public.leads
  add column oferta text check (oferta in ('vip_empresas', 'vip', 'empresas', 'grupal', 'membresia'));
create index leads_oferta_idx on public.leads (proyecto_id, oferta);

-- Membresía: pago mensual sin fin (cada mes queda un cobro pendiente hasta que se da de baja)
alter table public.productos drop constraint productos_modo_pago_check;
alter table public.productos add constraint productos_modo_pago_check check (modo_pago in ('unico', 'cuotas', 'mensual'));
alter table public.ventas drop constraint ventas_tipo_pago_check;
alter table public.ventas add constraint ventas_tipo_pago_check check (tipo_pago in ('completo', 'reserva', 'cuotas', 'mensual'));
alter table public.ventas add column baja_en timestamptz;
