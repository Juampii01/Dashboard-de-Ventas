import "server-only";

// Bloque 6 (Cristian, 11 oct 2026): emails de la app con Resend (avisos de reportes y enlaces mágicos).
// Remitente: Eternity <no-reply@eternity.llc> (dominio verificado en Resend). La clave va en RESEND_API_KEY.
// RESEND_API_URL solo existe para los tests (un servidor local hace de Resend; nunca se manda un email real).
const REMITENTE = "Eternity <no-reply@eternity.llc>";

export type ResultadoEmail = { enviado: boolean; motivo: string };

export async function enviarEmail(o: { para: string[]; asunto: string; texto: string; html?: string }): Promise<ResultadoEmail> {
  const clave = process.env.RESEND_API_KEY;
  if (!clave) return { enviado: false, motivo: "Falta RESEND_API_KEY" };
  const para = [...new Set(o.para.map((x) => x.trim()).filter(Boolean))];
  if (!para.length) return { enviado: false, motivo: "Sin destinatarios con email" };
  try {
    const r = await fetch(`${process.env.RESEND_API_URL ?? "https://api.resend.com"}/emails`, {
      method: "POST",
      headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_REMITENTE || REMITENTE, to: para, subject: o.asunto, text: o.texto, ...(o.html ? { html: o.html } : {}) }),
      signal: AbortSignal.timeout(10000),
    });
    if (r.ok) return { enviado: true, motivo: "" };
    // Resend explica el error en el cuerpo (p. ej. dominio sin verificar); solo el mensaje, sin datos internos
    const j = (await r.json().catch(() => null)) as { message?: string } | null;
    return { enviado: false, motivo: `Resend respondió ${r.status}${j?.message ? `: ${j.message}` : ""}` };
  } catch (e) {
    return { enviado: false, motivo: e instanceof Error ? e.message : "Error de red" };
  }
}

// Dirección pública de la app (para los enlaces de los emails): APP_URL si está; si no, la de producción de
// Vercel (variable del sistema); en local, la del servidor de desarrollo.
export function urlApp() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3100";
}
