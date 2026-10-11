// Mejora de la pasada (Cristian, 11 oct 2026): si se registra la venta de un lead cuya cita aún no ha llegado,
// la venta se guarda y la cita se cierra con la hora de ahora (como si se hubiera adelantado), para que cuente
// como asistida hoy y no en el futuro. En el historial queda la hora que tenía.
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

const venta = (lead: string) =>
  registrarVenta(lead, formulario({ producto: e.productos["Mentoría grupal"], facturacion: "1997", cash: "1997", tipo_pago: "completo", metodo: "transferencia" }));
const adelantadas = async (lead: string) =>
  (await db.from("actividades").select("nota").eq("lead_id", lead).eq("tipo", "cita").like("nota", "Cita adelantada%")).data!;

describe("Venta antes de la hora de la cita", () => {
  it("cierra la cita con la hora de ahora y apunta en el historial la hora que tenía", async () => {
    const futura = new Date(Date.now() + 3 * 86_400_000).toISOString();
    await db.from("leads").update({ closer_id: e.p.closerA.id }).eq("id", e.leads.LeadA); // como al agendar
    const cita = (await db.from("citas").insert({ proyecto_id: e.proyecto.id, lead_id: e.leads.LeadA, closer_id: e.p.closerA.id, fecha: futura, estado: "pendiente" }).select("id").single()).data!.id;
    como(e, e.p.closerA);
    const antes = Date.now();
    await ok(venta(e.leads.LeadA));
    const c = (await db.from("citas").select("estado, fecha").eq("id", cita).single()).data!;
    expect(c.estado).toBe("cerrada");
    const t = new Date(c.fecha).getTime();
    expect(t).toBeGreaterThanOrEqual(antes - 1000);
    expect(t).toBeLessThanOrEqual(Date.now() + 1000);
    const notas = await adelantadas(e.leads.LeadA);
    expect(notas).toHaveLength(1);
    expect(notas[0].nota).toMatch(/^Cita adelantada: era el /);
  });

  it("una cita que ya pasó se cierra sin tocar su hora", async () => {
    const pasada = "2026-10-05T15:00:00.000Z";
    await db.from("leads").update({ closer_id: e.p.closerA.id }).eq("id", e.leads.LeadB); // como al agendar
    const cita = (await db.from("citas").insert({ proyecto_id: e.proyecto.id, lead_id: e.leads.LeadB, closer_id: e.p.closerA.id, fecha: pasada, estado: "confirmada" }).select("id").single()).data!.id;
    como(e, e.p.closerA);
    await ok(venta(e.leads.LeadB));
    const c = (await db.from("citas").select("estado, fecha").eq("id", cita).single()).data!;
    expect(c.estado).toBe("cerrada");
    expect(new Date(c.fecha).toISOString()).toBe(pasada);
    expect(await adelantadas(e.leads.LeadB)).toHaveLength(0);
  });
});
