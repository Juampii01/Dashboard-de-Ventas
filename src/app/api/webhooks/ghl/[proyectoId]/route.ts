import { escribir } from "@/lib/datos";
import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { columnaCitasGhl, datosAgendaGhl, guardarLeads, moverAAgendadosOrganico, pipelineCitaGhl, telefonoClave, type LeadEntrada } from "@/lib/leads";
import { dentroDelLimite } from "@/lib/limite";
import { interpretar } from "@/lib/entrada";
import type { Proyecto } from "@/lib/tipos";
import { fechaDeGhl, mismoNombre } from "@/lib/formato";
import { PayloadInvalido, estadoDeError, fetchConLimite, leerCuerpo, registrar, tipoConocido, type Rastro } from "@/lib/webhook-ghl";

// Recibe eventos de los workflows de GHL (acción «Webhook»).
// Campo `tipo`: lead_nuevo | cita_agendada | cambio_etapa. Otro tipo se registra y se ignora (200).
// Códigos (auditoría 13 oct 2026): 200 procesado, repetido o ignorado · 400/422 envío inválido (no reintentar) ·
// 401 secreto · 429 límite · 500 fallo pasajero (sí reintentar). GHL reintenta: cada tipo es idempotente.
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

// Arreglo 18: se busca con filtros normales (.eq), nunca pegando el texto dentro del filtro (una coma o un
// paréntesis en el email lo rompía), y también por teléfono (últimas 9 cifras, como el resto de la app).
async function buscarLead(proyectoId: string, e: LeadEntrada) {
  const base = () => db().from("leads").select("id, pipeline_id").eq("proyecto_id", proyectoId);
  if (e.ghl_contact_id) {
    const { data } = await base().eq("ghl_contact_id", e.ghl_contact_id).limit(1).maybeSingle();
    if (data) return data;
  }
  if (e.email) {
    const { data } = await base().eq("email", e.email.toLowerCase()).limit(1).maybeSingle();
    if (data) return data;
  }
  const tel = telefonoClave(e.telefono);
  if (!e.email && tel.length >= 6) {
    const { data } = await base().eq("telefono_clave", tel).limit(1).maybeSingle();
    if (data) return data;
  }
  return null;
}

// Fase 4: con `conCita`, un lead que no existía nace ya en la columna de citas de GHL (su pipeline principal)
async function buscarOCrearLead(proyecto: Proyecto, b: Json, conCita = false, pipelineCita: string | null = null) {
  const e = aLead(b);
  if (!e.ghl_contact_id && !e.email && telefonoClave(e.telefono).length < 6) throw new PayloadInvalido("No se pudo identificar el lead: no viene email, teléfono ni contacto de GHL");
  const ya = await buscarLead(proyecto.id, e);
  if (ya) return ya;
  const destino = conCita ? await columnaCitasGhl(proyecto.id, pipelineCita) : null;
  const { data: pipe } = destino ? { data: null } : await db().from("pipelines").select("id").eq("proyecto_id", proyecto.id).eq("tipo", "normal").order("orden").limit(1).maybeSingle();
  await guardarLeads(proyecto, [e], { pipelineId: destino?.pipeline_id ?? pipe?.id ?? null, etapaId: destino?.id, origen: "ghl", perfilId: null, repartir: true });
  return buscarLead(proyecto.id, e);
}

