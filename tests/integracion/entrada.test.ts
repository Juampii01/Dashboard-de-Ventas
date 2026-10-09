// «Entradas»: las landings envían directamente a la app. Se prueba con los dos envíos reales
// (datos personales inventados) contra un proyecto de prueba que se borra solo.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { crearEscenario, borrarEscenario, db, type Escenario } from "../apoyo/escenario";
import { POST, OPTIONS } from "@/app/api/webhooks/entrada/[token]/route";
import { BIBLIOTECA, OPTIN } from "../apoyo/envios";

let e: Escenario;
let token: string;
let entradaId: string;
beforeAll(async () => {
  e = await crearEscenario();
  const { data: p2 } = await db.from("pipelines").insert({ proyecto_id: e.proyecto.id, nombre: "Biblioteca test", orden: 1 }).select().single();
  const { data: et } = await db.from("etapas").insert([{ pipeline_id: p2!.id, nombre: "Quiz completo", orden: 0 }]).select();
  const { data } = await db
    .from("entradas")
    .insert({
      proyecto_id: e.proyecto.id,
      nombre: "Biblioteca de recursos",
      pipeline_id: e.pipeline.id,
      reglas: [
        { campo: "quiz_completed", operador: "igual", valor: "true", pipeline_id: p2!.id, etapa_id: et![0].id, etiqueta: "quiz-completo" },
        { campo: "quiz_completed", operador: "igual", valor: "false", etiqueta: "quiz-sin-terminar" },
      ],
    })
    .select()
    .single();
  token = data!.token;
  entradaId = data!.id;
  (globalThis as Record<string, unknown>).__p2 = p2!.id;
  (globalThis as Record<string, unknown>).__et = et![0].id;
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});

const conEmail = (o: Record<string, unknown>, email: string) => ({ ...o, email });
function enviar(cuerpo: unknown, t = token) {
  const req = new NextRequest(`http://localhost/api/webhooks/entrada/${t}`, {
    method: "POST",
    body: typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo),
    headers: { "content-type": "application/json" },
  });
  return POST(req, { params: Promise.resolve({ token: t }) } as never);
}
const lead = async (email: string) => (await db.from("leads").select("*").eq("proyecto_id", e.proyecto.id).eq("email", email).single()).data!;

describe("Entradas (landings → app)", () => {
  it("un token que no existe da 404 y uno mal formado también", async () => {
    expect((await enviar(BIBLIOTECA, "0".repeat(48))).status).toBe(404);
    expect((await enviar(BIBLIOTECA, "malo")).status).toBe(404);
  });

  it("permite que la landing envíe desde el navegador (CORS)", async () => {
    const r = await OPTIONS();
    expect(r.status).toBe(204);
    expect(r.headers.get("access-control-allow-origin")).toBe("*");
    expect((await enviar("{roto")).headers.get("access-control-allow-origin")).toBe("*");
  });

  it("biblioteca: se guarda todo y las reglas lo llevan a su pipeline y columna", async () => {
    const email = `${e.pref}-bib@ejemplo.test`;
    const r = await enviar(conEmail(BIBLIOTECA, email));
    expect(r.status).toBe(200);
    const l = await lead(email);
    expect(l).toMatchObject({ nombre: "ana", apellido: "maria prueba lopez", fuente: "recursos", quiz_score: 14, origen: "ghl" });
    expect(l.pipeline_id).toBe((globalThis as Record<string, unknown>).__p2);
    expect(l.etapa_id).toBe((globalThis as Record<string, unknown>).__et);
    expect(l.etiquetas).toEqual(["recursos-ia", "quiz-completo"]);
    expect(l.respuestas).toHaveLength(6);
    expect(l.datos.event_id).toBe(BIBLIOTECA.event_id);
    expect(l.datos).not.toHaveProperty("headers");
    // El envío completo queda guardado y unido al lead
    const { data: ev } = await db.from("webhook_eventos").select("*").eq("entrada_id", entradaId).eq("lead_id", l.id).single();
    expect(ev).toMatchObject({ procesado: true, error: null });
    expect(ev!.payload.headers).toBeDefined(); // el original, intacto
  });

  it("opt-in: evento y UTM; si no cumple la regla, queda en el pipeline por defecto", async () => {
    const email = `${e.pref}-opt@ejemplo.test`;
    expect((await enviar(conEmail({ ...OPTIN, quiz_completed: false }, email))).status).toBe(200);
    const l = await lead(email);
    expect(l).toMatchObject({ evento: "Masterclass AI 2026-10-15", fuente: "landing-codigo-maestria", pipeline_id: e.pipeline.id, etapa_id: e.etapas.Nuevos });
    expect(l.seguimiento).toMatchObject({ utm_source: "facebook", utm_campaign: "masterclass-oct", fbclid: "abc123" });
    expect(l.etiquetas).toEqual(["quiz-sin-terminar"]);
    expect(l.respuestas).toHaveLength(8);
  });

  it("si la misma persona vuelve a entrar no se duplica, no pierde nada y se queda su primer origen", async () => {
    const email = `${e.pref}-opt@ejemplo.test`;
    await enviar(conEmail({ ...OPTIN, quiz_completed: true, event: "Masterclass AI 2026-11-20", utm_source: "google", quiz_nueva_pregunta: "Sí" }, email));
    const { data } = await db.from("leads").select("*").eq("proyecto_id", e.proyecto.id).eq("email", email);
    expect(data).toHaveLength(1);
    const l = data![0];
    expect(l.evento).toBe("Masterclass AI 2026-10-15"); // primer evento
    expect(l.seguimiento.utm_source).toBe("facebook"); // primer origen
    expect(l.etiquetas).toEqual(["quiz-sin-terminar", "quiz-completo"]); // se suman
    expect(l.respuestas).toHaveLength(9); // 8 + la nueva
    expect(l.pipeline_id).toBe(e.pipeline.id); // un lead que ya existe no se mueve solo
    const { data: act } = await db.from("actividades").select("nota").eq("lead_id", l.id).like("nota", "%Masterclass AI 2026-11-20%");
    expect(act).toHaveLength(1); // queda apuntado que volvió a otro evento
  });

  it("sin email: se reconoce a la persona por el teléfono", async () => {
    const sinEmail = { ...OPTIN, email: "", phone: "+1 (727) 555-0101" };
    expect((await enviar(sinEmail)).status).toBe(200);
    expect((await enviar({ ...sinEmail, phone: "17275550101" })).status).toBe(200);
    const { data } = await db.from("leads").select("id").eq("proyecto_id", e.proyecto.id).like("telefono", "%555%0101%");
    expect(data).toHaveLength(1);
  });

  it("sin email ni teléfono: se rechaza, pero el envío queda guardado con el motivo", async () => {
    const r = await enviar({ source: "x", quiz_edad: "18" });
    expect(r.status).toBe(422);
    const { data } = await db.from("webhook_eventos").select("procesado, error, payload").eq("entrada_id", entradaId).order("recibido_en", { ascending: false }).limit(1).single();
    expect(data).toMatchObject({ procesado: false, error: "El envío no trae email ni teléfono" });
    expect(data!.payload.quiz_edad).toBe("18");
  });

  it("una entrada desactivada no acepta envíos", async () => {
    await db.from("entradas").update({ activa: false }).eq("id", entradaId);
    expect((await enviar(conEmail(OPTIN, `${e.pref}-off@ejemplo.test`))).status).toBe(404);
    await db.from("entradas").update({ activa: true }).eq("id", entradaId);
  });
});
