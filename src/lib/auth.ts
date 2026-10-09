import "server-only";
import { getSesion } from "@/lib/sesion";
import type { Perfil, Rol } from "@/lib/tipos";
import { ErrorUsuario } from "@/lib/resultado";

export { getSesion, COOKIE_PROYECTO, type Sesion } from "@/lib/sesion";

// ---------- Permisos ----------
export const esJefe = (p: Perfil) => p.rol === "ceo" || p.rol === "director";
export const puedeAdmin = (p: Perfil) => p.rol === "ceo" || (p.rol === "director" && p.admin_activo);
export const puedeProductos = (p: Perfil) => p.rol === "ceo";
export const puedeCrearProyectos = (p: Perfil) => p.rol === "ceo";
export const puedeRecursos = (p: Perfil) => esJefe(p);

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
