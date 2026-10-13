import { describe, expect, it } from "vitest";
import { linksDe, linksValidos, MAX_LINKS } from "@/lib/links-pago";

describe("links de pago de un programa", () => {
  it("limpia: solo https, sin vacíos ni repetidos, con nombre por defecto", () => {
    expect(
      linksValidos([
        { nombre: " PIF ", url: " https://buy.stripe.com/a " },
        { nombre: "Malo", url: "http://buy.stripe.com/b" },
        { nombre: "Repetido", url: "https://buy.stripe.com/a" },
        { nombre: "", url: "https://buy.stripe.com/c" },
        { nombre: "Sin url", url: "" },
        "texto",
      ])
    ).toEqual([
      { nombre: "PIF", url: "https://buy.stripe.com/a" },
      { nombre: "Link de pago", url: "https://buy.stripe.com/c" },
    ]);
    expect(linksValidos("nada")).toEqual([]);
  });
  it("como mucho los que caben", () => {
    const muchos = Array.from({ length: 20 }, (_, i) => ({ nombre: `L${i}`, url: `https://x.com/${i}` }));
    expect(linksValidos(muchos)).toHaveLength(MAX_LINKS);
  });
  it("sin lista, el link de pago de siempre", () => {
    expect(linksDe({ links_pago: [], link_pago: "https://pago.com/1" })).toEqual([{ nombre: "Link de pago", url: "https://pago.com/1" }]);
    expect(linksDe({ links_pago: [{ nombre: "PIF", url: "https://a.com" }], link_pago: "https://pago.com/1" })).toEqual([{ nombre: "PIF", url: "https://a.com" }]);
    expect(linksDe({ link_pago: null })).toEqual([]);
  });
});
