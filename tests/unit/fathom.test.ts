import { describe, expect, it } from "vitest";
import { conciliarGrabacion, nombreDesdeTitulo, type CitaC } from "@/lib/fathom";

describe("nombreDesdeTitulo", () => {
  it("saca el nombre con el formato de la app actual", () => {
    expect(nombreDesdeTitulo("Ana López: Sesión estratégica", "{nombre cliente}: Sesión…")).toBe("Ana López");
    expect(nombreDesdeTitulo("Llamada con Pedro Ruiz (Maestría)", "Llamada con {nombre} (...)")).toBe("Pedro Ruiz");
  });
  it("sin formato, sin marca o si no encaja: null", () => {
    expect(nombreDesdeTitulo("Ana: Sesión", null)).toBeNull();
    expect(nombreDesdeTitulo("Ana: Sesión", "Sesión")).toBeNull();
    expect(nombreDesdeTitulo("Reunión interna", "{nombre cliente}: Sesión…")).toBeNull();
  });
});

const cita = (id: string, fecha: string, nombre: string, email: string | null = null): CitaC => ({ id, fecha, closer_id: "c1", lead: { nombre, email } });

describe("conciliarGrabacion", () => {
  const citas = [cita("a", "2026-10-09T15:00:00Z", "Ana López", "ana@x.test"), cita("b", "2026-10-09T15:20:00Z", "Pedro Ruiz", "pedro@x.test"), cita("c", "2026-10-12T10:00:00Z", "Luis")];
  it("1º por el email del invitado externo", () => {
    expect(conciliarGrabacion({ inicio: "2026-10-09T15:02:00Z", titulo: "x", invitados: [{ email: "PEDRO@x.test", is_external: true }] }, citas, null)).toEqual({ cita_id: "b", motivo: "Por el email del invitado" });
  });
  it("2º por el nombre del título (sin acentos)", () => {
    expect(conciliarGrabacion({ inicio: "2026-10-09T15:05:00Z", titulo: "Ana Lopez: Sesión estratégica", invitados: [] }, citas, "{nombre cliente}: Sesión…")).toMatchObject({ cita_id: "a" });
  });
  it("3º por la hora solo si hay una única cita a ±30 min; si hay dos, no elige", () => {
    expect(conciliarGrabacion({ inicio: "2026-10-12T10:10:00Z", titulo: null, invitados: [] }, citas, null)).toMatchObject({ cita_id: "c" });
    const r = conciliarGrabacion({ inicio: "2026-10-09T15:10:00Z", titulo: null, invitados: [] }, citas, null);
    expect(r.cita_id).toBeNull();
    expect(r.motivo).toMatch(/2 citas posibles/);
  });
  it("lejos de cualquier cita: no la une", () => {
    expect(conciliarGrabacion({ inicio: "2026-11-01T10:00:00Z", titulo: null, invitados: [] }, citas, null)).toEqual({ cita_id: null, motivo: "No hay ninguna cita de este closer cerca de esa hora." });
  });
});
