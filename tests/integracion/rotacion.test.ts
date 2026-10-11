// 1.0 Bloque 3 (Cristian, 11 oct 2026): rotación de closers. % por closer (todos al 0 % = apagada); toca quien tenga
// menos citas para su % y esté libre a esa hora; «lo decide la rotación» pone el closer en el servidor; con «lo elige
// quien agenda» se puede agendar a un closer no libre; al reagendar, el mismo closer y tiene que estar libre.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { borrarEscenario, como, crearEscenario, db, falla, ok, type Escenario } from "../apoyo/escenario";
import { guardarRotacion } from "@/app/(panel)/admin/acciones";
import { agendarCita } from "@/app/(panel)/leads/acciones";
import { consultarAgenda } from "@/app/(panel)/leads/agenda";
import { reagendarCita } from "@/app/(panel)/closer/acciones";
import { ordenRotacion } from "@/lib/disponibilidad";
import type { Proyecto } from "@/lib/tipos";

let e: Escenario;
// Lunes 4 de enero de 2027 (Nueva York), de 9 a 18, para los dos closers
const LUNES = { semana: { 1: [{ desde: "09:00", hasta: "18:00" }] }, fechas: {} };
beforeAll(async () => {
  e = await crearEscenario();
  await db.from("miembros_proyecto").update({ horario: LUNES }).eq("proyecto_id", e.proyecto.id).in("perfil_id", [e.p.closerA.id, e.p.closerB.id]);
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});

// La sesión simulada lleva el proyecto: se pone al día tras cambiar la rotación
const alDia = async () => Object.assign(e.proyecto, (await db.from("proyectos").select("*").eq("id", e.proyecto.id).single()).data as Proyecto);
const closerDe = async (leadId: string, fecha: string) => (await db.from("citas").select("closer_id").eq("lead_id", leadId).eq("fecha", new Date(`${fecha}:00-05:00`).toISOString()).single()).data!.closer_id;
const cuentas = async () => {
  const { data } = await db.from("miembros_proyecto").select("perfil_id, rotacion_cuenta").eq("proyecto_id", e.proyecto.id).in("perfil_id", [e.p.closerA.id, e.p.closerB.id]);
  return [e.p.closerA.id, e.p.closerB.id].map((id) => data!.find((d) => d.perfil_id === id)!.rotacion_cuenta);
};

describe("Orden de la rotación", () => {
  it("primero quien tenga menos citas para su %; los de 0 % no entran", () => {
    expect(ordenRotacion([{ id: "a", pct: 50, cuenta: 1, orden: 0 }, { id: "b", pct: 50, cuenta: 0, orden: 1 }, { id: "c", pct: 0, cuenta: 0, orden: 2 }])).toEqual(["b", "a"]);
    expect(ordenRotacion([{ id: "a", pct: 75, cuenta: 2, orden: 0 }, { id: "b", pct: 25, cuenta: 1, orden: 1 }])).toEqual(["a", "b"]); // 3/75 < 2/25
    expect(ordenRotacion([{ id: "a", pct: 0, cuenta: 0, orden: 0 }])).toEqual([]);
  });
});

describe("Configurar la rotación (Administración)", () => {
  it("solo el administrador; los % suman 100 o todos a 0", async () => {
    como(e, e.p.closerA);
    await falla(guardarRotacion({ modo: "decide", pcts: { [e.p.closerA.id]: 50, [e.p.closerB.id]: 50 } }), /permiso/);
    como(e, e.p.directorAdmin);
    await falla(guardarRotacion({ modo: "decide", pcts: { [e.p.closerA.id]: 50, [e.p.closerB.id]: 40 } }), /suman 90/);
    await falla(guardarRotacion({ modo: "otro", pcts: {} }), /cómo se elige/);
    await ok(guardarRotacion({ modo: "elige", pcts: {} })); // apagada
  });
});

