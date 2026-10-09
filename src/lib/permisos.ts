import "server-only";
import { db } from "@/lib/datos";
import { ErrorUsuario } from "@/lib/resultado";
import { getSesion } from "@/lib/sesion";
import type { Perfil } from "@/lib/tipos";

// Secciones del CEO (v2). Por defecto solo las ve el CEO; en Administración → Permisos
// se pueden abrir a un rol entero (todos los directores iguales, decisión de Cristian).
export const SECCIONES = [
  { v: "equipo", t: "Equipo", d: "Organigrama, altas y comisiones" },
  { v: "programas", t: "Programas", d: "Productos, precios y comisiones por producto" },
  { v: "finanzas", t: "Finanzas", d: "Facturación, cobros, gastos, liquidaciones" },
  { v: "clientes", t: "Clientes", d: "Quién ha comprado y su seguimiento" },
] as const;
export type Seccion = (typeof SECCIONES)[number]["v"];

export async function seccionesPermitidas(perfil: Perfil, proyectoId: string): Promise<Set<Seccion>> {
  if (perfil.rol === "ceo") return new Set(SECCIONES.map((s) => s.v));
  const { data } = await db().from("permisos_seccion").select("seccion").eq("proyecto_id", proyectoId).eq("rol", perfil.rol).eq("permitido", true);
  return new Set((data ?? []).map((x) => x.seccion as Seccion).filter((s) => SECCIONES.some((x) => x.v === s)));
}

export async function puedeSeccion(perfil: Perfil, proyectoId: string, seccion: Seccion) {
  return (await seccionesPermitidas(perfil, proyectoId)).has(seccion);
}

// Para acciones y páginas: corta si no tiene la sección
export async function exigirSeccion(seccion: Seccion) {
  const sesion = await getSesion();
  if (!(await puedeSeccion(sesion.perfil, sesion.proyecto.id, seccion))) throw new ErrorUsuario("No tienes acceso a esta sección.");
  return sesion;
}
