// Leads por API (Cristian, 16 oct 2026): las oportunidades nuevas de GHL entran en su pipeline cada 30 s.
// GHL se simula (sin internet) con la forma real comprobada ese día.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { borrarEscenario, crearEscenario, db, type Escenario } from "../apoyo/escenario";
import { leerLeadsGhl } from "@/lib/ghl-leads";
import type { Proyecto } from "@/lib/tipos";

let e: Escenario;
let ops: Record<string, unknown>[] = [];
const contactos: Record<string, Record<string, unknown> | 500> = {};
const PIPES = [
  { id: "pT", name: "Pipeline test", stages: [{ id: "sReg", name: "Registrados" }, { id: "sAg", name: "Agendados" }] },
  { id: "pG", name: "0. Agendas General", stages: [{ id: "sG", name: "Agendan" }] },
  { id: "pX", name: "Pipeline que no está en la app", stages: [{ id: "sX", name: "Nuevos" }] },
];
const CAMPOS = [
  { id: "f1", name: "¿En qué situación estás hoy?" },
  { id: "f2", name: "¿Cuándo quieres empezar?" },
  { id: "f3", name: "utm_source" },
];
const falsoFetch = (async (url: string) => {
  const u = new URL(url);
  if (u.pathname === "/opportunities/search") {
    const lim = Number(u.searchParams.get("limit"));
    const orden = [...ops].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return Response.json({ opportunities: orden.slice(0, lim), meta: { total: orden.length } });
  }
  if (u.pathname === "/opportunities/pipelines") return Response.json({ pipelines: PIPES });
  if (/^\/locations\/[^/]+\/customFields$/.test(u.pathname)) return Response.json({ customFields: CAMPOS });
  const m = u.pathname.match(/^\/contacts\/(.+)$/);
  if (m) {
    const c = contactos[m[1]];
    if (c === 500) return new Response("{}", { status: 500 });
    return c ? Response.json({ contact: c }) : new Response("{}", { status: 404 });
  }
  return new Response("{}", { status: 404 });
}) as unknown as typeof fetch;

const AHORA = new Date("2026-10-16T21:30:00Z");
const proyecto = async () => (await db.from("proyectos").select("*").eq("id", e.proyecto.id).single()).data as Proyecto & { ghl_location_id: string | null };
const leer = async (ahora = AHORA) => leerLeadsGhl(await proyecto(), "tok", { fetchImpl: falsoFetch, ahora });
const leadPorContacto = async (id: string) => (await db.from("leads").select("*").eq("proyecto_id", e.proyecto.id).eq("ghl_contact_id", id).maybeSingle()).data;
const op = (id: string, pipelineId: string, stage: string, createdAt: string, contactId: string) => ({ id: `${e.pref}-${id}`, pipelineId, pipelineStageId: stage, createdAt, source: "recursos", contactId: `${e.pref}-${contactId}` });

beforeAll(async () => {
  e = await crearEscenario();
  // El pipeline del escenario («Pipeline test») tiene el mismo nombre que uno de GHL
  await db.from("proyectos").update({ ghl_location_id: "loc-1" }).eq("id", e.proyecto.id);
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});

