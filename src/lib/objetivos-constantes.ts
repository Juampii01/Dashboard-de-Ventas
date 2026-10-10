// Listas fijas de los objetivos (Paso H3). Sin «server-only»: las usa también el formulario del navegador.

export type Cifra = "llamadas" | "contactados" | "agendas" | "citas_atendidas" | "asistencias" | "ventas" | "facturacion" | "cash";
export type PeriodoObjetivo = "dia" | "semana" | "mes" | "lanzamiento";
export type RolObjetivo = "caller" | "closer" | "director";

export const CIFRAS: { v: Cifra; t: string; roles: RolObjetivo[]; dinero?: true }[] = [
  { v: "llamadas", t: "Llamadas", roles: ["caller", "director"] },
  { v: "contactados", t: "Contactados", roles: ["caller", "director"] },
  { v: "agendas", t: "Agendas", roles: ["caller", "director"] },
  { v: "citas_atendidas", t: "Citas atendidas", roles: ["closer", "director"] },
  { v: "asistencias", t: "Asistencias", roles: ["closer", "director"] },
  { v: "ventas", t: "Ventas", roles: ["caller", "closer", "director"] },
  { v: "facturacion", t: "Facturación", roles: ["caller", "closer", "director"], dinero: true },
  { v: "cash", t: "Cash collected", roles: ["caller", "closer", "director"], dinero: true },
];
export const PERIODOS: { v: PeriodoObjetivo; t: string }[] = [
  { v: "dia", t: "Diario" },
  { v: "semana", t: "Semanal" },
  { v: "mes", t: "Mensual" },
  { v: "lanzamiento", t: "Lanzamiento" },
];
export const DIAS = ["L", "M", "X", "J", "V", "S", "D"];
