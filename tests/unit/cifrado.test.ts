// Arreglo 3 de la auditoría: token de GHL y API keys de Fathom cifrados con AES-256-GCM (CLAVE_CIFRADO).
import { afterEach, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { cifrar, descifrar } from "@/lib/cifrado";

const original = process.env.CLAVE_CIFRADO;
const usarClave = (k: string | undefined) => {
  if (k === undefined) delete process.env.CLAVE_CIFRADO;
  else process.env.CLAVE_CIFRADO = k;
};
afterEach(() => usarClave(original));

describe("Cifrado de claves", () => {
  it("ida y vuelta; el texto no aparece y cada vez sale distinto", () => {
    usarClave(randomBytes(32).toString("base64"));
    const token = "pit-1234567890abcdef-ñ";
    const a = cifrar(token);
    expect(a).toMatch(/^v1:/);
    expect(a).not.toContain("pit-");
    expect(cifrar(token)).not.toBe(a); // vector de inicio aleatorio
    expect(descifrar(a, "el token de GHL")).toBe(token);
  });
  it("un valor alterado o con otra clave maestra no se descifra", () => {
    usarClave(randomBytes(32).toString("base64"));
    const a = cifrar("secreto");
    const datos = Buffer.from(a.slice(3), "base64");
    datos[datos.length - 1] ^= 1;
    expect(() => descifrar(`v1:${datos.toString("base64")}`, "el token de GHL")).toThrow(/Hay que volver a pegar el token de GHL: no se pudo descifrar/);
    usarClave(randomBytes(32).toString("base64"));
    expect(() => descifrar(a, "el token de GHL")).toThrow(/¿ha cambiado CLAVE_CIFRADO\?/);
  });
  it("lo guardado sin cifrar se rechaza con un mensaje claro", () => {
    usarClave(randomBytes(32).toString("base64"));
    expect(() => descifrar("pit-en-claro", "la API key de Fathom")).toThrow("Hay que volver a pegar la API key de Fathom: lo guardado no está cifrado.");
  });
  it("sin CLAVE_CIFRADO, o con una de otro tamaño, avisa en vez de guardar en claro", () => {
    usarClave(undefined);
    expect(() => cifrar("x")).toThrow(/Falta la variable CLAVE_CIFRADO/);
    usarClave(randomBytes(16).toString("base64"));
    expect(() => cifrar("x")).toThrow(/32 bytes/);
    expect(() => descifrar("v1:AAAA", "el token de GHL")).toThrow(/32 bytes/);
  });
});
