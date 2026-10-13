// Piezas puras del webhook de GHL (auditoría 13 oct 2026)
import { afterEach, describe, expect, it, vi } from "vitest";
import { PayloadInvalido, estadoDeError, fetchConLimite, leerCuerpo, registrar, tipoConocido } from "@/lib/webhook-ghl";

describe("leerCuerpo", () => {
  it("acepta un objeto JSON", () => {
    expect(leerCuerpo('{"tipo":"lead_nuevo","email":"a@b.co"}')).toEqual({ ok: true, cuerpo: { tipo: "lead_nuevo", email: "a@b.co" } });
  });
  it("rechaza JSON roto, null, listas y valores sueltos", () => {
    for (const t of ["{roto", "null", "[]", '[{"email":"a@b.co"}]', '"texto"', "42", "true", ""]) expect(leerCuerpo(t).ok, t).toBe(false);
  });
});

describe("tipos", () => {
  it("solo los tres que la app procesa", () => {
    expect(["lead_nuevo", "cita_agendada", "cambio_etapa"].every(tipoConocido)).toBe(true);
    for (const t of ["venta", "cita_cancelada", "LEAD_NUEVO", ""]) expect(tipoConocido(t), t).toBe(false);
  });
});

describe("estadoDeError: 422 si reintentar no sirve, 500 si es pasajero", () => {
  it("un envío inválido es 422 y explica el motivo", () => {
    expect(estadoDeError(new PayloadInvalido("La cita no trae fecha"))).toEqual({ status: 422, publico: "La cita no trae fecha" });
  });
  it("cualquier otro error es 500 y no enseña el detalle interno", () => {
    const r = estadoDeError(new Error("No se pudo guardar en «citas»: connection refused"));
    expect(r.status).toBe(500);
    expect(r.publico).not.toMatch(/citas|connection/);
    expect(estadoDeError("raro").status).toBe(500);
  });
});

describe("fetchConLimite", () => {
  it("pasa una señal de tiempo máximo sin perder las opciones", async () => {
    const base = vi.fn(async (_u: RequestInfo | URL, init?: RequestInit) => new Response(String(init?.signal instanceof AbortSignal) + (init?.headers as Record<string, string>).Version));
    const r = await fetchConLimite(1000, base as unknown as typeof fetch)("https://x.test", { headers: { Version: "v1" } });
    expect(await r.text()).toBe("truev1");
  });
  it("corta una petición que no contesta", async () => {
    const colgada = ((_u: RequestInfo | URL, init?: RequestInit) => new Promise((_, rechazar) => init?.signal?.addEventListener("abort", () => rechazar(init.signal!.reason)))) as typeof fetch;
    await expect(fetchConLimite(20, colgada)("https://x.test")).rejects.toThrow();
  });
});

describe("registrar: logs sin datos personales", () => {
  afterEach(() => vi.restoreAllMocks());
  it("una línea JSON con id, tipo y resultado; los errores van a console.error", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    registrar({ evento_id: "ev1", proyecto_id: "p1", tipo: "cita_agendada", resultado: "duplicado", status: 200, ms: 12 });
    registrar({ evento_id: "ev2", proyecto_id: "p1", tipo: "lead_nuevo", resultado: "error", status: 500, ms: 3, motivo: "timeout" });
    expect(JSON.parse(info.mock.calls[0][0] as string)).toEqual({ webhook: "ghl", evento_id: "ev1", proyecto_id: "p1", tipo: "cita_agendada", resultado: "duplicado", status: 200, ms: 12 });
    expect(JSON.parse(error.mock.calls[0][0] as string)).toMatchObject({ evento_id: "ev2", resultado: "error", status: 500 });
  });
});

describe("origen de la cita en GHL (pedido de José, 13 oct)", async () => {
  const { calendarioCorto, canalCorto, etiquetaOrigenGhl, faltaColumna } = await import("@/lib/webhook-ghl");
  it("acorta los nombres reales de los calendarios de Maestria", () => {
    expect(calendarioCorto("#1 Llamada de Descubrimiento | MaestrIA - Vende AI Services en USA")).toBe("Llamada de Descubrimiento");
    expect(calendarioCorto("#3 Closers - Maestria ")).toBe("Closers");
    expect(calendarioCorto("#2 Callers - Maestria")).toBe("Callers");
    expect(calendarioCorto("#1 Maestria founders")).toBe("Maestria founders");
    expect(calendarioCorto("")).toBeNull();
    expect(calendarioCorto(null)).toBeNull();
  });
  it("acorta el canal (pipeline del workflow)", () => {
    expect(canalCorto("0. Agendas YT")).toBe("Agendas YT");
    expect(canalCorto("Agendas IG")).toBe("Agendas IG");
    expect(canalCorto("  ")).toBeNull();
  });
  it("arma la etiqueta que se ve en Llamadas y en el tablero", () => {
    expect(etiquetaOrigenGhl({ canal: "0. Agendas YT", ghl_calendario: "#1 Llamada de Descubrimiento | MaestrIA - Vende AI Services en USA" })).toBe("GHL · Agendas YT · Llamada de Descubrimiento");
    expect(etiquetaOrigenGhl({ ghl_calendario: "#3 Closers - Maestria " })).toBe("GHL · Closers");
    expect(etiquetaOrigenGhl({ canal: "Closers", ghl_calendario: "#3 Closers - Maestria" })).toBe("GHL · Closers"); // sin repetir
    expect(etiquetaOrigenGhl({})).toBe("GHL · sincronizada");
  });
  it("reconoce el error de columna que falta (base sin la migración)", () => {
    expect(faltaColumna({ code: "PGRST204" })).toBe(true);
    expect(faltaColumna({ code: "42703" })).toBe(true);
    expect(faltaColumna({ code: "23505" })).toBe(false);
    expect(faltaColumna(null)).toBe(false);
  });
});
