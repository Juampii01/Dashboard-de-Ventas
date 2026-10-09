// V2-10: IA con un Claude FALSO (nunca se llama a la API de verdad en los tests).
// Comprueba qué se le envía (modelo, fallbacks, formato, contexto, sin datos personales en el scoring) y qué se guarda.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { borrarEscenario, como, crearEscenario, db, falla, ok, type Escenario } from "../apoyo/escenario";
import { encolarAnalisis, procesarPendientes, type LlamarClaude, type PeticionClaude } from "@/lib/ia";
import { aceptarAutocompletado, calcularScoringIa, evaluarManual, guardarConfigIa, rechazarAutocompletado } from "@/app/(panel)/closer/analisis/acciones";

let e: Escenario;
let citaA = "";
let citaB = "";
const grab: Record<string, string> = {};
beforeAll(async () => {
  e = await crearEscenario();
  const { data: cs } = await db.from("citas").insert([
    { proyecto_id: e.proyecto.id, lead_id: e.leads.LeadA, closer_id: e.p.closerA.id, fecha: "2026-10-09T15:00:00Z", estado: "pendiente" },
    { proyecto_id: e.proyecto.id, lead_id: e.leads.LeadB, closer_id: e.p.closerA.id, fecha: "2026-10-09T18:00:00Z", estado: "pendiente" },
  ]).select("id, lead_id");
  citaA = cs!.find((c) => c.lead_id === e.leads.LeadA)!.id;
  citaB = cs!.find((c) => c.lead_id === e.leads.LeadB)!.id;
  const { data: gs } = await db.from("grabaciones").insert([
    { proyecto_id: e.proyecto.id, closer_id: e.p.closerA.id, recording_id: 1, titulo: "LeadA: Sesión", inicio: "2026-10-09T15:00:00Z", cita_id: citaA, conciliacion: "auto", transcripcion: [{ speaker: { display_name: "LeadA" }, text: "Me parece caro", timestamp: "00:10:00" }] },
    { proyecto_id: e.proyecto.id, closer_id: e.p.closerA.id, recording_id: 2, titulo: "LeadB: Sesión", inicio: "2026-10-09T18:00:00Z", cita_id: citaB, conciliacion: "auto", transcripcion: [] },
  ]).select("id, recording_id");
  for (const g of gs!) grab[g.recording_id] = g.id;
  await db.from("leads").update({ respuestas: [{ pregunta: "Inversión", respuesta: "Sí, ahora" }], email: "secreto-a@cliente.test" }).eq("id", e.leads.LeadA);
  await db.from("leads").update({ respuestas: [{ pregunta: "Inversión", respuesta: "No" }] }).eq("id", e.leads.LeadB);
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});

function claudeFalso(respuesta: unknown, extra: Record<string, unknown> = {}) {
  const peticiones: PeticionClaude[] = [];
  const llamar = (async (p) => {
    peticiones.push(p);
    return { id: "msg_test", type: "message", role: "assistant", model: "claude-sonnet-5-5", stop_reason: "end_turn", stop_details: null, content: [{ type: "text", text: JSON.stringify(respuesta) }], usage: { input_tokens: 100, output_tokens: 50 }, ...extra } as never;
  }) as LlamarClaude;
  return { llamar, peticiones };
}
const analisis = async (rec: number) => (await db.from("analisis_llamadas").select("*").eq("grabacion_id", grab[rec]).single()).data!;

