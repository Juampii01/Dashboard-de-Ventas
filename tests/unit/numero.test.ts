import { describe, expect, it } from "vitest";
import { leerNumero } from "@/lib/numero";

describe("leerNumero (como en España)", () => {
  it.each([
    ["4.600", 4600],
    ["1.997,50", 1997.5],
    ["1.250.000", 1250000],
    ["4600", 4600],
    ["1997.5", 1997.5],
    ["12,5", 12.5],
    ["0.92", 0.92],
    ["0,92", 0.92],
    ["1,997.50", 1997.5],
    [" 4 600 € ", 4600],
    ["$1.997", 1997],
    ["-15,99", -15.99],
    ["-1.000", -1000],
    ["300", 300],
  ])("«%s» = %d", (txt, n) => expect(leerNumero(txt)).toBe(n));
  it.each(["", "abc", "1,2,3", "4.600,5,1", "12a"])("«%s» no es un número", (txt) => expect(leerNumero(txt)).toBeNaN());
});
