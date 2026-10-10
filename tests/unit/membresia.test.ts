// Bloque A: membresía mensual sin fin
import { describe, expect, it } from "vitest";
import { planDePagos, plazosMensualesQueFaltan, siguienteMes } from "@/lib/finanzas";

describe("Membresía mensual", () => {
  it("el mismo día del mes siguiente (o el último si no existe)", () => {
    expect(siguienteMes("2026-10-11")).toBe("2026-11-11");
    expect(siguienteMes("2026-01-31")).toBe("2026-02-28");
    expect(siguienteMes("2026-12-15")).toBe("2027-01-15");
  });
  it("al vender queda el cobro del mes siguiente", () => {
    expect(planDePagos({ facturacion: 47, cobradoHoy: 47, tipo: "mensual", numCuotas: null, fecha: "2026-10-11T12:00:00Z" })).toEqual([{ numero: 2, importe: 47, vence_el: "2026-11-11" }]);
  });
  it("mientras no haya baja, siempre queda un cobro por venir; con baja, ninguno", () => {
    const v = { id: "v", lead_id: "l", facturacion: 47, fecha: "2026-10-11T12:00:00Z", tipo_pago: "mensual", baja_en: null };
    expect(plazosMensualesQueFaltan([v], [{ venta_id: "v", numero: 2, vence_el: "2026-11-11" }], "2026-10-20")).toEqual([]);
    expect(plazosMensualesQueFaltan([v], [{ venta_id: "v", numero: 2, vence_el: "2026-11-11" }], "2027-01-12").map((p) => [p.numero, p.vence_el])).toEqual([[3, "2026-12-11"], [4, "2027-01-11"], [5, "2027-02-11"]]);
    expect(plazosMensualesQueFaltan([{ ...v, baja_en: "2026-12-01" }], [], "2027-01-12")).toEqual([]);
    expect(plazosMensualesQueFaltan([{ ...v, tipo_pago: "completo" }], [], "2027-01-12")).toEqual([]);
  });
});
