import "server-only";
import { db } from "@/lib/datos";
import { GUION_EJEMPLO, guionValido, type Guion, type RolGuion } from "@/lib/guiones";

// Fase 6: el guion guardado del proyecto o, si no hay (o la base aún no tiene la tabla), el de ejemplo
export async function cargarGuion(proyectoId: string, rol: RolGuion): Promise<{ guion: Guion; deEjemplo: boolean }> {
  const { data, error } = await db().from("guiones").select("contenido").eq("proyecto_id", proyectoId).eq("rol", rol).maybeSingle();
  const g = !error && data ? guionValido(data.contenido) : null;
  return g ? { guion: g, deEjemplo: false } : { guion: GUION_EJEMPLO[rol], deEjemplo: true };
}

// El guion que ve quien llama: el del closer para los closers; el del caller para el resto
export const rolDelGuion = (rol: string): RolGuion => (rol === "closer" ? "closer" : "caller");

export type MarcaGuardada = { id: string; lead_id: string; perfil_id: string | null; rol: RolGuion; hechos: number; total: number; resultado: string | null; creado_en: string };

export async function ultimasMarcas(proyectoId: string, limite = 200): Promise<{ filas: MarcaGuardada[]; sinTabla: boolean }> {
  const { data, error } = await db().from("guion_marcas").select("id, lead_id, perfil_id, rol, hechos, total, resultado, creado_en").eq("proyecto_id", proyectoId).order("creado_en", { ascending: false }).limit(limite);
  if (error) return { filas: [], sinTabla: true };
  return { filas: (data ?? []) as MarcaGuardada[], sinTabla: false };
}
