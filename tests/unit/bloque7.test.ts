// 1.0 Bloque 7 (Cristian, 10 y 11 oct 2026): preguntas del reporte editables y cola del caller sin prioridad.
import { describe, expect, it } from "vitest";
import { PREGUNTAS, preguntasDe, preguntasValidas } from "@/lib/reportes";
import { colaCaller } from "@/lib/cola";

describe("Preguntas del reporte", () => {
  it("del closer, las 3 de las tasas se pueden renombrar pero no quitar ni pasar a texto", () => {
    const sinVentas = PREGUNTAS.closer.filter((p) => p.clave !== "ventas");
    expect(preguntasValidas("closer", sinVentas)).toEqual({ error: "«Ventas cerradas» no se puede quitar: se usa para las tasas del closer." });
    const comoTexto = PREGUNTAS.closer.map((p) => (p.clave === "llamadas_agendadas" ? { ...p, tipo: "texto" } : p));
    expect(preguntasValidas("closer", comoTexto)).toMatchObject({ error: expect.stringMatching(/tiene que ser un número/) });
    const renombrada = PREGUNTAS.closer.map((p) => (p.clave === "ventas" ? { ...p, texto: "Cierres del día" } : p));
    expect(preguntasValidas("closer", renombrada)).toMatchObject({ ok: expect.arrayContaining([expect.objectContaining({ clave: "ventas", texto: "Cierres del día" })]) });
  });
  it("del caller ninguna es fija; texto obligatorio, sin repetir, número o texto", () => {
    expect(preguntasValidas("caller", [{ clave: "nueva", texto: "¿Cuántas demos?", tipo: "numero" }])).toEqual({ ok: [{ clave: "nueva", texto: "¿Cuántas demos?", tipo: "numero" }] });
    expect(preguntasValidas("caller", [])).toMatchObject({ error: expect.stringMatching(/al menos una/) });
    expect(preguntasValidas("caller", [{ clave: "a", texto: " ", tipo: "numero" }])).toMatchObject({ error: expect.stringMatching(/necesita un texto/) });
    expect(preguntasValidas("caller", [{ clave: "a", texto: "x", tipo: "numero" }, { clave: "a", texto: "y", tipo: "texto" }])).toMatchObject({ error: expect.stringMatching(/dos preguntas iguales/) });
    expect(preguntasValidas("caller", [{ clave: "a", texto: "x", tipo: "fecha" }])).toMatchObject({ error: expect.stringMatching(/número o un texto/) });
    expect(preguntasValidas("caller", [{ clave: "A B", texto: "x", tipo: "numero" }])).toMatchObject({ error: expect.stringMatching(/no es válida/) });
  });
  it("sin preguntas propias (o mal guardadas), las de siempre", () => {
    expect(preguntasDe(null, "caller")).toBe(PREGUNTAS.caller);
    expect(preguntasDe({ closer: [{ clave: "x", texto: "x", tipo: "numero" }] }, "closer")).toBe(PREGUNTAS.closer); // le faltan las fijas
    expect(preguntasDe({ caller: [{ clave: "x", texto: "Hola", tipo: "texto" }] }, "caller")).toEqual([{ clave: "x", texto: "Hola", tipo: "texto" }]);
  });
});

describe("Cola del caller sin prioridad", () => {
  const ahora = Date.parse("2026-10-11T12:00:00Z");
  const lead = (id: string, estado: string, creado: string, inversion: string, llamar_en: string | null = null) => ({ id, estado_caller: estado, llamar_en, creado_en: creado, respuestas: [{ pregunta: "¿Puedes invertir?", respuesta: inversion }] }) as never;
  it("los grupos se quedan; dentro, del más nuevo al más viejo aunque el viejo tenga más prioridad", () => {
    const leads = [
      lead("nuevo-viejo-A", "nuevo", "2026-10-01", "Sí"),
      lead("nuevo-reciente-C", "nuevo", "2026-10-10", "No"),
      lead("no-contesta-reciente", "no_contesta", "2026-10-11", "Sí"),
      lead("luego-ya-toca", "llamar_luego", "2026-09-01", "No", "2026-10-11T10:00:00Z"),
    ];
    expect(colaCaller(leads, "llamar", ahora).map((l: { id: string }) => l.id)).toEqual(["luego-ya-toca", "nuevo-reciente-C", "nuevo-viejo-A", "no-contesta-reciente"]);
    // La prioridad se sigue calculando (para enseñarla)
    const [, , viejoA] = colaCaller(leads, "llamar", ahora) as { id: string; puntos: number }[];
    expect(viejoA.puntos).toBeGreaterThan(0);
  });
});
