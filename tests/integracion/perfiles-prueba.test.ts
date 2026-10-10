// 1.0 «Antes de todo» (Cristian, 11 oct 2026): «Llamadas de GHL» oculta a callers y closers, y perfiles de prueba
// que pueden entrar pero no cuentan en las cifras, el reparto ni las liquidaciones, ni salen en Equipo.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { borrarEscenario, como, crearEscenario, db, ok, type Escenario } from "../apoyo/escenario";
import { cargarBase } from "@/lib/metricas";
import { calcularKpis } from "@/lib/kpis";
import { cargarFinanzas } from "@/lib/finanzas-datos";
import { cargarEquipo } from "@/lib/equipo";
import { equipo } from "@/lib/datos";
import { guardarLeads } from "@/lib/leads";
import { seccionesPermitidas } from "@/lib/permisos";
import { calcularLiquidaciones } from "@/app/(panel)/finanzas/acciones";
import { rangoDe } from "@/lib/formato";

let e: Escenario;
beforeAll(async () => {
  e = await crearEscenario();
  // callerC y closerB son perfiles de prueba; cada uno hace algo que contaría
  await db.from("perfiles").update({ es_prueba: true }).in("id", [e.p.callerC.id, e.p.closerB.id]);
  await db.from("actividades").insert([
    { proyecto_id: e.proyecto.id, lead_id: e.leads.LeadA, perfil_id: e.p.callerA.id, tipo: "llamada", resultado: "contestado" },
    { proyecto_id: e.proyecto.id, lead_id: e.leads.LeadB, perfil_id: e.p.callerC.id, tipo: "llamada", resultado: "contestado" },
  ]);
  await db.from("ventas").insert([
    { proyecto_id: e.proyecto.id, lead_id: e.leads.LeadA, vendedor_id: e.p.closerA.id, facturacion: 1000, cash_collected: 1000, tipo_pago: "completo" },
    { proyecto_id: e.proyecto.id, lead_id: e.leads.LeadB, vendedor_id: e.p.closerB.id, facturacion: 5000, cash_collected: 5000, tipo_pago: "completo" },
  ]);
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});

describe("«Llamadas de GHL»", () => {
  it("callers y closers ya no la ven por defecto; un perfil de prueba con permiso propio, sí", async () => {
    expect((await seccionesPermitidas(e.p.callerA, e.proyecto.id)).has("grabadas")).toBe(false);
    expect((await seccionesPermitidas(e.p.closerA, e.proyecto.id)).has("grabadas")).toBe(false);
    expect((await seccionesPermitidas(e.p.director, e.proyecto.id)).has("grabadas")).toBe(true);
    await db.from("permisos_persona").insert({ proyecto_id: e.proyecto.id, perfil_id: e.p.callerC.id, seccion: "grabadas", permitido: true });
    expect((await seccionesPermitidas(e.p.callerC, e.proyecto.id)).has("grabadas")).toBe(true);
  });
});

describe("Perfiles de prueba fuera de todo", () => {
  it("no salen en el equipo ni en Equipo (organigrama); un perfil de prueba sí ve a los otros", async () => {
    const ids = (await equipo(e.proyecto.id)).map((p) => p.id);
    expect(ids).not.toContain(e.p.callerC.id);
    expect(ids).not.toContain(e.p.closerB.id);
    expect((await equipo(e.proyecto.id, true)).map((p) => p.id)).toContain(e.p.closerB.id);
    const org = await cargarEquipo(e.proyecto.id);
    expect(org.miembros.some((m) => m.perfil_id === e.p.callerC.id || m.perfil_id === e.p.closerB.id)).toBe(false);
  });
  it("sus llamadas y ventas no cuentan en KPIs ni Finanzas", async () => {
    const base = await cargarBase(e.proyecto);
    expect(base.actividades.every((a) => a.perfil_id !== e.p.callerC.id)).toBe(true);
    expect(base.ventas.reduce((s, v) => s + v.facturacion, 0)).toBe(1000);
    const k = calcularKpis(base, rangoDe("todo", "America/New_York"), "America/New_York");
    expect(k.callers.map((c) => c.perfil.id)).not.toContain(e.p.callerC.id);
    expect(k.totalClosers.facturacion).toBe(1000);
    const f = await cargarFinanzas(e.proyecto.id);
    expect(f.ventas.reduce((s, v) => s + v.facturacion, 0)).toBe(1000);
    // Él, mirando lo suyo, sí lo ve
    expect((await cargarBase(e.proyecto, true)).ventas.reduce((s, v) => s + v.facturacion, 0)).toBe(6000);
  });
  it("no cobran comisión en Liquidaciones", async () => {
    como(e, e.p.ceo);
    await ok(calcularLiquidaciones(new Date().toISOString().slice(0, 7)));
    const { data } = await db.from("liquidaciones").select("perfil_id").eq("proyecto_id", e.proyecto.id);
    expect((data ?? []).map((l) => l.perfil_id)).not.toContain(e.p.closerB.id);
  });
  it("el reparto nunca les da leads", async () => {
    await db.from("proyectos").update({ modo_reparto: "rotativo" }).eq("id", e.proyecto.id);
    const emails = Array.from({ length: 9 }, (_, i) => `${e.pref}-rep${i}@x.test`);
    await guardarLeads({ ...e.proyecto, modo_reparto: "rotativo" }, emails.map((email) => ({ ghl_contact_id: null, nombre: "Rep", apellido: "", email, telefono: null, etiquetas: [], respuestas: [], creado_en: null })), { pipelineId: e.pipeline.id, origen: "csv", perfilId: null, repartir: true });
    const { data } = await db.from("leads").select("caller_id").in("email", emails);
    const callers = new Set((data ?? []).map((l) => l.caller_id));
    expect(callers.has(e.p.callerC.id)).toBe(false);
    expect(callers.size).toBeGreaterThan(0);
  });
});
