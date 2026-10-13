// Piezas puras del webhook de GHL (auditoría 13 oct 2026): validación del cuerpo, qué tipos se procesan,
// qué código HTTP corresponde a cada error y un registro en los logs sin datos personales.
// Sin base de datos: se prueban en tests/unit/webhook-ghl.test.ts.

export const TIPOS_GHL = ["lead_nuevo", "cita_agendada", "cambio_etapa"] as const;
export type TipoGhl = (typeof TIPOS_GHL)[number];
export const tipoConocido = (t: string): t is TipoGhl => (TIPOS_GHL as readonly string[]).includes(t);

// Error del envío (faltan datos, la columna no existe…): reintentarlo no lo arregla → 422, GHL no debe reintentar.
// Cualquier otro error (base de datos caída, tiempo agotado…) es pasajero → 500, el reintento puede funcionar.
export class PayloadInvalido extends Error {}

export function estadoDeError(e: unknown): { status: 422 | 500; publico: string } {
  if (e instanceof PayloadInvalido) return { status: 422, publico: e.message };
  return { status: 500, publico: "Error interno: se puede reintentar" };
}

// El cuerpo tiene que ser un objeto JSON (no null, ni lista, ni texto suelto)
export function leerCuerpo(texto: string): { ok: true; cuerpo: Record<string, unknown> } | { ok: false; error: string } {
  let j: unknown;
  try {
    j = JSON.parse(texto);
  } catch {
    return { ok: false, error: "JSON no válido" };
  }
  if (!j || typeof j !== "object" || Array.isArray(j)) return { ok: false, error: "El cuerpo tiene que ser un objeto JSON" };
  return { ok: true, cuerpo: j as Record<string, unknown> };
}

// Un fetch con tiempo máximo: la consulta a la API de GHL (pipeline de la cita) no puede colgar el webhook
export function fetchConLimite(ms: number, base: typeof fetch = fetch): typeof fetch {
  return (url, init) => base(url, { ...init, signal: AbortSignal.timeout(ms) });
}

// Una línea por evento en los logs de Vercel: ids, tipo y resultado. Nunca email, teléfono ni el payload.
export type Rastro = { evento_id: string | null; proyecto_id: string; tipo: string; resultado: "ok" | "duplicado" | "ignorado" | "invalido" | "error"; status: number; ms: number; motivo?: string };
export function registrar(r: Rastro) {
  const linea = JSON.stringify({ webhook: "ghl", ...r });
  if (r.resultado === "error") console.error(linea);
  else console.info(linea);
}
