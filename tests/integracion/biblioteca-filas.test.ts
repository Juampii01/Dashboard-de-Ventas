// Velocidad (17 oct 2026): el resumen de KPIs → Biblioteca calculado con la función de la base (biblioteca_filas)
// sale idéntico al de siempre (todos los leads, contados en la app).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { borrarEscenario, crearEscenario, db, type Escenario } from "../apoyo/escenario";
import { filasDeGrupos, resumenBiblioteca, resumenDeFilas, type GrupoBiblioteca } from "@/lib/biblioteca";
import type { Oferta } from "@/lib/oferta";

let e: Escenario;
const P = (pregunta: string, respuesta: string) => ({ pregunta, respuesta });

beforeAll(async () => {
  e = await crearEscenario();
  const base = { proyecto_id: e.proyecto.id, pipeline_id: e.pipeline.id, etapa_id: e.etapas.Nuevos };
  const leads = [
    // Texto del CSV, con acentos y signos
    { nombre: "A", telefono: "+34 600 000 001", respuestas: [P("¿En qué situación estás hoy?", "Tengo un negocio"), P("Si encuentras el programa correcto, ¿estás en condiciones de invertir en tu formación?", "Sí, ahora"), P("¿Cuándo quieres empezar?", "Ya mismo"), P("¿Qué quieres lograr en los próximos 90 días?", "Automatizar mi negocio")] },
    // Nombres alternativos de la landing, en mayúsculas y con espacios
    { nombre: "B", telefono: "+593 99 111 2222", respuestas: [P("SITUACIÓN", " Empleado "), P("quiz_inversion", "No por ahora"), P("Tiempo  Semanal", "10 a 20 h"), P("Objetivo 90 días", "Llegar a $5,000 al mes")] },
    // Respuesta vacía y la misma pregunta dos veces (vale la última no vacía)
    { nombre: "C", telefono: "+1 305 555 0000", respuestas: [P("inicio", "Más adelante"), P("¿Cuándo quieres empezar?", "Este mes"), P("inversión", ""), P("experiencia con ia", "Ya automatizo cosas")] },
    // Sin «+» en el teléfono (país «Otro») y solo una pregunta
    { nombre: "D", telefono: "600000002", respuestas: [P("quiz_experiencia_ia", "Ninguna, empiezo de cero")] },
    // Entra por la etiqueta, sin preguntas
    { nombre: "E", telefono: "+52 55 0000 0000", etiquetas: ["Biblioteca Recursos"], respuestas: [P("Otra pregunta", "x")] },
    // Entra por la fuente
    { nombre: "F", telefono: null, fuente: "Recursos", respuestas: [] },
    // No es de la Biblioteca
    { nombre: "G", telefono: "+34 611 111 111", respuestas: [P("¿Color favorito?", "azul")] },
    // Oferta ya guardada distinta de la que saldría por sus respuestas (se respeta la guardada)
    { nombre: "H", telefono: "+57 300 000 0000", oferta: "grupal", respuestas: [P("situacion", "Freelance / Self-employed"), P("quiz_inicio", "Ya mismo")] },
  ];
  const { error } = await db.from("leads").insert(leads.map((l, i) => ({ ...base, email: `${e.pref}-bib${i}@x.test`, etiquetas: [], ...l })));
  if (error) throw new Error(error.message);
});
afterAll(async () => {
  if (e) await borrarEscenario(e);
});

describe("biblioteca_filas", () => {
  it("el resumen sale idéntico al de siempre", async () => {
    const { data: todos } = await db.from("leads").select("id, telefono, etiquetas, respuestas, fuente, oferta").eq("proyecto_id", e.proyecto.id);
    const { esDeBiblioteca } = await import("@/lib/oferta");
    const deBiblioteca = (todos ?? []).filter((l) => esDeBiblioteca(l));
    const antes = resumenBiblioteca(deBiblioteca.map((l) => ({ id: l.id, respuestas: l.respuestas, telefono: l.telefono, oferta: l.oferta as Oferta | null })));

    const { data, error } = await db.rpc("biblioteca_filas", { p_proyecto: e.proyecto.id });
    expect(error).toBeNull();
    const ahora = resumenDeFilas(filasDeGrupos(data as GrupoBiblioteca[]));

    expect(antes.total).toBe(7); // A, B, C, D, E, F, H (G no es de la Biblioteca)
    expect(ahora).toEqual(antes);
  });
});
