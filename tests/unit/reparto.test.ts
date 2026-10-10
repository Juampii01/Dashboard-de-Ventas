// Bloque A: las 4 formas de «Repartir leads»
import { describe, expect, it } from "vitest";
import { planReparto, resumenPlan } from "@/lib/reparto";

const leads = Array.from({ length: 10 }, (_, i) => `l${i}`);
const C = ["ana", "bea", "carlos"];

describe("planReparto", () => {
  it("equitativo: N leads por turnos", () => {
    const p = planReparto(leads, C, { modo: "equitativo", n: 7 });
    expect(p.size).toBe(7);
    expect(resumenPlan(p, C)).toEqual({ ana: 3, bea: 2, carlos: 2 });
    expect([...p.keys()]).toEqual(leads.slice(0, 7)); // los primeros (los más nuevos)
  });
  it("aleatorio: N leads, cada uno a un caller al azar", () => {
    const tiradas = [0.1, 0.9, 0.5, 0.95];
    let i = 0;
    const p = planReparto(leads, C, { modo: "aleatorio", n: 4 }, {}, () => tiradas[i++]);
    expect([...p.values()]).toEqual(["ana", "carlos", "bea", "carlos"]);
  });
  it("fijo por persona: N a cada uno, mientras haya leads", () => {
    expect(resumenPlan(planReparto(leads, C, { modo: "fijo", porPersona: 2 }), C)).toEqual({ ana: 2, bea: 2, carlos: 2 });
    expect(planReparto(leads, C, { modo: "fijo", porPersona: 5 }).size).toBe(10); // no hay 15
  });
  it("con tope: nadie pasa de X leads sin trabajar", () => {
    const p = planReparto(leads, C, { modo: "tope", tope: 4 }, { ana: 4, bea: 1, carlos: 3 });
    expect(resumenPlan(p, C)).toEqual({ ana: 0, bea: 3, carlos: 1 });
  });
  it("sin callers o sin leads no reparte nada", () => {
    expect(planReparto(leads, [], { modo: "equitativo", n: 3 }).size).toBe(0);
    expect(planReparto([], C, { modo: "fijo", porPersona: 3 }).size).toBe(0);
  });
});
