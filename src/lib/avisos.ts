import "server-only";
import { db, equipo } from "@/lib/datos";
import { enviarEmail } from "@/lib/email";
import type { Perfil } from "@/lib/tipos";
import type { Proyecto } from "@/lib/tipos";

// Envía un aviso a los jefes (CEO y directores) por dos caminos:
// · al webhook de entrada de GHL del proyecto (un workflow «Inbound Webhook» manda el WhatsApp, y el email si se quiere);
// · por email con Resend (bloque 6, 11 oct 2026), si hay RESEND_API_KEY.
// Se da por enviado si llega por cualquiera de los dos.
// `html` (opcional) es la versión con diseño del email; a GHL solo van los datos.
export async function enviarAviso(proyecto: Proyecto, tipo: string, datos: Record<string, unknown>, html?: string) {
  // Arreglo 34 (decisión de Cristian): el CEO recibe siempre los avisos, aunque no sea miembro del proyecto
  const [miembros, { data: ceos }] = await Promise.all([equipo(proyecto.id), db().from("perfiles").select("*").eq("rol", "ceo").eq("activo", true)]);
  const porId = new Map<string, Perfil>();
  for (const p of [...miembros.filter((m) => m.rol === "ceo" || m.rol === "director"), ...((ceos ?? []) as Perfil[])]) porId.set(p.id, p);
  const destinatarios = [...porId.values()].map((p) => ({ nombre: p.nombre, email: p.email, whatsapp: p.whatsapp ?? p.telefono }));

  const [ghl, email] = await Promise.all([
    avisoGhl(proyecto, { tipo, proyecto: proyecto.nombre, destinatarios, ...datos, enviado_en: new Date().toISOString() }),
    process.env.RESEND_API_KEY
      ? enviarEmail({
          para: destinatarios.map((d) => d.email),
          asunto: typeof datos.asunto === "string" ? datos.asunto : `${proyecto.nombre} · ${tipo === "reporte_fin_de_dia" ? `Reporte de ${String(datos.persona ?? "")}` : tipo}`,
          texto: typeof datos.texto === "string" ? datos.texto : JSON.stringify(datos, null, 2),
          ...(html ? { html } : {}),
        })
      : Promise.resolve({ enviado: false, motivo: "" }),
  ]);
  const motivos = [ghl.motivo, email.motivo].filter(Boolean).join(" · ");
  return { enviado: ghl.enviado || email.enviado, motivo: motivos || "Sin webhook de avisos ni Resend configurados" };
}

async function avisoGhl(proyecto: Proyecto, cuerpo: Record<string, unknown>) {
  if (!proyecto.aviso_webhook_url) return { enviado: false, motivo: "" };
  try {
    const r = await fetch(proyecto.aviso_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(8000),
    });
    return { enviado: r.ok, motivo: r.ok ? "" : `GHL respondió ${r.status}` };
  } catch (e) {
    return { enviado: false, motivo: e instanceof Error ? e.message : "Error de red" };
  }
}
