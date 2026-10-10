import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Perfil } from "@/lib/tipos";

export const db = () => createAdminClient();

// Arreglo 22: una escritura que falla no puede acabar en «Guardado». Si hay error, se corta la acción:
// el usuario ve el mensaje genérico de error (seguro) y el detalle queda en el registro del servidor.
export async function escribir<T extends { error: { message: string } | null }>(peticion: PromiseLike<T>, tabla: string): Promise<T> {
  const r = await peticion;
  if (r.error) throw new Error(`No se pudo guardar en «${tabla}»: ${r.error.message}`);
  return r;
}

// Supabase devuelve como mucho 1000 filas por consulta: esto pagina.
export async function todas<T>(
  consulta: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const out: T[] = [];
  const paso = 1000;
  for (let i = 0; ; i += paso) {
    const { data, error } = await consulta(i, i + paso - 1);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < paso) break;
  }
  return out;
}

export async function equipo(proyectoId: string): Promise<Perfil[]> {
  const { data, error } = await db()
    .from("miembros_proyecto")
    .select("orden, perfiles(*)")
    .eq("proyecto_id", proyectoId)
    .order("orden");
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as { perfiles: Perfil }[]).map((m) => m.perfiles).filter((p) => p.activo);
}

// Arreglos 10 y 11: quien se desactiva o se quita del proyecto deja de estar en equipo(), pero lo que
// vendió o agendó sigue contando (comisiones del mes, métricas del pasado). Añade a esas personas
// (las que salen en `ids`) con «(baja)» en el nombre.
export async function conBajas(activos: Perfil[], ids: (string | null | undefined)[]): Promise<(Perfil & { baja?: true })[]> {
  const enEquipo = new Set(activos.map((a) => a.id));
  const faltan = [...new Set(ids.filter((x): x is string => !!x && !enEquipo.has(x)))];
  if (!faltan.length) return activos;
  const { data, error } = await db().from("perfiles").select("*").in("id", faltan);
  if (error) throw new Error(error.message);
  return [...activos, ...((data ?? []) as Perfil[]).map((p) => ({ ...p, nombre: `${p.nombre} (baja)`, baja: true as const }))];
}

export async function registrarActividad(a: {
  proyecto_id: string;
  lead_id: string;
  perfil_id: string | null;
  tipo: string;
  resultado?: string | null;
  nota?: string | null;
}) {
  // El historial es secundario: si falla, se apunta en el registro del servidor y la acción sigue (arreglo 22)
  const { error } = await db().from("actividades").insert(a);
  if (error) console.error("[actividad] no se pudo guardar:", error.message);
  await db().from("leads").update({ ultima_actividad: new Date().toISOString() }).eq("id", a.lead_id);
}
