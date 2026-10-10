import "server-only";
import { db } from "@/lib/datos";
import { descifrar } from "@/lib/cifrado";
import { guardarLeads, telefonoClave } from "@/lib/leads";
import { contactoGhl, estadoDesdeGhl, eventosGhl, nuevoEstado, type ContactoGhl } from "@/lib/ghl";
import type { Proyecto } from "@/lib/tipos";
import { ABIERTAS } from "@/lib/llamadas";

type ProyectoGhl = Proyecto & { ghl_token: string | null; ghl_location_id: string | null };
export type ResultadoSync = { nuevas: number; actualizadas: number; canceladas: number; sinUnir: number; invalidas: number; closers: number; errores: string[] };

const DIA = 86_400_000;

// Trae las citas del calendario de GHL de cada closer y las guarda en la app.
export async function sincronizarCalendarios(proyectoId: string, opciones: { fetchImpl?: typeof fetch; ahora?: Date } = {}): Promise<ResultadoSync> {
  const { data: proyecto } = await db().from("proyectos").select("*").eq("id", proyectoId).single<ProyectoGhl>();
  if (!proyecto?.ghl_token || !proyecto.ghl_location_id) throw new Error("Falta conectar GHL (token e id de la subcuenta) en Administración → Integraciones.");
  const token = descifrar(proyecto.ghl_token, "el token de GHL");
  const fetchImpl = opciones.fetchImpl;
  const ahora = opciones.ahora ?? new Date();
  const desde = new Date(ahora.getTime() - 30 * DIA);
  const hasta = new Date(ahora.getTime() + 60 * DIA);

  const { data: miembros } = await db()
    .from("miembros_proyecto")
    .select("perfil_id, ghl_calendar_id, ghl_user_id, perfiles!inner(rol, nombre)")
    .eq("proyecto_id", proyecto.id)
    .eq("perfiles.rol", "closer");
  const closers = ((miembros ?? []) as unknown as { perfil_id: string; ghl_calendar_id: string | null; ghl_user_id: string | null; perfiles: { nombre: string } }[]).filter((m) => m.ghl_calendar_id || m.ghl_user_id);
  const r: ResultadoSync = { nuevas: 0, actualizadas: 0, canceladas: 0, sinUnir: 0, invalidas: 0, closers: closers.length, errores: [] };
  if (!closers.length) throw new Error("Ningún closer tiene puesto su calendario de GHL (Administración → Integraciones).");

  const contactos = new Map<string, ContactoGhl | null>();
  const { data: pipe } = await db().from("pipelines").select("id").eq("proyecto_id", proyecto.id).order("orden").limit(1).maybeSingle();

  for (const c of closers) {
    let eventos;
    try {
      eventos = await eventosGhl({ token, locationId: proyecto.ghl_location_id, calendarId: c.ghl_calendar_id, userId: c.ghl_user_id, desde, hasta, fetchImpl });
    } catch (e) {
      r.errores.push(`${c.perfiles.nombre}: ${e instanceof Error ? e.message : "error"}`);
      continue;
    }
    for (const ev of eventos) {
      if (!ev.id || !ev.startTime || isNaN(new Date(ev.startTime).getTime())) continue;
      const fecha = new Date(ev.startTime).toISOString();
      const deGhl = estadoDesdeGhl(ev.appointmentStatus);

      // ¿Ya está en la app?
      const { data: existe } = await db().from("citas").select("id, estado, fecha, closer_id").eq("proyecto_id", proyecto.id).eq("ghl_cita_id", ev.id).maybeSingle();
      if (existe) {
        const estado = nuevoEstado(existe.estado, deGhl);
        if (estado !== existe.estado || new Date(existe.fecha).getTime() !== new Date(fecha).getTime() || existe.closer_id !== c.perfil_id) {
          await db().from("citas").update({ estado, fecha, closer_id: c.perfil_id }).eq("id", existe.id);
          r.actualizadas++;
        }
        continue;
      }
      const sinUnir = async (estado: "pendiente" | "invalida") => {
        await db().from("citas_sin_lead").upsert(
          { proyecto_id: proyecto.id, ghl_cita_id: ev.id, ghl_contact_id: ev.contactId ?? null, closer_id: c.perfil_id, titulo: ev.title ?? null, fecha, estado, datos: ev },
          { onConflict: "proyecto_id,ghl_cita_id", ignoreDuplicates: true }
        );
        if (estado === "invalida") r.invalidas++;
        else r.sinUnir++;
      };
      if (deGhl === "invalida") {
        await sinUnir("invalida");
        continue;
      }

      // Buscar el lead: por el contacto de GHL; si no, con el email o el teléfono del contacto; si no, se crea
      let leadId: string | null = null;
      if (ev.contactId) {
        const { data } = await db().from("leads").select("id").eq("proyecto_id", proyecto.id).eq("ghl_contact_id", ev.contactId).maybeSingle();
        leadId = data?.id ?? null;
      }
      if (!leadId && ev.contactId) {
        if (!contactos.has(ev.contactId)) {
          try {
            contactos.set(ev.contactId, await contactoGhl({ token, contactId: ev.contactId, fetchImpl }));
          } catch {
            contactos.set(ev.contactId, null);
          }
        }
        const ct = contactos.get(ev.contactId);
        const email = (ct?.email ?? "").trim().toLowerCase() || null;
        const telefono = (ct?.phone ?? "").trim() || null;
        if (email || telefonoClave(telefono).length >= 6) {
          const nombreCompleto = (ct?.name ?? "").trim();
          await guardarLeads(
            proyecto,
            [{ ghl_contact_id: ev.contactId, nombre: ct?.firstName ?? nombreCompleto.split(/\s+/)[0] ?? "", apellido: ct?.lastName ?? nombreCompleto.split(/\s+/).slice(1).join(" "), email, telefono, etiquetas: [], respuestas: [], creado_en: null }],
            { pipelineId: pipe?.id ?? null, origen: "ghl", perfilId: null, repartir: false, notaActividad: "Entró desde el calendario de GHL" }
          );
          const { data } = await db().from("leads").select("id").eq("proyecto_id", proyecto.id).eq("ghl_contact_id", ev.contactId).maybeSingle();
          leadId = data?.id ?? null;
        }
      }
      if (!leadId) {
        await sinUnir("pendiente");
        continue;
      }
      const estado = deGhl ?? "pendiente"; // las inválidas ya salieron antes
      const { error } = await db().from("citas").insert({ proyecto_id: proyecto.id, lead_id: leadId, closer_id: c.perfil_id, fecha, estado, origen: "ghl", ghl_cita_id: ev.id, nota: ev.title ?? null });
      if (error) {
        r.errores.push(`Cita ${ev.id}: ${error.message}`);
        continue;
      }
      await db().from("citas_sin_lead").update({ estado: "resuelta" }).eq("proyecto_id", proyecto.id).eq("ghl_cita_id", ev.id);
      if (estado === "pendiente" || estado === "confirmada") await db().from("leads").update({ estado_caller: "agendado", closer_id: c.perfil_id }).eq("id", leadId);
      await db().from("actividades").insert({ proyecto_id: proyecto.id, lead_id: leadId, tipo: "cita", resultado: "agendada", nota: `Cita del calendario de GHL con ${c.perfiles.nombre}` });
      r.nuevas++;
    }

    // Arreglo 21: una cita de GHL de este closer, dentro del rango consultado, que ya no viene es que se
    // borró en GHL → «cancelada». Solo las que siguen abiertas (lo que registró el closer no se toca) y solo
    // si la consulta a GHL fue bien. Según la especificación oficial, GET /calendars/events no pagina.
    const vienen = new Set(eventos.map((ev) => ev.id).filter(Boolean));
    const { data: abiertas } = await db()
      .from("citas")
      .select("id, lead_id, ghl_cita_id")
      .eq("proyecto_id", proyecto.id)
      .eq("closer_id", c.perfil_id)
      .not("ghl_cita_id", "is", null)
      .in("estado", [...ABIERTAS])
      .gte("fecha", desde.toISOString())
      .lt("fecha", hasta.toISOString());
    const borradas = (abiertas ?? []).filter((x) => !vienen.has(x.ghl_cita_id));
    if (borradas.length) {
      await db().from("citas").update({ estado: "cancelada" }).in("id", borradas.map((x) => x.id));
      await db().from("actividades").insert(borradas.map((x) => ({ proyecto_id: proyecto.id, lead_id: x.lead_id, tipo: "cita", resultado: "cancelada", nota: "La cita ya no está en el calendario de GHL: marcada como cancelada" })));
      r.canceladas += borradas.length;
    }
  }
  const resumen = `${r.nuevas} nuevas · ${r.actualizadas} actualizadas${r.canceladas ? ` · ${r.canceladas} canceladas (borradas en GHL)` : ""} · ${r.sinUnir} sin unir · ${r.invalidas} inválidas${r.errores.length ? ` · ${r.errores.length} con error` : ""}`;
  await db().from("proyectos").update({ ghl_sincronizado_en: ahora.toISOString(), ghl_ultimo_resultado: resumen }).eq("id", proyecto.id);
  return r;
}
