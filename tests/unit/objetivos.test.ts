import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calcularAvances, vigentes, type DatosObjetivos, type FilaObjetivo } from "@/lib/objetivos";
import type { Base } from "@/lib/metricas";
import type { Perfil } from "@/lib/tipos";

const NY = "America/New_York";
const persona = (id: string, rol: Perfil["rol"]): Perfil => ({ id, nombre: id, email: `${id}@t`, rol, telefono: null, whatsapp: null, admin_activo: false, onboarding_completo: true, activo: true });
const carla = persona("carla", "caller");
const cris = persona("cris", "caller");
const ana = persona("ana", "closer");
const dani = persona("dani", "director");

// «Hoy» = miércoles 14 oct 2026, 12:00 en Nueva York
const hoyMiercoles = () => vi.setSystemTime(new Date("2026-10-14T16:00:00Z"));
beforeEach(() => {
  vi.useFakeTimers();
  hoyMiercoles();
});
afterEach(() => vi.useRealTimers());

let n = 0;
const obj = (o: Partial<FilaObjetivo> & Pick<FilaObjetivo, "cifra" | "valor">, creado = "2026-10-01T12:00:00Z"): FilaObjetivo => ({
  id: `o${++n}`,
  rol: null,
  perfil_id: null,
  periodo: "semana",
  lanzamiento_id: null,
  dias: [1, 2, 3, 4, 5],
  creado_en: creado,
  ...o,
});
const llamada = (perfil: string, lead: string, dia: string) => ({ lead_id: lead, perfil_id: perfil, tipo: "llamada", resultado: "contestado", creado_en: `2026-${dia}T15:00:00Z` });

function base(): Base {
  return {
    gente: [carla, cris, ana, dani],
    leads: [],
    actividades: [
      llamada("carla", "l1", "10-14"), // hoy
      llamada("carla", "l2", "10-14"), // hoy (lead de la masterclass)
      llamada("carla", "l3", "10-12"), // lunes de esta semana
      llamada("carla", "l4", "10-05"), // semana pasada (este mes)
      llamada("cris", "l5", "10-13"),
    ],
    citas: [
      { id: "c1", lead_id: "l1", closer_id: "ana", agendada_por: "carla", creado_en: "2026-10-12T16:00:00Z", fecha: "2026-10-13T18:00:00Z", estado: "no_show" },
      { id: "c2", lead_id: "l2", closer_id: "ana", agendada_por: "carla", creado_en: "2026-10-12T16:00:00Z", fecha: "2026-10-13T19:00:00Z", estado: "cerrada" },
      { id: "c3", lead_id: "l3", closer_id: "ana", agendada_por: "carla", creado_en: "2026-10-12T16:00:00Z", fecha: "2026-10-20T19:00:00Z", estado: "pendiente" },
    ],
    ventas: [{ id: "v1", lead_id: "l2", vendedor_id: "ana", facturacion: 1997, cash_collected: 500, fecha: "2026-10-13T20:00:00Z", producto_id: null }],
    pagos: [],
  };
}
const datos = (filas: FilaObjetivo[], extra: Partial<DatosObjetivos> = {}): DatosObjetivos => ({ filas, lanzamientos: [], leadsEvento: new Map(), ...extra });
const avances = (d: DatosObjetivos, gente = [carla, cris, ana, dani]) => calcularAvances(base(), d, gente, NY);

describe("vigentes: cada cambio es una fila nueva", () => {
  it("un periodo usa el último objetivo puesto antes de que acabe; quitarlo deja de contar", () => {
    const filas = [
      obj({ rol: "caller", cifra: "llamadas", valor: 300 }, "2026-10-01T12:00:00Z"),
      obj({ rol: "caller", cifra: "llamadas", valor: 400 }, "2026-10-14T15:00:00Z"), // miércoles de esta semana
    ];
    expect(vigentes(filas, new Date("2026-10-12T04:00:00Z"))[0].valor).toBe(300); // semana pasada: el de antes
    expect(vigentes(filas, new Date("2026-10-19T04:00:00Z"))[0].valor).toBe(400); // esta semana: el nuevo
    const quitado = [...filas, obj({ rol: "caller", cifra: "llamadas", valor: null }, "2026-10-14T15:30:00Z")];
    expect(vigentes(quitado, null)).toHaveLength(0);
  });
});

