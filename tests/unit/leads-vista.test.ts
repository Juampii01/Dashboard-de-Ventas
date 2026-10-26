// 1c (26 oct 2026): compactar los leads no pierde nada, y el embudo por lead sigue las reglas de KPIs.
import { describe, expect, it } from "vitest";
import { compactarLeads, descompactarLeads, marcasEmbudo, MARCA, type LeadDeLaBase } from "@/lib/leads-vista";

const ASISTIDAS = ["cerrada", "seguimiento", "perdida"];
const lead = (x: Partial<LeadDeLaBase> & { id: string }): LeadDeLaBase => ({
  nombre: "",
  apellido: null,
  email: null,
  telefono: null,
  pais: null,
  etiquetas: [],
  respuestas: [],
  pipeline_id: null,
  etapa_id: null,
  caller_id: null,
  closer_id: null,
  estado_caller: "nuevo",
  creado_en: "2026-10-26T03:59:56.000Z",
  fuente: null,
  estrellas_caller: null,
  oferta: null,
  ...x,
});

describe("compactar y descompactar", () => {
  const pipelines = [{ id: "p1", nombre: "Leads WhatsApp" }, { id: "p2", nombre: "1. Biblioteca Recursos" }];
  const etapas = [{ id: "e1", nombre: "Grupo 2", pipeline_id: "p1", color: "#0891b2" }, { id: "e2", nombre: "Nuevos", pipeline_id: "p2", color: "#64748b" }];
  const gente = [{ id: "c1", nombre: "Lucas", rol: "caller" }, { id: "k1", nombre: "Felipe", rol: "closer" }];
  const leads = [
    lead({ id: "a", nombre: "Ana", apellido: "Pérez", email: "ana@x.test", telefono: "+34 600 11 22 33", pais: "ES", etiquetas: ["leads whatsapp", "grupo 2"], pipeline_id: "p2", etapa_id: "e2", caller_id: "c1", closer_id: "k1", estado_caller: "agendado", fuente: "recursos", estrellas_caller: 4, oferta: "vip", respuestas: [{ pregunta: "¿Cuándo quieres empezar?", respuesta: "Ya mismo" }, { pregunta: "Perfil", respuesta: "" }] }),
    lead({ id: "b", etiquetas: ["leads whatsapp"], pipeline_id: "p1", etapa_id: "e1", caller_id: "fuera" }), // caller que ya no está en la lista
  ];
  const c = compactarLeads({ leads, tarjetas: [{ lead_id: "a", pipeline_id: "p1", etapa_id: "e1" }], pipelines, etapas, gente, marcas: new Map([["a", MARCA.contactado | MARCA.agendado]]) });
  const d = descompactarLeads(JSON.parse(JSON.stringify(c))); // como llega al navegador

  it("cada dato vuelve igual", () => {
    expect(d.leads[0]).toEqual({
      id: "a",
      nombre: "Ana Pérez",
      telefono: "+34 600 11 22 33",
      email: "ana@x.test",
      pais: "ES",
      alta: Date.parse("2026-10-26T03:59:56.000Z"),
      pipelineId: "p2",
      etapaId: "e2",
      tarjetas: [{ pipelineId: "p1", etapaId: "e1" }],
      callerId: "c1",
      closerId: "k1",
      estado: "agendado",
      estrellas: 4,
      oferta: "vip",
      fuente: "recursos",
      etiquetas: ["leads whatsapp", "grupo 2"],
      respuestas: [{ pregunta: "¿Cuándo quieres empezar?", respuesta: "Ya mismo" }, { pregunta: "Perfil", respuesta: "" }],
      marcas: MARCA.contactado | MARCA.agendado,
    });
    expect(d.leads[1]).toMatchObject({ nombre: "", callerId: null, tarjetas: [], marcas: 0, fuente: null });
    expect(d.pipelines).toEqual(pipelines);
    expect(d.gente).toEqual(gente);
  });

  it("los textos repetidos van una sola vez", () => {
    expect(c.textos.filter((t) => t === "leads whatsapp")).toHaveLength(1);
  });
});

describe("marcas del embudo (reglas de KPIs)", () => {
  const m = marcasEmbudo(
    [
      { lead_id: "llama-no", tipo: "llamada", resultado: "no_contesta" },
      { lead_id: "llama-si", tipo: "llamada", resultado: "contestado" },
      { lead_id: "wsp", tipo: "whatsapp", resultado: null },
      { lead_id: "nota", tipo: "nota", resultado: null },
    ],
    [
      { lead_id: "cita", estado: "cancelada" },
      { lead_id: "fue", estado: "seguimiento" },
      { lead_id: "noshow", estado: "no_show" },
    ],
    [{ lead_id: "compra" }],
    ASISTIDAS
  );
  const C = MARCA.contactado | MARCA.contesta | MARCA.agendado;
  it.each([
    ["llama-no", MARCA.contactado],
    ["llama-si", MARCA.contactado | MARCA.contesta],
    ["wsp", MARCA.contactado],
    ["nota", undefined], // una nota no es contacto
    ["cita", C], // agendar cuenta como contactado y contestado, aunque luego se cancele
    ["fue", C | MARCA.asistio],
    ["noshow", C],
    ["compra", MARCA.compro],
  ])("%s", (id, marcas) => expect(m.get(id)).toBe(marcas));
});
