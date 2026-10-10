import { describe, expect, it } from "vitest";
import { detalleVencimientos, estadoVencimientos, liquidacionesMes, totalPorCobrar, planDePagos, resumenFinanzas, saldosCuentas, type MovF, type PagoF, type VentaF } from "@/lib/finanzas";

const OCT = { desde: new Date("2026-10-01T04:00:00Z"), hasta: new Date("2026-11-01T04:00:00Z") };
const v = (id: string, x: Partial<VentaF> = {}): VentaF => ({ id, lead_id: `L${id}`, producto_id: "GRUPAL", vendedor_id: "CLOSER", facturacion: 1997, cash_collected: 500, fecha: "2026-10-05T15:00:00Z", metodo: "stripe", tipo_pago: "reserva", devuelto: null, devuelto_en: null, ...x });
const pago = (venta_id: string, importe: number, fecha: string, metodo = "transferencia"): PagoF => ({ id: venta_id + fecha, venta_id, importe, fecha, metodo });
const mov = (tipo: MovF["tipo"], importe: number, x: Partial<MovF> = {}): MovF => ({ id: tipo + importe, tipo, importe, fecha: "2026-10-10T12:00:00Z", categoria_id: null, cuenta_id: null, cuenta_destino_id: null, conciliado: true, ...x });

describe("resumen de finanzas", () => {
  const datos = {
    ventas: [v("1"), v("2", { producto_id: "BACK", facturacion: 997, cash_collected: 997, tipo_pago: "completo" }), v("3", { fecha: "2026-09-20T15:00:00Z", devuelto: 200, devuelto_en: "2026-10-15T10:00:00Z" })],
    pagos: [pago("1", 700, "2026-10-20T15:00:00Z"), pago("3", 300, "2026-10-02T15:00:00Z"), pago("1", 100, "2026-11-02T15:00:00Z")],
    movimientos: [mov("ingreso", 150), mov("egreso", 1000, { categoria_id: "ADS" }), mov("egreso", 50, { categoria_id: "PERSONAL" }), mov("egreso", 20)],
    categorias: [{ id: "ADS", tipo: "egreso" as const, nombre: "Publicidad", en_profit: true }, { id: "PERSONAL", tipo: "egreso" as const, nombre: "Personal", en_profit: false }],
    backend: new Set(["BACK"]),
  };
  it("facturación, cash neto, de dónde viene, profit y ROAS", () => {
    const r = resumenFinanzas(datos, OCT);
    expect(r.facturacion).toBe(1997 + 997); // la venta 3 es de septiembre
    expect(r.deDonde).toEqual({ ventaNueva: 500, cuotas: 700 + 300, backend: 997 });
    expect(r.cash).toBe(500 + 997 + 700 + 300 - 200); // la cuota de noviembre no cuenta; la devolución sí resta
    expect(r.ingresosExtra).toBe(150);
    expect(r.egresos).toBe(1070);
    expect(r.egresosProfit).toBe(1020); // «Personal» no cuenta; el gasto sin categoría sí
    expect(r.profit).toBe(2297 + 150 - 1020);
    expect(r.roas).toBe(2.25); // 2297 / 1020
    expect(r.porCobrar).toBeNull(); // sin plazos no se calcula (antes sumaba lo que faltaba de todas las ventas)
    expect(r.porDia.get("2026-10-05")).toBe(500 + 997);
  });
  it("el día de un cobro se cuenta en la hora del proyecto", () => {
    const r = resumenFinanzas({ ...datos, ventas: [v("x", { fecha: "2026-10-06T02:00:00Z" })], pagos: [] }, OCT, "America/New_York");
    expect([...r.porDia.keys()]).toEqual(["2026-10-05"]);
  });
  it("arreglo 12: «Cuentas por cobrar» = «Total por cobrar» de Pagos pendientes (sin «no paga» ni lo cobrado)", () => {
    const vencs = [
      { id: "a", venta_id: "1", importe: 700, vence_el: "2020-01-01", estado: "pendiente" as const }, // tapado por el pago de 700
      { id: "b", venta_id: "1", importe: 797, vence_el: "2099-01-01", estado: "pendiente" as const }, // falta 797 − 100 = 697 (por vencer)
      { id: "c", venta_id: "3", importe: 1197, vence_el: "2020-02-01", estado: "pendiente" as const }, // falta 1197 − 300 = 897 (vencido)
      { id: "d", venta_id: "9", importe: 400, vence_el: "2020-03-01", estado: "no_paga" as const }, // no cuenta
      { id: "e", venta_id: null, importe: 250, vence_el: "2099-02-01", estado: "pendiente" as const }, // deudor puesto a mano
    ];
    const r = resumenFinanzas({ ...datos, vencimientos: vencs }, OCT);
    expect(r.porCobrar).toBe(697 + 897 + 250);
    const det = [...detalleVencimientos(vencs, datos.pagos, "2026-10-10").values()].filter((x) => x.estado === "por_vencer" || x.estado === "vencido").reduce((s, x) => s + x.falta, 0);
    expect(totalPorCobrar(vencs, datos.pagos, "2026-10-10")).toBe(det); // misma cifra que la pestaña Pagos pendientes
  });
  it("sin gastos, el ROAS no se puede calcular", () => {
    expect(resumenFinanzas({ ...datos, movimientos: [] }, OCT).roas).toBeNull();
  });
});