describe("IA", () => {
  it("Configurar IA: solo jefes; el contexto del programa manda sobre el general", async () => {
    como(e, e.p.closerA);
    await falla(guardarConfigIa(null, "x", {}), /Solo el director o el CEO/);
    como(e, e.p.ceo);
    await ok(guardarConfigIa(null, "Contexto general", { psicologia: { activo: false } }));
    await ok(guardarConfigIa(null, "Contexto general v2", { psicologia: { activo: false } })); // actualiza, no duplica
    expect((await db.from("config_ia").select("id").eq("proyecto_id", e.proyecto.id)).data).toHaveLength(1);
  });

  it("analiza la cola con Sonnet 5.5, fallbacks «default», formato fijo y lo guarda revisado", async () => {
    await encolarAnalisis(e.proyecto.id, grab[1]);
    const { llamar, peticiones } = claudeFalso({ resumen: "Dudó por el precio", puntuacion: 72, resultado: "seguimiento", secciones: { objeciones: "- Precio" }, autocompletado: { estado: "seguimiento", estrellas: 4, nota: "Volver a llamar el lunes" } });
    expect(await procesarPendientes(e.proyecto.id, { llamar })).toBe(1);
    const p = peticiones[0];
    expect(p).toMatchObject({ model: "claude-sonnet-5-5", fallbacks: "default", betas: ["server-side-fallback-2026-07-01"], output_config: { effort: "medium", format: { type: "json_schema" } } });
    const sistema = (p.system as { text: string }[])[0].text;
    expect(sistema).toContain("Contexto general v2");
    expect(sistema).not.toContain("psicologia"); // agente apagado
    expect(JSON.stringify(p.messages)).toContain("[00:10:00] LeadA: Me parece caro");
    expect(await analisis(1)).toMatchObject({ estado: "hecho", puntuacion: 72, resultado: "seguimiento", cita_id: citaA, lead_id: e.leads.LeadA, closer_id: e.p.closerA.id, autocompletado_estado: "pendiente", modelo: "claude-sonnet-5-5" });
  });

  it("si Claude se niega, queda «error» con el motivo; la cola sigue", async () => {
    await encolarAnalisis(e.proyecto.id, grab[2]);
    const { llamar } = claudeFalso({}, { stop_reason: "refusal", stop_details: { type: "refusal", category: "general_harms", explanation: null }, content: [] });
    await procesarPendientes(e.proyecto.id, { llamar });
    expect(await analisis(2)).toMatchObject({ estado: "error", error: "Claude no ha querido analizar esto (motivo: general_harms)." });
  });

  it("autocompletado: otro closer no lo toca; confirmar aplica el estado y las estrellas a la cita", async () => {
    const a = await analisis(1);
    como(e, e.p.closerB);
    await falla(aceptarAutocompletado(a.id), /no es tuyo/);
    como(e, e.p.closerA);
    await ok(aceptarAutocompletado(a.id));
    expect((await db.from("citas").select("estado, estrellas_closer, nota").eq("id", citaA).single()).data).toEqual({ estado: "seguimiento", estrellas_closer: 4, nota: "IA: Volver a llamar el lunes" });
    expect((await analisis(1)).autocompletado_estado).toBe("aceptado");
    await falla(aceptarAutocompletado(a.id), /nada que confirmar/);
  });

  it("si la IA propone «cerrada», no cierra sola: manda a la ficha para registrar la venta", async () => {
    await db.from("analisis_llamadas").update({ autocompletado: { estado: "cerrada", estrellas: 5, nota: "x" }, autocompletado_estado: "pendiente" }).eq("grabacion_id", grab[1]);
    como(e, e.p.closerA);
    expect(await ok(aceptarAutocompletado((await analisis(1)).id))).toEqual({ irAVenta: e.leads.LeadA });
    expect((await db.from("citas").select("estado").eq("id", citaA).single()).data!.estado).toBe("seguimiento"); // sin tocar
    expect((await analisis(1)).autocompletado_estado).toBe("aceptado"); // no se queda pendiente para siempre
    await ok(rechazarAutocompletado((await analisis(1)).id));
  });

  it("evaluación manual: solo jefes y nota de 1 a 10", async () => {
    const id = (await analisis(1)).id;
    como(e, e.p.closerA);
    await falla(evaluarManual(id, 8, ""), /Solo el director/);
    como(e, e.p.director);
    await falla(evaluarManual(id, 11, ""), /de 1 a 10/);
    await ok(evaluarManual(id, 8, "Buen manejo del precio"));
    expect(await analisis(1)).toMatchObject({ evaluacion_manual: 8, evaluado_por: e.p.director.id });
  });

  it("scoring IA: a Claude no le llega ningún nombre ni email; solo se guardan respuestas que existen", async () => {
    await db.from("citas").update({ estado: "cerrada" }).eq("id", citaA);
    await db.from("citas").update({ estado: "perdida" }).eq("id", citaB);
    const { llamar, peticiones } = claudeFalso({ pesos: [{ pregunta: "Inversión", respuesta: "Sí, ahora", puntos: 15 }, { pregunta: "Inversión", respuesta: "No", puntos: -4 }, { pregunta: "Inventada", respuesta: "x", puntos: 3 }], explicacion: "- Quien invierte ya, cierra" });
    como(e, e.p.ceo);
    await ok(calcularScoringIa(llamar));
    const enviado = JSON.stringify(peticiones[0]);
    for (const dato of ["LeadA", "LeadB", "secreto-a@cliente.test"]) expect(enviado).not.toContain(dato);
    expect((await db.from("scoring_ia").select("pesos").eq("proyecto_id", e.proyecto.id).single()).data!.pesos).toEqual({ Inversión: { "Sí, ahora": 10, No: -4 } });
  });
});
