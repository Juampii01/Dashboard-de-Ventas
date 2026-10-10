// Paso H6: un doble clic en «Agendar» creó dos citas iguales (Lázaro, Maestria, 10 oct 2026).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { borrarEscenario, como, crearEscenario, db, falla, ok, type Escenario } from "../apoyo/escenario";
import { agendarCita } from "@/app/(panel)/leads/acciones";
import { cambiarEstadoCita } from "@/app/(panel)/closer/acciones";

let e: Escenario;
beforeAll(async () => {
  e = await crearEscenario();
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});
const citas = async () => (await db.from("citas").select("id, estado").eq("lead_id", e.leads.LeadA)).data ?? [];

describe("Agendar no duplica citas", () => {
  it("dos «Agendar» iguales a la vez: solo se crea una y el otro recibe un aviso claro", async () => {
    como(e, e.p.callerA);
    const r = await Promise.all([1, 2].map(() => agendarCita(e.leads.LeadA, e.p.closerA.id, "2026-11-20T16:00", "", 4)));
    expect(await citas()).toHaveLength(1);
    const errores = r.filter((x) => x && typeof x === "object" && "error" in x).map((x) => (x as { error: string }).error);
    expect(errores).toEqual(["Ese lead ya tiene una cita con ese closer a esa hora."]);
  });
  it("otra hora u otro closer sí se puede; y si la cita se cancela, se puede volver a agendar a esa hora", async () => {
    como(e, e.p.callerA);
    await ok(agendarCita(e.leads.LeadA, e.p.closerA.id, "2026-11-20T17:00", "", 4));
    await ok(agendarCita(e.leads.LeadA, e.p.closerB.id, "2026-11-20T16:00", "", 4));
    await falla(agendarCita(e.leads.LeadA, e.p.closerA.id, "2026-11-20T16:00", "", 4), /ya tiene una cita/);
    const primera = (await db.from("citas").select("id").eq("lead_id", e.leads.LeadA).eq("closer_id", e.p.closerA.id).order("fecha").limit(1).single()).data!;
    como(e, e.p.closerA);
    await ok(cambiarEstadoCita(primera.id, "cancelada", ""));
    como(e, e.p.callerA);
    await ok(agendarCita(e.leads.LeadA, e.p.closerA.id, "2026-11-20T16:00", "", 4));
    expect(await citas()).toHaveLength(4);
  });
});
