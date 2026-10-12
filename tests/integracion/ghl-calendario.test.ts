// V2-3: sincronizar el calendario de GHL de cada closer. GHL se simula (sin internet) con su formato oficial.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { borrarEscenario, como, crearEscenario, db, falla, ok, type Escenario } from "../apoyo/escenario";
import { sincronizarCalendarios } from "@/lib/ghl-sync";
import { estadoDesdeGhl, nuevoEstado } from "@/lib/ghl";
import { descartarCitaSinLead, unirCitaSinLead } from "@/app/(panel)/closer/acciones";
import { guardarCalendarioCloser, guardarConexionGhl } from "@/app/(panel)/admin/acciones";

let e: Escenario;
const llamadas: { url: string; headers: Record<string, string> }[] = [];
let eventos: Record<string, unknown>[] = [];
const contactos: Record<string, unknown> = {};
let rechazar = false;
const falsoFetch = (async (url: string, init?: { headers?: Record<string, string> }) => {
  llamadas.push({ url, headers: init?.headers ?? {} });
  if (rechazar) return new Response("{}", { status: 401 });
  const u = new URL(url);
  if (u.pathname === "/calendars/events") return Response.json({ events: eventos });
  const m = u.pathname.match(/^\/contacts\/(.+)$/);
  if (m) return contactos[m[1]] ? Response.json({ contact: contactos[m[1]] }) : new Response("{}", { status: 404 });
  return new Response("{}", { status: 404 });
}) as unknown as typeof fetch;
const AHORA = new Date("2026-10-09T15:00:00Z");
const sync = () => sincronizarCalendarios(e.proyecto.id, { fetchImpl: falsoFetch, ahora: AHORA });
const cita = async (ghlId: string) => (await db.from("citas").select("*").eq("proyecto_id", e.proyecto.id).eq("ghl_cita_id", ghlId).maybeSingle()).data;

beforeAll(async () => {
  e = await crearEscenario();
  await db.from("leads").update({ ghl_contact_id: `${e.pref}-cA` }).eq("id", e.leads.LeadA);
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});

describe("estados de GHL", () => {
  it("se traducen y no pisan lo que ya registró el closer", () => {
    expect(estadoDesdeGhl("confirmed")).toBe("confirmada");
    expect(estadoDesdeGhl("noshow")).toBe("no_show");
    expect(estadoDesdeGhl("showed")).toBeNull();
    expect(nuevoEstado("pendiente", "cancelada")).toBe("cancelada");
    expect(nuevoEstado("cerrada", "cancelada")).toBe("cerrada");
    expect(nuevoEstado("pendiente", null)).toBe("pendiente");
  });
});

