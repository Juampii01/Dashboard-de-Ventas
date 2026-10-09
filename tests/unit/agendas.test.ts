import { afterEach, describe, expect, it, vi } from "vitest";
import { leerPeriodo, rangoNav } from "@/lib/periodos";
import { metricasAgendas, type CitaM, type LeadM, type VentaM } from "@/lib/metricas-agendas";

const NY = "America/New_York";

describe("periodos navegables", () => {
  afterEach(() => vi.useRealTimers());
  it("mes actual, anterior y siguiente (Nueva York)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-09T15:00:00Z"));
    const r = rangoNav("mes", 0, NY);
    expect(r.etiqueta).toBe("Este mes");
    expect(r.desde!.toISOString()).toBe("2026-10-01T04:00:00.000Z");
    expect(r.hasta!.toISOString()).toBe("2026-11-01T04:00:00.000Z");
    expect(rangoNav("mes", -1, NY).etiqueta).toBe("Septiembre 2026");
    expect(rangoNav("mes", -10, NY).etiqueta).toBe("Diciembre 2025");
  });
  it("semana empieza en lunes; día, año y personalizado", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-09T15:00:00Z")); // viernes
    expect(rangoNav("semana", 0, NY).desde!.toISOString()).toBe("2026-10-05T04:00:00.000Z");
    expect(rangoNav("semana", -1, NY).etiqueta).toBe("Semana pasada");
    expect(rangoNav("dia", -1, NY).etiqueta).toBe("Ayer");
    expect(rangoNav("anio", -1, NY).etiqueta).toBe("2025");
    const p = rangoNav("rango", 0, NY, "2026-10-02", "2026-10-04");
    expect(p.etiqueta).toBe("Del 2 oct al 4 oct");
    expect(p.hasta!.toISOString()).toBe("2026-10-05T04:00:00.000Z");
  });
  it("leerPeriodo ignora valores raros", () => {
    expect(leerPeriodo({ p: "inventado", n: "abc", desde: "2026-1-1" })).toEqual({ periodo: "mes", n: 0, desde: undefined, hasta: undefined });
    expect(leerPeriodo({ p: "anio", n: "-2" })).toMatchObject({ periodo: "anio", n: -2 });
  });
});

const R = { desde: new Date("2026-10-01T00:00:00Z"), hasta: new Date("2026-11-01T00:00:00Z") };
const cita = (id: string, estado: string, extra: Partial<CitaM> = {}): CitaM => ({ id, lead_id: `L${id}`, closer_id: "A", agendada_por: "C1", fecha: "2026-10-10T15:00:00Z", estado, estrellas_caller: null, estrellas_closer: null, ...extra });
const venta = (id: string, extra: Partial<VentaM> = {}): VentaM => ({ id, lead_id: "L1", vendedor_id: "A", producto_id: "P1", facturacion: 1997, cash_collected: 500, fecha: "2026-10-10T16:00:00Z", devuelto: null, devuelto_en: null, ...extra });

describe("métricas de agendas", () => {
  const datos = {
    citas: [
      cita("1", "cerrada", { estrellas_closer: 5, estrellas_caller: 4 }),
      cita("2", "seguimiento", { estrellas_closer: 4, estrellas_caller: 3 }),
      cita("3", "perdida", { estrellas_closer: 2 }),
      cita("4", "no_show"),
      cita("5", "cancelada"),
      cita("6", "reagendada"),
      cita("7", "pendiente"),
      cita("8", "cerrada", { closer_id: "B" }), // de otro closer
      cita("9", "cerrada", { fecha: "2026-09-20T15:00:00Z" }), // fuera del periodo
    ],
    ventas: [venta("v1"), venta("v2", { facturacion: 4997, cash_collected: 4997, producto_id: "P2", devuelto: 1000, devuelto_en: "2026-10-20T10:00:00Z" }), venta("v3", { vendedor_id: "B" })],
    pagos: [{ venta_id: "v1", importe: 300, fecha: "2026-10-25T10:00:00Z" }, { venta_id: "v1", importe: 100, fecha: "2026-11-02T10:00:00Z" }],
    leads: <LeadM[]>[
      { id: "L1", pipeline_id: "W", evento: "MC oct", seguimiento: { utm_source: "facebook" } },
      { id: "L2", pipeline_id: "W", evento: "MC oct", seguimiento: {} },
      { id: "L3", pipeline_id: "B", evento: null, seguimiento: null },
    ],
    pipelines: [{ id: "W", nombre: "Webinar 1" }, { id: "B", nombre: "Biblioteca" }],
  };

  it("embudo, tasas, dinero neto y estrellas del closer A", () => {
    const m = metricasAgendas(datos, R, { closerIds: ["A"] });
    expect(m).toMatchObject({ agendadas: 6, asistencias: 3, cerradas: 1, perdidas: 1, noShow: 1, canceladas: 1, reagendadas: 1, pendientes: 1, seguimiento: 1 });
    expect(m.pctCierre).toBe(33.3); // 1 de 3 asistencias
    expect(m.pctCallClose).toBe(16.7); // 1 de 6 agendadas
    expect(m.tasaAsistencia).toBe(75); // 3 de 3+1 no-show
    expect(m.tasaCancelacion).toBe(16.7);
    expect(m.facturacion).toBe(1997 + 4997);
    expect(m.ventas).toBe(2);
    expect(m.cash).toBe(500 + 4997 + 300 - 1000); // la cuota de noviembre no cuenta
    expect(m.devoluciones).toBe(1);
    expect(m.calificados).toBe(2);
    expect(m.con5).toBe(1);
    expect(m.mediaEstrellasCloser).toBe(3.7); // (5+4+2)/3
    expect(m.mediaEstrellasCaller).toBe(3.5); // (4+3)/2
  });
  it("comparativa: varios closers suman; filtro por producto y por evento", () => {
    expect(metricasAgendas(datos, R, { closerIds: ["A", "B"] }).cerradas).toBe(2);
    expect(metricasAgendas(datos, R, { closerIds: ["A"], productoId: "P2" }).facturacion).toBe(4997);
    const ev = metricasAgendas(datos, R, { closerIds: ["A"], evento: "MC oct" });
    expect(ev.agendadas).toBe(2); // citas de L1 y L2 (los demás leads no tienen evento)
  });
  it("agendas por fuente (pipeline y UTM)", () => {
    const m = metricasAgendas(datos, R, { closerIds: ["A"] });
    expect(m.porPipeline).toEqual([{ nombre: "Sin pipeline", n: 3 }, { nombre: "Webinar 1", n: 2 }, { nombre: "Biblioteca", n: 1 }]);
    expect(m.porUtm).toContainEqual({ nombre: "facebook", n: 1 });
  });
  it("sin datos no rompe", () => {
    const m = metricasAgendas({ citas: [], ventas: [], pagos: [], leads: [], pipelines: [] }, R, { closerIds: [] });
    expect(m).toMatchObject({ agendadas: 0, pctCierre: 0, ticketMedio: 0, mediaEstrellasCloser: null });
  });
});
