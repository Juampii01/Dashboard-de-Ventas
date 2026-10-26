// 1b (26 oct 2026): el país del lead por su teléfono. Números con el formato real de los leads de Maestria.
import { describe, expect, it } from "vitest";
import { conPais, paisDe } from "@/lib/pais";
import { nombrePais, SIN_PAIS } from "@/lib/formato";

describe("paisDe: el país sale del teléfono", () => {
  it.each([
    ["+34 600 11 22 33", "ES"],
    ["+5491123456789", "AR"],
    ["+52 1 55 1234 5678", "MX"],
    ["+57 300 123 4567", "CO"],
    ["+1 809 555 1234", "DO"], // el +1 se separa por el código de área
    ["+1 787 555 1234", "PR"],
    ["+1 212 555 1234", "US"],
    ["+1 416 555 1234", "CA"],
  ])("%s → %s", (tel, pais) => expect(paisDe(tel)).toBe(pais));

  it.each([["+1 555 123 4567"], ["+882 1234567"], ["600112233"], [""], [null], [undefined]])("%s → «Sin país»", (tel) => expect(paisDe(tel)).toBe(SIN_PAIS));

  it("guarda de qué teléfono salió el país", () => {
    expect(conPais("+34 600 11 22 33")).toEqual({ pais: "ES", pais_de: "+34 600 11 22 33" });
    expect(conPais(null)).toEqual({ pais: SIN_PAIS, pais_de: null });
  });
});

describe("nombrePais: en español", () => {
  it("con el código, el nombre; sin calcular o sin país, «Sin país»", () => {
    expect(nombrePais("US")).toBe("Estados Unidos");
    expect(nombrePais("DO")).toBe("República Dominicana");
    expect(nombrePais("PR")).toBe("Puerto Rico");
    expect(nombrePais("ES")).toBe("España");
    expect(nombrePais(SIN_PAIS)).toBe(SIN_PAIS);
    expect(nombrePais(null)).toBe(SIN_PAIS);
  });
});
