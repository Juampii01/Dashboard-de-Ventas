// 1.0 Bloque 4 (Cristian, 10 y 11 oct 2026): comisiones por tramos mensuales. Sin base de datos.
import { describe, expect, it } from "vitest";
import { modoComision, pctDeTramo, TRAMOS_DEFECTO, tramosDe, tramosValidos } from "@/lib/comisiones";
import { liquidacionesMes, type CitaL, type PersonaL, type VentaF } from "@/lib/finanzas";
import { inicioDia } from "@/lib/formato";

const NY = "America/New_York";
const mes = (ym: string, sig: string) => ({ desde: new Date(inicioDia(`${ym}-01`, NY)), hasta: new Date(inicioDia(`${sig}-01`, NY)) });

describe("Tramos", () => {
  it("el % del tramo alcanzado (callers: 3 % hasta 9.999, 3,5 % desde 10.000…; closers: 7 %)", () => {
    const c = TRAMOS_DEFECTO.caller;
    expect([0, 9999.99, 10000, 24999, 25000, 50000, 75000, 99999, 100000, 250000].map((b) => pctDeTramo(c, b))).toEqual([3, 3, 3.5, 3.5, 4, 4.5, 5, 5, 5.5, 5.5]);
    expect(pctDeTramo(TRAMOS_DEFECTO.closer, 123456)).toBe(7);
  });
  it("tramos válidos: el primero desde 0, sin repetir, % de 0 a 100; si no, los de por defecto", () => {
    expect(tramosValidos([{ desde: 5000, pct: 4 }, { desde: 0, pct: 2 }])).toEqual([{ desde: 0, pct: 2 }, { desde: 5000, pct: 4 }]);
    expect(tramosValidos([{ desde: 100, pct: 4 }])).toBeNull();
    expect(tramosValidos([{ desde: 0, pct: 4 }, { desde: 0, pct: 5 }])).toBeNull();
    expect(tramosValidos([{ desde: 0, pct: 140 }])).toBeNull();
    expect(tramosDe({ caller: [{ desde: 0, pct: 9 }] })).toEqual({ caller: [{ desde: 0, pct: 9 }], closer: TRAMOS_DEFECTO.closer });
  });
  it("por defecto, callers y closers van por tramos; CEO y directores, con su % propio", () => {
    expect(modoComision("caller", null)).toBe("tramos");
    expect(modoComision("closer", "propio")).toBe("propio");
    expect(modoComision("director", "tramos")).toBe("propio");
    expect(modoComision("ceo", null)).toBe("propio");
  });
});