describe("Sincronizar calendarios de GHL", () => {
  it("sin conectar GHL da un error claro; solo un admin guarda la conexión", async () => {
    await expect(sync()).rejects.toThrow(/Falta conectar GHL/);
    como(e, e.p.closerA);
    await falla(guardarConexionGhl("x".repeat(30), "loc"), /permiso/i);
    como(e, e.p.ceo);
    await ok(guardarConexionGhl("pit-" + "x".repeat(30), "loc-123"));
    // Arreglo 3: en la base el token está cifrado (el test de cabeceras de abajo comprueba que a GHL llega bien)
    const { data: p } = await db.from("proyectos").select("ghl_token").eq("id", e.proyecto.id).single();
    expect(p!.ghl_token).toMatch(/^v1:/);
    expect(p!.ghl_token).not.toContain("xxxxxxxxxx");
    await expect(sync()).rejects.toThrow(/Ningún closer/);
    await falla(guardarCalendarioCloser(e.p.callerA.id, "cal", ""), /no es closer/);
    await ok(guardarCalendarioCloser(e.p.closerA.id, "cal-A", ""));
  });

  it("primera sincronización: une, crea leads, aparta las que no puede y las inválidas", async () => {
    contactos[`${e.pref}-cNuevo`] = { firstName: "Nuevo", lastName: "De GHL", email: `${e.pref}-nuevo@x.test`, phone: "+1 555 000 1111" };
    contactos[`${e.pref}-cVacio`] = { firstName: "Sin", lastName: "Datos" };
    eventos = [
      { id: `${e.pref}-e1`, contactId: `${e.pref}-cA`, title: "Llamada LeadA", startTime: "2026-10-12T10:00:00-04:00", appointmentStatus: "new" },
      { id: `${e.pref}-e2`, contactId: `${e.pref}-cNuevo`, title: "Llamada nuevo", startTime: "2026-10-13T10:00:00-04:00", appointmentStatus: "confirmed" },
      { id: `${e.pref}-e3`, contactId: `${e.pref}-cVacio`, title: "Sin datos", startTime: "2026-10-14T10:00:00-04:00", appointmentStatus: "new" },
      { id: `${e.pref}-e4`, contactId: `${e.pref}-cA`, title: "Mala", startTime: "2026-10-15T10:00:00-04:00", appointmentStatus: "invalid" },
      { id: `${e.pref}-e5`, contactId: `${e.pref}-cA`, title: "Cancelada", startTime: "2026-10-16T10:00:00-04:00", appointmentStatus: "cancelled" },
      { id: `${e.pref}-e6`, contactId: `${e.pref}-cA`, title: "Sin hora" },
    ];
    llamadas.length = 0;
    const r = await sync();
    expect(r).toMatchObject({ nuevas: 3, actualizadas: 0, sinUnir: 1, invalidas: 1, errores: [] });
    // Cabeceras y parámetros oficiales
    const ev = llamadas.find((l) => l.url.includes("/calendars/events"))!;
    expect(ev.headers).toMatchObject({ Authorization: `Bearer pit-${"x".repeat(30)}`, Version: "2021-04-15" });
    const u = new URL(ev.url);
    expect(u.searchParams.get("calendarId")).toBe("cal-A");
    expect(u.searchParams.get("startTime")).toBe(String(AHORA.getTime() - 30 * 86_400_000));
    expect(llamadas.find((l) => l.url.includes("/contacts/"))!.headers.Version).toBe("2021-07-28");

    // La agenda es del caller del lead (nadie marcó «Link enviado»; 11 oct)
    expect(await cita(`${e.pref}-e1`)).toMatchObject({ lead_id: e.leads.LeadA, closer_id: e.p.closerA.id, estado: "pendiente", origen: "ghl", agendada_por: e.p.callerA.id });
    expect((await cita(`${e.pref}-e2`))!.estado).toBe("confirmada");
    const { data: nuevo } = await db.from("leads").select("id, nombre, email, ghl_contact_id").eq("proyecto_id", e.proyecto.id).eq("ghl_contact_id", `${e.pref}-cNuevo`).single();
    expect(nuevo).toMatchObject({ nombre: "Nuevo", email: `${e.pref}-nuevo@x.test` });
    expect((await cita(`${e.pref}-e5`))!.estado).toBe("cancelada");
    expect(await cita(`${e.pref}-e3`)).toBeNull();
    const { data: sin } = await db.from("citas_sin_lead").select("ghl_cita_id, estado").eq("proyecto_id", e.proyecto.id).order("ghl_cita_id");
    expect(sin).toEqual([{ ghl_cita_id: `${e.pref}-e3`, estado: "pendiente" }, { ghl_cita_id: `${e.pref}-e4`, estado: "invalida" }]);
  });

  it("segunda sincronización: no duplica, actualiza la hora y el estado, y respeta lo que registró el closer", async () => {
    await db.from("citas").update({ estado: "cerrada" }).eq("ghl_cita_id", `${e.pref}-e2`);
    eventos = [
      { id: `${e.pref}-e1`, contactId: `${e.pref}-cA`, startTime: "2026-10-12T12:00:00-04:00", appointmentStatus: "confirmed" },
      { id: `${e.pref}-e2`, contactId: `${e.pref}-cNuevo`, startTime: "2026-10-13T10:00:00-04:00", appointmentStatus: "cancelled" },
    ];
    const r = await sync();
    expect(r).toMatchObject({ nuevas: 0, actualizadas: 1 });
    expect(await cita(`${e.pref}-e1`)).toMatchObject({ estado: "confirmada", fecha: "2026-10-12T16:00:00+00:00" });
    expect((await cita(`${e.pref}-e2`))!.estado).toBe("cerrada"); // no se pisa
    expect((await db.from("citas").select("id").eq("proyecto_id", e.proyecto.id).eq("ghl_cita_id", `${e.pref}-e1`)).data).toHaveLength(1);
    const { data: p } = await db.from("proyectos").select("ghl_sincronizado_en, ghl_ultimo_resultado").eq("id", e.proyecto.id).single();
    expect(p!.ghl_ultimo_resultado).toMatch(/0 nuevas · 1 actualizadas/);
  });

  it("una cita ya terminada en la app no cambia de hora aunque GHL traiga otra (venta adelantada, 11 oct)", async () => {
    const antes = (await cita(`${e.pref}-e2`))!;
    expect(antes.estado).toBe("cerrada");
    eventos = [
      { id: `${e.pref}-e1`, contactId: `${e.pref}-cA`, startTime: "2026-10-12T12:00:00-04:00", appointmentStatus: "confirmed" },
      { id: `${e.pref}-e2`, contactId: `${e.pref}-cNuevo`, startTime: "2026-10-20T10:00:00-04:00", appointmentStatus: "confirmed" },
    ];
    const r = await sync();
    expect(r).toMatchObject({ nuevas: 0, actualizadas: 0 });
    expect(await cita(`${e.pref}-e2`)).toMatchObject({ estado: "cerrada", fecha: antes.fecha, closer_id: antes.closer_id });
  });

  it("si GHL rechaza el token, se explica y no rompe", async () => {
    rechazar = true;
    const r = await sync();
    rechazar = false;
    expect(r.errores[0]).toMatch(/no acepta el token/);
  });

  it("revisar las sin unir: unir a un lead crea la cita; descartar la quita de la lista", async () => {
    const { data: s } = await db.from("citas_sin_lead").select("id, estado").eq("proyecto_id", e.proyecto.id).eq("ghl_cita_id", `${e.pref}-e3`).single();
    como(e, e.p.closerA);
    await falla(unirCitaSinLead(s!.id, e.leads.LeadB), /director o el CEO/);
    como(e, e.p.director);
    await ok(unirCitaSinLead(s!.id, e.leads.LeadB));
    expect(await cita(`${e.pref}-e3`)).toMatchObject({ lead_id: e.leads.LeadB, closer_id: e.p.closerA.id });
    expect((await db.from("leads").select("ghl_contact_id").eq("id", e.leads.LeadB).single()).data!.ghl_contact_id).toBe(`${e.pref}-cVacio`);
    const { data: inv } = await db.from("citas_sin_lead").select("id").eq("proyecto_id", e.proyecto.id).eq("ghl_cita_id", `${e.pref}-e4`).single();
    await ok(descartarCitaSinLead(inv!.id));
    const { data: quedan } = await db.from("citas_sin_lead").select("estado").eq("proyecto_id", e.proyecto.id).order("ghl_cita_id");
    expect(quedan!.map((x) => x.estado)).toEqual(["resuelta", "descartada"]);
  });
});

