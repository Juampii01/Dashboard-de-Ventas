// 1.0 Bloque 4 (Cristian, 10 y 11 oct 2026): tramos en Administración, interruptor por persona en Equipo, casilla
// «Cuenta para comisión» en Programas y la liquidación del mes con el tramo alcanzado.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { borrarEscenario, como, crearEscenario, db, falla, formulario, ok, type Escenario } from "../apoyo/escenario";
import { guardarTramos } from "@/app/(panel)/admin/acciones";
import { cambiarModoComision } from "@/app/(panel)/equipo/acciones";
import { guardarPrograma, type DatosPrograma } from "@/app/(panel)/programas/acciones";
import { registrarVenta } from "@/app/(panel)/leads/acciones";
import { calcularLiquidaciones } from "@/app/(panel)/finanzas/acciones";
import { cargarEquipo } from "@/lib/equipo";
import { hoyEnZona } from "@/lib/formato";
import type { Proyecto } from "@/lib/tipos";

let e: Escenario;
beforeAll(async () => {
  e = await crearEscenario();
  await cargarEquipo(e.proyecto.id);
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});

const alDia = async () => Object.assign(e.proyecto, (await db.from("proyectos").select("*").eq("id", e.proyecto.id).single()).data as Proyecto);
const miembro = async (perfilId: string) => (await db.from("miembros_equipo").select("id, comision_modo").eq("proyecto_id", e.proyecto.id).eq("perfil_id", perfilId).single()).data!;

describe("Tramos en Administración", () => {
  it("por defecto los del plan; solo los cambia un administrador y tienen que estar bien", async () => {
    expect((await alDia()).tramos_comision).toMatchObject({ closer: [{ desde: 0, pct: 7 }] });
    como(e, e.p.closerA);
    await falla(guardarTramos("closer", [{ desde: 0, pct: 20 }]), /permiso/);
    como(e, e.p.director); // sin Administración
    await falla(guardarTramos("closer", [{ desde: 0, pct: 20 }]), /permiso/);
    como(e, e.p.directorAdmin);
    await falla(guardarTramos("caller", [{ desde: 500, pct: 3 }]), /empieza en 0/);
    await ok(guardarTramos("closer", [{ desde: 0, pct: 7 }, { desde: 20000, pct: 8 }]));
    const p = await alDia();
    expect(p.tramos_comision).toMatchObject({ closer: [{ desde: 0, pct: 7 }, { desde: 20000, pct: 8 }], caller: [{ desde: 0, pct: 3 }, { desde: 10000, pct: 3.5 }, { desde: 25000, pct: 4 }, { desde: 50000, pct: 4.5 }, { desde: 75000, pct: 5 }, { desde: 100000, pct: 5.5 }] });
  });
});

describe("Interruptor de cada persona (Equipo)", () => {
  it("solo CEO o director; solo callers y closers; nadie el suyo", async () => {
    const closerB = await miembro(e.p.closerB.id);
    como(e, e.p.callerA);
    await falla(cambiarModoComision(closerB.id, "propio"));
    como(e, e.p.ceo);
    await ok(cambiarModoComision(closerB.id, "propio"));
    expect((await miembro(e.p.closerB.id)).comision_modo).toBe("propio");
    await falla(cambiarModoComision((await miembro(e.p.director.id)).id, "tramos"), /callers y closers/);
    await ok(cambiarModoComision(closerB.id, "tramos"));
  });
});

describe("Casilla «Cuenta para comisión» (Programas)", () => {
  it("se guarda; la Membresía de un proyecto nuevo viene en «sí» salvo que se quite", async () => {
    const programa = (cuenta: boolean): DatosPrograma => ({ id: null, nombre: "Membresía test", descripcion: "", categoria: "", color: "#7c3aed", activo: true, backend_offer: false, vende_caller: true, cuenta_comision: cuenta, modo_pago: "mensual", num_cuotas: null, precio: "47", precios_divisa: {}, comisiones: {}, link_pago: "" });
    como(e, e.p.ceo);
    await ok(guardarPrograma(programa(false)));
    const { data } = await db.from("productos").select("cuenta_comision").eq("proyecto_id", e.proyecto.id).eq("nombre", "Membresía test").single();
    expect(data!.cuenta_comision).toBe(false);
  });
});

describe("Liquidación del mes con tramos", () => {
  it("closer por tramos: 7 % de lo cobrado y el tramo a la vista; la Membresía no paga", async () => {
    como(e, e.p.ceo);
    await ok(registrarVenta(e.leads.LeadA, formulario({ producto: e.productos["Mentoría grupal"], facturacion: "1000", cash: "1000", tipo_pago: "completo", metodo: "stripe", vendedor: e.p.closerA.id })));
    const { data: mem } = await db.from("productos").select("id").eq("proyecto_id", e.proyecto.id).eq("nombre", "Membresía test").single();
    await ok(registrarVenta(e.leads.LeadB, formulario({ producto: mem!.id, facturacion: "47", cash: "47", tipo_pago: "mensual", metodo: "stripe", vendedor: e.p.closerA.id })));
    const mes = hoyEnZona(e.proyecto.zona_horaria).slice(0, 7);
    await ok(calcularLiquidaciones(mes));
    const { data: liq } = await db.from("liquidaciones").select("comision_cobrado, tramo, detalle").eq("proyecto_id", e.proyecto.id).eq("mes", mes).eq("perfil_id", e.p.closerA.id).single();
    expect(Number(liq!.comision_cobrado)).toBe(70);
    expect(liq!.tramo).toEqual({ base: 1000, pct: 7 });
    expect((liq!.detalle as { venta_id: string }[]).length).toBe(1); // la Membresía no sale
  });
});
