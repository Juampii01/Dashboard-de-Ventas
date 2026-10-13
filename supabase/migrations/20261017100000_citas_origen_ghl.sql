-- Pedido de José (Daily 13 oct 2026): saber de qué calendario y canal viene cada cita de GHL.
-- Antes todas salían como «Calendario GHL». SIN APLICAR en la nube: se aplica con `supabase db push` tras revisar el PR.
-- El código funciona sin ella (no guarda el origen y muestra «GHL · sincronizada»); con ella, las citas nuevas lo guardan.

-- Nombre del calendario tal como lo manda GHL (calendar.calendarName) y canal = pipeline de la app que manda el
-- workflow en Custom Data («0. Agendas YT», «0. Agendas IG», «0. Agendas Callers»…)
alter table public.citas
  add column if not exists ghl_calendario text,
  add column if not exists canal text;

-- Las citas que ya llegaron por webhook recuperan su origen del payload guardado (mismo appointmentId).
-- Las creadas por la sincronización por API sin webhook no tienen el nombre y se quedan vacías.
update public.citas c
set ghl_calendario = coalesce(c.ghl_calendario, nullif(e.payload->'calendar'->>'calendarName', '')),
    canal = coalesce(c.canal, nullif(e.payload->'customData'->>'pipeline', ''))
from public.webhook_eventos e
where c.ghl_cita_id is not null
  and e.proyecto_id = c.proyecto_id
  and e.entrada_id is null
  and e.payload->'calendar'->>'appointmentId' = c.ghl_cita_id;
