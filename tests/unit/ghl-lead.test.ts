// Leads por API (16 oct): un contacto de GHL → un lead. Forma sacada de un contacto real de la Biblioteca (sin sus datos).
import { describe, expect, it } from "vitest";
import { leadDeContactoGhl } from "@/lib/ghl-lead";

const campos = new Map([
  ["f1", "¿En qué situación estás hoy?"],
  ["f2", "¿Cuándo quieres empezar?"],
  ["f3", "utm_source"],
  ["f4", "¿En qué servicio(s) estás interesado?"],
]);

describe("leadDeContactoGhl", () => {
  it("respuestas con el nombre de la pregunta; utm al seguimiento; vacías fuera", () => {
    const { lead } = leadDeContactoGhl(
      "c1",
      {
        firstName: " Ana ",
        lastName: "Ruiz",
        email: "ANA@X.TEST",
        phone: "+34 600 11 22 33",
        tags: ["biblioteca recursos"],
        customFields: [
          { id: "f1", value: "Tengo un negocio" },
          { id: "f2", value: "" },
          { id: "f3", value: "yt" },
          { id: "f4", value: ["Agentes", "Web"] },
          { id: "desconocido", value: "x" },
        ],
      },
      campos,
      { fuente: "recursos", creadoEn: "2026-10-16T21:09:08.846Z", oportunidad: "o1", pipeline: "1. Biblioteca Recursos" }
    );
    expect(lead).toMatchObject({ ghl_contact_id: "c1", nombre: "Ana", apellido: "Ruiz", email: "ana@x.test", telefono: "+34 600 11 22 33", etiquetas: ["biblioteca recursos"], creado_en: "2026-10-16T21:09:08.846Z" });
    expect(lead.respuestas).toEqual([
      { pregunta: "¿En qué situación estás hoy?", respuesta: "Tengo un negocio" },
      { pregunta: "¿En qué servicio(s) estás interesado?", respuesta: "Agentes, Web" },
    ]);
    expect(lead.extra).toMatchObject({ fuente: "recursos", seguimiento: { utm_source: "yt" }, datos: { ghl_oportunidad: "o1", ghl_pipeline: "1. Biblioteca Recursos" } });
  });

  it("solo con el nombre completo, se parte; sin email ni fecha válida, null", () => {
    const { lead } = leadDeContactoGhl("c2", { name: "Luis Pérez Gil" }, campos, { creadoEn: "no-es-fecha" });
    expect(lead).toMatchObject({ nombre: "Luis", apellido: "Pérez Gil", email: null, telefono: null, etiquetas: [], respuestas: [], creado_en: null });
  });
});
