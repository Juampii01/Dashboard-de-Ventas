import "server-only";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { SIN_PAIS } from "@/lib/formato";

// 1b (Cristian, 26 oct 2026): el país del lead sale de su teléfono, con libphonenumber-js (separa el +1: EE. UU.,
// Canadá, República Dominicana, Puerto Rico… por el código de área). Un teléfono sin «+», vacío o con un código que
// no existe (p. ej. +1 555) = «Sin país». Se calcula al guardar y se guarda en la base (no se recalcula al enseñarlo).
export function paisDe(telefono: string | null | undefined): string {
  const t = (telefono ?? "").trim();
  if (!t.startsWith("+")) return SIN_PAIS;
  return parsePhoneNumberFromString(t)?.country ?? SIN_PAIS;
}

// Lo que se guarda junto al teléfono: el país y de qué teléfono salió (la base borra el país si no coincide con el
// teléfono que se guarda; migración 20261026120000_pais_leads.sql).
export const conPais = (telefono: string | null | undefined) => ({ pais: paisDe(telefono), pais_de: telefono ?? null });
