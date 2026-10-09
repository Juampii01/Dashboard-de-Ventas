// V2-5: programas (productos) con precio, forma de pago, back-end y comisiones; solo con la sección «programas».
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { borrarEscenario, como, crearEscenario, db, falla, ok, type Escenario } from "../apoyo/escenario";
import { activarPrograma, guardarPrograma, type DatosPrograma } from "@/app/(panel)/programas/acciones";

let e: Escenario;
beforeAll(async () => {
  e = await crearEscenario();
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});
const base: DatosPrograma = { id: null, nombre: "Mentoría VIP", descripcion: "", categoria: "Mentorías", color: "#7c3aed", activo: true, backend_offer: false, vende_caller: false, modo_pago: "unico", num_cuotas: null, precio: "4997", precios_divisa: {}, comisiones: {}, link_pago: "" };

describe("Programas", () => {
  it("solo con la sección: el director no puede por defecto; si el CEO se la da, sí", async () => {
    como(e, e.p.director);
    await falla(guardarPrograma(base), /No tienes acceso/);
    await db.from("permisos_seccion").insert({ proyecto_id: e.proyecto.id, rol: "director", seccion: "programas", permitido: true });
    await ok(guardarPrograma({ ...base, nombre: "Del director" }));
    await db.from("permisos_seccion").delete().eq("proyecto_id", e.proyecto.id);
  });
  it("crear con cuotas, precio en otra moneda y comisiones; los vacíos y ceros no se guardan", async () => {
    como(e, e.p.ceo);
    await ok(guardarPrograma({ ...base, modo_pago: "cuotas", num_cuotas: 6, precios_divisa: { EUR: "4600", USD: "1" }, comisiones: { closer: "12", caller_agenda: "4", caller: "", director: "0" }, link_pago: "https://pago.test/vip", backend_offer: true }));
    const { data: p } = await db.from("productos").select("*").eq("proyecto_id", e.proyecto.id).eq("nombre", "Mentoría VIP").single();
    expect(p).toMatchObject({ precio: 4997, modo_pago: "cuotas", num_cuotas: 6, backend_offer: true, categoria: "Mentorías", link_pago: "https://pago.test/vip" });
    expect(p!.precios_divisa).toEqual({ EUR: 4600 }); // la moneda del proyecto (USD) no se repite
    expect(p!.comisiones).toEqual({ closer: 12, caller_agenda: 4 });
  });
  it("validaciones: nombre, precio cero, cuotas y link", async () => {
    como(e, e.p.ceo);
    await falla(guardarPrograma({ ...base, nombre: " " }), /Falta el nombre/);
    await falla(guardarPrograma({ ...base, precio: "0" }), /en cero/);
    await falla(guardarPrograma({ ...base, modo_pago: "cuotas", num_cuotas: 1 }), /de 2 a 60/);
    await falla(guardarPrograma({ ...base, link_pago: "javascript:alert(1)" }), /https/);
    await falla(guardarPrograma({ ...base, comisiones: { closer: "150" } }), /Comisión no válido/);
  });
  it("precio personalizado (vacío) y activar / desactivar", async () => {
    como(e, e.p.ceo);
    await ok(guardarPrograma({ ...base, nombre: "DFY", precio: "" }));
    const { data: p } = await db.from("productos").select("id, precio, activo").eq("proyecto_id", e.proyecto.id).eq("nombre", "DFY").single();
    expect(p!.precio).toBeNull();
    await ok(activarPrograma(p!.id, false));
    expect((await db.from("productos").select("activo").eq("id", p!.id).single()).data!.activo).toBe(false);
  });
});
