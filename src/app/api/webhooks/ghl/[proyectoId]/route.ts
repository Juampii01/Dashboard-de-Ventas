import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardarLeads, type LeadEntrada } from "@/lib/leads";
import { dentroDelLimite } from "@/lib/limite";
import { interpretar } from "@/lib/entrada";
import type { Proyecto } from "@/lib/tipos";

// Recibe eventos de los workflows de GHL (acción «Webhook»).
// Campo `tipo`: lead_nuevo | cita_agendada | cambio_etapa.
// En GHL: acción «Custom Webhook» con Event = CUSTOM y el JSON de GUIA-GHL.md en «Raw Body».
// AVISO: el formato exacto de GHL no se ha probado todavía con datos reales
// (se probará al publicar). Por eso se guarda siempre el payload completo.

const db = () => createAdminClient();

function igual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

type Json = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
function primero(o: Json, claves: string[]) {
  for (const c of claves) {
    const partes = c.split(".");
    let v: unknown = o;
    for (const p of partes) v = v && typeof v === "object" ? (v as Json)[p] : undefined;
    const s = str(v);
    if (s) return s;
  }
  return "";
}

// Todo lo que llega se interpreta igual que en las «Entradas» (src/lib/entrada.ts): no se pierde nada.
function aLead(b: Json): LeadEntrada {
  const r = interpretar(b);
  return { ...r.lead, extra: { fuente: r.fuente, evento: r.evento, seguimiento: r.seguimiento, quiz_score: r.quiz_score, datos: r.datos } };
}

async function buscarOCrearLead(proyecto: Proyecto, b: Json) {
  const e = aLead(b);
  const filtro = e.ghl_contact_id ? `ghl_contact_id.eq.${e.ghl_contact_id}` : e.email ? `email.eq.${e.email}` : null;
  if (filtro) {
    const { data } = await db().from("leads").select("id, pipeline_id").eq("proyecto_id", proyecto.id).or(filtro).limit(1).maybeSingle();
    if (data) return data;
  }
  const { data: pipe } = await db().from("pipelines").select("id").eq("proyecto_id", proyecto.id).order("orden").limit(1).maybeSingle();
  await guardarLeads(proyecto, [e], { pipelineId: pipe?.id ?? null, origen: "ghl", perfilId: null, repartir: true });
  const { data } = await db().from("leads").select("id, pipeline_id").eq("proyecto_id", proyecto.id).or(filtro ?? "id.is.null").limit(1).maybeSingle();
  return data;
}

