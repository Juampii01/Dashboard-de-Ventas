// V2-9: Fathom por API (simulado con el formato oficial de GET /meetings). Cuentas por closer, traer grabaciones,
// conciliar solas o a mano, no pisar lo hecho a mano y que la API key no salga.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { borrarEscenario, como, crearEscenario, db, falla, ok, type Escenario } from "../apoyo/escenario";
import { sincronizarFathom } from "@/lib/fathom-sync";
import { cifrar } from "@/lib/cifrado";
import { conciliarGrabacionManual, desunirGrabacion, guardarCuentaFathom } from "@/app/(panel)/closer/llamadas/acciones-fathom";

let e: Escenario;
const KEY = "fathom-test-key-1234567890";
beforeAll(async () => {
  e = await crearEscenario();
  await db.from("citas").insert([
    { proyecto_id: e.proyecto.id, lead_id: e.leads.LeadA, closer_id: e.p.closerA.id, fecha: "2026-10-09T15:00:00Z", estado: "pendiente" },
    { proyecto_id: e.proyecto.id, lead_id: e.leads.LeadB, closer_id: e.p.closerA.id, fecha: "2026-10-09T18:00:00Z", estado: "pendiente" },
  ]);
  await db.from("leads").update({ email: "lead-a@cliente.test" }).eq("id", e.leads.LeadA);
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});

const reunion = (id: number, inicio: string, extra: Record<string, unknown> = {}) => ({
  title: "Sesión", meeting_title: "Sesión", meeting_type: null, recording_id: id, url: `https://fathom.video/calls/${id}`, share_url: `https://fathom.video/share/${id}`,
  created_at: inicio, scheduled_start_time: inicio, scheduled_end_time: inicio, recording_start_time: inicio, recording_end_time: inicio,
  calendar_invitees_domains_type: "one_or_more_external", shared_with: "single_team", transcript_language: "es",
  calendar_invitees: [], recorded_by: { name: "Closer", email: "c@x.test", email_domain: "x.test", team: null },
  default_summary: { template_name: "General", markdown_formatted: "## Resumen" }, transcript: [{ speaker: { display_name: "Ana" }, text: "Hola", timestamp: "00:00:01" }],
  ...extra,
});
// Fathom simulado: 2 páginas, y guarda lo que se le pide
function fathomFalso(paginas: unknown[][]) {
  const pedidos: { url: string; key: string | null }[] = [];
  const f = (async (url: string, init?: RequestInit) => {
    const h = new Headers(init?.headers);
    pedidos.push({ url, key: h.get("X-Api-Key") });
    if (h.get("X-Api-Key") !== KEY) return new Response("{}", { status: 401 });
    const cursor = new URL(url).searchParams.get("cursor");
    const i = cursor ? Number(cursor) : 0;
    return Response.json({ limit: 10, next_cursor: i + 1 < paginas.length ? String(i + 1) : null, items: paginas[i] });
  }) as typeof fetch;
  return { f, pedidos };
}