describe("Arreglo 21: citas borradas en GHL", () => {
  it("si GHL falla no se cancela nada; si una cita del rango ya no viene, pasa a «cancelada»; fuera del rango no se toca", async () => {
    expect((await cita(`${e.pref}-e1`))!.estado).toBe("confirmada");
    // Fuera del rango consultado (de hace 30 días a dentro de 60): no se toca
    await db.from("citas").insert({ proyecto_id: e.proyecto.id, lead_id: e.leads.LeadA, closer_id: e.p.closerA.id, fecha: "2027-06-01T15:00:00Z", estado: "pendiente", origen: "ghl", ghl_cita_id: `${e.pref}-lejos` });
    rechazar = true;
    expect((await sync()).canceladas).toBe(0);
    rechazar = false;
    expect((await cita(`${e.pref}-e1`))!.estado).toBe("confirmada");
    // e1 ya no viene (se borró en GHL); e2 sigue
    eventos = [{ id: `${e.pref}-e2`, contactId: `${e.pref}-cNuevo`, startTime: "2026-10-13T10:00:00-04:00", appointmentStatus: "new" }];
    const antes = (await cita(`${e.pref}-e3`))?.estado; // la que se unió a mano en el test anterior (sigue abierta)
    const r = await sync();
    expect(antes).toBe("pendiente");
    expect(r.canceladas).toBe(2); // e1 y e3: ninguna viene ya de GHL
    expect((await cita(`${e.pref}-e1`))!.estado).toBe("cancelada");
    expect((await cita(`${e.pref}-e3`))!.estado).toBe("cancelada");
    expect((await cita(`${e.pref}-e2`))!.estado).toBe("cerrada"); // lo del closer no se toca
    expect((await cita(`${e.pref}-lejos`))!.estado).toBe("pendiente");
    const { data: p } = await db.from("proyectos").select("ghl_ultimo_resultado").eq("id", e.proyecto.id).single();
    expect(p!.ghl_ultimo_resultado).toMatch(/2 canceladas \(borradas en GHL\)/);
  });

  it("12 oct (Cristian): un lead con cita nueva de GHL pasa a «Orgánico → Agendados»; una cancelada no lo mueve", async () => {
    const { data: org } = await db.from("pipelines").insert({ proyecto_id: e.proyecto.id, nombre: "Orgánico", orden: 5 }).select().single();
    const { data: ets } = await db.from("etapas").insert(["Nuevos", "Agendados"].map((n, i) => ({ pipeline_id: org!.id, nombre: n, orden: i }))).select();
    const agendados = ets!.find((x) => x.nombre === "Agendados")!.id;
    await db.from("leads").update({ ghl_contact_id: `${e.pref}-cB` }).eq("id", e.leads.LeadB);
    contactos[`${e.pref}-cOrg`] = { firstName: "Org", lastName: "Nuevo", email: `${e.pref}-org@x.test` };
    contactos[`${e.pref}-cCan`] = { firstName: "Can", lastName: "Celada", email: `${e.pref}-can@x.test` };
    eventos = [
      { id: `${e.pref}-o1`, contactId: `${e.pref}-cB`, title: "LeadB", startTime: "2026-10-20T10:00:00-04:00", appointmentStatus: "confirmed" },
      { id: `${e.pref}-o2`, contactId: `${e.pref}-cOrg`, title: "Nuevo", startTime: "2026-10-21T10:00:00-04:00", appointmentStatus: "new" },
      { id: `${e.pref}-o3`, contactId: `${e.pref}-cCan`, title: "Cancelada", startTime: "2026-10-22T10:00:00-04:00", appointmentStatus: "cancelled" },
    ];
    await sync();
    const lead = async (filtro: { id?: string; email?: string }) =>
      (await (filtro.id ? db.from("leads").select("pipeline_id, etapa_id").eq("id", filtro.id) : db.from("leads").select("pipeline_id, etapa_id").eq("email", filtro.email!)).single()).data;
    expect(await lead({ id: e.leads.LeadB })).toEqual({ pipeline_id: org!.id, etapa_id: agendados });
    expect(await lead({ email: `${e.pref}-org@x.test` })).toEqual({ pipeline_id: org!.id, etapa_id: agendados });
    expect((await lead({ email: `${e.pref}-can@x.test` }))!.pipeline_id).not.toBe(org!.id);
  });
});
