// Paso H3: objetivos y lanzamientos. Los ponen el CEO o el director; cada cambio es una fila nueva.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { borrarEscenario, como, crearEscenario, db, falla, ok, type Escenario } from "../apoyo/escenario";
import { guardarObjetivo, quitarObjetivo, crearLanzamiento, borrarLanzamiento } from "@/app/(panel)/kpis/acciones";
import { cargarObjetivos, calcularAvances, panelObjetivos, avancesDelEquipo, calcularRacha } from "@/lib/objetivos";
import { cargarBase } from "@/lib/metricas";

let e: Escenario;
beforeAll(async () => {
  e = await crearEscenario();
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});
const nuevo = { para: "rol:caller", periodo: "semana", lanzamientoId: null, cifra: "llamadas", valor: "300", dias: [1, 2, 3, 4, 5] };
const filas = async () => (await db.from("objetivos").select("*").eq("proyecto_id", e.proyecto.id).order("creado_en")).data ?? [];

describe("Objetivos", () => {
  it("solo el CEO o el director; ni el caller ni el closer", async () => {
    como(e, e.p.callerA);
    await falla(guardarObjetivo(nuevo), /No tienes permiso/);
    como(e, e.p.closerA);
    await falla(crearLanzamiento({ nombre: "X", inicio: "2026-10-01", fin: "2026-10-02", evento: "" }), /No tienes permiso/);
    como(e, e.p.director);
    await ok(guardarObjetivo(nuevo));
    expect(await filas()).toHaveLength(1);
  });

  it("validaciones: cifra del rol, persona del proyecto, valor, días y lanzamiento", async () => {
    como(e, e.p.ceo);
    await falla(guardarObjetivo({ ...nuevo, cifra: "citas_atendidas" }), /no es una cifra de ese rol/);
    await falla(guardarObjetivo({ ...nuevo, para: `persona:${e.p.ceo.id}` }), /no es caller, closer ni director/);
    await falla(guardarObjetivo({ ...nuevo, para: "persona:00000000-0000-0000-0000-000000000000" }), /no es caller, closer ni director/);
    await falla(guardarObjetivo({ ...nuevo, valor: "0" }), /mayor que 0/);
    await falla(guardarObjetivo({ ...nuevo, periodo: "dia", dias: [] }), /al menos un día/);
    await falla(guardarObjetivo({ ...nuevo, periodo: "lanzamiento", lanzamientoId: "00000000-0000-0000-0000-000000000000" }), /Elige el lanzamiento/);
    await falla(crearLanzamiento({ nombre: "Al revés", inicio: "2026-10-10", fin: "2026-10-01", evento: "" }), /anterior/);
  });

  it("por persona guarda su rol vacío; quitar añade una fila sin valor (el histórico se conserva)", async () => {
    como(e, e.p.ceo);
    await ok(guardarObjetivo({ ...nuevo, para: `persona:${e.p.callerA.id}`, periodo: "dia", valor: "1.500", dias: [6, 1, 1] }));
    const propio = (await filas()).find((f) => f.perfil_id === e.p.callerA.id)!;
    expect(propio).toMatchObject({ rol: null, valor: 1500, dias: [1, 6] });
    await ok(quitarObjetivo(propio.id));
    const despues = (await filas()).filter((f) => f.perfil_id === e.p.callerA.id);
    expect(despues.map((f) => f.valor)).toEqual([1500, null]);
  });

  it("lanzamiento: se crea, se le ponen objetivos y al borrarlo se van con él", async () => {
    como(e, e.p.ceo);
    await ok(crearLanzamiento({ nombre: "Masterclass prueba", inicio: "2026-10-01", fin: "2026-10-31", evento: "Masterclass AI" }));
    const { data: l } = await db.from("lanzamientos").select("*").eq("proyecto_id", e.proyecto.id).single();
    expect(l).toMatchObject({ nombre: "Masterclass prueba", evento: "Masterclass AI" });
    await ok(guardarObjetivo({ ...nuevo, periodo: "lanzamiento", lanzamientoId: l!.id, cifra: "agendas", valor: "20" }));
    await ok(borrarLanzamiento(l!.id));
    expect((await filas()).some((f) => f.lanzamiento_id)).toBe(false);
  });

  it("«Mis objetivos» (carga solo los datos de la persona) da lo mismo que la cuenta con todo el proyecto", async () => {
    const pid = e.proyecto.id;
    const ahora = new Date().toISOString();
    const { LeadA, LeadB } = e.leads;
    await db.from("actividades").insert([
      { proyecto_id: pid, lead_id: LeadA, perfil_id: e.p.callerA.id, tipo: "llamada", resultado: "contestado", creado_en: ahora },
      { proyecto_id: pid, lead_id: LeadB, perfil_id: e.p.callerA.id, tipo: "whatsapp", creado_en: ahora },
      { proyecto_id: pid, lead_id: LeadB, perfil_id: e.p.callerB.id, tipo: "llamada", resultado: "no_contesta", creado_en: ahora },
    ]);
    await db.from("citas").insert({ proyecto_id: pid, lead_id: LeadA, closer_id: e.p.closerA.id, agendada_por: e.p.callerA.id, fecha: ahora, estado: "cerrada" });
    await db.from("ventas").insert({ proyecto_id: pid, lead_id: LeadA, producto_id: e.productos["Mentoría grupal"], vendedor_id: e.p.closerA.id, facturacion: 1997, cash_collected: 500, tipo_pago: "reserva", metodo: "stripe", fecha: ahora });
    como(e, e.p.ceo);
    for (const [para, cifra] of [["rol:caller", "contactados"], ["rol:caller", "agendas"], ["rol:closer", "citas_atendidas"], ["rol:closer", "cash"], ["rol:closer", "facturacion"]]) {
      await ok(guardarObjetivo({ ...nuevo, para, cifra, periodo: "mes", valor: "10" }));
    }
    const base = await cargarBase(e.proyecto);
    const todos = calcularAvances(base, await cargarObjetivos(pid), [e.p.callerA, e.p.closerA], e.proyecto.zona_horaria);
    const caller = (await panelObjetivos(e.proyecto, e.p.callerA)).mios;
    const closer = (await panelObjetivos(e.proyecto, e.p.closerA)).mios;
    expect(caller).toEqual(todos.get(e.p.callerA.id));
    expect(closer).toEqual(todos.get(e.p.closerA.id));
    const valor = (lista: typeof caller, cifra: string) => lista.filter((a) => a.etiqueta === "Este mes" && a.cifra === cifra).map((a) => a.hecho);
    expect(valor(caller, "contactados")).toEqual([2]); // LeadA (llamada y agenda) y LeadB (WhatsApp)
    expect(valor(caller, "agendas")).toEqual([1]);
    expect(valor(closer, "citas_atendidas")).toEqual([1]);
    expect(valor(closer, "cash")).toEqual([500]);
  });

  it("H4: el objetivo del equipo y la racha salen iguales con la carga ligera que con todo el proyecto", async () => {
    como(e, e.p.ceo);
    for (const cifra of ["llamadas", "contactados", "agendas", "citas_atendidas", "ventas", "facturacion", "cash"]) {
      await ok(guardarObjetivo({ ...nuevo, para: "rol:director", cifra, periodo: "semana", valor: "10" }));
    }
    await ok(guardarObjetivo({ ...nuevo, para: "rol:caller", cifra: "llamadas", periodo: "dia", valor: "1", dias: [1, 2, 3, 4, 5, 6, 7] }));
    const base = await cargarBase(e.proyecto);
    const datos = await cargarObjetivos(e.proyecto.id);
    const panel = await panelObjetivos(e.proyecto, e.p.callerA);
    expect(panel.equipo).toEqual(avancesDelEquipo(base, datos, e.proyecto.zona_horaria));
    expect(panel.equipo.find((a) => a.cifra === "llamadas")!.hecho).toBe(2); // las 2 llamadas de hoy (callerA y callerB)
    expect(panel.racha).toEqual(calcularRacha(base, datos.filas, e.p.callerA, e.proyecto.zona_horaria));
    expect(panel.racha!.dias).toBe(1); // llamó hoy
    // El closer ve el mismo objetivo del equipo
    expect((await panelObjetivos(e.proyecto, e.p.closerA)).equipo).toEqual(panel.equipo);
  });
});
