// V2-8: el CEO abre o cierra las secciones de «Empresa» por rol (todos los directores iguales).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { borrarEscenario, como, crearEscenario, falla, ok, type Escenario } from "../apoyo/escenario";
import { guardarPermisoSeccion } from "@/app/(panel)/admin/acciones";
import { crearMovimiento } from "@/app/(panel)/finanzas/acciones";
import { seccionesPermitidas } from "@/lib/permisos";

let e: Escenario;
beforeAll(async () => {
  e = await crearEscenario();
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});
const gasto = { tipo: "egreso" as const, importe: "10", fecha: "", categoria_id: null, cuenta_id: null, descripcion: "" };

describe("Permisos por sección", () => {
  it("solo el CEO los cambia (ni un director con Administración)", async () => {
    como(e, e.p.directorAdmin);
    await falla(guardarPermisoSeccion("director", "finanzas", true), /Solo el CEO/);
    como(e, e.p.closerA);
    await falla(guardarPermisoSeccion("closer", "finanzas", true), /No tienes permiso/);
  });

  it("abrir Finanzas a los directores: entran todos los directores, no los closers; cerrarla les quita el acceso", async () => {
    como(e, e.p.ceo);
    await falla(guardarPermisoSeccion("director", "inventada", true), /Sección no válida/);
    await falla(guardarPermisoSeccion("ceo" as "director", "finanzas", true), /Rol no válido/);
    await ok(guardarPermisoSeccion("director", "finanzas", true));
    expect([...(await seccionesPermitidas(e.p.director, e.proyecto.id))]).toEqual(["finanzas"]);
    expect([...(await seccionesPermitidas(e.p.directorAdmin, e.proyecto.id))]).toEqual(["finanzas"]);
    expect((await seccionesPermitidas(e.p.closerA, e.proyecto.id)).size).toBe(0);
    como(e, e.p.director);
    await ok(crearMovimiento(gasto));
    como(e, e.p.closerA);
    await falla(crearMovimiento(gasto), /No tienes acceso/);

    como(e, e.p.ceo);
    await ok(guardarPermisoSeccion("director", "finanzas", false));
    como(e, e.p.director);
    await falla(crearMovimiento(gasto), /No tienes acceso/);
  });

  it("el CEO lo tiene todo siempre", async () => {
    expect([...(await seccionesPermitidas(e.p.ceo, e.proyecto.id))].sort()).toEqual(["clientes", "equipo", "finanzas", "programas"]);
  });
});
