// Bloque A (Cristian, 11 oct 2026): la Oferta y las cifras de la Biblioteca tienen que dar lo mismo que su vista
// de ventas (vista-ventas.html) con las mismas 1.005 personas. Los casos van SIN datos de contacto.
import { describe, expect, it } from "vitest";
import casosJson from "../apoyo/biblioteca-1005.json";
import { calcularOferta, esDeBiblioteca, normalizarRespuestas, ofertaDe, PREGUNTAS_BIBLIOTECA, preguntaCanonica, respuestasBiblioteca, type ClavePregunta, type Oferta } from "@/lib/oferta";
import { paisDeTelefono, resumenBiblioteca } from "@/lib/biblioteca";

type Caso = Record<ClavePregunta, string> & { pais: string; etiquetas: string[]; oferta: Oferta };
const casos = (casosJson as { casos: Caso[] }).casos;
const texto = Object.fromEntries(PREGUNTAS_BIBLIOTECA.map((p) => [p.clave, p.texto])) as Record<ClavePregunta, string>;
const respuestas = (c: Caso) => (Object.keys(texto) as ClavePregunta[]).map((k) => ({ pregunta: texto[k], respuesta: c[k] }));
// Un teléfono inventado con el prefijo de su país (solo para contar países)
const PREF: Record<string, string> = { España: "+34", "EE. UU./Canadá": "+1", Argentina: "+54", Colombia: "+57", Venezuela: "+58", México: "+52", Chile: "+56", Perú: "+51", Cuba: "+53", Ecuador: "+593", Panamá: "+507", "Costa Rica": "+506", Guatemala: "+502", "El Salvador": "+503", Honduras: "+504", Nicaragua: "+505", Bolivia: "+591", Paraguay: "+595", Uruguay: "+598" };
const telefono = (c: Caso) => `${PREF[c.pais] ?? "+33"} 000000`;

describe("Oferta", () => {
  it("las 1.005 personas salen con la misma oferta que en la vista", () => {
    expect(casos).toHaveLength(1005);
    const mal = casos.filter((c) => calcularOferta({ etiquetas: c.etiquetas, respuestas: respuestas(c) }) !== c.oferta);
    expect(mal).toHaveLength(0);
  });
  it("reconoce las preguntas por cualquiera de sus nombres (CSV, landing o su campo)", () => {
    expect(preguntaCanonica("Situación")).toBe("¿En qué situación estás hoy?");
    expect(preguntaCanonica("quiz_inversion")).toBe(texto.inversion);
    expect(preguntaCanonica("Objetivo 90 días")).toBe(texto.objetivo);
    expect(preguntaCanonica("Otra pregunta")).toBe("Otra pregunta");
    const landing = [
      { pregunta: "Situación", respuesta: "Tengo un negocio" },
      { pregunta: "Experiencia ia", respuesta: "Ya automatizo cosas" },
      { pregunta: "Objetivo 90 días", respuesta: "Automatizar mi negocio" },
      { pregunta: "Tiempo semanal", respuesta: "5 a 10 h" },
      { pregunta: "Inversión", respuesta: "Sí, ahora" },
      { pregunta: "Inicio", respuesta: "Ya mismo" },
    ];
    expect(ofertaDe(respuestasBiblioteca(landing))).toBe("vip_empresas");
  });
  it("una respuesta nueva sustituye a la de la misma pregunta aunque venga con otro nombre", () => {
    const r = normalizarRespuestas([{ pregunta: "¿Cuándo quieres empezar?", respuesta: "Más adelante" }, { pregunta: "Inicio", respuesta: "Ya mismo" }]);
    expect(r).toEqual([{ pregunta: texto.inicio, respuesta: "Ya mismo" }]);
  });
  it("es de la Biblioteca por etiqueta, por fuente o por sus preguntas; si no, no tiene oferta", () => {
    expect(esDeBiblioteca({ etiquetas: ["recursos-ia"] })).toBe(true);
    expect(esDeBiblioteca({ fuente: "recursos" })).toBe(true);
    expect(calcularOferta({ etiquetas: ["webinar1"], respuestas: [] })).toBeNull();
    expect(calcularOferta({ etiquetas: ["biblioteca recursos"], respuestas: [] })).toBe("membresia");
  });
});

describe("Cifras de la Biblioteca (las mismas que la vista)", () => {
  const r = resumenBiblioteca(casos.map((c, i) => ({ id: String(i), respuestas: respuestas(c), telefono: telefono(c) })));
  const pcts = (xs: { pct: number }[]) => xs.map((x) => x.pct);
  it("resumen", () => {
    expect(r.total).toBe(1005);
    expect(r.invierteYa).toEqual({ n: 342, pct: 34 });
    expect(r.caliente).toEqual({ n: 180, pct: 17.9 });
    expect(r.buscaIngresos).toBe(47.8);
    expect(r.masDe10h).toBe(19.2);
    expect(r.sinInversion).toBe(3.5);
  });
  it("quiénes son, qué quieren, invertir y tiempo", () => {
    expect(pcts(r.situacion)).toEqual([33.1, 29.7, 17.6, 14.6, 3.9]);
    expect(pcts(r.experiencia)).toEqual([56.4, 22, 16.3, 3.9]);
    expect(pcts(r.objetivo)).toEqual([35, 31.6, 18.7, 12.7]);
    expect(pcts(r.inicio)).toEqual([50.8, 23.7, 21.5]);
    expect(pcts(r.inversion)).toEqual([34, 30.7, 31.7]);
    expect(pcts(r.tiempo)).toEqual([45.8, 32.6, 7.3, 11.9]);
  });
  it("países y escalera de ofertas", () => {
    expect(r.paises.slice(0, 8).map((p) => [p.pais, p.pct])).toEqual([["España", 18.6], ["EE. UU./Canadá", 16.1], ["Argentina", 13.3], ["Colombia", 10.6], ["Venezuela", 9.7], ["México", 7.2], ["Chile", 5.5], ["Perú", 3.9]]);
    expect(r.escalera.membresia).toEqual({ n: 627, pct: 62.4 });
    expect(r.escalera.grupal).toEqual({ n: 242, pct: 24.1 });
    expect(r.escalera.vip).toEqual({ n: 96, pct: 9.6 });
    expect(r.escalera.dfy).toEqual({ n: 65, pct: 6.5, inviertenYa: 29 });
  });
  it("país por prefijo", () => {
    expect(paisDeTelefono("+34 611 75 39 94")).toBe("España");
    expect(paisDeTelefono("+5491162192081")).toBe("Argentina");
    expect(paisDeTelefono("+50688706577")).toBe("Costa Rica");
    expect(paisDeTelefono("+33 1243 6997")).toBe("Otro");
    expect(paisDeTelefono("611 75 39 94")).toBe("Otro");
  });
});
