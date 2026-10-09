// Mapeo de columnas de un CSV a campos del lead.
// Se usa en el navegador (para proponer el mapeo) y en el servidor (para importar).
import type { Respuesta } from "@/lib/tipos";

export const CAMPOS = [
  { v: "respuesta", t: "Respuesta del formulario" },
  { v: "nombre", t: "Nombre" },
  { v: "apellido", t: "Apellido" },
  { v: "nombre_completo", t: "Nombre completo" },
  { v: "email", t: "Email" },
  { v: "telefono", t: "Teléfono" },
  { v: "etiquetas", t: "Etiquetas (separadas por comas)" },
  { v: "creado_en", t: "Fecha de alta" },
  { v: "ghl_contact_id", t: "Contact Id de GHL" },
  { v: "ignorar", t: "No importar" },
] as const;
export type Campo = (typeof CAMPOS)[number]["v"];
const VALIDOS = new Set<string>(CAMPOS.map((c) => c.v));

// Propuesta automática según el nombre de la columna (GHL en inglés o en español).
const ALIAS: Record<string, Campo> = {
  "contact id": "ghl_contact_id",
  "contact_id": "ghl_contact_id",
  "first name": "nombre",
  "nombre": "nombre",
  "last name": "apellido",
  "apellido": "apellido",
  "apellidos": "apellido",
  "full name": "nombre_completo",
  "name": "nombre_completo",
  "nombre completo": "nombre_completo",
  phone: "telefono",
  "teléfono": "telefono",
  telefono: "telefono",
  "móvil": "telefono",
  email: "email",
  "e-mail": "email",
  correo: "email",
  created: "creado_en",
  "date created": "creado_en",
  "fecha": "creado_en",
  "fecha de alta": "creado_en",
  tags: "etiquetas",
  etiquetas: "etiquetas",
  "business name": "ignorar",
  "last activity": "ignorar",
};

export function proponerCampo(columna: string): Campo {
  return ALIAS[columna.trim().toLowerCase()] ?? "respuesta";
}

export function mapaValido(mapa: unknown, columnas: string[]): Record<string, Campo> {
  const out: Record<string, Campo> = {};
  const m = mapa && typeof mapa === "object" ? (mapa as Record<string, unknown>) : {};
  for (const c of columnas) {
    const v = m[c];
    out[c] = typeof v === "string" && VALIDOS.has(v) ? (v as Campo) : proponerCampo(c);
  }
  return out;
}

export type LeadEntrada = {
  ghl_contact_id: string | null;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  etiquetas: string[];
  respuestas: Respuesta[];
  creado_en: string | null;
};

export function filaALead(fila: Record<string, string>, mapa?: Record<string, Campo>): LeadEntrada {
  const lead: LeadEntrada = { ghl_contact_id: null, nombre: "", apellido: "", email: null, telefono: null, etiquetas: [], respuestas: [], creado_en: null };
  for (const [col, bruto] of Object.entries(fila)) {
    if (!col.trim()) continue;
    const valor = (bruto ?? "").trim();
    const campo = mapa?.[col] ?? proponerCampo(col);
    switch (campo) {
      case "ignorar":
        break;
      case "respuesta":
        lead.respuestas.push({ pregunta: col.trim(), respuesta: valor });
        break;
      case "etiquetas":
        lead.etiquetas = valor.split(",").map((t) => t.trim()).filter(Boolean);
        break;
      case "creado_en": {
        const d = new Date(valor);
        lead.creado_en = valor && !isNaN(d.getTime()) ? d.toISOString() : null;
        break;
      }
      case "email":
        lead.email = valor ? valor.toLowerCase() : null;
        break;
      case "nombre_completo": {
        const [n, ...resto] = valor.split(/\s+/);
        lead.nombre = n ?? "";
        lead.apellido = resto.join(" ");
        break;
      }
      case "nombre":
      case "apellido":
        lead[campo] = valor;
        break;
      case "telefono":
      case "ghl_contact_id":
        lead[campo] = valor || null;
        break;
    }
  }
  return lead;
}
