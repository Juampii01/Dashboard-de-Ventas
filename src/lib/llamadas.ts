// Reparto de las citas en las pestañas de «Llamadas» (V2-2). Sin base de datos.
// Pre-call: citas abiertas que aún no han pasado. Post-call: lo que ya pasó, por estado.
export const ABIERTAS = ["pendiente", "confirmacion_pendiente", "confirmada"] as const;
export const COLUMNAS_PRECALL = [
  { estado: "pendiente", titulo: "Pendiente", color: "var(--aviso)" },
  { estado: "confirmacion_pendiente", titulo: "Confirmación pendiente", color: "var(--oro)" },
  { estado: "confirmada", titulo: "Confirmado", color: "var(--ok)" },
  { estado: "no_califica", titulo: "No califica", color: "var(--mal)" },
] as const;
export type ColumnaPrecall = { estado: (typeof COLUMNAS_PRECALL)[number]["estado"]; titulo: string; color: string };
// Paso H7: nombre, color y orden que puso el admin en el CRM (proyectos.precall_columnas); si falta algo, lo de siempre
export function columnasPrecall(config: unknown): ColumnaPrecall[] {
  const lista = Array.isArray(config) ? (config as Partial<ColumnaPrecall>[]) : [];
  const base = COLUMNAS_PRECALL.map((c) => ({ ...c }) as ColumnaPrecall);
  const ordenadas = lista.map((x) => base.find((c) => c.estado === x.estado)).filter((c): c is ColumnaPrecall => !!c);
  const resto = base.filter((c) => !ordenadas.includes(c));
  return [...ordenadas, ...resto].map((c) => {
    const p = lista.find((x) => x.estado === c.estado);
    return { estado: c.estado, titulo: (p?.titulo ?? "").trim() || c.titulo, color: /^(#[0-9a-fA-F]{6}|var\(--[a-z0-9-]+\))$/.test(p?.color ?? "") ? p!.color! : c.color };
  });
}
export const SUB_POSTCALL = [
  { v: "pendientes", t: "Pendientes", d: "Ya pasaron y falta registrar el resultado" },
  { v: "reagendadas", t: "Reagendadas", d: "Citas que se movieron a otra fecha" },
  { v: "reserva", t: "Reserva", d: "Ventas con reserva (seña) y resto por cobrar" },
  { v: "cuotas", t: "Cuotas", d: "Ventas a cuotas con dinero por cobrar" },
  { v: "cerradas", t: "Cerradas", d: "Ventas de este mes pagadas del todo" }, // Paso H6 (Cristian, 10 oct 2026)
  { v: "seguimiento", t: "En seguimiento", d: "Leads pendientes de decidir" },
  { v: "no_show", t: "No-show", d: "No se presentaron" },
  { v: "cancelada", t: "Canceladas", d: "Canceladas antes de la llamada" },
  { v: "perdida", t: "Perdidas", d: "Asistieron y no compraron" },
] as const;
export type SubPostcall = (typeof SUB_POSTCALL)[number]["v"];

type CitaL = { id: string; lead_id: string; fecha: string; estado: string };
type VentaL = { id: string; lead_id: string; tipo_pago: string; pendiente: number; fecha?: string };

const abierta = (e: string) => (ABIERTAS as readonly string[]).includes(e);

export function esPrecall(c: CitaL, ahora: number) {
  return (abierta(c.estado) || c.estado === "no_califica") && new Date(c.fecha).getTime() >= ahora;
}

export function enPostcall(c: CitaL, sub: SubPostcall, ahora: number) {
  if (sub === "pendientes") return abierta(c.estado) && new Date(c.fecha).getTime() < ahora;
  if (sub === "reagendadas") return c.estado === "reagendada";
  if (esColumnaVentas(sub)) return false; // salen de las ventas
  return c.estado === sub;
}

export const esColumnaVentas = (sub: SubPostcall): sub is "reserva" | "cuotas" | "cerradas" => sub === "reserva" || sub === "cuotas" || sub === "cerradas";

// Reserva y Cuotas: con dinero por cobrar. Cerradas: pagadas del todo y vendidas desde `desdeMs` (el día 1 del mes)
export function ventasPostcall<V extends VentaL>(ventas: V[], sub: "reserva" | "cuotas" | "cerradas", desdeMs = 0): V[] {
  if (sub === "cerradas") return ventas.filter((v) => v.pendiente <= 0.001 && !!v.fecha && new Date(v.fecha).getTime() >= desdeMs);
  return ventas.filter((v) => v.tipo_pago === sub && v.pendiente > 0.001);
}

// «YYYY-MM-DD» de una fecha en la zona del proyecto
export function diaEnZona(iso: string, zona: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zona }).format(new Date(iso));
}

// Celdas de un mes (de lunes a domingo), con los huecos del principio y del final
export function celdasMes(ymd: string) {
  const primero = new Date(`${ymd.slice(0, 8)}01T12:00:00Z`);
  const desplazamiento = (primero.getUTCDay() + 6) % 7; // lunes = 0
  const dias = new Date(Date.UTC(primero.getUTCFullYear(), primero.getUTCMonth() + 1, 0)).getUTCDate();
  const celdas: (string | null)[] = Array(desplazamiento).fill(null);
  for (let d = 1; d <= dias; d++) celdas.push(`${ymd.slice(0, 8)}${String(d).padStart(2, "0")}`);
  while (celdas.length % 7) celdas.push(null);
  return celdas;
}

// Texto para buscar: nombre, email, teléfono (sin acentos ni mayúsculas)
export const normal = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
export function coincide(q: string, ...campos: (string | null | undefined)[]) {
  if (!q.trim()) return true;
  const t = normal(campos.filter(Boolean).join(" "));
  const digitos = q.replace(/\D/g, "");
  return normal(q).split(/\s+/).every((p) => t.includes(p)) || (digitos.length >= 4 && t.replace(/\D/g, "").includes(digitos));
}
