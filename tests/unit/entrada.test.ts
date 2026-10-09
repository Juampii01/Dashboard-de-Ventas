// Interpretación de los envíos de las landings (ejemplos en tests/apoyo/envios.ts).
import { describe, expect, it } from "vitest";
import { aplicarReglas, interpretar, nombreLegible, reglasValidas, type Regla } from "@/lib/entrada";
import { BIBLIOTECA, OPTIN } from "../apoyo/envios";

describe("interpretar: biblioteca de recursos", () => {
  const r = interpretar(BIBLIOTECA);
  it("reconoce nombre (y saca el apellido del nombre completo), email y teléfono", () => {
    expect(r.lead).toMatchObject({ nombre: "ana", apellido: "maria prueba lopez", email: "ana.prueba@ejemplo.test", telefono: "+584220000000", etiquetas: ["recursos-ia"] });
  });
  it("guarda las 6 respuestas una sola vez (vienen repetidas en «quiz» y en «quiz_*») con nombre legible", () => {
    expect(r.lead.respuestas).toHaveLength(6);
    expect(r.lead.respuestas).toContainEqual({ pregunta: "Objetivo 90 días", respuesta: "Cerrar mi primer cliente en USA" });
    expect(r.lead.respuestas).toContainEqual({ pregunta: "Inversión", respuesta: "No por ahora" });
    expect(r.lead.respuestas.map((x) => x.pregunta)).not.toContain("Score");
  });
  it("fuente, puntuación y seguimiento", () => {
    expect(r.fuente).toBe("recursos");
    expect(r.evento).toBeNull();
    expect(r.quiz_score).toBe(14);
    expect(r.seguimiento).toEqual({ page_url: "https://biblioteca.codigomaestria.com/?mcp_token=x" });
  });
  it("no se pierde nada: todo va a «datos», menos las cabeceras que añade GHL", () => {
    expect(Object.keys(r.datos)).toHaveLength(Object.keys(BIBLIOTECA).length - 1);
    expect(r.datos).not.toHaveProperty("headers");
    expect(r.datos.event_id).toBe(BIBLIOTECA.event_id);
    expect(r.datos.quiz_completed).toBe(true);
  });
});

describe("interpretar: opt-in de la masterclass", () => {
  const r = interpretar(OPTIN);
  it("evento, fuente, 8 respuestas y solo las UTM que vienen rellenas", () => {
    expect(r.evento).toBe("Masterclass AI 2026-10-15");
    expect(r.fuente).toBe("landing-codigo-maestria");
    expect(r.lead.respuestas).toHaveLength(8);
    expect(r.lead.respuestas).toContainEqual({ pregunta: "Uso IA", respuesta: "Casi no lo uso todavía" });
    expect(r.seguimiento).toEqual({ utm_source: "facebook", utm_campaign: "masterclass-oct", fbclid: "abc123", page_url: "https://codigomaestria.com/optin-page" });
    expect(r.quiz_score).toBeNull();
  });
  it("con name = first_name no inventa apellido", () => {
    expect(r.lead).toMatchObject({ nombre: "test", apellido: "" });
  });
});

describe("formato antiguo de GHL (customData) sigue funcionando", () => {
  it("las preguntas de customData se guardan con su texto", () => {
    const r = interpretar({ tipo: "lead_nuevo", contact_id: "c1", first_name: "A", customData: { "¿Cuándo quieres empezar?": "Ya mismo", pipeline: "Webinar 1" } });
    expect(r.lead.ghl_contact_id).toBe("c1");
    expect(r.lead.respuestas).toEqual([{ pregunta: "¿Cuándo quieres empezar?", respuesta: "Ya mismo" }]);
  });
});

describe("nombreLegible", () => {
  it("convierte claves en texto", () => {
    expect(nombreLegible("quiz_situacion_laboral")).toBe("Situación laboral");
    expect(nombreLegible("quiz_experiencia_ia")).toBe("Experiencia IA");
  });
});

describe("reglas tipo GHL", () => {
  const def = { pipeline_id: "P0", etapa_id: "E0" };
  const reglas: Regla[] = [
    { campo: "quiz_completed", operador: "igual", valor: "true", pipeline_id: "P1", etapa_id: "E1", etiqueta: "quiz-completo" },
    { campo: "quiz_completed", operador: "igual", valor: "false", etiqueta: "quiz-sin-terminar" },
    { campo: "utm_source", operador: "existe", etiqueta: "con-utm" },
    { campo: "quiz.inversion", operador: "contiene", valor: "no por", etiqueta: "sin-dinero" },
  ];
  it("aplica todas las que se cumplen; la última con pipeline manda; las etiquetas se suman", () => {
    expect(aplicarReglas(BIBLIOTECA, reglas, def)).toEqual({ pipeline_id: "P1", etapa_id: "E1", etiquetas: ["quiz-completo", "sin-dinero"] });
    expect(aplicarReglas(OPTIN, reglas, def)).toEqual({ pipeline_id: "P1", etapa_id: "E1", etiquetas: ["quiz-completo", "con-utm"] });
  });
  it("si no se cumple ninguna, quedan el pipeline y la columna por defecto", () => {
    expect(aplicarReglas({ quiz_completed: false }, reglas.slice(0, 1), def)).toEqual({ ...def, etiquetas: [] });
  });
  it("las reglas mal formadas se descartan", () => {
    expect(reglasValidas([{ campo: "x", operador: "raro" }, { campo: " ", operador: "igual" }, { campo: "a", operador: "existe" }, null])).toEqual([
      { campo: "a", operador: "existe", valor: "", pipeline_id: null, etapa_id: null, etiqueta: null },
    ]);
  });
});
