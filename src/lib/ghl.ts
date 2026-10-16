// Conexión con la API de GHL (V2-3). Comprobado en la especificación oficial (9 oct 2026):
// github.com/GoHighLevel/highlevel-api-docs → apps/calendars.json y apps/contacts.json
// · GET /calendars/events?locationId&calendarId|userId&startTime&endTime (milisegundos) · Version 2021-04-15 · permiso calendars/events.readonly
// · GET /contacts/{id} → { contact: { firstName, lastName, email, phone } } · Version 2021-07-28 · permiso contacts.readonly
// · GET /opportunities/pipelines?locationId y GET /opportunities/search?location_id&contact_id · Version 2021-07-28 · permiso opportunities.readonly (13 oct)
// Autenticación: «Private Integration Token» de la subcuenta en Authorization: Bearer.
import { mismoNombre } from "@/lib/formato";

export const GHL_BASE = "https://services.leadconnectorhq.com";

export type EventoGhl = {
  id: string;
  calendarId?: string;
  contactId?: string;
  title?: string;
  startTime?: string;
  appointmentStatus?: string;
  assignedUserId?: string;
  deleted?: boolean;
};
// Plan GHL (16 oct): `lastAttributionSource` = la última página por la que entró (la de la agenda, con su UTM).
// Comprobado con contactos reales: `attributionSource` (la primera) suele venir vacío.
type AtribucionGhl = { url?: string | null; utmSource?: string | null };
export type ContactoGhl = { id?: string; firstName?: string; lastName?: string; name?: string; email?: string; phone?: string; lastAttributionSource?: AtribucionGhl | null; attributionSource?: AtribucionGhl | null };
type Fetch = typeof fetch;

async function llamar(fetchImpl: Fetch, token: string, ruta: string, version: string) {
  const res = await fetchImpl(`${GHL_BASE}${ruta}`, { headers: { Authorization: `Bearer ${token}`, Version: version, Accept: "application/json" }, cache: "no-store" });
  if (res.status === 401 || res.status === 403) throw new Error("GHL no acepta el token (revisa que sea de esta subcuenta y que tenga los permisos de calendario y contactos).");
  if (res.status === 429) throw new Error("GHL pide esperar (demasiadas peticiones). Prueba en unos minutos.");
  if (!res.ok) throw new Error(`GHL respondió ${res.status}.`);
  return res.json();
}

export async function eventosGhl(o: { token: string; locationId: string; calendarId?: string | null; userId?: string | null; desde: Date; hasta: Date; fetchImpl?: Fetch }): Promise<EventoGhl[]> {
  const q = new URLSearchParams({ locationId: o.locationId, startTime: String(o.desde.getTime()), endTime: String(o.hasta.getTime()) });
  if (o.calendarId) q.set("calendarId", o.calendarId);
  else if (o.userId) q.set("userId", o.userId);
  else throw new Error("Falta el calendario o el usuario de GHL.");
  const j = await llamar(o.fetchImpl ?? fetch, o.token, `/calendars/events?${q}`, "2021-04-15");
  return Array.isArray(j?.events) ? j.events : [];
}

export async function contactoGhl(o: { token: string; contactId: string; fetchImpl?: Fetch }): Promise<ContactoGhl | null> {
  const j = await llamar(o.fetchImpl ?? fetch, o.token, `/contacts/${encodeURIComponent(o.contactId)}`, "2021-07-28");
  return j?.contact ?? null;
}

// Plan GHL (16 oct): nombre del calendario. Necesita el permiso calendars.readonly (hoy el token no lo tiene: 401);
// sin él, null y la cita guarda el id del calendario.
export async function nombreCalendarioGhl(o: { token: string; calendarId: string; fetchImpl?: Fetch }): Promise<string | null> {
  try {
    const j = await llamar(o.fetchImpl ?? fetch, o.token, `/calendars/${encodeURIComponent(o.calendarId)}`, "2021-04-15");
    return typeof j?.calendar?.name === "string" ? j.calendar.name.trim() || null : null;
  } catch {
    return null;
  }
}

