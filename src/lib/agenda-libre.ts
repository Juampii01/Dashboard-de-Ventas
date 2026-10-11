import "server-only";
import { db } from "@/lib/datos";
import { horarioValido } from "@/lib/horarios";
import { ajustesDe, CITA_NO_OCUPA, libreA } from "@/lib/disponibilidad";
import type { Proyecto } from "@/lib/tipos";
import type { Horario } from "@/lib/horarios";

const TODO_EL_DIA: Horario = { semana: Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((d) => [d, [{ desde: "00:00", hasta: "24:00" }]])), fechas: {} };

// Bloque 1 de 1.0: «¿está libre este closer a esta hora?» con sus datos de la base (al agendar y reagendar a mano).
// `sinCita`: la cita que se está moviendo (al reagendar no choca consigo misma).
// `sinHorarioLibre`: si el closer aún no tiene horario, se le trata como libre todo el día (al reagendar).
export async function closerLibreA(proyecto: Pick<Proyecto, "id" | "zona_horaria" | "calendario">, closerId: string, inicio: Date, o: { sinCita?: string; ahora?: Date; sinHorarioLibre?: boolean } = {}) {
  const { sinCita, ahora = new Date() } = o;
  const { data: m } = await db().from("miembros_proyecto").select("horario, calendario").eq("proyecto_id", proyecto.id).eq("perfil_id", closerId).maybeSingle();
  const ajustes = ajustesDe(proyecto.calendario, m?.calendario);
  // Sus citas vivas de ese día y el anterior y el siguiente (bastan para ver si se pisan y para el máximo del día)
  const desde = new Date(inicio.getTime() - 36 * 3600_000).toISOString();
  const hasta = new Date(inicio.getTime() + 36 * 3600_000).toISOString();
  let q = db().from("citas").select("id, fecha").eq("closer_id", closerId).gte("fecha", desde).lte("fecha", hasta).not("estado", "in", `(${CITA_NO_OCUPA.join(",")})`);
  if (sinCita) q = q.neq("id", sinCita);
  const { data: citas, error } = await q;
  if (error) throw new Error(`No se pudieron leer las citas: ${error.message}`);
  const horario = horarioValido(m?.horario) ?? (o.sinHorarioLibre ? TODO_EL_DIA : null);
  return libreA({ horario, ajustes, citas: (citas ?? []).map((c) => c.fecha as string), inicio, ahora, zona: proyecto.zona_horaria });
}


// ¿Tiene horario puesto en este proyecto? (para avisar «no tiene horario puesto» en vez de «fuera de su horario»)
export async function tieneHorario(proyectoId: string, perfilId: string) {
  const { data } = await db().from("miembros_proyecto").select("horario").eq("proyecto_id", proyectoId).eq("perfil_id", perfilId).maybeSingle();
  return !!horarioValido(data?.horario);
}
