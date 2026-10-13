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

// ---------- De qué calendario o canal viene la cita (pedido de José, 13 oct 2026) ----------
// GHL manda `calendar.calendarName` («#1 Llamada de Descubrimiento | MaestrIA - Vende AI Services en USA») y cada
// workflow manda en Custom Data `pipeline` («0. Agendas YT»). Antes se tiraba: todas salían como «Calendario GHL».

// «#3 Closers - Maestria » → «Closers» · «#1 Llamada de Descubrimiento | MaestrIA - …» → «Llamada de Descubrimiento»
export function calendarioCorto(nombre: string | null | undefined) {
  const s = (nombre ?? "").split("|")[0].replace(/^\s*#\d+\s*/, "").replace(/\s*-\s*maestr[ií]a\s*$/i, "").trim();
  return s || null;
}

// «0. Agendas YT» → «Agendas YT»
export function canalCorto(pipeline: string | null | undefined) {
  const s = (pipeline ?? "").replace(/^\s*\d+\s*[.)-]\s*/, "").trim();
  return s || null;
}

// Lo que se ve en la cita: «GHL · Agendas YT · Llamada de Descubrimiento». Las que trajo la sincronización por API
// (sin webhook) no tienen el nombre del calendario: «GHL · sincronizada».
export function etiquetaOrigenGhl(c: { ghl_calendario?: string | null; canal?: string | null }) {
  const partes = [canalCorto(c.canal), calendarioCorto(c.ghl_calendario)].filter((x): x is string => !!x);
  const unicas = partes.filter((p, i) => partes.findIndex((q) => q.toLowerCase() === p.toLowerCase()) === i);
  return unicas.length ? `GHL · ${unicas.join(" · ")}` : "GHL · sincronizada";
}

// La base aún sin la migración 20261017100000 (columnas nuevas): PostgREST dice PGRST204, Postgres 42703
export const faltaColumna = (e: { code?: string } | null | undefined) => e?.code === "PGRST204" || e?.code === "42703";
