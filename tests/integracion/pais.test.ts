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
