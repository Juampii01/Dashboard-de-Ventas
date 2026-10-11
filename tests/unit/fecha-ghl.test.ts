// Hora de las citas de GHL (11 oct 2026, primera cita real de prueba): GHL manda calendar.startTime como
// "2026-10-14T15:30:00" — hora del reloj de calendar.selectedTimezone, SIN zona. Se leía como UTC y la cita
// quedaba 4 horas antes (15:30 UTC en vez de 19:30 UTC = 15:30 de Nueva York).
import { describe, expect, it } from "vitest";
import { fechaDeGhl } from "@/lib/formato";

describe("Fecha de una cita de GHL", () => {
  it("una hora sin zona se lee en la zona que manda GHL (caso real: 15:30 Nueva York = 19:30 UTC)", () => {
    expect(fechaDeGhl("2026-10-14T15:30:00", "America/New_York")?.toISOString()).toBe("2026-10-14T19:30:00.000Z");
  });
  it("también en Madrid y en invierno (otro desfase)", () => {
    expect(fechaDeGhl("2026-10-14T21:30:00", "Europe/Madrid")?.toISOString()).toBe("2026-10-14T19:30:00.000Z");
    expect(fechaDeGhl("2026-12-01T10:00", "America/New_York")?.toISOString()).toBe("2026-12-01T15:00:00.000Z");
  });
  it("si trae zona (Z o desfase), se respeta tal cual", () => {
    expect(fechaDeGhl("2026-10-12T15:00:00-04:00", "Europe/Madrid")?.toISOString()).toBe("2026-10-12T19:00:00.000Z");
    expect(fechaDeGhl("2026-11-02T15:00:00Z", "America/New_York")?.toISOString()).toBe("2026-11-02T15:00:00.000Z");
  });
  it("una zona que no existe usa UTC en vez de romper", () => {
    expect(fechaDeGhl("2026-10-14T15:30:00", "No/Existe")?.toISOString()).toBe("2026-10-14T15:30:00.000Z");
  });
  it("vacío o basura → null", () => {
    expect(fechaDeGhl("", "America/New_York")).toBeNull();
    expect(fechaDeGhl("mañana", "America/New_York")).toBeNull();
  });
});
