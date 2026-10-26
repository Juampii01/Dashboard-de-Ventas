// 1c (26 oct 2026): filtros y cifras de la pestaña «Leads» de KPIs.
import { describe, expect, it } from "vitest";
import { cifras, compararFuentes, embudo, filtrarLeads, repartir, type FiltroLeads } from "@/lib/leads-cifras";
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
  it("repartir por una clave, de más a menos y el vacío al final", () => {
    expect(repartir(leads, (l) => l.pais, "Sin país")).toEqual([{ t: "ES", n: 2, pct: 40 }, { t: "AR", n: 1, pct: 20 }, { t: "MX", n: 1, pct: 20 }, { t: "Sin país", n: 1, pct: 20 }]);
  });
});