describe("Liquidaciones con tramos", () => {
  const personas: PersonaL[] = [
    { perfil_id: "caller", nombre: "Caller", rol: "caller", comision: null, modo: "tramos" },
    { perfil_id: "closer", nombre: "Closer", rol: "closer", comision: null, modo: "tramos" },
    { perfil_id: "propio", nombre: "Closer propio", rol: "closer", comision: { pct_venta: 10 }, modo: "propio" },
  ];
  const venta = (id: string, o: Partial<VentaF>): VentaF => ({ id, lead_id: `L-${id}`, producto_id: "grupal", vendedor_id: "closer", facturacion: 0, cash_collected: 0, fecha: "2027-01-15T15:00:00Z", metodo: "stripe", tipo_pago: "completo", devuelto: null, devuelto_en: null, ...o });
  const cita = (lead: string): CitaL => ({ lead_id: lead, closer_id: "closer", agendada_por: "caller", estado: "cerrada", fecha: "2027-01-10T15:00:00Z" });
  const base = { personas, comisionesRol: {}, productos: new Map(), sinComision: new Set(["membresia"]), zona: NY };

  it("el ejemplo de Cristian: agenda 9.950 $ y vende 2 Membresías → se queda en el 3 % y las Membresías no pagan", () => {
    const ventas = [
      venta("v1", { facturacion: 9950, cash_collected: 9950 }),
      venta("m1", { producto_id: "membresia", vendedor_id: "caller", facturacion: 47, cash_collected: 47 }),
      venta("m2", { producto_id: "membresia", vendedor_id: "caller", facturacion: 47, cash_collected: 47 }),
    ];
    const r = liquidacionesMes({ ...base, ventas, pagos: [], citas: [cita("L-v1")], mes: mes("2027-01", "2027-02") });
    const caller = r.find((x) => x.perfil_id === "caller")!;
    expect(caller.tramo).toEqual({ base: 9950, pct: 3 });
    expect(caller.comision_cobrado).toBe(298.5); // 3 % de 9.950
    expect(caller.detalle.map((l) => l.venta_id)).toEqual(["v1"]); // las Membresías no salen
    expect(r.find((x) => x.perfil_id === "closer")!).toMatchObject({ comision_cobrado: 696.5, tramo: { base: 9950, pct: 7 } });
  });
  it("con 100 $ de otro producto suyo pasa de 10.000 $: el 3,5 % vale para TODA la facturación del mes", () => {
    const ventas = [venta("v1", { facturacion: 9950, cash_collected: 9950 }), venta("lt", { producto_id: "low", vendedor_id: "caller", facturacion: 100, cash_collected: 100 })];
    const caller = liquidacionesMes({ ...base, ventas, pagos: [], citas: [cita("L-v1")], mes: mes("2027-01", "2027-02") }).find((x) => x.perfil_id === "caller")!;
    expect(caller.tramo).toEqual({ base: 10050, pct: 3.5 });
    expect(caller.comision_cobrado).toBe(351.75); // 3,5 % de 10.050
  });
  it("se paga sobre lo cobrado; lo cobrado después va con el % del mes de la venta; la devolución no cambia el tramo", () => {
    const ventas = [
      venta("v1", { facturacion: 12000, cash_collected: 2000, tipo_pago: "cuotas", devuelto: 500, devuelto_en: "2027-02-20T15:00:00Z" }), // enero: 3,5 %
      venta("v2", { facturacion: 30000, cash_collected: 30000, fecha: "2027-02-10T15:00:00Z" }), // febrero: 4 %
    ];
    const pagos = [{ id: "p1", venta_id: "v1", importe: 1000, fecha: "2027-02-05T15:00:00Z", metodo: "stripe" }];
    const citas = [cita("L-v1"), { ...cita("L-v2"), fecha: "2027-02-01T15:00:00Z" }];
    const ene = liquidacionesMes({ ...base, ventas, pagos, citas, mes: mes("2027-01", "2027-02") }).find((x) => x.perfil_id === "caller")!;
    expect(ene.tramo).toEqual({ base: 12000, pct: 3.5 }); // la devolución de febrero no la baja
    expect(ene.comision_cobrado).toBe(70); // 3,5 % de los 2.000 cobrados en enero
    const feb = liquidacionesMes({ ...base, ventas, pagos, citas, mes: mes("2027-02", "2027-03") }).find((x) => x.perfil_id === "caller")!;
    expect(feb.tramo).toEqual({ base: 30000, pct: 4 });
    const cuota = feb.detalle.find((l) => l.venta_id === "v1")!;
    expect(cuota).toMatchObject({ pct: 3.5, cobrado: 1000, com_cobrado: 35 }); // la cuota de enero, al 3,5 % de enero
    expect(feb.detalle.find((l) => l.venta_id === "v2")).toMatchObject({ pct: 4, com_cobrado: 1200 });
  });
  it("quien tiene «su % propio» cobra como siempre y no sale con tramo", () => {
    const ventas = [venta("v1", { vendedor_id: "propio", facturacion: 1000, cash_collected: 1000 })];
    const p = liquidacionesMes({ ...base, ventas, pagos: [], citas: [], mes: mes("2027-01", "2027-02") }).find((x) => x.perfil_id === "propio")!;
    expect(p).toMatchObject({ comision_cobrado: 100, tramo: null });
  });
});
