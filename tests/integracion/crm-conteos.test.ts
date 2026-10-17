// Velocidad (17 oct 2026): crm_conteos cuenta lo mismo que las consultas de antes (una por pipeline).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { borrarEscenario, crearEscenario, db, type Escenario } from "../apoyo/escenario";

let e: Escenario;

beforeAll(async () => {
  e = await crearEscenario();
  await db.from("leads").update({ pipeline_id: e.pipeline.id, etapa_id: e.etapas.Nuevos }).in("id", [e.leads.LeadA, e.leads.LeadB]);
  await db.from("tarjetas_extra").insert({ proyecto_id: e.proyecto.id, lead_id: e.leads.LeadA, pipeline_id: e.pipeline.id });
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});

// Lo que contaba el CRM antes, pipeline a pipeline
async function comoAntes(persona: string | null) {
  const { data: pipelines } = await db.from("pipelines").select("id, tipo").eq("proyecto_id", e.proyecto.id).neq("tipo", "closers");
  const r: Record<string, { leads: number; tarjetas: number }> = {};
  for (const p of pipelines!) {
    let q = db.from("leads").select("id", { count: "exact", head: true }).eq("proyecto_id", e.proyecto.id);
    q = p.tipo === "callers" ? q.not("caller_id", "is", null) : q.eq("pipeline_id", p.id);
    if (persona) q = q.or(`caller_id.eq.${persona},closer_id.eq.${persona}`);
    const { count: tarjetas } = await db.from("tarjetas_extra").select("id", { count: "exact", head: true }).eq("pipeline_id", p.id);
    r[p.id] = { leads: (await q).count ?? 0, tarjetas: tarjetas ?? 0 };
  }
  return r;
}

async function conRpc(persona: string | null) {
  const { data, error } = await db.rpc("crm_conteos", { p_proyecto: e.proyecto.id, p_persona: persona });
  expect(error).toBeNull();
  return Object.fromEntries((data as { pipeline_id: string; leads: number; tarjetas: number }[]).map((x) => [x.pipeline_id, { leads: Number(x.leads), tarjetas: Number(x.tarjetas) }]));
}

describe("crm_conteos", () => {
  it("todo el proyecto: mismos números que antes (también las tarjetas 🔗)", async () => {
    const antes = await comoAntes(null);
    expect(await conRpc(null)).toEqual(antes);
    expect(antes[e.pipeline.id].tarjetas).toBe(1);
  });

  it("de una persona: solo sus leads, como antes", async () => {
    expect(await conRpc(e.p.callerA.id)).toEqual(await comoAntes(e.p.callerA.id));
  });

  it("no la puede usar nadie sin la clave de servicio", async () => {
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
    const { data, error } = await anon.rpc("crm_conteos", { p_proyecto: e.proyecto.id });
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });
});
