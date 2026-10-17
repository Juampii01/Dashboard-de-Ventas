// Leads por API (Cristian, 16-17 oct 2026): los contactos nuevos de GHL entran cada 30 s en el pipeline de su
// etiqueta (varias = todos; ninguna = «0. Agendas General»), en la primera columna. GHL se simula (sin internet) con
// la forma real de POST /contacts/search comprobada el 17 oct.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { borrarEscenario, crearEscenario, db, type Escenario } from "../apoyo/escenario";
import { leerLeadsGhl, pipelinesDeEtiquetas } from "@/lib/ghl-leads";
import type { Proyecto } from "@/lib/tipos";

let e: Escenario;
let contactos: Record<string, unknown>[] = [];
let falla: string | null = null; // id de contacto cuyo GET falla (500)
const CAMPOS = [
  { id: "f1", name: "¿En qué situación estás hoy?" },
  { id: "f2", name: "¿Cuándo quieres empezar?" },
  { id: "f3", name: "utm_source" },
];
const busquedas: { gt: string }[] = [];
const falsoFetch = (async (url: string, init?: { body?: string }) => {
  const u = new URL(url);
  if (u.pathname === "/contacts/search") {
    const b = JSON.parse(init?.body ?? "{}");
    const campo = b.filters[0].field as "dateAdded" | "dateUpdated";
    const gt = b.filters[0].value.gt as string;
    if (campo === "dateAdded") busquedas.push({ gt });
    const lista = contactos.filter((c) => typeof c[campo] === "string" && (c[campo] as string) > gt).sort((a, b) => String(a[campo]).localeCompare(String(b[campo])));
    return Response.json({ contacts: lista.slice(0, b.pageLimit), total: lista.length });
  }
  if (/^\/locations\/[^/]+\/customFields$/.test(u.pathname)) return Response.json({ customFields: CAMPOS });
  if (u.pathname === "/opportunities/pipelines") return Response.json({ pipelines: [] }); // el espejo (17 oct) se prueba aparte
  const m = u.pathname.match(/^\/contacts\/(.+)$/);
  if (m) {
    if (m[1] === falla) return new Response("{}", { status: 500 });
    const c = contactos.find((x) => x.id === m[1]);
    return c ? Response.json({ contact: c }) : new Response("{}", { status: 404 });
  }
  return new Response("{}", { status: 404 });
}) as unknown as typeof fetch;

const AHORA = new Date("2026-10-17T10:00:00Z");
const mas = (min: number) => new Date(AHORA.getTime() + min * 60_000);
const proyecto = async () => (await db.from("proyectos").select("*").eq("id", e.proyecto.id).single()).data as Proyecto & { ghl_location_id: string | null };
const leer = async (ahora = AHORA) => leerLeadsGhl(await proyecto(), "tok", { fetchImpl: falsoFetch, ahora });
const leadPorContacto = async (id: string) => (await db.from("leads").select("*").eq("proyecto_id", e.proyecto.id).eq("ghl_contact_id", `${e.pref}-${id}`).maybeSingle()).data;
const contacto = (id: string, dateAdded: string, extra: Record<string, unknown> = {}) => ({ id: `${e.pref}-${id}`, dateAdded, firstName: id, email: `${e.pref}-${id}@x.test`, source: "recursos", tags: [], customFields: [], ...extra });
const pipes: Record<string, { id: string; etapas: Record<string, string> }> = {};

beforeAll(async () => {
  e = await crearEscenario();
  await db.from("proyectos").update({ ghl_location_id: "loc-1" }).eq("id", e.proyecto.id);
  for (const [nombre, cols] of [
    ["1. Biblioteca Recursos", ["Nuevos", "Agendados"]],
    ["2. Webinar 1", ["Optin", "Form completo"]],
    ["0. Agendas General", ["Form", "Agendan"]],
  ] as const) {
    const { data: p } = await db.from("pipelines").insert({ proyecto_id: e.proyecto.id, nombre, orden: 5 }).select("id").single();
    const { data: et } = await db.from("etapas").insert(cols.map((n, i) => ({ pipeline_id: p!.id, nombre: n, orden: i }))).select("id, nombre");
    pipes[nombre] = { id: p!.id, etapas: Object.fromEntries(et!.map((x) => [x.nombre, x.id])) };
  }
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});

