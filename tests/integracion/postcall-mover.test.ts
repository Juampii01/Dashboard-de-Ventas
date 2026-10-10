// Paso H6 (Cristian, 10 oct 2026): en el tablero de Post-call se mueve todo, también las ventas.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { borrarEscenario, como, crearEscenario, db, falla, formulario, ok, type Escenario } from "../apoyo/escenario";
import { borrarVenta, cambiarFormaPago } from "@/app/(panel)/ventas/acciones";
import { registrarVenta } from "@/app/(panel)/leads/acciones";
import { cambiarEstadoCita } from "@/app/(panel)/closer/acciones";

let e: Escenario;
beforeAll(async () => {
  e = await crearEscenario();
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});
const plazos = async (ventaId: string) => (await db.from("vencimientos").select("numero, importe, estado").eq("venta_id", ventaId).order("numero")).data!.map((v) => [v.numero, Number(v.importe)]);

describe("Reserva ↔ Cuotas", () => {
  it("pasa a cuotas lo que falta, deja lo ya cobrado como un plazo y vuelve a reserva", async () => {
    const pid = e.proyecto.id;
    // 2.000 vendidos, 500 al vender, plazo de 1.500 y un cobro posterior de 300 → faltan 1.200
    const venta = (await db.from("ventas").insert({ proyecto_id: pid, lead_id: e.leads.LeadA, vendedor_id: e.p.closerA.id, facturacion: 2000, cash_collected: 500, tipo_pago: "reserva" }).select("id").single()).data!.id;
    await db.from("vencimientos").insert({ proyecto_id: pid, venta_id: venta, lead_id: e.leads.LeadA, numero: 1, importe: 1500, vence_el: "2026-11-09" });
    await db.from("pagos").insert({ venta_id: venta, importe: 300, metodo: "stripe" });
    como(e, e.p.closerB);
    await falla(cambiarFormaPago(venta, "cuotas", "3"), /no es tuya/);
    como(e, e.p.closerA);
    await falla(cambiarFormaPago(venta, "cuotas", "0"), /de 1 a 60/);
    await ok(cambiarFormaPago(venta, "cuotas", "3"));
    expect(await plazos(venta)).toEqual([[1, 300], [2, 400], [3, 400], [4, 400]]);
    expect((await db.from("ventas").select("tipo_pago, num_cuotas").eq("id", venta).single()).data).toEqual({ tipo_pago: "cuotas", num_cuotas: 3 });
    await ok(cambiarFormaPago(venta, "reserva"));
    expect(await plazos(venta)).toEqual([[1, 300], [2, 1200]]);
    expect((await db.from("ventas").select("tipo_pago, num_cuotas").eq("id", venta).single()).data).toEqual({ tipo_pago: "reserva", num_cuotas: null });
    // Pagada del todo: ya no se puede cambiar
    await db.from("pagos").insert({ venta_id: venta, importe: 1200, metodo: "stripe" });
    await falla(cambiarFormaPago(venta, "cuotas", "2"), /nada por cobrar/);
  });
});

describe("Citas y ventas entre columnas", () => {
  it("una venta desde una cita perdida cierra esa cita; borrarla la devuelve (citaId) para moverla", async () => {
    const pid = e.proyecto.id;
    await db.from("leads").update({ closer_id: e.p.closerA.id }).eq("id", e.leads.LeadB); // como al agendar
    const cita = (await db.from("citas").insert({ proyecto_id: pid, lead_id: e.leads.LeadB, closer_id: e.p.closerA.id, fecha: "2026-10-05T15:00:00Z", estado: "pendiente" }).select("id").single()).data!.id;
    como(e, e.p.closerA);
    await ok(cambiarEstadoCita(cita, "perdida", "", 2));
    await ok(registrarVenta(e.leads.LeadB, formulario({ producto: e.productos["Mentoría grupal"], facturacion: "1997", cash: "500", tipo_pago: "reserva", metodo: "stripe", desde_cita: "1", estrellas: "4", cita_id: cita })));
    expect((await db.from("citas").select("estado").eq("id", cita).single()).data!.estado).toBe("cerrada");
    const venta = (await db.from("ventas").select("id, vendedor_id").eq("lead_id", e.leads.LeadB).single()).data!;
    expect(venta.vendedor_id).toBe(e.p.closerA.id);
    // Una cita de otro lead no vale (como CEO, que ve todos los leads)
    como(e, e.p.ceo);
    await falla(registrarVenta(e.leads.LeadA, formulario({ producto: e.productos["Mentoría grupal"], facturacion: "1997", cash: "500", tipo_pago: "reserva", metodo: "stripe", cita_id: cita })), /no es de este lead/);
    como(e, e.p.closerA); // el closer borra su propia venta
    const r = await ok(borrarVenta(venta.id));
    expect(r.citaId).toBe(cita);
    expect((await db.from("citas").select("estado").eq("id", cita).single()).data!.estado).toBe("seguimiento");
    await ok(cambiarEstadoCita(r.citaId!, "no_show", ""));
    expect((await db.from("citas").select("estado").eq("id", cita).single()).data!.estado).toBe("no_show");
  });
});