describe("calcularAvances", () => {
  it("el de la persona manda sobre el de su rol; el resto usa el del rol", () => {
    const a = avances(datos([obj({ rol: "caller", cifra: "llamadas", valor: 10 }), obj({ perfil_id: "carla", cifra: "llamadas", valor: 4 })]));
    const deCarla = a.get("carla")!;
    expect(deCarla).toHaveLength(1);
    expect(deCarla[0]).toMatchObject({ meta: 4, hecho: 2 + 1, dePersona: true, etiqueta: "Esta semana" }); // l1, l2 y l3
    expect(a.get("cris")![0]).toMatchObject({ meta: 10, hecho: 1, dePersona: false, pct: 10 });
    expect(a.get("ana")).toEqual([]); // «llamadas» no es cifra de closer
  });

  it("diario: solo los días marcados (por defecto de lunes a viernes)", () => {
    const filas = [obj({ rol: "caller", periodo: "dia", cifra: "llamadas", valor: 2 })];
    expect(avances(datos(filas)).get("carla")![0]).toMatchObject({ hecho: 2, pct: 100, etiqueta: "Hoy" });
    vi.setSystemTime(new Date("2026-10-17T16:00:00Z")); // sábado
    expect(avances(datos(filas)).get("carla")).toEqual([]);
    expect(avances(datos([obj({ rol: "caller", periodo: "dia", cifra: "llamadas", valor: 2, dias: [6] })])).get("carla")).toHaveLength(1);
  });

  it("mensual y citas atendidas del closer (registradas, viniera o no el lead)", () => {
    const a = avances(datos([obj({ rol: "caller", periodo: "mes", cifra: "llamadas", valor: 8 }), obj({ rol: "closer", cifra: "citas_atendidas", valor: 4 }), obj({ rol: "closer", cifra: "asistencias", valor: 4 })]));
    expect(a.get("carla")![0]).toMatchObject({ hecho: 4, pct: 50, etiqueta: "Este mes" });
    const deAna = a.get("ana")!;
    expect(deAna.find((x) => x.cifra === "citas_atendidas")!.hecho).toBe(2); // no-show y cerrada; la pendiente no
    expect(deAna.find((x) => x.cifra === "asistencias")!.hecho).toBe(1);
  });

  it("director: el avance es del equipo entero", () => {
    const a = avances(datos([obj({ rol: "director", cifra: "llamadas", valor: 10 }), obj({ rol: "director", cifra: "facturacion", valor: 4000 })]));
    const deDani = a.get("dani")!;
    expect(deDani.find((x) => x.cifra === "llamadas")!.hecho).toBe(4); // carla 3 + cris 1 esta semana
    expect(deDani.find((x) => x.cifra === "facturacion")!).toMatchObject({ hecho: 1997, pct: 49.9 });
  });

  it("lanzamiento: con evento solo sus leads; sin evento, todo lo de sus fechas; solo los que están en curso", () => {
    const lanzamientos = [
      { id: "m", nombre: "Masterclass", inicio: "2026-10-01", fin: "2026-10-20", evento: "Masterclass AI" },
      { id: "t", nombre: "Todo octubre", inicio: "2026-10-10", fin: "2026-10-31", evento: null },
      { id: "viejo", nombre: "Septiembre", inicio: "2026-09-01", fin: "2026-09-30", evento: null },
    ];
    const filas = ["m", "t", "viejo"].map((id) => obj({ rol: "caller", periodo: "lanzamiento", lanzamiento_id: id, cifra: "llamadas", valor: 10 }));
    const deCarla = avances(datos(filas, { lanzamientos, leadsEvento: new Map([["Masterclass AI", new Set(["l2"])]]) })).get("carla")!;
    expect(deCarla.map((x) => [x.etiqueta, x.hecho])).toEqual([
      ["Masterclass", 1], // solo l2
      ["Todo octubre", 3], // l1, l2 y l3 (la del 5 queda fuera de sus fechas)
    ]);
  });
});