describe("saldo de las cuentas", () => {
  it("los cobros van a la cuenta de su método; el resto a la de por defecto; transferencias y devoluciones", () => {
    const cuentas = [{ id: "TODO", nombre: "Todo", metodos: [], por_defecto: true }, { id: "BANCO", nombre: "Banco", metodos: ["transferencia"], por_defecto: false }];
    const s = saldosCuentas(cuentas, { ventas: [v("1", { devuelto: 100, devuelto_en: "2026-10-12T10:00:00Z" })], pagos: [pago("1", 700, "2026-10-20T15:00:00Z")], movimientos: [mov("egreso", 50, { cuenta_id: "BANCO" }), mov("transferencia", 200, { cuenta_id: "BANCO", cuenta_destino_id: "TODO" })] }, OCT);
    expect(s.get("TODO")).toEqual({ saldo: 500 - 100 + 200, entro: 700, salio: 100 });
    expect(s.get("BANCO")).toEqual({ saldo: 700 - 50 - 200, entro: 700, salio: 250 });
  });
});

describe("plazos y vencimientos", () => {
  it("reserva: el resto a 30 días; cuotas: una al mes y la última ajusta los céntimos", () => {
    expect(planDePagos({ facturacion: 1997, cobradoHoy: 500, tipo: "reserva", numCuotas: null, fecha: "2026-10-05T15:00:00Z" })).toEqual([{ numero: 1, importe: 1497, vence_el: "2026-11-04" }]);
    expect(planDePagos({ facturacion: 1000, cobradoHoy: 0, tipo: "cuotas", numCuotas: 3, fecha: "2026-10-05T15:00:00Z" })).toEqual([
      { numero: 1, importe: 333.33, vence_el: "2026-10-05" },
      { numero: 2, importe: 333.33, vence_el: "2026-11-05" },
      { numero: 3, importe: 333.34, vence_el: "2026-12-05" },
    ]);
    expect(planDePagos({ facturacion: 997, cobradoHoy: 997, tipo: "completo", numCuotas: null, fecha: "2026-10-05T15:00:00Z" })).toEqual([]);
  });
  it("los cobros van tapando los plazos por orden; vencido si ya pasó la fecha", () => {
    const vs = [
      { id: "a", venta_id: "1", importe: 300, vence_el: "2026-10-01", estado: "pendiente" as const },
      { id: "b", venta_id: "1", importe: 300, vence_el: "2026-11-01", estado: "pendiente" as const },
      { id: "c", venta_id: "1", importe: 300, vence_el: "2026-12-01", estado: "no_paga" as const },
      { id: "d", venta_id: null, importe: 50, vence_el: "2026-09-01", estado: "pendiente" as const },
    ];
    const e = estadoVencimientos(vs, [pago("1", 300, "2026-10-02T00:00:00Z")], "2026-10-15");
    expect(Object.fromEntries(e)).toEqual({ a: "pagado", b: "por_vencer", c: "no_paga", d: "vencido" });
    expect(estadoVencimientos(vs.slice(0, 2), [], "2026-10-15").get("a")).toBe("vencido");
  });
});

describe("liquidaciones del mes", () => {
  it("closer cobra su % sobre lo cobrado en el mes; el caller que agendó, su % por agenda; se enseña también sobre lo facturado", () => {
    const res = liquidacionesMes({
      ventas: [v("1"), v("2", { vendedor_id: "CALLER", producto_id: "LOW", facturacion: 47, cash_collected: 47, tipo_pago: "completo" }), v("3", { fecha: "2026-09-20T15:00:00Z" })],
      pagos: [pago("1", 700, "2026-10-20T15:00:00Z"), pago("3", 300, "2026-10-02T15:00:00Z")],
      citas: [{ lead_id: "L1", closer_id: "CLOSER", agendada_por: "CALLER", estado: "cerrada", fecha: "2026-10-05T14:00:00Z" }],
      personas: [
        { perfil_id: "CLOSER", nombre: "Ana", rol: "closer", comision: null },
        { perfil_id: "CALLER", nombre: "Carla", rol: "caller", comision: { pct_venta: 20 } },
      ],
      comisionesRol: { closer: { pct_venta: 10, pct_agenda: 0 }, caller: { pct_venta: 15, pct_agenda: 3 } },
      productos: new Map(),
      mes: OCT,
    });
    const closer = res.find((x) => x.perfil_id === "CLOSER")!;
    expect(closer.base_cobrado).toBe(500 + 700 + 300); // incluye la cuota de octubre de una venta de septiembre
    expect(closer.comision_cobrado).toBe(150); // 10 %
    expect(closer.base_facturado).toBe(1997); // solo la venta de octubre
    expect(closer.comision_facturado).toBe(199.7);
    const caller = res.find((x) => x.perfil_id === "CALLER")!;
    expect(caller.detalle.map((l) => [l.tipo, l.pct, l.com_cobrado])).toEqual([["agenda", 3, 36], ["venta", 20, 9.4]]); // 3 % de 1200 de la venta 1; 20 % (propio) de su low ticket
  });
});
