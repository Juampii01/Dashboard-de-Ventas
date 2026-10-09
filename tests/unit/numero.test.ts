import { describe, expect, it } from "vitest";
import { leerNumero } from "@/lib/numero";
import { pct } from "@/lib/formato";

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

describe("pct (porcentajes como en España)", () => {
  it.each([
    [66.7, "66,7\u00a0%"],
    [50, "50\u00a0%"],
    [0, "0\u00a0%"],
    [33.333, "33,3\u00a0%"],
    ["12.5", "12,5\u00a0%"],
  ])("%s → %s", (n, txt) => expect(pct(n)).toBe(txt));
  it("sin número, un guion", () => expect(pct(null)).toBe("—"));
});

