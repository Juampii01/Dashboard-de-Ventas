// Funciones que no se habían probado: reparto rotativo, cobros, borrados,
// pipelines y columnas, links, contraseñas, reagendar, proyectos.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { PASSWORD, borrarEscenario, como, crearEscenario, db, falla, formulario, ok, type Escenario } from "../apoyo/escenario";
import { guardarLeads } from "@/lib/leads";
import { crearPipeline, renombrarPipeline, borrarPipeline, crearEtapa, borrarEtapa, moverEtapa, importarCsv } from "@/app/(panel)/crm/acciones";
import { registrarLlamada, registrarVenta, agendarCita, volverANuevo } from "@/app/(panel)/leads/acciones";
import { reagendarCita, cambiarEstadoCita } from "@/app/(panel)/closer/acciones";
import { registrarCobro, borrarVenta } from "@/app/(panel)/ventas/acciones";
import { guardarLinkPago, crearRecurso, borrarRecurso } from "@/app/(panel)/recursos/acciones";
import { cambiarPassword, crearProyecto, anadirAlProyecto, quitarDelProyecto, guardarProyecto, moverEnReparto } from "@/app/(panel)/admin/acciones";
import type { Proyecto } from "@/lib/tipos";

let e: Escenario;
beforeAll(async () => {
  e = await crearEscenario();
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});

const leerLead = async (id: string) => (await db.from("leads").select("*").eq("id", id).single()).data!;

describe("Reparto rotativo", () => {
  it("con el modo «rotativo», los leads nuevos se reparten por turnos entre los 3 callers", async () => {
    await db.from("proyectos").update({ modo_reparto: "rotativo", rotacion_indice: 0 }).eq("id", e.proyecto.id);
    const proyecto = { ...e.proyecto, modo_reparto: "rotativo" } as Proyecto;
    const entradas = Array.from({ length: 7 }, (_, i) => ({
      ghl_contact_id: `${e.pref}-rot-${i}`,
      nombre: `Rot${i}`,
      apellido: "",
      email: `${e.pref}-rot${i}@x.test`,
      telefono: null,
      etiquetas: [],
      respuestas: [],
      creado_en: null,
    }));
    const r = await guardarLeads(proyecto, entradas, { pipelineId: e.pipeline.id, origen: "csv", perfilId: null, repartir: true });
    expect(r.insertados).toBe(7);
    expect(r.repartidos).toBe(7);
    const { data } = await db.from("leads").select("nombre, caller_id").eq("proyecto_id", e.proyecto.id).like("nombre", "Rot%").order("nombre");
    const orden = [e.p.callerA.id, e.p.callerB.id, e.p.callerC.id];
    expect(data!.map((l) => l.caller_id)).toEqual([0, 1, 2, 3, 4, 5, 6].map((i) => orden[i % 3]));
    // El turno sigue donde se quedó: el siguiente lead va al caller B
    const r2 = await guardarLeads(proyecto, [{ ...entradas[0], ghl_contact_id: `${e.pref}-rot-x`, email: `${e.pref}-rotx@x.test`, nombre: "RotX" }], {
      pipelineId: e.pipeline.id,
      origen: "csv",
      perfilId: null,
      repartir: true,
    });
    expect(r2.repartidos).toBe(1);
    const { data: x } = await db.from("leads").select("caller_id").eq("nombre", "RotX").eq("proyecto_id", e.proyecto.id).single();
    expect(x!.caller_id).toBe(e.p.callerB.id);
  });
  it("cambiar el orden del reparto en Administración cambia quién va primero", async () => {
    como(e, e.p.ceo);
    await ok(moverEnReparto(e.p.callerC.id, -1)); // C sube por encima de B
    const { data } = await db
      .from("miembros_proyecto")
      .select("perfil_id, orden, perfiles!inner(rol)")
      .eq("proyecto_id", e.proyecto.id)
      .eq("perfiles.rol", "caller")
      .order("orden");
    expect(data!.map((m) => m.perfil_id)).toEqual([e.p.callerA.id, e.p.callerC.id, e.p.callerB.id]);
  });
  it("en modo «manual» no se reparte nada aunque se marque la casilla", async () => {
    const proyecto = { ...e.proyecto, modo_reparto: "manual" } as Proyecto;
    const r = await guardarLeads(
      proyecto,
      [{ ghl_contact_id: `${e.pref}-man`, nombre: "Manual", apellido: "", email: `${e.pref}-man@x.test`, telefono: null, etiquetas: [], respuestas: [], creado_en: null }],
      { pipelineId: e.pipeline.id, origen: "csv", perfilId: null, repartir: true }
    );
    expect(r.repartidos).toBe(0);
  });
  it("guardar el modo desde Administración", async () => {
    como(e, e.p.ceo);
    expect((await guardarProyecto(null, formulario({ modo_reparto: "manual", aviso_webhook_url: "" })))?.ok).toBeTruthy();
    expect((await guardarProyecto(null, formulario({ modo_reparto: "manual", aviso_webhook_url: "http://inseguro.test" })))?.error).toMatch(/https/);
  });
});

