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
