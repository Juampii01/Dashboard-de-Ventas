import "server-only";
import { getSesion } from "@/lib/sesion";
import type { Perfil, Rol } from "@/lib/tipos";
import { ErrorUsuario } from "@/lib/resultado";

export { getSesion, COOKIE_PROYECTO, type Sesion } from "@/lib/sesion";

// ---------- Permisos ----------
export const esJefe = (p: Perfil) => p.rol === "ceo" || p.rol === "director";
export const puedeAdmin = (p: Perfil) => p.rol === "ceo" || (p.rol === "director" && p.admin_activo);
export const puedeCrearProyectos = (p: Perfil) => p.rol === "ceo";
export const puedeRecursos = (p: Perfil) => esJefe(p);

// Decisiones de Cristian (10 oct 2026, arreglo 2 de la auditoría):
// - cada uno solo crea accesos de su rol o de uno inferior;
// - solo el CEO y el director cambian comisiones; nadie la suya (ni la de su rol) salvo el CEO;
// - nadie marca como pagada (o desmarca) su propia liquidación, salvo el CEO.
const RANGO: Record<Rol, number> = { caller: 1, closer: 2, director: 3, ceo: 4 };
export function exigirPuedeDarRol(yo: Perfil, rol: Rol) {
  if (!(rol in RANGO)) throw new ErrorUsuario("Rol no válido.");
  if (RANGO[rol] > RANGO[yo.rol]) throw new ErrorUsuario("Solo puedes dar acceso con tu rol o con uno inferior.");
}
export function exigirCambiarComisionRol(yo: Perfil, rol: Rol) {
  if (!esJefe(yo)) throw new ErrorUsuario("Solo el CEO o el director pueden cambiar comisiones.");
  if (yo.rol !== "ceo" && rol === yo.rol) throw new ErrorUsuario("No puedes cambiar la comisión de tu propio rol.");
}
export function exigirCambiarComisionPersona(yo: Perfil, perfilId: string | null) {
  if (!esJefe(yo)) throw new ErrorUsuario("Solo el CEO o el director pueden cambiar comisiones.");
  if (yo.rol !== "ceo" && perfilId === yo.id) throw new ErrorUsuario("No puedes cambiar tu propia comisión.");
}
export function exigirNoEsPropia(yo: Perfil, perfilId: string | null, que: string) {
  if (yo.rol !== "ceo" && perfilId === yo.id) throw new ErrorUsuario(`No puedes ${que} tu propia liquidación.`);
}

// Para páginas y acciones: corta si el rol no está permitido.
export async function exigir(roles: Rol[] | ((p: Perfil) => boolean)) {
  const sesion = await getSesion();
  const ok = Array.isArray(roles) ? roles.includes(sesion.perfil.rol) : roles(sesion.perfil);
  if (!ok) throw new ErrorUsuario("No tienes permiso para esto.");
  return sesion;
}

export const RUTA_INICIO: Record<Rol, string> = {
  ceo: "/funnel",
  director: "/funnel",
  closer: "/closer",
  caller: "/caller",
};
