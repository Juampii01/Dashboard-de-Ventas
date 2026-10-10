import "server-only";
import { db } from "@/lib/datos";
import { horarioValido } from "@/lib/horarios";
import { ajustesDe, CITA_NO_OCUPA, libreA } from "@/lib/disponibilidad";
import type { Proyecto } from "@/lib/tipos";

// Bloque 1 de 1.0: «¿está libre este closer a esta hora?» con sus datos de la base (lo usa la rotación, bloque 3).
// `sinCita`: la cita que se está moviendo (al reagendar no choca consigo misma).
export async function closerLibreA(proyecto: Pick<Proyecto, "id" | "zona_horaria" | "calendario">, closerId: string, inicio: Date, sinCita?: string, ahora = new Date()) {
  const { data: m } = await db().from("miembros_proyecto").select("horario, calendario").eq("proyecto_id", proyecto.id).eq("perfil_id", closerId).maybeSingle();
  const ajustes = ajustesDe(proyecto.calendario, m?.calendario);
  // Sus citas vivas de ese día y el anterior y el siguiente (bastan para ver si se pisan y para el máximo del día)
  const desde = new Date(inicio.getTime() - 36 * 3600_000).toISOString();
  const hasta = new Date(inicio.getTime() + 36 * 3600_000).toISOString();
  let q = db().from("citas").select("id, fecha").eq("closer_id", closerId).gte("fecha", desde).lte("fecha", hasta).not("estado", "in", `(${CITA_NO_OCUPA.join(",")})`);
  if (sinCita) q = q.neq("id", sinCita);
  const { data: citas, error } = await q;
  if (error) throw new Error(`No se pudieron leer las citas: ${error.message}`);
  return libreA({ horario: horarioValido(m?.horario), ajustes, citas: (citas ?? []).map((c) => c.fecha as string), inicio, ahora, zona: proyecto.zona_horaria });
}
