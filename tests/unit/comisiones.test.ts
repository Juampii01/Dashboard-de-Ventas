import { describe, expect, it } from "vitest";
import { porcentajeComision } from "@/lib/comisiones";

const rolCaller = { pct_venta: 10, pct_agenda: 3 };
describe("porcentaje de comisión", () => {
  const base = { rol: "caller" as const, producto: null, productoId: "P1", deRol: rolCaller };
  it("sin nada propio, usa el de su rol (caller: 3 % por agenda, 10 % por su venta)", () => {
    expect(porcentajeComision({ ...base, tipo: "agenda", persona: null })).toEqual({ pct: 3, origen: "rol" });
    expect(porcentajeComision({ ...base, tipo: "venta", persona: null })).toEqual({ pct: 10, origen: "rol" });
  });
  it("el producto manda sobre el rol; la persona sobre el producto; la persona-producto sobre todo", () => {
    const producto = { caller: 15, caller_agenda: 4 };
    expect(porcentajeComision({ ...base, producto, tipo: "venta", persona: null }).pct).toBe(15);
    expect(porcentajeComision({ ...base, producto, tipo: "agenda", persona: null }).pct).toBe(4);
    expect(porcentajeComision({ ...base, producto, tipo: "venta", persona: { pct_venta: 12 } }).pct).toBe(12);
    expect(porcentajeComision({ ...base, producto, tipo: "venta", persona: { pct_venta: 12, por_producto: { P1: 20 } } })).toEqual({ pct: 20, origen: "persona-producto" });
  });
  it("un 0 o un hueco usan el siguiente («los que dejes en 0 % usan el general»)", () => {
    expect(porcentajeComision({ ...base, tipo: "venta", persona: { pct_venta: 0, por_producto: { P1: 0 } } })).toEqual({ pct: 10, origen: "rol" });
    expect(porcentajeComision({ ...base, tipo: "venta", persona: null, deRol: { pct_venta: 0, pct_agenda: 0 } })).toEqual({ pct: 0, origen: "ninguna" });
  });
});
