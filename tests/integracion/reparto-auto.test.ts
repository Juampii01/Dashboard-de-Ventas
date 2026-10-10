// 1.0 Bloque 2 (Cristian, 11 oct 2026): reparto automático al entrar con % por caller. Apagado por defecto y todo al 0 %;
// los % suman 100; «solo a quien esté en su horario» (si no hay nadie, igual entre todos los que tienen %);
// cada reparto queda en el historial del lead.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { borrarEscenario, como, crearEscenario, db, falla, ok, type Escenario } from "../apoyo/escenario";
import { guardarLeads, repartoAutomatico } from "@/lib/leads";
import { guardarReparto } from "@/app/(panel)/admin/acciones";
import type { Proyecto } from "@/lib/tipos";

let e: Escenario;
beforeAll(async () => {
  e = await crearEscenario();
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});

const proyecto = async () => (await db.from("proyectos").select("*").eq("id", e.proyecto.id).single()).data as Proyecto;
let n = 0;
const entradas = (k: number) =>
  Array.from({ length: k }, () => {
    n++;
    return { ghl_contact_id: null, nombre: `Auto${n}`, apellido: "", email: `${e.pref}-auto${n}@x.test`, telefono: null, etiquetas: [], respuestas: [], creado_en: null };
  });
const opcs = () => ({ pipelineId: e.pipeline.id, origen: "csv" as const, perfilId: null, repartir: true });
const pcts = (a: number, b: number, c: number) => ({ [e.p.callerA.id]: a, [e.p.callerB.id]: b, [e.p.callerC.id]: c });
const contar = (ids: (string | null)[]) => [e.p.callerA.id, e.p.callerB.id, e.p.callerC.id].map((c) => ids.filter((x) => x === c).length);

describe("Configurar el reparto (Administración)", () => {
  it("por defecto apagado y todo al 0 %: no se reparte aunque se marque «Repartir»", async () => {
    const p = await proyecto();
    expect(p.reparto_auto).toBe(false);
    expect(p.reparto_solo_horario).toBe(false);
    const r = await guardarLeads(p, entradas(3), opcs());
    expect(r.repartidos).toBe(0);
  });
  it("solo el administrador; para encenderlo los % tienen que sumar 100", async () => {
    como(e, e.p.callerA);
    await falla(guardarReparto({ auto: true, soloHorario: false, pcts: pcts(50, 30, 20) }), /permiso/);
    como(e, e.p.director); // sin Administración
    await falla(guardarReparto({ auto: true, soloHorario: false, pcts: pcts(50, 30, 20) }), /permiso/);
    como(e, e.p.directorAdmin);
    await falla(guardarReparto({ auto: true, soloHorario: false, pcts: pcts(50, 30, 10) }), /suman 90/);
    await falla(guardarReparto({ auto: false, soloHorario: false, pcts: pcts(50, 0, 0) }), /suman 50/);
    await falla(guardarReparto({ auto: true, soloHorario: false, pcts: pcts(120, -10, -10) }), /de 0 a 100/);
    await ok(guardarReparto({ auto: false, soloHorario: false, pcts: pcts(0, 0, 0) })); // apagado y a 0: vale
    await ok(guardarReparto({ auto: true, soloHorario: false, pcts: pcts(50, 30, 20) }));
    expect((await proyecto()).reparto_auto).toBe(true);
  });
});

describe("Repartir al entrar", () => {
  it("10 leads con 50 / 30 / 20 %: 5, 3 y 2; y siguen en proporción con los siguientes", async () => {
    const r = await guardarLeads(await proyecto(), entradas(10), opcs());
    expect(r.repartidos).toBe(10);
    const { data } = await db.from("leads").select("caller_id").eq("proyecto_id", e.proyecto.id).like("email", `${e.pref}-auto%`).not("caller_id", "is", null);
    expect(contar(data!.map((l) => l.caller_id))).toEqual([5, 3, 2]);
    // 10 más, de uno en uno (como llegan de GHL): en total 10, 6 y 4
    for (const x of entradas(10)) await guardarLeads(await proyecto(), [x], opcs());
    const { data: todos } = await db.from("leads").select("caller_id").eq("proyecto_id", e.proyecto.id).like("email", `${e.pref}-auto%`).not("caller_id", "is", null);
    expect(contar(todos!.map((l) => l.caller_id))).toEqual([10, 6, 4]);
  });
  it("cada reparto queda en el historial del lead", async () => {
    const { data: lead } = await db.from("leads").select("id, caller_id").eq("proyecto_id", e.proyecto.id).like("email", `${e.pref}-auto%`).not("caller_id", "is", null).limit(1).single();
    const { data: act } = await db.from("actividades").select("tipo, nota").eq("lead_id", lead!.id).eq("tipo", "asignacion");
    expect(act).toHaveLength(1);
    expect(act![0].nota).toMatch(/reparto automático \(%\)/);
  });
  it("un caller al 0 % no recibe nada; al cambiar los % la cuenta empieza de cero", async () => {
    como(e, e.p.ceo);
    await ok(guardarReparto({ auto: true, soloHorario: false, pcts: pcts(0, 50, 50) }));
    const { data: m } = await db.from("miembros_proyecto").select("reparto_cuenta").eq("proyecto_id", e.proyecto.id).in("perfil_id", [e.p.callerA.id, e.p.callerB.id, e.p.callerC.id]);
    expect(m!.every((x) => x.reparto_cuenta === 0)).toBe(true);
    expect(contar(await repartoAutomatico(await proyecto(), 4))).toEqual([0, 2, 2]);
  });
  it("«solo a quien esté en su horario»: si nadie lo está, igual entre todos los que tienen %", async () => {
    await ok(guardarReparto({ auto: true, soloHorario: true, pcts: pcts(0, 50, 50) }));
    // callerB trabaja los lunes de 9 a 13 (Nueva York); callerC, sin horario
    await db.from("miembros_proyecto").update({ horario: { semana: { 1: [{ desde: "09:00", hasta: "13:00" }] }, fechas: {} } }).eq("proyecto_id", e.proyecto.id).eq("perfil_id", e.p.callerB.id);
    const p = await proyecto();
    const lunes10 = new Date("2026-10-12T10:00:00-04:00");
    expect(contar(await repartoAutomatico(p, 4, lunes10))).toEqual([0, 4, 0]);
    const lunes20 = new Date("2026-10-12T20:00:00-04:00"); // nadie en su horario
    expect(contar(await repartoAutomatico(p, 4, lunes20)).reduce((a, b) => a + b, 0)).toBe(4);
    expect(contar(await repartoAutomatico(p, 4, lunes20))[0]).toBe(0); // al de 0 % nunca
  });
  it("apagado otra vez: deja de repartir", async () => {
    await ok(guardarReparto({ auto: false, soloHorario: false, pcts: pcts(0, 50, 50) }));
    expect((await guardarLeads(await proyecto(), entradas(2), opcs())).repartidos).toBe(0);
  });
});
