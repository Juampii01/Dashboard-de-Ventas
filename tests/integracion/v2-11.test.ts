// V2-11: llamadas de GHL (GHL y Deepgram simulados con su formato oficial; Claude falso), reparto por horarios y coach.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { borrarEscenario, como, crearEscenario, db, falla, ok, type Escenario } from "../apoyo/escenario";
import { procesarLlamadasGhl, sincronizarLlamadasGhl } from "@/lib/ghl-llamadas-sync";
import { cifrar } from "@/lib/cifrado";
import { repartoAutomatico } from "@/lib/leads";
import { guardarUsuarioGhl } from "@/app/(panel)/admin/acciones";
import { guardarHorario } from "@/app/(panel)/perfil/acciones";
import { coachIa } from "@/app/(panel)/leads/coach";
import type { LlamarClaude, PeticionClaude } from "@/lib/ia";
import type { Proyecto } from "@/lib/tipos";

let e: Escenario;
beforeAll(async () => {
  e = await crearEscenario();
  await db.from("proyectos").update({ ghl_token: cifrar("pit-falso"), ghl_location_id: "loc1" }).eq("id", e.proyecto.id);
  await db.from("leads").update({ ghl_contact_id: "cA", telefono: "+34 600 000 001", email: "privado@lead.test" }).eq("id", e.leads.LeadA);
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});

const msg = (id: string, fecha: string, extra: Record<string, unknown> = {}) => ({ id, type: 1, messageType: "TYPE_CALL", locationId: "loc1", contactId: "cA", conversationId: "cv1", dateAdded: fecha, direction: "outbound", status: "completed", userId: "uCaller", meta: { callDuration: "120", callStatus: "completed" }, ...extra });
function ghlFalso(o: { mensajes: unknown[]; transcripcion?: Record<string, unknown>; audio?: Record<string, boolean> }) {
  const pedidos: string[] = [];
  const f = (async (url: string, init?: RequestInit) => {
    pedidos.push(url);
    const h = new Headers(init?.headers);
    if (url.startsWith("https://api.deepgram.com")) {
      if (h.get("Authorization") !== "Token dg-test") return new Response("{}", { status: 401 });
      return Response.json({ results: { utterances: [{ start: 1, speaker: 0, transcript: "Hola, soy el caller" }] } });
    }
    if (h.get("Authorization") !== "Bearer pit-falso" || h.get("Version") !== "2021-04-15") return new Response("{}", { status: 401 });
    const u = new URL(url);
    if (u.pathname === "/conversations/messages/export") return Response.json({ messages: o.mensajes, nextCursor: null, total: o.mensajes.length });
    const t = u.pathname.match(/\/messages\/([^/]+)\/transcription$/);
    if (t) return o.transcripcion?.[t[1]] ? Response.json(o.transcripcion[t[1]]) : new Response("{}", { status: 404 });
    const r = u.pathname.match(/\/messages\/([^/]+)\/locations\/loc1\/recording$/);
    if (r) return o.audio?.[r[1]] ? new Response(new Uint8Array(4000), { headers: { "Content-Type": "audio/x-wav" } }) : new Response("{}", { status: 404 });
    return new Response("{}", { status: 404 });
  }) as unknown as typeof fetch;
  return { f, pedidos };
}
function claudeFalso() {
  const peticiones: PeticionClaude[] = [];
  const llamar = (async (p) => {
    peticiones.push(p);
    return { id: "m", type: "message", role: "assistant", model: "claude-sonnet-5-5", stop_reason: "end_turn", stop_details: null, content: [{ type: "text", text: JSON.stringify({ resumen: "Agendó", puntuacion: 81, interes: 4, objeciones: "- Tiempo", coaching: "- Preguntar antes", siguiente_paso: "Confirmar cita", idea: "Es miedo al precio", frases: ["Entiendo"], pregunta: "¿Qué te frena?" }) }], usage: { input_tokens: 1, output_tokens: 1 } } as never;
  }) as LlamarClaude;
  return { llamar, peticiones };
}

