// Paso 0: reparto de citas y ventas en las columnas del pipeline «Closers» (Pre-call y Post-call juntos)
import { describe, expect, it } from "vitest";
import { claveNatural, partirCloser, repartirCloser } from "@/lib/llamadas";

const AHORA = new Date("2026-10-10T12:00:00Z").getTime();
const FUTURO = "2026-10-12T15:00:00Z";
const PASADO = "2026-10-08T15:00:00Z";
const etapas = [
  { id: "p", columna_cita: "pendiente" },
  { id: "c", columna_cita: "confirmada" },
  { id: "libre", columna_cita: null },
  { id: "pp", columna_cita: "pendientes" },
  { id: "res", columna_cita: "reserva" },
  { id: "ns", columna_cita: "no_show" },
];
const cita = (id: string, estado: string, fecha: string, etapa_closers_id: string | null = null) => ({ id, lead_id: `l${id}`, estado, fecha, etapa_closers_id });

describe("claveNatural", () => {
  it("Pre-call por su estado si es futura; Post-call si ya pasó; cerrada no sale", () => {
    expect(claveNatural(cita("1", "confirmada", FUTURO), AHORA)).toBe("confirmada");
    expect(claveNatural(cita("2", "confirmada", PASADO), AHORA)).toBe("pendientes");
    expect(claveNatural(cita("3", "no_show", PASADO), AHORA)).toBe("no_show");
    expect(claveNatural(cita("4", "reagendada", PASADO), AHORA)).toBe("reagendadas");
    expect(claveNatural(cita("5", "cerrada", PASADO), AHORA)).toBeNull();
  });
});

describe("repartirCloser", () => {
  it("cada cita a su columna unida; la movida a una libre se queda; sin columna, aparte; ventas por su forma de pago", () => {
    const citas = [
      cita("1", "pendiente", FUTURO),
      cita("2", "confirmada", FUTURO, "libre"), // movida a la libre
      cita("3", "confirmada", PASADO), // ya pasó → Pendientes (ya pasaron)
      cita("4", "perdida", PASADO), // no hay columna «Perdidas» → aparte
      cita("5", "pendiente", FUTURO, "c"), // apunta a una unida: no cuenta, va a la suya
    ];
    const ventas = [
      { id: "v1", lead_id: "a", tipo_pago: "reserva", pendiente: 500 },
      { id: "v2", lead_id: "b", tipo_pago: "cuotas", pendiente: 300 }, // no hay columna «Cuotas» → aparte
    ];
    const { porColumna, sinColumna } = repartirCloser(etapas, citas, ventas, AHORA, 0);
    expect(porColumna.get("p")!.citas.map((c) => c.id)).toEqual(["1", "5"]);
    expect(porColumna.get("libre")!.citas.map((c) => c.id)).toEqual(["2"]);
    expect(porColumna.get("c")!.citas).toEqual([]);
    expect(porColumna.get("pp")!.citas.map((c) => c.id)).toEqual(["3"]);
    expect(porColumna.get("res")!.ventas.map((v) => v.id)).toEqual(["v1"]);
    expect(sinColumna.citas.map((c) => c.id)).toEqual(["4"]);
    expect(sinColumna.ventas.map((v) => v.id)).toEqual(["v2"]);
  });
});

describe("partirCloser (Agendas)", () => {
  it("Pre-call hasta la primera columna de Post-call (las libres van con su lado)", () => {
    const { pre, post } = partirCloser(etapas);
    expect(pre.map((e) => e.id)).toEqual(["p", "c", "libre"]);
    expect(post.map((e) => e.id)).toEqual(["pp", "res", "ns"]);
  });
});

describe("«No califica» se ve siempre (Cristian, 13 oct 2026)", () => {
  const PASADA = "2026-10-09T16:30:00Z";
  const etapas = [{ id: "nc", columna_cita: "no_califica" }];
  it("una cita no califica ya pasada sigue en su columna (antes se escondía)", () => {
    const c = { id: "c1", lead_id: "l1", fecha: PASADA, estado: "no_califica" };
    expect(claveNatural(c, AHORA)).toBe("no_califica");
    expect(repartirCloser(etapas, [c], [], AHORA, 0).porColumna.get("nc")!.citas).toHaveLength(1);
  });
  it("una cita cerrada sigue sin columna", () => {
    expect(claveNatural({ id: "c2", lead_id: "l2", fecha: PASADA, estado: "cerrada" }, AHORA)).toBeNull();
  });
});