describe("Ventas y cobros", () => {
  let ventaId: string;
  it("venta con reserva y después cobro de cuotas hasta completar", async () => {
    como(e, e.p.director);
    const fd = formulario({ producto: e.productos["Mentoría grupal"], facturacion: "1997", cash: "500", tipo_pago: "reserva", metodo: "transferencia", vendedor: e.p.closerA.id });
    await ok(registrarVenta(e.leads.LeadA, fd));
    const { data } = await db.from("ventas").select("*").eq("lead_id", e.leads.LeadA).single();
    ventaId = data!.id;
    expect(data).toMatchObject({ facturacion: 1997, cash_collected: 500, tipo_pago: "reserva", metodo: "transferencia", vendedor_id: e.p.closerA.id });

    como(e, e.p.closerA); // el closer que vendió cobra el resto
    await ok(registrarCobro(ventaId, "1000", "stripe"));
    await falla(registrarCobro(ventaId, "600", "stripe"), /más que la facturación/);
    await ok(registrarCobro(ventaId, "497", "stripe"));
    const { data: pagos } = await db.from("pagos").select("importe").eq("venta_id", ventaId);
    expect(pagos!.reduce((s, p) => s + Number(p.importe), 0)).toBe(1497);
  });
  it("valida los importes de la venta", async () => {
    como(e, e.p.director);
    const mal = formulario({ producto: e.productos["Low ticket"], facturacion: "47", cash: "100", tipo_pago: "completo", metodo: "stripe" });
    await falla(registrarVenta(e.leads.LeadB, mal), /cash collected/);
    const cero = formulario({ producto: e.productos["Low ticket"], facturacion: "0", cash: "0", tipo_pago: "completo", metodo: "stripe" });
    await falla(registrarVenta(e.leads.LeadB, cero), /mayor que 0/);
  });
  it("el director borra una venta y desaparecen también sus cobros", async () => {
    como(e, e.p.director);
    await ok(borrarVenta(ventaId));
    expect((await db.from("ventas").select("id").eq("id", ventaId)).data).toHaveLength(0);
    expect((await db.from("pagos").select("id").eq("venta_id", ventaId)).data).toHaveLength(0);
  });
});

describe("Citas", () => {
  it("al reagendar, la agenda sigue siendo mérito del caller y la nueva hora es correcta", async () => {
    como(e, e.p.callerB);
    await ok(agendarCita(e.leads.LeadB, e.p.closerA.id, "2026-11-01T09:00", "nota", 4));
    const { data: cita } = await db.from("citas").select("*").eq("lead_id", e.leads.LeadB).eq("agendada_por", e.p.callerB.id).single();
    expect(cita!.fecha).toMatch(/^2026-11-01T14:00:00/); // día del cambio de hora en NY
    como(e, e.p.closerA);
    await ok(reagendarCita(cita!.id, "2026-11-03T10:30"));
    const { data: citas } = await db.from("citas").select("estado, agendada_por, fecha").eq("lead_id", e.leads.LeadB).order("creado_en");
    expect(citas!.map((c) => c.estado)).toContain("reagendada");
    const nueva = citas!.find((c) => c.estado === "pendiente")!;
    expect(nueva.agendada_por).toBe(e.p.callerB.id);
    expect(nueva.fecha).toMatch(/^2026-11-03T15:30:00/);
  });
  it("un estado inventado se rechaza", async () => {
    como(e, e.p.closerA);
    const { data } = await db.from("citas").select("id").eq("lead_id", e.leads.LeadB).eq("estado", "pendiente").single();
    await falla(cambiarEstadoCita(data!.id, "inventado" as never, ""), /no válido/);
  });
  it("«seguimiento» mueve el lead a la columna de seguimiento si existe; si no, no rompe", async () => {
    como(e, e.p.closerA);
    const { data } = await db.from("citas").select("id").eq("lead_id", e.leads.LeadB).eq("estado", "pendiente").single();
    await ok(cambiarEstadoCita(data!.id, "seguimiento", "", 3));
    expect((await db.from("citas").select("estado").eq("id", data!.id).single()).data!.estado).toBe("seguimiento");
  });
});