describe("Fathom", () => {
  it("cuentas: un closer solo añade la suya; la API key es obligatoria al crear y el formato lleva {nombre cliente}", async () => {
    como(e, e.p.closerA);
    await falla(guardarCuentaFathom(null, { nombre: "Mía", apiKey: "", formato: "", perfilId: e.p.closerA.id }), /Pega la API key/);
    await falla(guardarCuentaFathom(null, { nombre: "Mía", apiKey: KEY, formato: "Sesión", perfilId: e.p.closerA.id }), /\{nombre cliente\}/);
    await ok(guardarCuentaFathom(null, { nombre: "Fathom de A", apiKey: KEY, formato: "{nombre cliente}: Sesión…", perfilId: e.p.closerB.id }));
    const { data } = await db.from("cuentas_fathom").select("perfil_id, api_key").eq("proyecto_id", e.proyecto.id);
    expect(data!.map((c) => c.perfil_id)).toEqual([e.p.closerA.id]); // aunque pidiera la de B, se guarda como suya
    expect(data![0].api_key).toMatch(/^v1:/); // arreglo 3: cifrada en la base
    expect(data![0].api_key).not.toContain(KEY);
    como(e, e.p.callerA);
    await falla(guardarCuentaFathom(null, { nombre: "X", apiKey: KEY, formato: "", perfilId: e.p.closerA.id }), /No tienes permiso/);
  });

  it("trae todas las páginas con la cabecera y los parámetros oficiales y concilia por email, por título o deja pendiente", async () => {
    const { f, pedidos } = fathomFalso([
      [reunion(1, "2026-10-09T15:03:00Z", { calendar_invitees: [{ name: "A", email: "LEAD-A@cliente.test", email_domain: "cliente.test", is_external: true, matched_speaker_display_name: null }] })],
      [reunion(2, "2026-10-09T18:01:00Z", { title: "LeadB: Sesión estratégica", share_url: "javascript:alert(1)" }), reunion(3, "2026-10-20T10:00:00Z")],
    ]);
    const r = await sincronizarFathom(e.proyecto.id, { fetchImpl: f, ahora: new Date("2026-10-21T00:00:00Z") });
    expect(r).toEqual([{ cuenta: "Fathom de A", nuevas: 3, conciliadas: 2 }]);
    expect(pedidos).toHaveLength(2);
    const u = new URL(pedidos[0].url);
    expect(u.origin + u.pathname).toBe("https://api.fathom.ai/external/v1/meetings");
    expect(u.searchParams.get("include_transcript")).toBe("true");
    expect(u.searchParams.get("created_after")).toBe("2026-08-22T00:00:00.000Z"); // 60 días la primera vez
    expect(pedidos[0].key).toBe(KEY);
    const gs = (await db.from("grabaciones").select("recording_id, cita_id, conciliacion, motivo, resumen, closer_id").eq("proyecto_id", e.proyecto.id).order("recording_id")).data!;
    const citaDe = async (lead: string) => (await db.from("citas").select("id").eq("lead_id", lead).single()).data!.id;
    expect(gs[0]).toMatchObject({ recording_id: 1, cita_id: await citaDe(e.leads.LeadA), conciliacion: "auto", motivo: "Por el email del invitado", resumen: "## Resumen", closer_id: e.p.closerA.id });
    expect(gs[1]).toMatchObject({ recording_id: 2, cita_id: await citaDe(e.leads.LeadB), motivo: "Por el nombre del título" });
    expect(gs[2]).toMatchObject({ recording_id: 3, cita_id: null, conciliacion: "pendiente" });
    // Un enlace que no es https no se guarda (se pondría en la página)
    expect((await db.from("grabaciones").select("share_url, url").eq("recording_id", 2).single()).data).toEqual({ share_url: null, url: "https://fathom.video/calls/2" });
  });

  it("volver a sincronizar no duplica ni pisa lo hecho a mano", async () => {
    como(e, e.p.closerA);
    const g1 = (await db.from("grabaciones").select("id").eq("recording_id", 1).single()).data!.id;
    await ok(desunirGrabacion(g1, true)); // descartada a mano
    const { f } = fathomFalso([[reunion(1, "2026-10-09T15:03:00Z", { title: "Título cambiado" })]]);
    await sincronizarFathom(e.proyecto.id, { fetchImpl: f });
    const g = (await db.from("grabaciones").select("titulo, conciliacion, cita_id").eq("id", g1).single()).data!;
    expect(g).toEqual({ titulo: "Título cambiado", conciliacion: "descartada", cita_id: null });
    expect((await db.from("grabaciones").select("id").eq("proyecto_id", e.proyecto.id)).data).toHaveLength(3);
  });

  it("conciliar a mano: solo citas del mismo closer y que no tengan ya otra grabación; otro closer no la toca", async () => {
    const g3 = (await db.from("grabaciones").select("id").eq("recording_id", 3).single()).data!.id;
    const citaB = (await db.from("citas").select("id").eq("lead_id", e.leads.LeadB).single()).data!.id;
    const citaA = (await db.from("citas").select("id").eq("lead_id", e.leads.LeadA).single()).data!.id;
    como(e, e.p.closerB);
    await falla(conciliarGrabacionManual(g3, citaA), /no es tuya/);
    como(e, e.p.closerA);
    await falla(conciliarGrabacionManual(g3, citaB), /ya tiene otra grabación/);
    await ok(conciliarGrabacionManual(g3, citaA)); // la de A quedó libre al descartar la grabación 1
    expect((await db.from("grabaciones").select("cita_id, conciliacion").eq("id", g3).single()).data).toEqual({ cita_id: citaA, conciliacion: "manual" });
  });

  it("una clave rechazada queda explicada en la cuenta, sin romper", async () => {
    await db.from("cuentas_fathom").update({ api_key: cifrar("otra-clave-que-no-vale") }).eq("proyecto_id", e.proyecto.id);
    const { f } = fathomFalso([[]]);
    const [r] = await sincronizarFathom(e.proyecto.id, { fetchImpl: f });
    expect(r.error).toMatch(/no acepta la API key/);
    expect((await db.from("cuentas_fathom").select("ultimo_resultado").eq("proyecto_id", e.proyecto.id).single()).data!.ultimo_resultado).toMatch(/^Error: Fathom no acepta/);
  });
});
