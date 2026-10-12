import { describe, expect, it } from "vitest";
import { destinoTrasEnlace } from "@/lib/enlace";

describe("A dónde lleva un enlace de entrar (Fase 1, 12 oct 2026)", () => {
  it("los accesos y «pide un enlace» llevan a crear la contraseña", () => {
    expect(destinoTrasEnlace("perfil")).toBe("/perfil?bienvenida=1");
  });
  it("sin destino, o con uno que no conoce, al inicio (nunca a otra web)", () => {
    for (const x of [null, undefined, "", "https://otra-web.com", "//otra-web.com", "/admin"]) expect(destinoTrasEnlace(x)).toBe("/");
  });
});
