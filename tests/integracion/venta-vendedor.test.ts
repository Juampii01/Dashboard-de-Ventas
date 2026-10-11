// Mejora de la pasada (Cristian, 11 oct 2026): si el CEO o un director registra la venta desde la ficha de un
// lead que tiene cita con un closer, la venta va a nombre de ese closer (como al cerrar desde la cita), salvo que
// elija a otro vendedor a mano. Así «Cerradas» y la facturación del closer cuentan lo mismo.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { borrarEscenario, como, crearEscenario, db, formulario, ok, type Escenario } from "../apoyo/escenario";
import { registrarVenta } from "@/app/(panel)/leads/acciones";

let e: Escenario;
beforeAll(async () => {
  e = await crearEscenario();
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});

const conCita = async (lead: string) => {
  await db.from("leads").update({ closer_id: e.p.closerA.id }).eq("id", lead);
  await db.from("citas").insert({ proyecto_id: e.proyecto.id, lead_id: lead, closer_id: e.p.closerA.id, fecha: "2026-10-05T15:00:00Z", estado: "confirmada" });
};
const venta = (lead: string, extra: Record<string, string> = {}) =>
  registrarVenta(lead, formulario({ producto: e.productos["Mentoría grupal"], facturacion: "1997", cash: "1997", tipo_pago: "completo", metodo: "transferencia", ...extra }));
const vendedorDe = async (lead: string) => (await db.from("ventas").select("vendedor_id").eq("lead_id", lead).single()).data!.vendedor_id;

describe("Vendedor de una venta registrada desde la ficha", () => {
  it("sin elegir vendedor, el CEO la registra a nombre del closer de la cita", async () => {
    await conCita(e.leads.LeadA);
    como(e, e.p.ceo);
    await ok(venta(e.leads.LeadA));
    expect(await vendedorDe(e.leads.LeadA)).toBe(e.p.closerA.id);
  });

  it("si elige a otro vendedor a mano, manda lo que elige", async () => {
    await conCita(e.leads.LeadB);
    como(e, e.p.ceo);
    await ok(venta(e.leads.LeadB, { vendedor: e.p.ceo.id }));
    expect(await vendedorDe(e.leads.LeadB)).toBe(e.p.ceo.id);
  });

  it("sin cita, sigue siendo de quien la registra", async () => {
    como(e, e.p.ceo);
    await ok(venta(e.leads.LeadLibre));
    expect(await vendedorDe(e.leads.LeadLibre)).toBe(e.p.ceo.id);
  });
});