describe("Llamadas de GHL", () => {
  it("usuario de GHL: solo jefes con Administración y formato válido", async () => {
    como(e, e.p.callerA);
    await falla(guardarUsuarioGhl(e.p.callerA.id, "uCaller"), /No tienes permiso/);
    como(e, e.p.ceo);
    await falla(guardarUsuarioGhl(e.p.callerA.id, "x y"), /no parece válido/);
    await ok(guardarUsuarioGhl(e.p.callerA.id, "uCaller"));
  });

  it("trae solo las contestadas de 1 minuto o más, une lead y caller, y no duplica", async () => {
    const { f, pedidos } = ghlFalso({
      mensajes: [
        msg("m1", "2026-10-09T10:00:00Z"),
        msg("m2", "2026-10-09T11:00:00Z", { meta: { callDuration: "30", callStatus: "completed" } }),
        msg("m3", "2026-10-09T12:00:00Z", { meta: { callDuration: "300", callStatus: "no-answer" } }),
        msg("m4", "2026-10-09T13:00:00Z", { contactId: "otro", userId: "uDesconocido" }),
        msg("m5", "2026-09-01T10:00:00Z"), // más vieja que «desde» (14 días): no entra
      ],
    });
    expect(await sincronizarLlamadasGhl(e.proyecto.id, { fetchImpl: f, ahora: new Date("2026-10-10T00:00:00Z") })).toEqual({ nuevas: 2 });
    const u = new URL(pedidos[0]);
    expect(u.searchParams.get("channel")).toBe("Call");
    expect(u.searchParams.get("locationId")).toBe("loc1");
    const ls = (await db.from("llamadas_ghl").select("ghl_message_id, lead_id, perfil_id, duracion, estado").eq("proyecto_id", e.proyecto.id).order("ghl_message_id")).data!;
    expect(ls).toEqual([
      { ghl_message_id: "m1", lead_id: e.leads.LeadA, perfil_id: e.p.callerA.id, duracion: 120, estado: "pendiente" },
      { ghl_message_id: "m4", lead_id: null, perfil_id: null, duracion: 120, estado: "pendiente" },
    ]);
    expect(await sincronizarLlamadasGhl(e.proyecto.id, { fetchImpl: f, ahora: new Date("2026-10-10T00:00:00Z") })).toEqual({ nuevas: 0 });
  });

  it("transcripción de GHL si existe; si no, grabación + Deepgram; sin audio queda marcado; luego Claude analiza", async () => {
    const { f, pedidos } = ghlFalso({ mensajes: [], transcripcion: { m1: [{ mediaChannel: 1, startTime: 2000, transcript: "Hola desde GHL" }] }, audio: { m4: true } });
    const { llamar, peticiones } = claudeFalso();
    await procesarLlamadasGhl(e.proyecto.id, { fetchImpl: f, llamar, deepgramKey: "dg-test" });
    const ls = (await db.from("llamadas_ghl").select("ghl_message_id, estado, fuente, transcripcion, puntuacion, analisis").eq("proyecto_id", e.proyecto.id).order("ghl_message_id")).data!;
    expect(ls[0]).toMatchObject({ ghl_message_id: "m1", estado: "hecho", fuente: "ghl", puntuacion: 81, transcripcion: [{ quien: "Canal 1", inicio: 2, texto: "Hola desde GHL" }] });
    expect(ls[0].analisis).toMatchObject({ interes: 4, siguiente_paso: "Confirmar cita" });
    expect(ls[1]).toMatchObject({ ghl_message_id: "m4", estado: "hecho", fuente: "deepgram", transcripcion: [{ quien: "Persona 1", inicio: 1, texto: "Hola, soy el caller" }] });
    expect(pedidos.some((u) => u.startsWith("https://api.deepgram.com/v1/listen"))).toBe(true);
    expect(peticiones[0].model).toBe("claude-sonnet-5-5");
    // A Claude no le llegan el teléfono ni el email del lead
    for (const p of peticiones) for (const dato of ["600 000 001", "privado@lead.test"]) expect(JSON.stringify(p)).not.toContain(dato);
  });

  it("sin transcripción en GHL y sin clave de Deepgram: error explicado; sin grabación: «sin audio»", async () => {
    await db.from("llamadas_ghl").update({ estado: "pendiente", transcripcion: null, fuente: null }).eq("proyecto_id", e.proyecto.id);
    const { f } = ghlFalso({ mensajes: [] });
    const { llamar } = claudeFalso();
    await procesarLlamadasGhl(e.proyecto.id, { fetchImpl: f, llamar, deepgramKey: null });
    const sinClave = (await db.from("llamadas_ghl").select("estado, error").eq("ghl_message_id", "m1").single()).data!;
    expect(sinClave).toEqual({ estado: "error", error: "GHL no tiene la transcripción y falta la clave de Deepgram (DEEPGRAM_API_KEY)." });
    await db.from("llamadas_ghl").update({ estado: "pendiente" }).eq("proyecto_id", e.proyecto.id);
    await procesarLlamadasGhl(e.proyecto.id, { fetchImpl: f, llamar, deepgramKey: "dg-test" });
    expect((await db.from("llamadas_ghl").select("estado").eq("ghl_message_id", "m1").single()).data!.estado).toBe("sin_audio");
  });
});

