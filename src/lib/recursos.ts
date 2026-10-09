import type { Perfil, Recurso } from "@/lib/tipos";

// Qué recursos ve cada persona: el CEO y los directores ven todos;
// callers y closers ven los de «todo el equipo» y los de su rol.
export function recursosVisibles<T extends Pick<Recurso, "para_rol" | "tipo">>(recursos: T[], perfil: Pick<Perfil, "rol">, tipo = "") {
  const editor = perfil.rol === "ceo" || perfil.rol === "director";
  return recursos.filter((r) => (editor || r.para_rol === "todos" || r.para_rol === perfil.rol) && (!tipo || r.tipo === tipo));
}