describe("Leads nuevos de GHL por la API", () => {
  it("la primera vez solo marca desde dónde (no mete los de antes)", async () => {
    ops = [op("viejo", "pT", "sReg", "2026-10-16T20:00:00.000Z", "cViejo")];
    contactos[`${e.pref}-cViejo`] = { firstName: "Viejo", email: `${e.pref}-viejo@x.test` };
    const r = await leer();
    expect(r.activado).toBe(true);
    expect((await proyecto()).ghl_leads_hasta).toBe("2026-10-16T20:00:00+00:00");
    expect(await leadPorContacto(`${e.pref}-cViejo`)).toBeNull();
  });

  it("las nuevas entran en su pipeline y columna; «0. Agendas …» y los pipelines que no existen se saltan", async () => {
    contactos[`${e.pref}-cNuevo`] = {
      firstName: "Nuevo",
      lastName: "De GHL",
      email: `${e.pref}-nuevo@x.test`,
      tags: ["biblioteca recursos"],
      customFields: [
        { id: "f1", value: "Tengo un negocio" },
        { id: "f3", value: "yt" },
      ],
    };
    contactos[`${e.pref}-cAg`] = { firstName: "Cita", email: `${e.pref}-cita@x.test` };
    contactos[`${e.pref}-cX`] = { firstName: "Otro", email: `${e.pref}-otro@x.test` };
    contactos[`${e.pref}-cA`] = { firstName: "LeadA", email: `${e.pref}-la@x.test`, customFields: [{ id: "f2", value: "Ya mismo" }] };
    ops.push(
      op("nuevo", "pT", "sAg", "2026-10-16T21:10:00.000Z", "cNuevo"),
      op("cita", "pG", "sG", "2026-10-16T21:11:00.000Z", "cAg"),
      op("otro", "pX", "sX", "2026-10-16T21:12:00.000Z", "cX"),
      op("ya", "pT", "sReg", "2026-10-16T21:13:00.000Z", "cA")
    );
    const r = await leer();
    expect(r).toMatchObject({ nuevos: 1, actualizados: 1, saltadas: 2, errores: [] });
    expect(r.avisos.join()).toContain("Pipeline que no está en la app");

    const nuevo = await leadPorContacto(`${e.pref}-cNuevo`);
    expect(nuevo).toMatchObject({ pipeline_id: e.pipeline.id, etapa_id: e.etapas.Agendados, fuente: "recursos", origen: "ghl", creado_en: "2026-10-16T21:10:00+00:00" });
    expect(nuevo!.respuestas).toEqual([{ pregunta: "¿En qué situación estás hoy?", respuesta: "Tengo un negocio" }]);
    expect(nuevo!.seguimiento).toEqual({ utm_source: "yt" });
    const { data: hist } = await db.from("actividades").select("nota").eq("lead_id", nuevo!.id);
    expect(hist!.map((h) => h.nota)).toContain("Entró desde GHL (API) · Pipeline test");

    expect(await leadPorContacto(`${e.pref}-cAg`)).toBeNull();
    expect(await leadPorContacto(`${e.pref}-cX`)).toBeNull();
    // LeadA ya estaba (por email): se completa sin moverlo ni duplicarlo
    const { data: a } = await db.from("leads").select("*").eq("id", e.leads.LeadA).single();
    expect(a).toMatchObject({ ghl_contact_id: `${e.pref}-cA`, etapa_id: e.etapas.Nuevos });
    expect(a!.respuestas).toEqual([{ pregunta: "¿Cuándo quieres empezar?", respuesta: "Ya mismo" }]);
    expect((await proyecto()).ghl_leads_hasta).toBe("2026-10-16T21:13:00+00:00");
  });

  it("no repite las ya vistas", async () => {
    const r = await leer(new Date(AHORA.getTime() + 30_000));
    expect(r).toMatchObject({ nuevos: 0, actualizados: 0, saltadas: 0 });
    const { count } = await db.from("leads").select("id", { count: "exact", head: true }).eq("proyecto_id", e.proyecto.id).eq("email", `${e.pref}-nuevo@x.test`);
    expect(count).toBe(1);
  });

  it("las respuestas que llegan después se completan durante 10 min", async () => {
    (contactos[`${e.pref}-cNuevo`] as { customFields: unknown[] }).customFields.push({ id: "f2", value: "Este mes" });
    const r = await leer(new Date(AHORA.getTime() + 60_000));
    expect(r.completados).toBe(1);
    const nuevo = await leadPorContacto(`${e.pref}-cNuevo`);
    expect(nuevo!.respuestas).toHaveLength(2);
    // Pasados los 10 min ya no se relee
    (contactos[`${e.pref}-cNuevo`] as { customFields: unknown[] }).customFields.push({ id: "f1", value: "Cambiada" });
    expect((await leer(new Date(AHORA.getTime() + 11 * 60_000))).completados).toBe(0);
  });

  it("si GHL falla con un contacto, se para ahí y la siguiente lectura sigue desde esa", async () => {
    contactos[`${e.pref}-cMal`] = 500;
    contactos[`${e.pref}-cLuego`] = { firstName: "Luego", email: `${e.pref}-luego@x.test` };
    ops.push(op("mal", "pT", "sReg", "2026-10-16T21:20:00.000Z", "cMal"), op("luego", "pT", "sReg", "2026-10-16T21:21:00.000Z", "cLuego"));
    const r = await leer(new Date(AHORA.getTime() + 12 * 60_000));
    expect(r.errores).toHaveLength(1);
    expect(await leadPorContacto(`${e.pref}-cLuego`)).toBeNull();
    expect((await proyecto()).ghl_leads_hasta).toBe("2026-10-16T21:13:00+00:00");

    contactos[`${e.pref}-cMal`] = { firstName: "Mal", email: `${e.pref}-mal@x.test` };
    const r2 = await leer(new Date(AHORA.getTime() + 13 * 60_000));
    expect(r2.nuevos).toBe(2);
    expect(await leadPorContacto(`${e.pref}-cLuego`)).not.toBeNull();
    expect((await proyecto()).ghl_leads_hasta).toBe("2026-10-16T21:21:00+00:00");
  });
});
