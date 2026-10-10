// Pendiente 7 (Cristian, 10 oct 2026): el cash de Ventas se mide como el de Finanzas: el dinero que entró DENTRO del
// periodo (al vender + cuotas del periodo, aunque la venta sea de antes − devoluciones del periodo).
import { describe, expect, it } from "vitest";
import { cashDelPeriodo } from "@/lib/metricas";

const octubre = { desde: new Date("2026-10-01T00:00:00Z"), hasta: new Date("2026-11-01T00:00:00Z") };
const ventas = [
  { id: "sep", fecha: "2026-09-20T12:00:00Z", cash_collected: 500 }, // reserva de septiembre
  { id: "oct", fecha: "2026-10-05T12:00:00Z", cash_collected: 1000, devuelto: 200, devuelto_en: "2026-10-20T12:00:00Z" },
];
const pagos = [
  { venta_id: "sep", fecha: "2026-10-10T12:00:00Z", importe: 300 }, // cuota de la venta de septiembre, cobrada en octubre
  { venta_id: "sep", fecha: "2026-09-25T12:00:00Z", importe: 100 }, // cobrada en septiembre: no cuenta en octubre
];

describe("cashDelPeriodo", () => {
  it("octubre = 1000 al vender + 300 de la cuota de septiembre − 200 devueltos", () => {
    expect(cashDelPeriodo(ventas, pagos, octubre)).toBe(1100);
  });
  it("septiembre = 500 al vender + 100 de cuota", () => {
    expect(cashDelPeriodo(ventas, pagos, { desde: new Date("2026-09-01T00:00:00Z"), hasta: octubre.desde })).toBe(600);
  });
});
