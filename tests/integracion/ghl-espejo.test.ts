// Espejo de GHL (Cristian, 17 oct 2026): en «2. Webinar 1» la app tiene las columnas de GHL y cada lead en la columna
// de su oportunidad; se mueve cuando GHL la mueve, pero no deshace lo que mueve el equipo. GHL simulado (forma real).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { borrarEscenario, crearEscenario, db, type Escenario } from "../apoyo/escenario";
import { espejoGhl } from "@/lib/ghl-espejo";
import type { Proyecto } from "@/lib/tipos";

let e: Escenario;
let ops: Record<string, unknown>[] = [];
const contactos: Record<string, Record<string, unknown>> = {};
const STAGES = [
  { id: "sOpt", name: "Optin" },
  { id: "sForm", name: "Form completo" },
  { id: "sR1", name: "Regalo 1" },
  { id: "sR2", name: "Regalo 2" },
];
const falsoFetch = (async (url: string) => {
  const u = new URL(url);
  if (u.pathname === "/opportunities/pipelines") return Response.json({ pipelines: [{ id: "pW", name: "2. Webinar 1", stages: STAGES }, { id: "pX", name: "Otro", stages: [] }] });
  if (u.pathname === "/opportunities/search") {
    expect(u.searchParams.get("pipeline_id")).toBe("pW");
    return Response.json({ opportunities: ops, meta: {} });
  }
  const m = u.pathname.match(/^\/contacts\/(.+)$/);
  if (m) return contactos[m[1]] ? Response.json({ contact: contactos[m[1]] }) : new Response("{}", { status: 404 });
  return new Response("{}", { status: 404 });
}) as unknown as typeof fetch;

let web: { id: string; etapas: Record<string, string> };
let general: string;
const proyecto = async () => (await db.from("proyectos").select("*").eq("id", e.proyecto.id).single()).data as Proyecto & { ghl_location_id: string | null };
const espejo = async () => espejoGhl(await proyecto(), "tok", new Map(), { fetchImpl: falsoFetch });
const etapas = async () => (await db.from("etapas").select("id, nombre, orden").eq("pipeline_id", web.id).order("orden")).data!;
const col = (nombre: string) => etapas().then((l) => l.find((x) => x.nombre === nombre)!.id);
const op = (id: string, contact: string, stage: string) => ({ id: `${e.pref}-${id}`, contactId: `${e.pref}-${contact}`, pipelineId: "pW", pipelineStageId: stage, createdAt: "2026-10-17T18:40:00.000Z" });

beforeAll(async () => {
  e = await crearEscenario();
  await db.from("proyectos").update({ ghl_location_id: "loc-1" }).eq("id", e.proyecto.id);
  const { data: p } = await db.from("pipelines").insert({ proyecto_id: e.proyecto.id, nombre: "2. Webinar 1", orden: 5 }).select("id").single();
  const { data: et } = await db.from("etapas").insert(["Optin", "Form completo", "Cerrados"].map((n, i) => ({ pipeline_id: p!.id, nombre: n, orden: i }))).select("id, nombre");
  web = { id: p!.id, etapas: Object.fromEntries(et!.map((x) => [x.nombre, x.id])) };
  const { data: g } = await db.from("pipelines").insert({ proyecto_id: e.proyecto.id, nombre: "0. Agendas General", orden: 6 }).select("id").single();
  general = g!.id;
  await db.from("leads").update({ ghl_contact_id: `${e.pref}-cA` }).eq("id", e.leads.LeadA);
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});

describe("Espejo de GHL en «2. Webinar 1»", () => {
  it("crea las columnas de GHL en su orden (las de la app, al final) y pone cada lead donde está en GHL", async () => {
    contactos[`${e.pref}-cNuevo`] = { firstName: "Nuevo", email: `${e.pref}-nuevo@x.test`, tags: ["regalo 1"] };
    ops = [op("o1", "cNuevo", "sR1"), op("o2", "cA", "sForm")];
    const r = await espejo();
    expect(r).toMatchObject({ columnas: 2, nuevos: 1, anadidos: 1, errores: [] });
    expect((await etapas()).map((x) => x.nombre)).toEqual(["Optin", "Form completo", "Regalo 1", "Regalo 2", "Cerrados"]);
    // El nuevo entra en Webinar 1 → Regalo 1 (no en General)
    const { data: n } = await db.from("leads").select("id, pipeline_id, etapa_id").eq("ghl_contact_id", `${e.pref}-cNuevo`).single();
    expect(n).toMatchObject({ pipeline_id: web.id, etapa_id: await col("Regalo 1") });
    expect(n!.pipeline_id).not.toBe(general);
    // LeadA ya estaba en otro pipeline: gana su tarjeta 🔗 en «Form completo» sin salir del suyo
    const { data: t } = await db.from("tarjetas_extra").select("etapa_id").eq("lead_id", e.leads.LeadA).eq("pipeline_id", web.id).single();
    expect(t!.etapa_id).toBe(web.etapas["Form completo"]);
    expect((await db.from("leads").select("pipeline_id").eq("id", e.leads.LeadA).single()).data!.pipeline_id).toBe(e.pipeline.id);
  });

  it("sin cambios en GHL no hace nada; si GHL la mueve, la app también", async () => {
    expect(await espejo()).toMatchObject({ nuevos: 0, anadidos: 0, movidos: 0, columnas: 0 });
    ops = [op("o1", "cNuevo", "sR2"), op("o2", "cA", "sR1")];
    expect((await espejo()).movidos).toBe(2);
    expect((await db.from("leads").select("etapa_id").eq("ghl_contact_id", `${e.pref}-cNuevo`).single()).data!.etapa_id).toBe(await col("Regalo 2"));
    expect((await db.from("tarjetas_extra").select("etapa_id").eq("lead_id", e.leads.LeadA).eq("pipeline_id", web.id).single()).data!.etapa_id).toBe(await col("Regalo 1"));
    const { data: hist } = await db.from("actividades").select("nota").eq("lead_id", e.leads.LeadA);
    expect(hist!.map((h) => h.nota)).toContain("GHL (API): 2. Webinar 1 → Regalo 1");
  });

  it("lo que mueve el equipo en la app (p. ej. a «Cerrados») no se deshace mientras GHL no cambie", async () => {
    const { data: n } = await db.from("leads").select("id").eq("ghl_contact_id", `${e.pref}-cNuevo`).single();
    await db.from("leads").update({ etapa_id: web.etapas.Cerrados }).eq("id", n!.id);
    expect((await espejo()).movidos).toBe(0);
    expect((await db.from("leads").select("etapa_id").eq("id", n!.id).single()).data!.etapa_id).toBe(web.etapas.Cerrados);
  });
});