export async function POST(request: NextRequest, ctx: RouteContext<"/api/webhooks/ghl/[proyectoId]">) {
  const inicio = Date.now();
  const { proyectoId } = await ctx.params;
  // La clave va en la cabecera x-eternity-secreto (recomendado por GHL) o, si no, en la URL
  const secreto = request.headers.get("x-eternity-secreto") ?? request.nextUrl.searchParams.get("secreto") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(proyectoId)) return NextResponse.json({ ok: false }, { status: 404 });
  // Tamaño: se corta antes de leer el cuerpo si el remitente ya dice que es enorme
  if (Number(request.headers.get("content-length") ?? 0) > 500_000) return NextResponse.json({ ok: false, error: "Demasiado grande" }, { status: 413 });
  const { data: proyecto, error: errProyecto } = await db().from("proyectos").select("*").eq("id", proyectoId).maybeSingle<Proyecto>();
  if (errProyecto) {
    registrar({ evento_id: null, proyecto_id: proyectoId, tipo: "?", resultado: "error", status: 500, ms: Date.now() - inicio, motivo: "no se pudo leer el proyecto" });
    return NextResponse.json({ ok: false, error: "Error interno: se puede reintentar" }, { status: 500 });
  }
  if (!proyecto || !secreto || !igual(secreto, proyecto.webhook_secreto)) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!(await dentroDelLimite(`webhook-fallo:${ip}`, 30, 15 * 60_000))) return NextResponse.json({ ok: false, error: "Demasiados intentos" }, { status: 429 });
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }
  // Ritmo: como mucho 300 eventos por minuto y proyecto. Se cuenta DESPUÉS del secreto: antes, cualquiera sin la
  // clave gastaba el cupo del proyecto y los envíos buenos de GHL recibían 429.
  if (!(await dentroDelLimite(`webhook:${proyectoId}`, 300, 60_000))) return NextResponse.json({ ok: false, error: "Demasiadas peticiones" }, { status: 429 });

  const texto = await request.text();
  if (texto.length > 500_000) return NextResponse.json({ ok: false, error: "Demasiado grande" }, { status: 413 });
  const leido = leerCuerpo(texto);
  if (!leido.ok) return NextResponse.json({ ok: false, error: leido.error }, { status: 400 });
  const body: Json = leido.cuerpo;
  const tipo = primero(body, ["tipo", "customData.tipo", "type"]) || "lead_nuevo";
  const { data: evento, error: errEvento } = await db().from("webhook_eventos").insert({ proyecto_id: proyecto.id, tipo, payload: body }).select("id").single();
  if (errEvento) console.error(JSON.stringify({ webhook: "ghl", proyecto_id: proyecto.id, tipo, aviso: "no se pudo guardar el evento", detalle: errEvento.message }));
  const rastro = (resultado: Rastro["resultado"], status: number, motivo?: string) =>
    registrar({ evento_id: evento?.id ?? null, proyecto_id: proyecto.id, tipo, resultado, status, ms: Date.now() - inicio, ...(motivo ? { motivo } : {}) });

  // Un tipo que la app no procesa (p. ej. un workflow nuevo en GHL) se registra y se contesta 200:
  // con un error, GHL lo reintentaría para nada.
  if (!tipoConocido(tipo)) {
    if (evento) await db().from("webhook_eventos").update({ error: `Ignorado: el tipo «${tipo.slice(0, 60)}» no se procesa` }).eq("id", evento.id);
    rastro("ignorado", 200);
    return NextResponse.json({ ok: true, ignorado: true });
  }

  try {
    let duplicado = false;
    if (tipo === "lead_nuevo") {
      const lead = aLead(body);
      if (!lead.ghl_contact_id && !lead.email && telefonoClave(lead.telefono).length < 6) throw new PayloadInvalido("No se pudo identificar el lead: no viene email, teléfono ni contacto de GHL");
      const { data: pipes } = await db().from("pipelines").select("id, nombre").eq("proyecto_id", proyecto.id).eq("tipo", "normal").order("orden");
      const pipelineNombre = primero(body, ["pipeline", "customData.pipeline"]);
      // Sin el número ni tildes: «Biblioteca Recursos» vale para «1. Biblioteca Recursos» (13 oct)
      const pipelineId = (pipelineNombre ? pipes?.find((p) => mismoNombre(p.nombre, pipelineNombre)) : null)?.id ?? pipes?.[0]?.id ?? null;
      await guardarLeads(proyecto, [lead], { pipelineId, origen: "ghl", perfilId: null, repartir: true });
    } else if (tipo === "cita_agendada") {
      // 11 oct 2026: GHL manda calendar.startTime sin zona ("2026-10-14T15:30:00", hora de calendar.selectedTimezone).
      // Se prueba cada campo por orden y vale el primero que sea una fecha; sin zona, se lee en la del calendario
      // (o la del proyecto). El texto tipo «Wednesday, October 14, 2026 9:30 PM» no vale (no trae zona).
      // La fecha se valida ANTES de crear el lead: un envío sin fecha ya no deja un lead a medias.
      const zonaCita = primero(body, ["calendar.selectedTimezone", "appointment.timezone", "timezone"]) || proyecto.zona_horaria;
      let fecha: Date | null = null;
      for (const c of ["fecha", "calendar.startTime", "appointment.start_time", "start_time", "startTime", "customData.fecha"]) {
        const v = primero(body, [c]);
        if (v && (fecha = fechaDeGhl(v, zonaCita))) break;
      }
      if (!fecha) throw new PayloadInvalido("La cita no trae fecha");
      // 13 oct: el workflow de cada calendario dice su pipeline («0. Agendas YT», «0. Agendas IG»…)
      // Si el workflow no lo dice, se pregunta a GHL en qué pipeline está su oportunidad en «Agendan» (máx. 5 s)
      const pipelineCita = primero(body, ["pipeline", "customData.pipeline"]) || (await pipelineCitaGhl(proyecto, aLead(body).ghl_contact_id, fetchConLimite(5_000)));
      const lead = await buscarOCrearLead(proyecto, body, true, pipelineCita);
      if (!lead) throw new Error("No se encontró el lead recién guardado");
      const closerEmail = primero(body, ["closer_email", "customData.closer_email", "user.email", "assigned_user.email"]).toLowerCase();
      let closerId: string | null = null;
      // Arreglo 20: el closer se busca solo entre los miembros de este proyecto
      if (closerEmail) {
        const { data: c } = await db().from("miembros_proyecto").select("perfil_id, perfiles!inner(email, rol)").eq("proyecto_id", proyecto.id).eq("perfiles.email", closerEmail).eq("perfiles.rol", "closer").limit(1).maybeSingle();
        closerId = c?.perfil_id ?? null;
      }
      // Si GHL reenvía la misma cita, se actualiza la que ya existe (no se duplica)
      const ghlCitaId = primero(body, ["calendar.appointmentId", "appointment.id", "appointment_id"]) || null;
      const buscarCita = () =>
        ghlCitaId
          ? db().from("citas").select("id, fecha").eq("proyecto_id", proyecto.id).eq("ghl_cita_id", ghlCitaId).maybeSingle()
          : // Arreglo 19: sin id de GHL, se busca una cita del mismo lead a la misma hora antes de crear otra
            db().from("citas").select("id, fecha").eq("proyecto_id", proyecto.id).eq("lead_id", lead.id).eq("fecha", fecha.toISOString()).neq("estado", "reagendada").limit(1).maybeSingle();
      let { data: yaExiste } = await escribir(buscarCita(), "citas");
      if (!yaExiste) {
        const nueva = await db().from("citas").insert({ proyecto_id: proyecto.id, lead_id: lead.id, closer_id: closerId, ...(await datosAgendaGhl(lead.id)), fecha: fecha.toISOString(), origen: "ghl", ghl_cita_id: ghlCitaId });
        // Dos reintentos a la vez: el segundo choca con el índice único → es la misma cita, no un error
        if (nueva.error?.code === "23505") yaExiste = (await escribir(buscarCita(), "citas")).data;
        else if (nueva.error) throw new Error(`No se pudo guardar en «citas»: ${nueva.error.message}`);
      }
      if (yaExiste) {
        // Reenvío de una cita que ya está: solo se actualizan la hora y el closer. NO se vuelve a poner el lead en
        // «agendado» (un reintento tardío deshacía «vendido» o lo que hubiera marcado el closer), ni se mueve de
        // columna, ni se repite la actividad.
        duplicado = true;
        await escribir(db().from("citas").update({ fecha: fecha.toISOString(), ...(closerId ? { closer_id: closerId } : {}) }).eq("id", yaExiste.id), "citas");
        if (new Date(yaExiste.fecha).getTime() !== fecha.getTime())
          await escribir(db().from("actividades").insert({ proyecto_id: proyecto.id, lead_id: lead.id, tipo: "cita", resultado: "agendada", nota: "Cita movida en el calendario de GHL" }), "actividades");
      } else {
        await escribir(db().from("leads").update({ estado_caller: "agendado", llamar_en: null, ...(closerId ? { closer_id: closerId } : {}) }).eq("id", lead.id), "leads");
        await moverAAgendadosOrganico(proyecto.id, lead.id, pipelineCita);
        await escribir(db().from("actividades").insert({ proyecto_id: proyecto.id, lead_id: lead.id, tipo: "cita", resultado: "agendada", nota: "Cita agendada en el calendario de GHL" }), "actividades");
      }
    } else {
      const etapaNombre = primero(body, ["etapa", "pipeline_stage", "pipleline_stage", "stage", "customData.etapa"]);
      const pipelineNombre = primero(body, ["pipeline_name", "pipeline", "customData.pipeline"]);
      if (!etapaNombre) throw new PayloadInvalido("No viene el nombre de la etapa");
      const lead = await buscarOCrearLead(proyecto, body);
      if (!lead) throw new Error("No se encontró el lead recién guardado");
      const { data: etapas, error: errEtapas } = await db().from("etapas").select("id, nombre, pipeline_id, pipelines!inner(proyecto_id, nombre, tipo)").eq("pipelines.proyecto_id", proyecto.id).eq("pipelines.tipo", "normal");
      if (errEtapas) throw new Error(`No se pudieron leer las columnas: ${errEtapas.message}`);
      const etapa = (etapas ?? []).find((e) => {
        const pipe = (Array.isArray(e.pipelines) ? e.pipelines[0] : e.pipelines) as { nombre: string } | null;
        return mismoNombre(e.nombre, etapaNombre) && (!pipelineNombre || mismoNombre(pipe?.nombre, pipelineNombre));
      });
      if (!etapa) throw new PayloadInvalido(`No existe la columna «${etapaNombre}» en la app`);
      const { data: actual } = await db().from("leads").select("etapa_id").eq("id", lead.id).maybeSingle();
      if (actual?.etapa_id === etapa.id) duplicado = true; // reintento: ya está en esa columna, no se repite la actividad
      else {
        await escribir(db().from("leads").update({ etapa_id: etapa.id, pipeline_id: etapa.pipeline_id }).eq("id", lead.id), "leads");
        await escribir(db().from("actividades").insert({ proyecto_id: proyecto.id, lead_id: lead.id, tipo: "cambio_etapa", nota: `GHL: movido a «${etapaNombre}»` }), "actividades");
      }
    }
    if (evento) await db().from("webhook_eventos").update({ procesado: true }).eq("id", evento.id);
    rastro(duplicado ? "duplicado" : "ok", 200);
    return NextResponse.json({ ok: true, ...(duplicado ? { duplicado: true } : {}) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    const { status, publico } = estadoDeError(e);
    if (evento) await db().from("webhook_eventos").update({ error: msg.slice(0, 300) }).eq("id", evento.id);
    rastro(status === 422 ? "invalido" : "error", status, msg.slice(0, 200));
    return NextResponse.json({ ok: false, error: publico }, { status });
  }
}
