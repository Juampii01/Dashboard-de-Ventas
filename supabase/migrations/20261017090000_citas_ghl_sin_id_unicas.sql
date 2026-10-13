-- Auditoría del webhook de GHL (13 oct 2026). SIN APLICAR en la nube: se aplica a mano con `supabase db push`
-- después de revisar el PR.
--
-- Hueco: una cita de GHL que llega SIN appointmentId y SIN closer no tiene índice único que la proteja
-- (citas_ghl_unica pide ghl_cita_id; citas_app_unica incluye closer_id, y dos NULL no chocan). Si GHL manda
-- dos reintentos a la vez, los dos ven «no existe» y se crean dos citas iguales. Con este índice, el segundo
-- choca (23505) y el webhook lo trata como la misma cita (ya está preparado: responde 200 «duplicado»).
--
-- ANTES de aplicarlo en la nube, comprobar que no hay duplicados (si los hay, el índice no se crea):
--   select proyecto_id, lead_id, fecha, count(*) from public.citas
--   where origen = 'ghl' and ghl_cita_id is null and estado not in ('cancelada', 'reagendada')
--   group by 1, 2, 3 having count(*) > 1;
create unique index if not exists citas_ghl_sin_id_unica on public.citas (proyecto_id, lead_id, fecha)
  where origen = 'ghl' and ghl_cita_id is null and estado not in ('cancelada', 'reagendada');
