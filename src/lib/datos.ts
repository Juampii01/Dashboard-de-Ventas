import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Perfil } from "@/lib/tipos";

export const db = () => createAdminClient();

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

export async function registrarActividad(a: {
  proyecto_id: string;
  lead_id: string;
  perfil_id: string | null;
  tipo: string;
  resultado?: string | null;
  nota?: string | null;
}) {
  await db().from("actividades").insert(a);
  await db().from("leads").update({ ultima_actividad: new Date().toISOString() }).eq("id", a.lead_id);
}