describe("Leads nuevos de GHL por la API (contactos)", () => {
  it("etiqueta → pipeline; varias, todos; ninguna, General", () => {
    expect(pipelinesDeEtiquetas(["Biblioteca Recursos"])).toEqual(["1. Biblioteca Recursos"]);
    expect(pipelinesDeEtiquetas(["webinar1", "form completado", "biblioteca recursos"])).toEqual(["1. Biblioteca Recursos", "2. Webinar 1"]);
    expect(pipelinesDeEtiquetas(["agenda llamada"])).toEqual(["0. Agendas General"]);
    expect(pipelinesDeEtiquetas(undefined)).toEqual(["0. Agendas General"]);
  });

  it("la primera vez empieza ahora: no mete los de antes", async () => {
    contactos = [contacto("viejo", "2026-10-17T09:00:00.000Z", { tags: ["biblioteca recursos"] })];
    const r = await leer();
    expect(r.nuevos).toBe(0);
    expect(busquedas.at(-1)!.gt).toBe("2026-10-17T09:58:00.000Z");
    expect(await leadPorContacto("viejo")).toBeNull();
    expect((await proyecto()).ghl_leads_hasta).toBe("2026-10-17T10:00:00+00:00");
  });

  it("cada contacto nuevo va al pipeline de su etiqueta, en la primera columna, con respuestas y reparto", async () => {
    contactos.push(
      contacto("bib", "2026-10-17T10:00:10.000Z", { tags: ["biblioteca recursos"], customFields: [{ id: "f1", value: "Tengo un negocio" }, { id: "f3", value: "yt" }] }),
      contacto("dos", "2026-10-17T10:00:20.000Z", { tags: ["biblioteca recursos", "webinar1", "form completado"], source: "landing-codigo-maestria" }),
      // Sin etiqueta: se espera 2 min a que GHL se la ponga (este ya lleva más de 2 min creado)
      contacto("sin", "2026-10-17T09:58:30.000Z", { tags: [] }),
      // LeadA ya estaba en la app (mismo email): no se duplica ni se mueve de su pipeline; gana su tarjeta en la Biblioteca
      { id: `${e.pref}-cA`, dateAdded: "2026-10-17T10:00:40.000Z", firstName: "LeadA", email: `${e.pref}-la@x.test`, tags: ["biblioteca recursos"], customFields: [{ id: "f2", value: "Ya mismo" }] }
    );
    const r = await leer(mas(1));
    expect(r).toMatchObject({ nuevos: 3, errores: [] });

    const bib = await leadPorContacto("bib");
    expect(bib).toMatchObject({ pipeline_id: pipes["1. Biblioteca Recursos"].id, etapa_id: pipes["1. Biblioteca Recursos"].etapas.Nuevos, fuente: "recursos", origen: "ghl", creado_en: "2026-10-17T10:00:10+00:00" });
    expect(bib!.respuestas).toEqual([{ pregunta: "¿En qué situación estás hoy?", respuesta: "Tengo un negocio" }]);
    expect(bib!.seguimiento).toEqual({ utm_source: "yt" });
    const { data: hist } = await db.from("actividades").select("nota").eq("lead_id", bib!.id);
    expect(hist!.map((h) => h.nota)).toContain("Entró desde GHL (API) · 1. Biblioteca Recursos");

    // Con dos etiquetas: su pipeline es el primero y en el otro tiene su tarjeta 🔗, en la primera columna
    const dos = await leadPorContacto("dos");
    expect(dos).toMatchObject({ pipeline_id: pipes["1. Biblioteca Recursos"].id, fuente: "landing-codigo-maestria" });
    const { data: tarjetas } = await db.from("tarjetas_extra").select("pipeline_id, etapa_id").eq("lead_id", dos!.id);
    expect(tarjetas).toEqual([{ pipeline_id: pipes["2. Webinar 1"].id, etapa_id: pipes["2. Webinar 1"].etapas.Optin }]);

    const sin = await leadPorContacto("sin");
    expect(sin).toMatchObject({ pipeline_id: pipes["0. Agendas General"].id, etapa_id: pipes["0. Agendas General"].etapas.Form });

    const { data: a } = await db.from("leads").select("*").eq("id", e.leads.LeadA).single();
    expect(a).toMatchObject({ ghl_contact_id: `${e.pref}-cA`, pipeline_id: e.pipeline.id, etapa_id: e.etapas.Nuevos });
    expect(a!.respuestas).toEqual([{ pregunta: "¿Cuándo quieres empezar?", respuesta: "Ya mismo" }]);
    const { data: tA } = await db.from("tarjetas_extra").select("pipeline_id").eq("lead_id", e.leads.LeadA);
    expect(tA!.map((t) => t.pipeline_id)).toContain(pipes["1. Biblioteca Recursos"].id);
    expect((await proyecto()).ghl_leads_hasta).toBe("2026-10-17T10:00:40+00:00");
  });

  it("no repite los ya vistos", async () => {
    const r = await leer(mas(1.5));
    expect(r).toMatchObject({ nuevos: 0, actualizados: 0 });
    const { count } = await db.from("leads").select("id", { count: "exact", head: true }).eq("proyecto_id", e.proyecto.id).eq("email", `${e.pref}-bib@x.test`);
    expect(count).toBe(1);
  });

  it("las respuestas que llegan después se completan durante 10 min", async () => {
    (contactos.find((c) => c.id === `${e.pref}-bib`)!.customFields as unknown[]).push({ id: "f2", value: "Este mes" });
    expect((await leer(mas(2))).completados).toBe(1);
    expect((await leadPorContacto("bib"))!.respuestas).toHaveLength(2);
    // Pasados los 10 min ya no se relee
    (contactos.find((c) => c.id === `${e.pref}-bib`)!.customFields as unknown[]).push({ id: "f1", value: "Cambiada" });
    expect((await leer(mas(12))).completados).toBe(0);
  });

  it("los que llegan más tarde entran en la lectura siguiente; si GHL falla al releer, no rompe la lectura", async () => {
    falla = `${e.pref}-luego`;
    contactos.push(contacto("luego", "2026-10-17T10:13:00.000Z", { tags: ["webinar1"] }));
    const r = await leer(mas(13));
    expect(r.nuevos).toBe(1);
    expect((await leadPorContacto("luego"))!.pipeline_id).toBe(pipes["2. Webinar 1"].id);
    expect((await proyecto()).ghl_leads_hasta).toBe("2026-10-17T10:13:00+00:00");
    const r2 = await leer(mas(13.5));
    expect(r2.errores.join()).toContain("Releer");
    expect(r2.nuevos).toBe(0);
  });

  it("un contacto que gana una etiqueta después (Biblioteca → Webinar) gana su tarjeta en ese pipeline", async () => {
    falla = null;
    const bib = contactos.find((c) => c.id === `${e.pref}-bib`)!;
    bib.tags = ["biblioteca recursos", "webinar1"];
    bib.dateUpdated = "2026-10-17T10:20:00.000Z";
    // Uno de antes que no estaba en la app y se apunta al Webinar: entra como nuevo
    contactos.push(contacto("antiguo", "2026-10-01T10:00:00.000Z", { tags: ["webinar1"], dateUpdated: "2026-10-17T10:21:00.000Z" }));
    // Uno que cambia sin etiqueta de pipeline: no se toca
    contactos.push(contacto("otro", "2026-10-02T10:00:00.000Z", { tags: ["enviado email mkt"], dateUpdated: "2026-10-17T10:22:00.000Z" }));
    const r = await leer(mas(25));
    expect(r).toMatchObject({ cambiados: 2, nuevos: 1, errores: [] });

    const lead = await leadPorContacto("bib");
    expect(lead!.pipeline_id).toBe(pipes["1. Biblioteca Recursos"].id);
    const { data: t } = await db.from("tarjetas_extra").select("pipeline_id, etapa_id").eq("lead_id", lead!.id);
    expect(t).toEqual([{ pipeline_id: pipes["2. Webinar 1"].id, etapa_id: pipes["2. Webinar 1"].etapas.Optin }]);
    const { data: hist } = await db.from("actividades").select("nota").eq("lead_id", lead!.id);
    expect(hist!.map((h) => h.nota)).toContain("Nueva etiqueta en GHL (API) · ahora también en 2. Webinar 1");

    expect((await leadPorContacto("antiguo"))!.pipeline_id).toBe(pipes["2. Webinar 1"].id);
    expect(await leadPorContacto("otro")).toBeNull();

    // La lectura siguiente ya no hace nada (ya está en los dos)
    expect((await leer(mas(25.5))).cambiados).toBe(0);
  });

  it("si en GHL cambian los datos de un lead que ya está, la app se pone al día (y solo escribe si hay algo nuevo)", async () => {
    const bib = contactos.find((c) => c.id === `${e.pref}-bib`)!;
    bib.phone = "+34 699 00 11 22";
    bib.lastName = "Corregido";
    (bib.customFields as unknown[]).push({ id: "f3", value: "ig" }); // utm: va al seguimiento, no cuenta como respuesta
    bib.dateUpdated = "2026-10-17T10:30:00.000Z";
    const r = await leer(mas(31));
    expect(r).toMatchObject({ puestosAlDia: 1, errores: [] });
    const lead = await leadPorContacto("bib");
    expect(lead).toMatchObject({ telefono: "+34 699 00 11 22", apellido: "Corregido" });
    // Mismo teléfono con otro formato y nada más nuevo: no se reescribe
    bib.phone = "34699001122";
    expect((await leer(mas(31.5))).puestosAlDia).toBe(0);
  });

  it("GHL no pisa lo que el equipo cambió en la app (Cristian, 17 oct); lo nuevo sí llega", async () => {
    const lead = await leadPorContacto("bib");
    await db.from("leads").update({ apellido: "CambioApp", telefono: "+1 555 000 9999" }).eq("id", lead!.id);
    const bib = contactos.find((c) => c.id === `${e.pref}-bib`)!;
    bib.lastName = "Otro en GHL";
    bib.phone = "+34 600 00 00 01";
    bib.tags = [...(bib.tags as string[]), "prueba api"];
    bib.dateUpdated = "2026-10-17T10:35:00.000Z";
    const r = await leer(mas(36));
    expect(r).toMatchObject({ puestosAlDia: 1, errores: [] });
    const ahora = await leadPorContacto("bib");
    expect(ahora).toMatchObject({ apellido: "CambioApp", telefono: "+1 555 000 9999" });
    expect(ahora!.etiquetas).toContain("prueba api");
    // Sin nada nuevo más que su nombre o teléfono, no se escribe
    bib.dateUpdated = "2026-10-17T10:36:00.000Z";
    expect((await leer(mas(37))).puestosAlDia).toBe(0);
  });

  it("un contacto sin etiqueta espera 2 min: si GHL se la pone, va a su pipeline y no a General (Cristian, 17 oct)", async () => {
    contactos.push(contacto("espera", "2026-10-17T10:40:00.000Z", { tags: [] }), contacto("general", "2026-10-17T10:40:05.000Z", { tags: [] }));
    const t = (hhmmss: string) => new Date(`2026-10-17T${hhmmss}.000Z`);
    expect((await leer(t("10:40:30"))).nuevos).toBe(0);
    expect(await leadPorContacto("espera")).toBeNull();
    contactos.find((c) => c.id === `${e.pref}-espera`)!.tags = ["biblioteca recursos"];
    expect((await leer(t("10:41:00"))).nuevos).toBe(1);
    const espera = await leadPorContacto("espera");
    expect(espera!.pipeline_id).toBe(pipes["1. Biblioteca Recursos"].id);
    const { data: te } = await db.from("tarjetas_extra").select("pipeline_id").eq("lead_id", espera!.id);
    expect(te).toEqual([]);
    expect(await leadPorContacto("general")).toBeNull(); // aún no lleva 2 min
    expect((await leer(t("10:42:10"))).nuevos).toBe(1);
    expect(await leadPorContacto("general")).toMatchObject({ pipeline_id: pipes["0. Agendas General"].id, etapa_id: pipes["0. Agendas General"].etapas.Form });
  });
});