export async function POST(request: NextRequest, ctx: RouteContext<"/api/webhooks/ghl/[proyectoId]">) {
  const { proyectoId } = await ctx.params;
  // La clave va en la cabecera x-eternity-secreto (recomendado por GHL) o, si no, en la URL
  const secreto = request.headers.get("x-eternity-secreto") ?? request.nextUrl.searchParams.get("secreto") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(proyectoId)) return NextResponse.json({ ok: false }, { status: 404 });
  // Tamaño: se corta antes de leer el cuerpo si el remitente ya dice que es enorme
  if (Number(request.headers.get("content-length") ?? 0) > 500_000) return NextResponse.json({ ok: false, error: "Demasiado grande" }, { status: 413 });
  // Ritmo: como mucho 300 eventos por minuto y proyecto (y 30 intentos fallidos por conexión)
  if (!(await dentroDelLimite(`webhook:${proyectoId}`, 300, 60_000))) return NextResponse.json({ ok: false, error: "Demasiadas peticiones" }, { status: 429 });
  const { data: proyecto } = await db().from("proyectos").select("*").eq("id", proyectoId).maybeSingle<Proyecto>();
  if (!proyecto || !secreto || !igual(secreto, proyecto.webhook_secreto)) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!(await dentroDelLimite(`webhook-fallo:${ip}`, 30, 15 * 60_000))) return NextResponse.json({ ok: false, error: "Demasiados intentos" }, { status: 429 });
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const texto = await request.text();
  if (texto.length > 500_000) return NextResponse.json({ ok: false, error: "Demasiado grande" }, { status: 413 });
  let body: Json;
  try {
    body = JSON.parse(texto);
  } catch {
    return NextResponse.json({ ok: false, error: "JSON no válido" }, { status: 400 });
  }
  const tipo = primero(body, ["tipo", "customData.tipo", "type"]) || "lead_nuevo";
  const { data: evento } = await db().from("webhook_eventos").insert({ proyecto_id: proyecto.id, tipo, payload: body }).select("id").single();

  try {
    if (tipo === "lead_nuevo") {
      const { data: pipe } = await db().from("pipelines").select("id").eq("proyecto_id", proyecto.id).order("orden").limit(1).maybeSingle();
      const pipelineNombre = primero(body, ["pipeline", "customData.pipeline"]);
      let pipelineId = pipe?.id ?? null;
      if (pipelineNombre) {
        const { data: p } = await db().from("pipelines").select("id").eq("proyecto_id", proyecto.id).ilike("nombre", pipelineNombre).maybeSingle();
        if (p) pipelineId = p.id;
      }
      await guardarLeads(proyecto, [aLead(body)], { pipelineId, origen: "ghl", perfilId: null, repartir: true });
    } else if (tipo === "cita_agendada") {
      const lead = await buscarOCrearLead(proyecto, body);
      if (!lead) throw new Error("No se pudo identificar el lead");
      const inicio = primero(body, ["fecha", "calendar.startTime", "appointment.start_time", "start_time", "startTime", "customData.fecha"]);
      const fecha = new Date(inicio);
      if (!inicio || isNaN(fecha.getTime())) throw new Error("La cita no trae fecha");
      const closerEmail = primero(body, ["closer_email", "customData.closer_email", "user.email", "assigned_user.email"]).toLowerCase();
      let closerId: string | null = null;
      if (closerEmail) {
        const { data: c } = await db().from("perfiles").select("id").eq("email", closerEmail).eq("rol", "closer").maybeSingle();
        closerId = c?.id ?? null;
      }
      // Si GHL reenvía la misma cita, se actualiza la que ya existe (no se duplica)
      const ghlCitaId = primero(body, ["calendar.appointmentId", "appointment.id", "appointment_id"]) || null;
      const { data: yaExiste } = ghlCitaId ? await db().from("citas").select("id").eq("proyecto_id", proyecto.id).eq("ghl_cita_id", ghlCitaId).maybeSingle() : { data: null };
      if (yaExiste) await db().from("citas").update({ fecha: fecha.toISOString(), ...(closerId ? { closer_id: closerId } : {}) }).eq("id", yaExiste.id);
      else
        await db().from("citas").insert({ proyecto_id: proyecto.id, lead_id: lead.id, closer_id: closerId, fecha: fecha.toISOString(), origen: "ghl", ghl_cita_id: ghlCitaId });
      await db().from("leads").update({ estado_caller: "agendado", ...(closerId ? { closer_id: closerId } : {}) }).eq("id", lead.id);
      await db().from("actividades").insert({ proyecto_id: proyecto.id, lead_id: lead.id, tipo: "cita", resultado: "agendada", nota: "Cita agendada en el calendario de GHL" });
    } else if (tipo === "cambio_etapa") {
      const lead = await buscarOCrearLead(proyecto, body);
      if (!lead) throw new Error("No se pudo identificar el lead");
      const etapaNombre = primero(body, ["etapa", "pipeline_stage", "pipleline_stage", "stage", "customData.etapa"]);
      const pipelineNombre = primero(body, ["pipeline_name", "pipeline", "customData.pipeline"]);
      if (!etapaNombre) throw new Error("No viene el nombre de la etapa");
      let q = db().from("etapas").select("id, pipeline_id, pipelines!inner(proyecto_id, nombre)").eq("pipelines.proyecto_id", proyecto.id).ilike("nombre", etapaNombre);
      if (pipelineNombre) q = q.ilike("pipelines.nombre", pipelineNombre);
      const { data: etapa } = await q.limit(1).maybeSingle();
      if (!etapa) throw new Error(`No existe la columna «${etapaNombre}» en la app`);
      await db().from("leads").update({ etapa_id: etapa.id, pipeline_id: etapa.pipeline_id }).eq("id", lead.id);
      await db().from("actividades").insert({ proyecto_id: proyecto.id, lead_id: lead.id, tipo: "cambio_etapa", nota: `GHL: movido a «${etapaNombre}»` });
    } else {
      throw new Error(`Tipo desconocido: ${tipo}`);
    }
    if (evento) await db().from("webhook_eventos").update({ procesado: true }).eq("id", evento.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (evento) await db().from("webhook_eventos").update({ error: msg.slice(0, 300) }).eq("id", evento.id);
    return NextResponse.json({ ok: false, error: msg }, { status: 422 });
  }
}

