// 4.4 · Agendar por link de GHL (Cristian, 11 oct 2026): el caller marca «Link enviado»; la agenda cuenta cuando
// llega la cita de GHL, a nombre de quien envió el link (si nadie lo marcó, del caller del lead; sin caller, de nadie).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { borrarEscenario, como, crearEscenario, db, falla, ok, type Escenario } from "../apoyo/escenario";
import { agendarCita, marcarLinkEnviado } from "@/app/(panel)/leads/acciones";
import { POST } from "@/app/api/webhooks/ghl/[proyectoId]/route";
import { guardarLinkAgenda } from "@/app/(panel)/admin/acciones";

let e: Escenario;
let secreto: string;
beforeAll(async () => {
  e = await crearEscenario();
  secreto = (await db.from("proyectos").select("webhook_secreto").eq("id", e.proyecto.id).single()).data!.webhook_secreto;
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});

const enviar = (cuerpo: unknown) =>
  POST(
    new NextRequest(`http://localhost/api/webhooks/ghl/${e.proyecto.id}?secreto=${secreto}`, { method: "POST", body: JSON.stringify(cuerpo), headers: { "content-type": "application/json" } }),
    { params: Promise.resolve({ proyectoId: e.proyecto.id }) } as never
  );
const lead = async (id: string) => (await db.from("leads").select("estado_caller, link_enviado_por, link_enviado_en, llamar_en, etapa_callers_id, estrellas_caller").eq("id", id).single()).data!;
const citaDe = async (id: string) => (await db.from("citas").select("agendada_por, origen, estrellas_caller").eq("lead_id", id).single()).data!;

describe("Link enviado", () => {
  it("el caller lo marca: sale de la cola 2 días, va a su columna y queda en el historial", async () => {
    como(e, e.p.callerA);
    const antes = Date.now();
    await falla(marcarLinkEnviado(e.leads.LeadA, undefined as never), /de 2 a 5/); // las estrellas son obligatorias
    await ok(marcarLinkEnviado(e.leads.LeadA, 4));
    const l = await lead(e.leads.LeadA);
    expect(l.estado_caller).toBe("link_enviado");
    expect(l.link_enviado_por).toBe(e.p.callerA.id);
    expect(l.estrellas_caller).toBe(4);
    const dosDias = new Date(l.llamar_en!).getTime() - antes;
    expect(dosDias).toBeGreaterThan(2 * 86_400_000 - 5_000);
    expect(dosDias).toBeLessThan(2 * 86_400_000 + 5_000);
    const { data: col } = await db.from("etapas").select("estado_caller").eq("id", l.etapa_callers_id!).single();
    expect(col!.estado_caller).toBe("link_enviado");
    const { data: act } = await db.from("actividades").select("tipo, nota, perfil_id").eq("lead_id", e.leads.LeadA).eq("tipo", "whatsapp").single();
    expect(act).toMatchObject({ nota: "Link de agenda enviado", perfil_id: e.p.callerA.id });
  });

  it("un caller ya no agenda a mano (manda el link); un jefe sí puede", async () => {
    como(e, e.p.callerA);
    await falla(agendarCita(e.leads.LeadA, e.p.closerA.id, "2026-12-01T10:00", ""), /link/i);
    como(e, e.p.callerB);
    await falla(marcarLinkEnviado(e.leads.LeadA, 4), /no está asignado a ti/);
  });

  it("al llegar la cita de GHL, la agenda es de quien envió el link", async () => {
    expect((await enviar({ tipo: "cita_agendada", email: `${e.pref}-la@x.test`, fecha: "2026-12-02T15:00:00Z", closer_email: e.p.closerA.email })).status).toBe(200);
    expect(await citaDe(e.leads.LeadA)).toMatchObject({ agendada_por: e.p.callerA.id, origen: "ghl", estrellas_caller: 4 }); // las estrellas pasan a la cita
    const l = await lead(e.leads.LeadA);
    expect(l.estado_caller).toBe("agendado");
    expect(l.llamar_en).toBeNull();
  });

  it("sin «Link enviado», la agenda es del caller del lead; sin caller, de nadie", async () => {
    expect((await enviar({ tipo: "cita_agendada", email: `${e.pref}-lb@x.test`, fecha: "2026-12-03T15:00:00Z" })).status).toBe(200);
    expect((await citaDe(e.leads.LeadB)).agendada_por).toBe(e.p.callerB.id);
    expect((await enviar({ tipo: "cita_agendada", email: `${e.pref}-ll@x.test`, fecha: "2026-12-04T15:00:00Z" })).status).toBe(200);
    expect((await citaDe(e.leads.LeadLibre)).agendada_por).toBeNull();
  });
});

describe("Link de agenda del proyecto", () => {
  it("solo un administrador lo guarda, y solo con https", async () => {
    como(e, e.p.callerA);
    await falla(guardarLinkAgenda("https://api.leadconnectorhq.com/widget/booking/abc"));
    como(e, e.p.ceo);
    await falla(guardarLinkAgenda("http://inseguro.test/agenda"), /https/);
    await ok(guardarLinkAgenda("https://api.leadconnectorhq.com/widget/booking/abc"));
    expect((await db.from("proyectos").select("link_agenda").eq("id", e.proyecto.id).single()).data!.link_agenda).toBe("https://api.leadconnectorhq.com/widget/booking/abc");
    await ok(guardarLinkAgenda(""));
    expect((await db.from("proyectos").select("link_agenda").eq("id", e.proyecto.id).single()).data!.link_agenda).toBeNull();
  });
});
