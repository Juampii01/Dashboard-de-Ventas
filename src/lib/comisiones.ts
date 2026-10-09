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