describe("Agendar con la rotación", () => {
  it("apagada: manda quien agenda y no cuenta", async () => {
    await alDia();
    como(e, e.p.callerA);
    await ok(agendarCita(e.leads.LeadA, e.p.closerB.id, "2027-01-04T09:00", ""  , 4));
    expect(await closerDe(e.leads.LeadA, "2027-01-04T09:00")).toBe(e.p.closerB.id);
    expect(await cuentas()).toEqual([0, 0]);
  });
  it("«lo decide la rotación»: el servidor pone el closer que toca, aunque se pida otro, y va alternando 50/50", async () => {
    como(e, e.p.ceo);
    await ok(guardarRotacion({ modo: "decide", pcts: { [e.p.closerA.id]: 50, [e.p.closerB.id]: 50 } }));
    await alDia();
    como(e, e.p.callerA);
    await ok(agendarCita(e.leads.LeadA, e.p.closerB.id, "2027-01-04T11:00", "", 4)); // pide B; toca A
    expect(await closerDe(e.leads.LeadA, "2027-01-04T11:00")).toBe(e.p.closerA.id);
    await ok(agendarCita(e.leads.LeadA, e.p.closerA.id, "2027-01-04T13:00", "", 4)); // ahora toca B
    expect(await closerDe(e.leads.LeadA, "2027-01-04T13:00")).toBe(e.p.closerB.id);
    expect(await cuentas()).toEqual([1, 1]);
  });
  it("si al que toca no está libre (ya tiene cita a esa hora), salta al siguiente", async () => {
    // Toca A (1/50 = 1/50, va primero por orden), pero A ya tiene la de las 11:00 → B
    como(e, e.p.ceo); // LeadLibre y LeadB no son de callerA
    const r = await consultarAgenda("2027-01-04T11:00", null);
    expect(r).toMatchObject({ modo: "decide", propuesto: { id: e.p.closerB.id }, ningunoLibre: false });
    await ok(agendarCita(e.leads.LeadLibre, e.p.closerA.id, "2027-01-04T11:00", "", 4));
    expect(await closerDe(e.leads.LeadLibre, "2027-01-04T11:00")).toBe(e.p.closerB.id);
  });
  it("si ninguno está libre a esa hora, no deja agendar", async () => {
    await falla(agendarCita(e.leads.LeadB, e.p.closerA.id, "2027-01-05T10:00", "", 4), /Ningún closer/); // martes: no trabajan
    expect((await consultarAgenda("2027-01-05T10:00", null) as { ningunoLibre: boolean }).ningunoLibre).toBe(true);
  });
  it("«lo propone la rotación»: lo propone y quien agenda lo puede cambiar", async () => {
    como(e, e.p.ceo);
    await ok(guardarRotacion({ modo: "propone", pcts: { [e.p.closerA.id]: 50, [e.p.closerB.id]: 50 } })); // mismos %: la cuenta sigue
    await alDia();
    const r = await consultarAgenda("2027-01-04T15:00", e.p.closerB.id);
    expect(r).toMatchObject({ modo: "propone", propuesto: { id: e.p.closerA.id } }); // A lleva 1, B lleva 2
    await ok(agendarCita(e.leads.LeadB, e.p.closerB.id, "2027-01-04T15:00", "", 4));
    expect(await closerDe(e.leads.LeadB, "2027-01-04T15:00")).toBe(e.p.closerB.id);
  });
  it("«lo elige quien agenda» con rotación: avisa si no está libre, pero deja agendar", async () => {
    como(e, e.p.ceo);
    await ok(guardarRotacion({ modo: "elige", pcts: { [e.p.closerA.id]: 50, [e.p.closerB.id]: 50 } }));
    await alDia();
    const r = await consultarAgenda("2027-01-04T20:00", e.p.closerA.id);
    expect(r).toMatchObject({ modo: "elige", propuesto: null });
    expect((r as { aviso: string }).aviso).toMatch(/fuera de su horario/);
    await ok(agendarCita(e.leads.LeadB, e.p.closerA.id, "2027-01-04T20:00", "", undefined));
    expect(await closerDe(e.leads.LeadB, "2027-01-04T20:00")).toBe(e.p.closerA.id);
  });
});

describe("Reagendar", () => {
  it("mismo closer; si no está libre a la nueva hora, no deja", async () => {
    como(e, e.p.ceo);
    const { data: cita } = await db.from("citas").select("id, closer_id").eq("lead_id", e.leads.LeadB).eq("fecha", new Date("2027-01-04T15:00:00-05:00").toISOString()).single();
    await falla(reagendarCita(cita!.id, "2027-01-04T13:00"), /No está libre/); // B ya tiene la de las 13:00
    await falla(reagendarCita(cita!.id, "2027-01-05T10:00"), /No está libre/); // martes no trabaja
    await ok(reagendarCita(cita!.id, "2027-01-04T16:30"));
    expect(await closerDe(e.leads.LeadB, "2027-01-04T16:30")).toBe(e.p.closerB.id);
  });
  it("closer sin horario: solo se comprueba que no choque con otra cita", async () => {
    await db.from("miembros_proyecto").update({ horario: null }).eq("proyecto_id", e.proyecto.id).eq("perfil_id", e.p.closerA.id);
    const { data: cita } = await db.from("citas").select("id").eq("lead_id", e.leads.LeadB).eq("fecha", new Date("2027-01-04T20:00:00-05:00").toISOString()).single();
    await falla(reagendarCita(cita!.id, "2027-01-04T11:15"), /No está libre/); // A tiene la de las 11:00 (30 min)
    await ok(reagendarCita(cita!.id, "2027-01-05T22:00"));
  });
});
