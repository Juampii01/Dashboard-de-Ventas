import { describe, expect, it } from "vitest";
import { reordenar } from "@/lib/orden";

describe("reordenar al arrastrar", () => {
  const l = ["a", "b", "c", "d"];
  it("hacia la derecha ocupa el sitio del destino", () => {
    expect(reordenar(l, "a", "c")).toEqual(["b", "c", "a", "d"]);
  });
  it("hacia la izquierda ocupa el sitio del destino", () => {
    expect(reordenar(l, "d", "b")).toEqual(["a", "d", "b", "c"]);
  });
  it("a la última posición", () => {
    expect(reordenar(l, "b", "d")).toEqual(["a", "c", "d", "b"]);
  });
  it("sobre sí mismo o con algo que no está, la deja igual y no toca la original", () => {
    expect(reordenar(l, "b", "b")).toEqual(l);
    expect(reordenar(l, "x", "b")).toEqual(l);
    expect(reordenar(l, "a", "c")).not.toBe(l);
    expect(l).toEqual(["a", "b", "c", "d"]);
  });
});