// Plan GHL (16 oct): una cita que ya no viene en la lista se comprueba una a una antes de cancelarla.
// «borrada» = GHL dice que no existe (404) o la marca borrada/cancelada · «sigue» = existe y no está cancelada ·
// «no_se» = GHL falló (no se toca nada).
export async function estadoCitaGhl(o: { token: string; citaId: string; fetchImpl?: Fetch }): Promise<"borrada" | "sigue" | "no_se"> {
  try {
    const res = await (o.fetchImpl ?? fetch)(`${GHL_BASE}/calendars/events/appointments/${encodeURIComponent(o.citaId)}`, {
      headers: { Authorization: `Bearer ${o.token}`, Version: "2021-04-15", Accept: "application/json" },
      cache: "no-store",
    });
    if (res.status === 404) return "borrada";
    if (!res.ok) return "no_se";
    const j = await res.json();
    const c = j?.appointment ?? j?.event ?? j;
    if (!c?.id) return "no_se";
    return c.deleted === true || estadoDesdeGhl(c.appointmentStatus) === "cancelada" ? "borrada" : "sigue";
  } catch {
    return "no_se";
  }
}

// 13 oct (Cristian): los pipelines de GHL donde el contacto tiene una oportunidad en la columna «Agendan»
// (la más reciente primero). Lo usan las citas que no dicen su pipeline: así van a «Agendan» del mismo pipeline que en GHL.
type OportunidadGhl = { pipelineId?: string; pipelineStageId?: string; updatedAt?: string; createdAt?: string };
type PipelineGhl = { id: string; name: string; stages?: { id: string; name: string }[] };
export async function pipelinesAgendanGhl(o: { token: string; locationId: string; contactId: string; fetchImpl?: Fetch }): Promise<string[]> {
  const f = o.fetchImpl ?? fetch;
  const [p, s] = await Promise.all([
    llamar(f, o.token, `/opportunities/pipelines?locationId=${encodeURIComponent(o.locationId)}`, "2021-07-28"),
    llamar(f, o.token, `/opportunities/search?location_id=${encodeURIComponent(o.locationId)}&contact_id=${encodeURIComponent(o.contactId)}&limit=20`, "2021-07-28"),
  ]);
  const pipelines: PipelineGhl[] = Array.isArray(p?.pipelines) ? p.pipelines : [];
  const opps: OportunidadGhl[] = Array.isArray(s?.opportunities) ? s.opportunities : [];
  const fecha = (x: OportunidadGhl) => new Date(x.updatedAt ?? x.createdAt ?? 0).getTime() || 0;
  return [...opps]
    .sort((a, b) => fecha(b) - fecha(a))
    .map((op) => {
      const pl = pipelines.find((x) => x.id === op.pipelineId);
      const etapa = pl?.stages?.find((x) => x.id === op.pipelineStageId);
      return pl && etapa && mismoNombre(etapa.name, "Agendan") ? pl.name : null;
    })
    .filter((x): x is string => !!x);
}

// Estado de GHL → estado de la cita en la app. `null` = no se toca (lo decide el closer).
export function estadoDesdeGhl(s: string | undefined): "confirmada" | "cancelada" | "no_show" | "invalida" | null {
  switch ((s ?? "").toLowerCase()) {
    case "confirmed":
      return "confirmada";
    case "cancelled":
      return "cancelada";
    case "noshow":
      return "no_show";
    case "invalid":
      return "invalida";
    default:
      return null; // new, booked, showed, active, completed…
  }
}

// Un estado de GHL solo cambia una cita que aún está abierta (no pisa lo que ya registró el closer)
export function nuevoEstado(actual: string, deGhl: ReturnType<typeof estadoDesdeGhl>) {
  const abierta = ["pendiente", "confirmacion_pendiente", "confirmada"].includes(actual);
  if (!abierta || !deGhl || deGhl === "invalida") return actual;
  // 16 oct (Cristian): GHL marca «confirmed» toda reserva del widget, así que no pisa «Confirmación pendiente»,
  // que lo pone el equipo a mano. Una cancelación o un no show de GHL sí cuentan.
  if (deGhl === "confirmada" && (actual === "confirmada" || actual === "confirmacion_pendiente")) return actual;
  return deGhl;
}
