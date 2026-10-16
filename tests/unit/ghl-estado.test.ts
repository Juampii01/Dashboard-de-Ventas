// 16 oct (Cristian): el «confirmed» de GHL (lo lleva toda reserva del widget) no pisa «Confirmación pendiente».
import { describe, expect, it } from "vitest";
import { nuevoEstado } from "@/lib/ghl";

describe("nuevoEstado con «Confirmación pendiente»", () => {
  it("GHL «confirmed» no la cambia; una cancelación o un no show de GHL sí", () => {
    expect(nuevoEstado("confirmacion_pendiente", "confirmada")).toBe("confirmacion_pendiente");
    expect(nuevoEstado("confirmacion_pendiente", "cancelada")).toBe("cancelada");
    expect(nuevoEstado("confirmacion_pendiente", "no_show")).toBe("no_show");
    expect(nuevoEstado("pendiente", "confirmada")).toBe("confirmada");
  });
});
