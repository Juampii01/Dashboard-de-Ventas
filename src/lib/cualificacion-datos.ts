import "server-only";
import { db, todas } from "@/lib/datos";
import { estudioRespuestas, type LeadQ } from "@/lib/cualificacion";

// Datos del estudio de cualificación de un proyecto (solo desde el servidor, después de comprobar la sesión)
export async function datosEstudio(proyectoId: string, preguntas?: string[]) {
  const [leads, citas, ventas] = await Promise.all([
    todas<LeadQ>((a, b) => db().from("leads").select("id, respuestas").eq("proyecto_id", proyectoId).order("id").range(a, b)),
    todas<{ lead_id: string; estado: string }>((a, b) => db().from("citas").select("lead_id, estado").eq("proyecto_id", proyectoId).order("id").range(a, b)),
    todas<{ lead_id: string; cash_collected: number; devuelto: number | null; pagos: { importe: number }[] }>((a, b) => db().from("ventas").select("*, pagos(importe)").eq("proyecto_id", proyectoId).order("id").range(a, b)),
  ]);
  return estudioRespuestas({ leads, citas, ventas: ventas.map((v) => ({ lead_id: v.lead_id, cash_collected: Number(v.cash_collected), devuelto: v.devuelto === null ? null : Number(v.devuelto), pagado: v.pagos.reduce((s, p) => s + Number(p.importe), 0) })) }, preguntas);
}
