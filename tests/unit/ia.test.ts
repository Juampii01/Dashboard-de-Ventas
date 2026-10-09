import { describe, expect, it } from "vitest";
import { esquemaAnalisis, limpiarAnalisis, promptSistema, AGENTES } from "@/lib/ia-agentes";
import { estudioRespuestas, notaLead } from "@/lib/cualificacion";

describe("IA · agentes", () => {
  it("el formato pedido solo lleva los agentes activos; sin autocompletado no se pide", () => {
    const e = esquemaAnalisis({ psicologia: { activo: false }, autocompletado: { activo: false } }) as { properties: Record<string, { properties?: Record<string, unknown> }>; required: string[] };
    expect(Object.keys(e.properties.secciones.properties!)).toHaveLength(AGENTES.length - 2);
    expect(e.properties.secciones.properties).not.toHaveProperty("psicologia");
    expect(e.required).not.toContain("autocompletado");
    expect((esquemaAnalisis({}) as { required: string[] }).required).toContain("autocompletado");
  });
  it("el prompt usa las instrucciones personalizadas y el contexto del negocio", () => {
    const p = promptSistema({ negocio: "Maestria", contexto: "Vendemos mentorías de 1997 $", agentes: { objeciones: { instrucciones: "Céntrate en el precio" } } });
    expect(p).toContain("Vendemos mentorías de 1997 $");
    expect(p).toContain("objeciones (Objeciones): Céntrate en el precio");
    expect(p).toContain("español de España");
  });
  it("lo que devuelve Claude se revisa: nota entre 0 y 100, estados inventados fuera, estrellas 1-5", () => {
    const r = limpiarAnalisis({ resumen: "ok", puntuacion: 140, resultado: "ganado", secciones: { objeciones: "- precio", extra: "x" }, autocompletado: { estado: "cerrada", estrellas: 9, nota: "n" } }, {});
    expect(r.puntuacion).toBe(100);
    expect(r.resultado).toBeNull();
    expect(r.secciones).not.toHaveProperty("extra");
    expect(r.secciones.objeciones).toBe("- precio");
    expect(r.autocompletado).toEqual({ estado: "cerrada", estrellas: 5, nota: "n" });
    expect(limpiarAnalisis({ autocompletado: { estado: "borrar_todo", estrellas: 3, nota: "" } }, {}).autocompletado).toBeNull();
  });
});

describe("Cualificación", () => {
  const leads = [
    { id: "a", respuestas: [{ pregunta: "Inversión", respuesta: "Sí, ahora" }] },
    { id: "b", respuestas: [{ pregunta: "Inversión", respuesta: "sí, AHORA" }] },
    { id: "c", respuestas: [{ pregunta: "Inversión", respuesta: "No" }] },
  ];
  const citas = [{ lead_id: "a", estado: "cerrada" }, { lead_id: "b", estado: "perdida" }, { lead_id: "c", estado: "no_show" }];
  const ventas = [{ lead_id: "a", cash_collected: 1000, pagado: 500, devuelto: 300 }];
  it("estudio: agrupa respuestas sin mayúsculas ni acentos; cash por llamada = cash ÷ llamadas asistidas", () => {
    const f = estudioRespuestas({ leads, citas, ventas });
    const si = f.find((x) => x.respuesta === "Sí, ahora")!;
    expect(si).toMatchObject({ leads: 2, llamadas: 2, cerradas: 1, cierre: 50, cash: 1200, cashPorLlamada: 600 });
    expect(f.find((x) => x.respuesta === "No")).toMatchObject({ leads: 1, llamadas: 0, cashPorLlamada: 0 });
  });
  it("nota del lead: 50 neutro, sube con puntos buenos; sin respuestas que encajen, null", () => {
    const pesos = { Inversión: { "Sí, ahora": 10, No: -10 } };
    expect(notaLead([{ pregunta: "Inversión", respuesta: "si, ahora" }], pesos)).toBe(100);
    expect(notaLead([{ pregunta: "Inversión", respuesta: "No" }], pesos)).toBe(0);
    expect(notaLead([{ pregunta: "Otra", respuesta: "x" }], pesos)).toBeNull();
  });
});