describe("Caller: llamar luego y volver a nuevo", () => {
  it("«llamar luego» guarda la hora en la zona del proyecto y «volver a nuevo» la borra", async () => {
    como(e, e.p.callerA);
    await ok(registrarLlamada(e.leads.LeadA, "llamar_luego", "Me dijo que a las 5", "2026-10-15T17:00", 3));
    let l = await leerLead(e.leads.LeadA);
    expect(l.estado_caller).toBe("llamar_luego");
    expect(new Date(l.llamar_en).toISOString()).toBe("2026-10-15T21:00:00.000Z");
    await ok(volverANuevo(e.leads.LeadA));
    l = await leerLead(e.leads.LeadA);
    expect(l.estado_caller).toBe("nuevo");
    expect(l.llamar_en).toBeNull();
  });
  it("«no interesa» manda el lead a «Descartados»", async () => {
    como(e, e.p.callerA);
    await ok(registrarLlamada(e.leads.LeadA, "no_interesa", "", undefined, 2));
    expect((await leerLead(e.leads.LeadA)).etapa_id).toBe(e.etapas.Descartados);
  });
});

describe("Pipelines y columnas", () => {
  it("crear, renombrar, ordenar y borrar columnas; al borrar, los leads pasan a la primera", async () => {
    como(e, e.p.director);
    const id = await ok(crearPipeline(`Pipe ${e.id}`));
    await ok(renombrarPipeline(id, `Pipe ${e.id} renombrado`));
    expect((await db.from("pipelines").select("nombre").eq("id", id).single()).data!.nombre).toBe(`Pipe ${e.id} renombrado`);
    await ok(crearEtapa(id, "Extra", "#000000"));
    const etapas = async () => (await db.from("etapas").select("id, nombre, orden").eq("pipeline_id", id).order("orden")).data!;
    let lista = await etapas();
    expect(lista.map((x) => x.nombre)).toEqual(["Nuevos", "Agendados", "Cerrados", "Extra"]);
    const extra = lista.find((x) => x.nombre === "Extra")!;
    await ok(moverEtapa(extra.id, -1));
    lista = await etapas();
    expect(lista.map((x) => x.nombre)).toEqual(["Nuevos", "Agendados", "Extra", "Cerrados"]);
    await db.from("leads").update({ pipeline_id: id, etapa_id: extra.id }).eq("id", e.leads.LeadLibre);
    await ok(borrarEtapa(extra.id));
    expect((await leerLead(e.leads.LeadLibre)).etapa_id).toBe(lista[0].id);
    await ok(borrarPipeline(id));
    const l = await leerLead(e.leads.LeadLibre);
    expect(l.pipeline_id).toBeNull(); // el lead NO se borra
    expect(l.etapa_id).toBeNull();
  });
  it("subir CSV desde la acción con mapeo elegido", async () => {
    como(e, e.p.director);
    const fd = new FormData();
    fd.set("archivo", new File([`Correo,Nombre completo,Ciudad\n${e.pref}-csv@x.test,Pepe Lopez,Miami\n`], "a.csv", { type: "text/csv" }));
    fd.set("pipeline", e.pipeline.id);
    fd.set("mapa", JSON.stringify({ Correo: "email", "Nombre completo": "nombre_completo", Ciudad: "ignorar" }));
    expect((await importarCsv(null, fd))?.ok).toMatch(/Importados 1/);
    const { data } = await db.from("leads").select("nombre, apellido, respuestas").eq("email", `${e.pref}-csv@x.test`).single();
    expect(data).toEqual({ nombre: "Pepe", apellido: "Lopez", respuestas: [] });
    // Subirlo otra vez no duplica
    expect((await importarCsv(null, fd))?.ok).toMatch(/0 leads nuevos · 1 actualizados/);
  });
});

