// Leads por API (16 oct 2026): un contacto de GHL → un lead de la app. Sin base de datos (se prueba con datos reales).
// Las respuestas son los campos personalizados del contacto con el nombre de su pregunta (comprobado ese día: los de la
// Biblioteca llegan con las 6 preguntas tal cual las tiene la app). Los campos utm_* van al seguimiento, no a respuestas.
import type { LeadEntrada } from "@/lib/csv";
import type { Respuesta } from "@/lib/tipos";
import type { ContactoGhl } from "@/lib/ghl";
import { CAMPOS_SEGUIMIENTO } from "@/lib/entrada";

const texto = (v: unknown): string =>
  typeof v === "string" ? v.trim() : typeof v === "number" || typeof v === "boolean" ? String(v) : Array.isArray(v) ? v.map(texto).filter(Boolean).join(", ") : "";

export function leadDeContactoGhl(
  contactId: string,
  c: ContactoGhl,
  campos: Map<string, string>,
  o: { fuente?: string | null; creadoEn?: string | null; oportunidad?: string; pipeline?: string }
): { lead: LeadEntrada } {
  const respuestas: Respuesta[] = [];
  const seguimiento: Record<string, string> = {};
  for (const f of c.customFields ?? []) {
    const pregunta = campos.get(f.id)?.trim();
    const valor = texto(f.value);
    if (!pregunta || !valor) continue;
    const clave = pregunta.toLowerCase();
    if ((CAMPOS_SEGUIMIENTO as readonly string[]).includes(clave)) seguimiento[clave] = valor;
    else respuestas.push({ pregunta, respuesta: valor });
  }
  let nombre = (c.firstName ?? "").trim();
  let apellido = (c.lastName ?? "").trim();
  if (!nombre && c.name?.trim()) [nombre, apellido] = [c.name.trim().split(/\s+/)[0], c.name.trim().split(/\s+/).slice(1).join(" ")];
  const creado = o.creadoEn && !isNaN(new Date(o.creadoEn).getTime()) ? new Date(o.creadoEn).toISOString() : null;
  const fuente = o.fuente?.trim() || null;
  return {
    lead: {
      ghl_contact_id: contactId,
      nombre,
      apellido,
      email: c.email?.trim().toLowerCase() || null,
      telefono: c.phone?.trim() || null,
      etiquetas: (c.tags ?? []).map((t) => String(t).trim()).filter(Boolean),
      respuestas,
      creado_en: creado,
      extra: { fuente, evento: null, seguimiento, quiz_score: null, datos: { ghl_oportunidad: o.oportunidad ?? null, ghl_pipeline: o.pipeline ?? null } },
    },
  };
}
