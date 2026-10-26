// 1c (26 oct 2026): filtros y cifras de la pestaña «Leads» de KPIs.
import { describe, expect, it } from "vitest";
import { cifras, compararFuentes, embudo, filtrarLeads, porDia, preguntasDe, repartir, respuestasA, type FiltroLeads } from "@/lib/leads-cifras";
import { MARCA, type LeadVista } from "@/lib/leads-vista";

const lead = (x: Partial<LeadVista> & { id: string }): LeadVista => ({
  nombre: "",
  telefono: null,
  email: null,
  pais: null,
  alta: Date.parse("2026-10-20T12:00:00Z"),
  pipelineId: null,
  etapaId: null,
  tarjetas: [],
  callerId: null,
  closerId: null,
  estado: "nuevo",
  estrellas: null,
  oferta: null,
  fuente: null,
  etiquetas: [],
  respuestas: [],
  marcas: 0,
  ...x,
});
const AGENDO = MARCA.contactado | MARCA.contesta | MARCA.agendado;
const leads = [
  lead({ id: "wsp1", nombre: "Ana Pérez", telefono: "+34 600 11 22 33", pais: "ES", pipelineId: "wsp", alta: Date.parse("2026-10-26T04:00:00Z"), etiquetas: ["leads whatsapp", "grupo 2"] }),
  lead({ id: "wsp2", pais: "AR", pipelineId: "wsp", callerId: "c1", marcas: MARCA.contactado, alta: Date.parse("2026-10-26T04:00:00Z") }),
  lead({ id: "bib1", nombre: "Luis", email: "luis@x.test", pais: "ES", pipelineId: "bib", tarjetas: [{ pipelineId: "wsp", etapaId: null }], callerId: "c1", marcas: AGENDO | MARCA.asistio }),
  lead({ id: "bib2", pais: null, pipelineId: "bib", marcas: AGENDO | MARCA.asistio | MARCA.compro }),
  lead({ id: "web1", pais: "MX", pipelineId: "web", alta: Date.parse("2026-09-01T12:00:00Z") }),
];
const todo: FiltroLeads = { desde: null, hasta: null, pipelineId: null, pais: "", sinCaller: false, q: "" };
const ids = (f: Partial<FiltroLeads>) => filtrarLeads(leads, { ...todo, ...f }).map((l) => l.id);

describe("filtros", () => {
  it("por fuente: su pipeline y también sus tarjetas 🔗", () => {
    expect(ids({ pipelineId: "wsp" })).toEqual(["wsp1", "wsp2", "bib1"]);
    expect(ids({ pipelineId: "bib" })).toEqual(["bib1", "bib2"]);
  });
  it("por periodo de alta (desde incluido, hasta no)", () => {
    expect(ids({ desde: Date.parse("2026-10-26T00:00:00Z") })).toEqual(["wsp1", "wsp2"]);
    expect(ids({ hasta: Date.parse("2026-10-01T00:00:00Z") })).toEqual(["web1"]);
  });
  it("por país: «Sin país» incluye los aún sin calcular", () => {
    expect(ids({ pais: "ES" })).toEqual(["wsp1", "bib1"]);
    expect(ids({ pais: "Sin país" })).toEqual(["bib2"]);
  });
  it("sin caller y búsqueda (nombre, email, teléfono sin espacios, país y etiqueta)", () => {
    expect(ids({ sinCaller: true })).toEqual(["wsp1", "bib2", "web1"]);
    expect(ids({ q: "luis@" })).toEqual(["bib1"]);
    expect(ids({ q: "600112233" })).toEqual(["wsp1"]);
    expect(ids({ q: "méxico" })).toEqual(["web1"]);
    expect(ids({ q: "grupo 2" })).toEqual(["wsp1"]);
  });
});

describe("cifras y embudo (la misma tanda)", () => {
  it("embudo de todos", () => {
    expect(embudo(leads).map((p) => [p.t, p.n])).toEqual([["Leads", 5], ["Contactados", 3], ["Contestan", 2], ["Agendan", 2], ["Asisten", 2], ["Compran", 1]]);
  });
  it("tarjetas: total, sin caller y %", () => {
    expect(cifras(leads)).toEqual({ total: 5, sinCaller: { n: 3, pct: 60 }, contactados: { n: 3, pct: 60 }, agendados: { n: 2, pct: 40 }, compran: { n: 1, pct: 20 } });
    expect(cifras([])).toMatchObject({ total: 0, sinCaller: { n: 0, pct: null } });
  });
  it("comparar fuentes: «Todos» cuenta a cada persona una vez; cada fuente, con sus 🔗", () => {
    const filas = compararFuentes(leads, [{ id: "wsp", nombre: "Leads WhatsApp" }, { id: "bib", nombre: "Biblioteca" }]);
    expect(filas.map((f) => [f.nombre, f.pasos[0].n, f.sinCaller, f.pasos[3].n])).toEqual([["Todos", 5, 3, 2], ["Leads WhatsApp", 3, 1, 1], ["Biblioteca", 2, 1, 2]]);
  });
  it("leads por día: cada día del periodo, también los de 0, en la zona del proyecto", () => {
    const p = porDia(leads, "Europe/Madrid", Date.parse("2026-10-24T22:00:00Z"), Date.parse("2026-10-27T23:00:00Z"), Date.parse("2026-10-26T12:00:00Z"));
    expect(p).toEqual([{ dia: "25/10", valor: 0 }, { dia: "26/10", valor: 2 }]); // hasta hoy, no hasta el final del periodo
  });
  it("preguntas y respuestas de los formularios (con su nombre único; solo quien respondió)", () => {
    const conForm = [
      lead({ id: "f1", respuestas: [{ pregunta: "Inversión", respuesta: "Sí, ahora" }, { pregunta: "Perfil", respuesta: "" }] }),
      lead({ id: "f2", respuestas: [{ pregunta: "inversion", respuesta: "No por ahora" }] }),
      lead({ id: "f3", respuestas: [{ pregunta: "Inversión", respuesta: "Sí, ahora" }] }),
    ];
    const canonica = (p: string) => p.toLowerCase().replace("ó", "o");
    expect(preguntasDe(conForm, canonica)).toEqual([{ pregunta: "inversion", n: 3 }]);
    expect(respuestasA(conForm, "inversion", canonica)).toEqual({ total: 3, filas: [{ t: "Sí, ahora", n: 2, pct: 66.7 }, { t: "No por ahora", n: 1, pct: 33.3 }] });
    expect(respuestasA(conForm, "inversion", canonica, 1).filas).toEqual([{ t: "Otras", n: 3, pct: 100 }]);
  });
  it("repartir por una clave, de más a menos y el vacío al final", () => {
    expect(repartir(leads, (l) => l.pais, "Sin país")).toEqual([{ t: "ES", n: 2, pct: 40 }, { t: "AR", n: 1, pct: 20 }, { t: "MX", n: 1, pct: 20 }, { t: "Sin país", n: 1, pct: 20 }]);
  });
});
