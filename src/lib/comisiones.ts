// Qué porcentaje cobra una persona (V2-4 y V2-6). Sin base de datos.
// Orden (de más a menos concreto; un 0 o un hueco «usa el siguiente»):
// 1. La persona, para ese producto · 2. La persona, en general · 3. El producto, para su rol · 4. Su rol.
// Tipos: «venta» = % de lo que vende él · «agenda» = % del caller cuando el closer cierra su agenda.
export type ComisionPersona = { pct_venta?: number | null; pct_agenda?: number | null; por_producto?: Record<string, number> | null } | null;
export type ComisionProducto = Partial<Record<"ceo" | "director" | "closer" | "caller" | "caller_agenda", number>> | null;
export type ComisionRol = { pct_venta: number; pct_agenda: number };

const positivo = (n: unknown): number | null => (typeof n === "number" && n > 0 ? n : typeof n === "string" && Number(n) > 0 ? Number(n) : null);

export function porcentajeComision(o: {
  tipo: "venta" | "agenda";
  rol: "ceo" | "director" | "closer" | "caller";
  persona: ComisionPersona;
  producto: ComisionProducto;
  productoId: string | null;
  deRol: ComisionRol | undefined;
}): { pct: number; origen: "persona-producto" | "persona" | "producto" | "rol" | "ninguna" } {
  if (o.tipo === "venta" && o.productoId) {
    const p = positivo(o.persona?.por_producto?.[o.productoId]);
    if (p) return { pct: p, origen: "persona-producto" };
  }
  const general = positivo(o.tipo === "venta" ? o.persona?.pct_venta : o.persona?.pct_agenda);
  if (general) return { pct: general, origen: "persona" };
  const prod = positivo(o.tipo === "venta" ? o.producto?.[o.rol] : o.producto?.caller_agenda);
  if (prod) return { pct: prod, origen: "producto" };
  const rol = positivo(o.tipo === "venta" ? o.deRol?.pct_venta : o.deRol?.pct_agenda);
  if (rol) return { pct: rol, origen: "rol" };
  return { pct: 0, origen: "ninguna" };
}

export const redondear = (n: number) => Math.round(n * 100) / 100;

// ---------- Tramos mensuales (bloque 4 de 1.0, Cristian 10 y 11 oct 2026) ----------
// Cada tramo empieza en «desde» (importe del mes en la moneda del proyecto); el % del tramo alcanzado vale para
// toda la facturación del mes. Solo para callers y closers.
export type Tramo = { desde: number; pct: number };
export type TramosComision = { caller: Tramo[]; closer: Tramo[] };
export const TRAMOS_DEFECTO: TramosComision = {
  caller: [{ desde: 0, pct: 3 }, { desde: 10000, pct: 3.5 }, { desde: 25000, pct: 4 }, { desde: 50000, pct: 4.5 }, { desde: 75000, pct: 5 }, { desde: 100000, pct: 5.5 }],
  closer: [{ desde: 0, pct: 7 }],
};
export type ModoComision = "tramos" | "propio";

// Lista de tramos válida: el primero desde 0, «desde» creciente y sin repetir, % de 0 a 100. null si algo está mal.
export function tramosValidos(t: unknown): Tramo[] | null {
  if (!Array.isArray(t) || !t.length || t.length > 20) return null;
  const lista = t.map((x) => ({ desde: Number((x as Tramo)?.desde), pct: Number((x as Tramo)?.pct) }));
  if (lista.some((x) => !Number.isFinite(x.desde) || !Number.isFinite(x.pct) || x.desde < 0 || x.pct < 0 || x.pct > 100)) return null;
  lista.sort((a, b) => a.desde - b.desde);
  if (lista[0].desde !== 0 || lista.some((x, i) => i > 0 && x.desde === lista[i - 1].desde)) return null;
  return lista.map((x) => ({ desde: redondear(x.desde), pct: redondear(x.pct) }));
}
export function tramosDe(guardados: unknown): TramosComision {
  const g = (guardados && typeof guardados === "object" ? guardados : {}) as Record<string, unknown>;
  return { caller: tramosValidos(g.caller) ?? TRAMOS_DEFECTO.caller, closer: tramosValidos(g.closer) ?? TRAMOS_DEFECTO.closer };
}

// El % del tramo alcanzado con esa facturación del mes
export function pctDeTramo(tramos: Tramo[], base: number) {
  let pct = 0;
  for (const t of tramos) if (base >= t.desde) pct = t.pct;
  return pct;
}

// Quién manda: lo elegido en su ficha o, si no hay nada, lo de su rol (callers y closers, tramos)
export function modoComision(rol: "ceo" | "director" | "closer" | "caller", elegido: ModoComision | null | undefined): ModoComision {
  if (rol !== "caller" && rol !== "closer") return "propio";
  return elegido ?? "tramos";
}
