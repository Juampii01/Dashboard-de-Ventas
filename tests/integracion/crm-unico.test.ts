// Paso H7 (decisiones de Cristian del 10 oct 2026): un solo CRM con columnas unidas a los estados del caller.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { borrarEscenario, como, crearEscenario, db, falla, ok, type Escenario } from "../apoyo/escenario";
import { crearEtapa, guardarColumnasPrecall, moverLead, unirEstado } from "@/app/(panel)/crm/acciones";
import { agendarCita, registrarLlamada, volverANuevo } from "@/app/(panel)/leads/acciones";
import { columnasPrecall } from "@/lib/llamadas";

let e: Escenario;
let noContesta: string;
let libre: string;
beforeAll(async () => {
  e = await crearEscenario();
  await db.from("leads").update({ pipeline_id: e.pipeline.id, etapa_id: e.etapas.Nuevos }).in("id", [e.leads.LeadA, e.leads.LeadB]);
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});
const etapaDe = async (id: string) => (await db.from("leads").select("etapa_id").eq("id", id).single()).data!.etapa_id;
const idEtapa = async (nombre: string) => (await db.from("etapas").select("id").eq("pipeline_id", e.pipeline.id).eq("nombre", nombre).single()).data!.id as string;

describe("Uniones de columnas (solo CEO y director con Administración)", () => {
  it("el closer y el director sin Administración no pueden; el admin une, y un estado solo va a una columna", async () => {
    como(e, e.p.closerA);
    await falla(unirEstado(e.etapas.Nuevos, "nuevo"), /permiso/);
    como(e, e.p.director);
    await falla(unirEstado(e.etapas.Nuevos, "nuevo"), /permiso/);
    await falla(crearEtapa(e.pipeline.id, "No contesta", "#94a3b8"), /permiso/);
    como(e, e.p.directorAdmin);
    await ok(unirEstado(e.etapas.Nuevos, "nuevo"));
    await ok(unirEstado(e.etapas.Agendados, "agendado"));
    await ok(crearEtapa(e.pipeline.id, "No contesta", "#94a3b8"));
    await ok(crearEtapa(e.pipeline.id, "Libre", "#7c3aed"));
    noContesta = await idEtapa("No contesta");
    libre = await idEtapa("Libre");
    await ok(unirEstado(noContesta, "no_contesta"));
    await falla(unirEstado(libre, "no_contesta"), /ya está unida/);
    await falla(unirEstado(libre, "inventado"), /no válido/);
  });
});

describe("Los botones del caller mueven la tarjeta a su columna", () => {
  it("No contesta → su columna · Agendar → Agendados · volver a Nuevo → Nuevos", async () => {
    como(e, e.p.callerA);
    await ok(registrarLlamada(e.leads.LeadA, "no_contesta", ""));
    expect(await etapaDe(e.leads.LeadA)).toBe(noContesta);
    await ok(volverANuevo(e.leads.LeadA));
    expect(await etapaDe(e.leads.LeadA)).toBe(e.etapas.Nuevos);
    await ok(agendarCita(e.leads.LeadA, e.p.closerA.id, "2026-11-20T16:00", "", 4));
    expect(await etapaDe(e.leads.LeadA)).toBe(e.etapas.Agendados);
  });
  it("sin columna unida a ese estado, como antes, por el nombre", async () => {
    como(e, e.p.directorAdmin);
    await ok(unirEstado(e.etapas.Agendados, null));
    como(e, e.p.callerB);
    await ok(agendarCita(e.leads.LeadB, e.p.closerA.id, "2026-11-21T16:00", "", 4));
    expect(await etapaDe(e.leads.LeadB)).toBe(e.etapas.Agendados);
    como(e, e.p.directorAdmin);
    await ok(unirEstado(e.etapas.Agendados, "agendado"));
  });
});

describe("Arrastrar en el CRM", () => {
  it("cada uno mueve los suyos a columnas libres; a una unida, solo con su botón", async () => {
    como(e, e.p.callerA);
    await ok(moverLead(e.leads.LeadA, libre)); // suyo, columna libre
    expect(await etapaDe(e.leads.LeadA)).toBe(libre);
    await falla(moverLead(e.leads.LeadA, noContesta), /unida a un estado/); // su estado es «agendado»
    await falla(moverLead(e.leads.LeadB, libre), /no está asignado a ti/); // de otro caller
    como(e, e.p.closerA); // LeadA tiene a closerA desde que se agendó
    await ok(moverLead(e.leads.LeadA, e.etapas.Agendados)); // unida a su mismo estado: sí
    como(e, e.p.closerB);
    await falla(moverLead(e.leads.LeadA, libre), /no está asignado a ti/);
  });
});

describe("Columnas de Pre-call", () => {
  it("solo el admin; las 4, una vez cada una; nombre, color y orden", async () => {
    const lista = [
      { estado: "confirmada", titulo: "Confirmadas ✅", color: "#16a34a" },
      { estado: "pendiente", titulo: "Por confirmar", color: "var(--aviso)" },
      { estado: "confirmacion_pendiente", titulo: "Esperando", color: "#d97706" },
      { estado: "no_califica", titulo: "No califica", color: "#dc2626" },
    ];
    como(e, e.p.director);
    await falla(guardarColumnasPrecall(lista), /permiso/);
    como(e, e.p.directorAdmin);
    await falla(guardarColumnasPrecall(lista.slice(0, 3)), /las 4 columnas/);
    await falla(guardarColumnasPrecall([...lista.slice(0, 3), { ...lista[3], titulo: " " }]), /nombre/);
    await falla(guardarColumnasPrecall([...lista.slice(0, 3), { ...lista[3], color: "red; x" }]), /Color/);
    await ok(guardarColumnasPrecall(lista));
    const { data } = await db.from("proyectos").select("precall_columnas").eq("id", e.proyecto.id).single();
    expect(columnasPrecall(data!.precall_columnas).map((c) => [c.estado, c.titulo])).toEqual(lista.map((c) => [c.estado, c.titulo]));
  });
  it("sin configurar, las de siempre", () => {
    expect(columnasPrecall(null).map((c) => c.titulo)).toEqual(["Pendiente", "Confirmación pendiente", "Confirmado", "No califica"]);
    expect(columnasPrecall([{ estado: "no_califica", titulo: "NC" }]).map((c) => c.titulo)).toEqual(["NC", "Pendiente", "Confirmación pendiente", "Confirmado"]);
  });
});
