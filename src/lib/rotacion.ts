import "server-only";
import { db, equipo } from "@/lib/datos";
import { closerLibreA } from "@/lib/agenda-libre";
import { ordenRotacion, type ModoRotacion } from "@/lib/disponibilidad";
import type { Proyecto } from "@/lib/tipos";

// Rotación de closers (bloque 3 de 1.0, Cristian 11 oct 2026). Encendida = algún closer con % > 0.
export async function estadoRotacion(proyecto: Pick<Proyecto, "id" | "rotacion_modo">) {
  const closers = (await equipo(proyecto.id)).filter((p) => p.rol === "closer");
  const { data, error } = await db().from("miembros_proyecto").select("perfil_id, orden, rotacion_pct, rotacion_cuenta").eq("proyecto_id", proyecto.id).in("perfil_id", closers.map((c) => c.id));
  if (error) throw new Error(`No se pudo leer la rotación: ${error.message}`);
  const filas = (data ?? []).map((f) => ({ id: f.perfil_id as string, pct: Number(f.rotacion_pct), cuenta: Number(f.rotacion_cuenta), orden: Number(f.orden) }));
  const orden = ordenRotacion(filas);
  return { encendida: orden.length > 0, modo: (proyecto.rotacion_modo ?? "elige") as ModoRotacion, orden, nombres: new Map(closers.map((c) => [c.id, c.nombre])) };
}

// El closer al que le toca a esa hora: el primero del orden que esté libre (si no lo está, salta al siguiente).
// null si la rotación está apagada o si ninguno está libre.
export async function closerDeRotacion(proyecto: Pick<Proyecto, "id" | "zona_horaria" | "calendario" | "rotacion_modo">, inicio: Date, ahora = new Date()) {
  const r = await estadoRotacion(proyecto);
  if (!r.encendida) return { ...r, closer: null as string | null };
  for (const id of r.orden) {
    if ((await closerLibreA(proyecto, id, inicio, { ahora })).libre) return { ...r, closer: id as string | null };
  }
  return { ...r, closer: null as string | null };
}

// Cada cita que se da con la rotación encendida cuenta para el closer (así se reparte según su %)
export async function contarEnRotacion(proyectoId: string, closerId: string) {
  const { error } = await db().rpc("sumar_rotacion", { p_proyecto: proyectoId, p_closer: closerId });
  if (error) console.error("[rotación] no se pudo contar la cita:", error.message);
}
