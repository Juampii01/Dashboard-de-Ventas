import "server-only";
import { db, todas, equipo } from "@/lib/datos";
import { esJefe } from "@/lib/auth";
import type { CitaM, LeadM, PagoM, VentaM } from "@/lib/metricas-agendas";
import type { Perfil, Proyecto } from "@/lib/tipos";

// Todo lo que necesitan las métricas de Agendas, de una vez.
export async function cargarAgendas(proyecto: Proyecto) {
  const pid = proyecto.id;
  const [citas, ventas, pagos, leads, pipelines, productos, gente] = await Promise.all([
    todas<CitaM>((a, b) => db().from("citas").select("id, lead_id, closer_id, agendada_por, fecha, estado, estrellas_caller, estrellas_closer").eq("proyecto_id", pid).range(a, b)),
    todas<VentaM>((a, b) => db().from("ventas").select("id, lead_id, vendedor_id, producto_id, facturacion, cash_collected, fecha, devuelto, devuelto_en").eq("proyecto_id", pid).range(a, b)),
    todas<PagoM>((a, b) => db().from("pagos").select("venta_id, importe, fecha, ventas!inner(proyecto_id)").eq("ventas.proyecto_id", pid).range(a, b)),
    todas<LeadM>((a, b) => db().from("leads").select("id, pipeline_id, evento, seguimiento").eq("proyecto_id", pid).range(a, b)),
    db().from("pipelines").select("id, nombre").eq("proyecto_id", pid).order("orden"),
    db().from("productos").select("id, nombre").eq("proyecto_id", pid).order("orden"),
    equipo(pid),
  ]);
  const eventos = [...new Set(leads.map((l) => l.evento).filter((e): e is string => !!e))].sort();
  return { citas, ventas, pagos, leads, pipelines: pipelines.data ?? [], productos: productos.data ?? [], gente, eventos };
}

// Qué closers puede ver esta persona: el closer solo a sí mismo; los jefes, a todos o al elegido.
export function closersVisibles(perfil: Perfil, gente: Perfil[], elegido: string | null) {
  const closers = gente.filter((g) => g.rol === "closer");
  if (!esJefe(perfil)) return { closers: closers.filter((c) => c.id === perfil.id), ids: [perfil.id], todos: closers };
  const ids = elegido && closers.some((c) => c.id === elegido) ? [elegido] : closers.map((c) => c.id);
  return { closers: closers.filter((c) => ids.includes(c.id)), ids, todos: closers };
}