describe("Links y recursos", () => {
  it("link de pago: acepta https y rechaza lo que no es un enlace", async () => {
    como(e, e.p.director);
    await ok(guardarLinkPago(e.productos["Low ticket"], "https://buy.stripe.com/test_123"));
    expect((await db.from("productos").select("link_pago").eq("id", e.productos["Low ticket"]).single()).data!.link_pago).toBe("https://buy.stripe.com/test_123");
    await falla(guardarLinkPago(e.productos["Low ticket"], "javascript:alert(1)"), /enlace válido/);
  });
  it("recurso «solo callers»: se crea y se borra", async () => {
    como(e, e.p.director);
    expect((await crearRecurso(null, formulario({ titulo: "Guion", tipo: "guion", para_rol: "caller", contenido: "Hola…" })))?.ok).toBeTruthy();
    expect((await crearRecurso(null, formulario({ titulo: "Malo", tipo: "enlace", url: "ftp://x" })))?.error).toMatch(/enlace válido/);
    const { data } = await db.from("recursos").select("id, para_rol").eq("proyecto_id", e.proyecto.id).single();
    expect(data!.para_rol).toBe("caller");
    await ok(borrarRecurso(data!.id));
    expect((await db.from("recursos").select("id").eq("proyecto_id", e.proyecto.id)).data).toHaveLength(0);
  });
});

describe("Administración", () => {
  it("cambiar la contraseña de alguien: la nueva funciona y la vieja no", async () => {
    como(e, e.p.ceo);
    await ok(cambiarPassword(e.p.callerC.id, "Nueva-clave-2026"));
    const auth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
    expect((await auth.auth.signInWithPassword({ email: e.p.callerC.email, password: PASSWORD })).error).not.toBeNull();
    expect((await auth.auth.signInWithPassword({ email: e.p.callerC.email, password: "Nueva-clave-2026" })).error).toBeNull();
    await falla(cambiarPassword(e.p.callerC.id, "corta"), /8/);
  });
  it("crear un proyecto en EUR/Madrid, añadir a alguien que ya existe y quitarlo", async () => {
    como(e, e.p.ceo);
    expect((await crearProyecto(null, formulario({ nombre: `TEST-AUTO ${e.id} España`, region: "es", color: "#123456" })))?.ok).toMatch(/EUR, Europe\/Madrid/);
    const { data: nuevo } = await db.from("proyectos").select("*").eq("nombre", `TEST-AUTO ${e.id} España`).single();
    expect(nuevo).toMatchObject({ moneda: "EUR", zona_horaria: "Europe/Madrid", color: "#123456" });
    expect((await db.from("pipelines").select("id").eq("proyecto_id", nuevo!.id)).data).toHaveLength(1);
    // Trabajar dentro del proyecto nuevo
    const sesionNueva = { ...e, proyecto: nuevo as Proyecto };
    como(sesionNueva, e.p.ceo);
    await ok(anadirAlProyecto(e.p.callerA.id));
    await falla(anadirAlProyecto(e.p.callerA.id), /Ya está/);
    const miembros = async () => (await db.from("miembros_proyecto").select("perfil_id").eq("proyecto_id", nuevo!.id)).data!.map((m) => m.perfil_id);
    expect(await miembros()).toContain(e.p.callerA.id);
    await ok(quitarDelProyecto(e.p.callerA.id));
    expect(await miembros()).not.toContain(e.p.callerA.id);
    // Sigue en el proyecto original
    expect((await db.from("miembros_proyecto").select("perfil_id").eq("proyecto_id", e.proyecto.id).eq("perfil_id", e.p.callerA.id)).data).toHaveLength(1);
    await falla(quitarDelProyecto(e.p.ceo.id), /ti mismo/);
  });
});