describe("Reparto por horarios (ahora con %, bloque 2 de 1.0)", () => {
  it("solo a quien está en su horario; si no hay nadie, igual entre todos los que tienen %", async () => {
    como(e, e.p.ceo);
    await falla(guardarHorario(e.p.callerA.id, { dias: [], desde: "09:00", hasta: "14:00" }), /al menos un tramo/);
    await ok(guardarHorario(e.p.callerA.id, { dias: [1, 2, 3, 4, 5], desde: "09:00", hasta: "14:00" }));
    await ok(guardarHorario(e.p.callerB.id, { dias: [6, 7], desde: "09:00", hasta: "14:00" }));
    await db.from("miembros_proyecto").update({ reparto_pct: 33.34 }).eq("proyecto_id", e.proyecto.id).in("perfil_id", [e.p.callerA.id, e.p.callerB.id, e.p.callerC.id]);
    const proyecto = { ...(e.proyecto as Proyecto), reparto_auto: true, reparto_solo_horario: true, zona_horaria: "Europe/Madrid" } as Proyecto;
    const lunes = new Date("2026-10-12T08:30:00Z"); // lunes 10:30 Madrid: solo callerA
    expect(new Set(await repartoAutomatico(proyecto, 4, lunes))).toEqual(new Set([e.p.callerA.id]));
    // Nadie en su horario: entre los 3 con %. callerA ya lleva 4, así que el reparto equilibra: 4 / 3 / 3 en total
    const noche = new Date("2026-10-12T22:00:00Z");
    const deNoche = await repartoAutomatico(proyecto, 6, noche);
    expect([e.p.callerA.id, e.p.callerB.id, e.p.callerC.id].map((c) => deNoche.filter((x) => x === c).length)).toEqual([0, 3, 3]);
  });
});

describe("Coach de IA", () => {
  it("solo con leads tuyos; manda las respuestas del formulario pero no el email ni el teléfono", async () => {
    await db.from("leads").update({ respuestas: [{ pregunta: "Inversión", respuesta: "Sí, ahora" }] }).eq("id", e.leads.LeadA);
    const { llamar, peticiones } = claudeFalso();
    como(e, e.p.callerB);
    await falla(coachIa(e.leads.LeadA, "Me parece caro", llamar), /no está asignado a ti/);
    como(e, e.p.callerA);
    await falla(coachIa(e.leads.LeadA, "ok", llamar), /Escribe lo que ha dicho/);
    // Sin la clave de Claude (en los tests no la hay) el mensaje lo dice claro, no «Algo ha fallado»
    if (!process.env.ANTHROPIC_API_KEY) await falla(coachIa(e.leads.LeadA, "Me parece caro"), /Falta la clave de Claude/);
    const r = await ok(coachIa(e.leads.LeadA, "Me parece caro", llamar));
    expect(r).toEqual({ idea: "Es miedo al precio", frases: ["Entiendo"], pregunta: "¿Qué te frena?" });
    const enviado = JSON.stringify(peticiones[0]);
    expect(enviado).toContain("Inversión: Sí, ahora");
    expect(enviado).toContain("Me parece caro");
    expect(enviado).toContain("caller");
    for (const dato of ["privado@lead.test", "600 000 001"]) expect(enviado).not.toContain(dato);
    expect(peticiones[0].output_config?.effort).toBe("low");
  });
});
