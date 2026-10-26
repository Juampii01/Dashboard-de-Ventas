// 1b (26 oct 2026): el país se calcula al guardar el lead y la base nunca deja un país viejo.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { borrarEscenario, como, crearEscenario, db, formulario, ok, type Escenario } from "../apoyo/escenario";
import { crearLeadManual } from "@/app/(panel)/crm/acciones";
import { guardarLeads } from "@/lib/leads";
import type { LeadEntrada } from "@/lib/csv";

let e: Escenario;
beforeAll(async () => {
  e = await crearEscenario();
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});

const entrada = (x: Partial<LeadEntrada>): LeadEntrada => ({ ghl_contact_id: null, nombre: "", apellido: "", email: null, telefono: null, etiquetas: [], respuestas: [], creado_en: null, ...x });
const opcs = { pipelineId: null, origen: "ghl" as const, perfilId: null, repartir: false };
const porEmail = async (email: string) => (await db.from("leads").select("id, telefono, pais, pais_de").eq("proyecto_id", e.proyecto.id).eq("email", email).single()).data!;

describe("El país se guarda al crear el lead", () => {
  it("en bloque (CSV, GHL): cada uno con el suyo, también el +1 separado y «Sin país»", async () => {
    const emails = ["es", "do", "us", "sin"].map((x) => `${e.pref}-pais-${x}@x.test`);
    await guardarLeads(e.proyecto, [
      entrada({ email: emails[0], telefono: "+34 600 11 22 33" }),
      entrada({ email: emails[1], telefono: "+1 809 555 1234" }),
      entrada({ email: emails[2], telefono: "+1 212 555 1234" }),
      entrada({ email: emails[3], telefono: "+1 555 123 4567" }),
    ], opcs);
    expect((await Promise.all(emails.map(porEmail))).map((l) => l.pais)).toEqual(["ES", "DO", "US", "Sin país"]);
  });

  it("«Nuevo lead» a mano", async () => {
    como(e, e.p.ceo);
    const email = `${e.pref}-pais-manual@x.test`;
    await ok(crearLeadManual(formulario({ nombre: "País manual", email, telefono: "+54 9 11 2345 6789" })));
    expect(await porEmail(email)).toMatchObject({ pais: "AR", pais_de: "+54 9 11 2345 6789" });
  });
});

describe("Al cambiar el teléfono", () => {
  it("cambia el país (también si es otro número del mismo país)", async () => {
    const email = `${e.pref}-pais-cambia@x.test`;
    await guardarLeads(e.proyecto, [entrada({ email, telefono: "+34 600 11 22 33" })], opcs);
    await guardarLeads(e.proyecto, [entrada({ email, telefono: "+57 300 123 4567" })], opcs);
    expect(await porEmail(email)).toMatchObject({ pais: "CO", pais_de: "+57 300 123 4567" });
    await guardarLeads(e.proyecto, [entrada({ email, telefono: "+57 310 765 4321" })], opcs);
    expect(await porEmail(email)).toMatchObject({ pais: "CO", pais_de: "+57 310 765 4321" });
  });

  it("la base borra el país viejo si el teléfono cambia sin país nuevo (p. ej. a mano en Supabase)", async () => {
    const email = `${e.pref}-pais-regla@x.test`;
    await guardarLeads(e.proyecto, [entrada({ email, telefono: "+34 600 11 22 33" })], opcs);
    const { id } = await porEmail(email);
    await db.from("leads").update({ telefono: "+52 1 55 1234 5678" }).eq("id", id);
    expect(await porEmail(email)).toMatchObject({ pais: null, pais_de: null });
    // y un país escrito sin decir de qué teléfono sale tampoco se queda
    await db.from("leads").update({ pais: "ES" }).eq("id", id);
    expect((await porEmail(email)).pais).toBeNull();
  });
});

describe("P3 · rellenar_pais (la usa scripts/rellenar-pais.mjs)", () => {
  it("pone el país a una tanda en una escritura, cada uno con su teléfono; no toca los que ya tienen país ni los que cambiaron de teléfono", async () => {
    // Creados directamente en la base, como los leads de antes de guardar el país
    const filas = [["a", "+34 600 11 22 33"], ["b", "+34 611 22 33 44"], ["c", "+34 622 33 44 55"]].map(([x, telefono]) => ({ proyecto_id: e.proyecto.id, nombre: `Viejo ${x}`, email: `${e.pref}-viejo-${x}@x.test`, telefono }));
    const { data: creados } = await db.from("leads").insert(filas).select("id, telefono, pais");
    expect(creados!.map((l) => l.pais)).toEqual([null, null, null]);
    const [a, b, c] = creados!;
    await db.from("leads").update({ telefono: "+57 300 123 4567" }).eq("id", c.id); // cambió de teléfono después de leerlo
    const { data: n, error } = await db.rpc("rellenar_pais", { p_ids: [a.id, b.id, c.id], p_telefonos: [a.telefono, b.telefono, c.telefono], p_pais: "ES" });
    expect(error).toBeNull();
    expect(n).toBe(2);
    const despues = async (id: string) => (await db.from("leads").select("pais, pais_de, telefono").eq("id", id).single()).data!;
    expect(await despues(a.id)).toMatchObject({ pais: "ES", pais_de: "+34 600 11 22 33" });
    expect(await despues(b.id)).toMatchObject({ pais: "ES", pais_de: "+34 611 22 33 44" });
    expect(await despues(c.id)).toMatchObject({ pais: null });
    // Otra vez: ya tienen país, no cambia ninguno
    const { data: otra } = await db.rpc("rellenar_pais", { p_ids: [a.id], p_telefonos: [a.telefono], p_pais: "MX" });
    expect(otra).toBe(0);
    expect((await despues(a.id)).pais).toBe("ES");
  });
});
