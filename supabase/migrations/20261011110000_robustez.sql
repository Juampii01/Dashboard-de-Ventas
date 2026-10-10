-- Arreglos 🟡 de la auditoría (10 oct 2026).

-- ---------- Arreglo 15: buscar un lead por teléfono sin leer todos ----------
-- Misma regla que telefonoClave() en lib/leads.ts: solo las cifras; con 9 o más, las últimas 9.
-- right() de un texto más corto lo devuelve entero, así que coincide con la regla de la app.
alter table public.leads
  add column telefono_clave text generated always as (right(regexp_replace(coalesce(telefono, ''), '\D', '', 'g'), 9)) stored;
create index leads_telefono_clave_idx on public.leads (proyecto_id, telefono_clave);

-- ---------- Arreglo 17: el turno del reparto rotativo, en un solo paso ----------
-- Devuelve el turno de inicio y lo avanza n posiciones a la vez (dos leads a la vez ya no
-- pueden tocarle al mismo caller por leer el mismo turno).
create or replace function public.avanzar_rotacion(p_proyecto uuid, p_n integer)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.proyectos set rotacion_indice = coalesce(rotacion_indice, 0) + p_n
  where id = p_proyecto
  returning rotacion_indice - p_n;
$$;
revoke execute on function public.avanzar_rotacion(uuid, integer) from public, anon, authenticated;
grant execute on function public.avanzar_rotacion(uuid, integer) to service_role;

-- ---------- Arreglo 27: un reporte de fin de día por persona y día ----------
create unique index reportes_uno_por_dia on public.reportes (proyecto_id, perfil_id, fecha);

-- ---------- Arreglo 33: deshacer un deudor marcado «cobrado» por error ----------
-- Se guarda qué ingreso se creó al cobrarlo, para borrarlo al deshacer (y no contarlo dos veces).
alter table public.vencimientos add column movimiento_id uuid references public.movimientos (id) on delete set null;

-- ---------- Arreglo 36: índices para buscar rápido con muchos datos ----------
create index if not exists citas_lead_idx on public.citas (lead_id);
create index if not exists citas_closer_idx on public.citas (closer_id, fecha);
create index if not exists ventas_lead_idx on public.ventas (lead_id);
create index if not exists ventas_vendedor_idx on public.ventas (vendedor_id);
create index if not exists pagos_venta_idx on public.pagos (venta_id);
create index if not exists vencimientos_venta_idx on public.vencimientos (venta_id);
create index if not exists leads_closer_idx on public.leads (closer_id);
create index if not exists grabaciones_cita_idx on public.grabaciones (cita_id);
