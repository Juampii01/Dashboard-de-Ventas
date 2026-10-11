import "server-only";
import { db } from "@/lib/datos";
import { SECCIONES_TODAS, DEFECTO, NUNCA, ROLES_PERMISO, seccionesPermitidas } from "@/lib/permisos";
import type { DatosPermisos } from "@/app/(panel)/admin/permisos";
import type { Perfil } from "@/lib/tipos";

// Lo que necesitan la tabla de Permisos y la ficha de cada persona (V2-8, Paso H5 y bloque 5 de 1.0)
export async function cargarDatosPermisos(perfil: Perfil, proyectoId: string): Promise<DatosPermisos> {
  const [{ data: deRol }, { data: dePersona }, mias] = await Promise.all([
    db().from("permisos_seccion").select("rol, seccion, permitido").eq("proyecto_id", proyectoId),
    db().from("permisos_persona").select("perfil_id, seccion, permitido").eq("proyecto_id", proyectoId),
    seccionesPermitidas(perfil, proyectoId),
  ]);
  const lista = (m: Record<string, Set<string>>) => Object.fromEntries(ROLES_PERMISO.map((r) => [r, [...m[r]]])) as DatosPermisos["defecto"];
  return {
    secciones: SECCIONES_TODAS.map((x) => ({ v: x.v, t: x.t, d: x.d, grupo: x.grupo })),
    defecto: lista(DEFECTO),
    nunca: lista(NUNCA),
    deRol: Object.fromEntries((deRol ?? []).map((x) => [`${x.rol}:${x.seccion}`, x.permitido])),
    dePersona: Object.fromEntries((dePersona ?? []).map((x) => [`${x.perfil_id}:${x.seccion}`, x.permitido])),
    puedoDar: [...mias],
    soyCeo: perfil.rol === "ceo",
  };
}
