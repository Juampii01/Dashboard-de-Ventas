import "server-only";
import { db, equipo } from "@/lib/datos";
import type { Perfil } from "@/lib/tipos";
import type { Proyecto } from "@/lib/tipos";

// Envía un aviso al webhook de entrada de GHL del proyecto.
// En GHL, un workflow con el disparador «Inbound Webhook» recibe esto
// y manda el email y el WhatsApp a los destinatarios.
export async function enviarAviso(proyecto: Proyecto, tipo: string, datos: Record<string, unknown>) {
  if (!proyecto.aviso_webhook_url) return { enviado: false, motivo: "Sin webhook de avisos configurado" };
  // Arreglo 34 (decisión de Cristian): el CEO recibe siempre los avisos, aunque no sea miembro del proyecto
  const [miembros, { data: ceos }] = await Promise.all([equipo(proyecto.id), db().from("perfiles").select("*").eq("rol", "ceo").eq("activo", true)]);
  const porId = new Map<string, Perfil>();
  for (const p of [...miembros.filter((m) => m.rol === "ceo" || m.rol === "director"), ...((ceos ?? []) as Perfil[])]) porId.set(p.id, p);
  const destinatarios = [...porId.values()].map((p) => ({ nombre: p.nombre, email: p.email, whatsapp: p.whatsapp ?? p.telefono }));
  try {
    const r = await fetch(proyecto.aviso_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, proyecto: proyecto.nombre, destinatarios, ...datos, enviado_en: new Date().toISOString() }),
      signal: AbortSignal.timeout(8000),
    });
    return { enviado: r.ok, motivo: r.ok ? "" : `GHL respondió ${r.status}` };
  } catch (e) {
    return { enviado: false, motivo: e instanceof Error ? e.message : "Error de red" };
  }
}
