import "server-only";
// Leads nuevos de GHL por la API (Cristian, 16-17 oct 2026: «todo por API, sin workflows»). Cada 30 s, junto a las
// citas, se leen los contactos creados en GHL y cada uno entra en la app según su etiqueta. Se leen contactos, no
// oportunidades: con el workflow apagado, GHL crea el contacto pero no la oportunidad (comprobado el 16 oct con el
// test de Cristian). Decisiones de Cristian:
// · solo los nuevos (lo de antes se trae una vez con scripts/igualar-ghl.mjs); un contacto que gana la etiqueta
//   después de creado no se ve (aceptado)
// · etiqueta → pipeline (tabla de abajo); con varias, entra en todos (su tarjeta 🔗 en cada uno); sin ninguna,
//   a «0. Agendas General»
// · siempre en la primera columna; los leads nuevos se reparten solos a los callers, como los de la Entrada
import { db } from "@/lib/datos";
import { guardarLeads, type LeadEntrada } from "@/lib/leads";
import { camposGhl, contactoGhl, contactosNuevosGhl, type ContactoNuevoGhl } from "@/lib/ghl";
import { leadDeContactoGhl } from "@/lib/ghl-lead";
import { PIPELINE_GENERAL } from "@/lib/canal";
import { mismoNombre } from "@/lib/formato";
import type { Proyecto } from "@/lib/tipos";

type Fetch = typeof fetch;
export type ResultadoLeads = { nuevos: number; actualizados: number; completados: number; avisos: string[]; errores: string[] };

// Sacado de las 1.622 etiquetas de GHL (17 oct): DFY no tiene etiqueta; el resto, a General
export const PIPELINE_ETIQUETA: { etiqueta: string; pipeline: string }[] = [
  { etiqueta: "biblioteca recursos", pipeline: "1. Biblioteca Recursos" },
  { etiqueta: "webinar1", pipeline: "2. Webinar 1" },
];
export function pipelinesDeEtiquetas(tags: string[] | undefined) {
  const t = (tags ?? []).map((x) => String(x).trim().toLowerCase());
  const p = PIPELINE_ETIQUETA.filter((r) => t.includes(r.etiqueta)).map((r) => r.pipeline);
  return p.length ? p : [PIPELINE_GENERAL];
}

const MIN = 60_000;
const MARGEN = 2 * MIN; // se relee un poco hacia atrás por si GHL tarda en indexar alguno (los ya vistos no se repiten)
const MAX_POR_LECTURA = 30; // el resto, en la siguiente (a los 30 s)
const RELEER = 10 * MIN; // las respuestas pueden llegar un poco después: se releen durante 10 min
const MAX_RELEER = 10;
const GUARDAR_VISTOS = 3 * 24 * 60 * MIN;

// Las preguntas de GHL cambian poco: se guardan 10 min en memoria
const cache = new Map<string, { hasta: number; campos: Map<string, string> }>();
async function preguntas(token: string, locationId: string, fetchImpl: Fetch | undefined, ahora: number) {
  const c = cache.get(locationId);
  if (c && c.hasta > ahora && !fetchImpl) return c.campos;
  const campos = new Map((await camposGhl({ token, locationId, fetchImpl })).map((x) => [x.id, x.name]));
  if (!fetchImpl) cache.set(locationId, { hasta: ahora + 10 * MIN, campos });
  return campos;
}

const fecha = (c: ContactoNuevoGhl) => new Date(c.dateAdded ?? 0).getTime() || 0;
type PipeApp = { id: string; nombre: string; etapas: { id: string; orden: number }[] };

export async function leerLeadsGhl(proyecto: Proyecto & { ghl_location_id: string | null }, token: string, opciones: { fetchImpl?: Fetch; ahora?: Date } = {}): Promise<ResultadoLeads> {
  const { fetchImpl } = opciones;
  const ahora = (opciones.ahora ?? new Date()).getTime();
  const r: ResultadoLeads = { nuevos: 0, actualizados: 0, completados: 0, avisos: [], errores: [] };
  const locationId = proyecto.ghl_location_id;
  // Sin la migración 20261017130000 el campo no viene: no se hace nada
  if (!locationId || !("ghl_leads_hasta" in proyecto)) return r;
  // Sin fecha de inicio: se empieza ahora (lo anterior entra con el repaso único)
  const hasta = proyecto.ghl_leads_hasta ? new Date(proyecto.ghl_leads_hasta).getTime() : ahora;

  // 1 · Contactos creados después del corte, los más viejos primero; fuera los ya vistos
  const recientes = await contactosNuevosGhl({ token, locationId, desde: new Date(hasta - MARGEN), limite: 100, fetchImpl });
  const { data: vistosFilas, error: errVistos } = recientes.length
    ? await db().from("ghl_oportunidades_vistas").select("opp_id").eq("proyecto_id", proyecto.id).in("opp_id", recientes.map((c) => c.id))
    : { data: [], error: null };
  if (errVistos) throw new Error(`No se pudo leer ghl_oportunidades_vistas: ${errVistos.message}`);
  const yaVistos = new Set((vistosFilas ?? []).map((v) => v.opp_id as string));
  const pendientes = recientes.filter((c) => !yaVistos.has(c.id)).sort((a, b) => fecha(a) - fecha(b)).slice(0, MAX_POR_LECTURA);

  const campos = await preguntas(token, locationId, fetchImpl, ahora);
  const { data: pipesFilas } = await db().from("pipelines").select("id, nombre, etapas(id, orden)").eq("proyecto_id", proyecto.id).eq("tipo", "normal");
  const pipesApp = (pipesFilas ?? []) as PipeApp[];

  // 2 · Cada contacto a los pipelines de sus etiquetas. En orden: si algo falla, se para ahí y la siguiente lectura
  // sigue desde ese contacto.
  let nuevoHasta = hasta;
  for (const c of pendientes) {
    const { lead } = leadDeContactoGhl(c.id, c, campos, { fuente: c.source ?? null, creadoEn: c.dateAdded ?? null });
    try {
      const g = await meterEnPipelines(proyecto, lead, pipelinesDeEtiquetas(c.tags), pipesApp, r);
      r.nuevos += g.nuevos;
      r.actualizados += g.actualizados;
    } catch (e) {
      r.errores.push(`Contacto ${c.id}: ${e instanceof Error ? e.message : e}`);
      break;
    }
    // `opp_id` guarda el id del contacto (la tabla se creó para oportunidades el 16 oct)
    await db().from("ghl_oportunidades_vistas").upsert({ proyecto_id: proyecto.id, opp_id: c.id, contact_id: c.id, n_respuestas: lead.respuestas.length, visto_en: new Date(ahora).toISOString() });
    nuevoHasta = Math.max(nuevoHasta, fecha(c));
  }

  // 3 · Los de los últimos 10 min se releen: si GHL tiene ya más respuestas, se completan
  const hechos = new Set(pendientes.map((c) => c.id));
  const { data: releer } = await db()
    .from("ghl_oportunidades_vistas")
    .select("opp_id, contact_id, n_respuestas")
    .eq("proyecto_id", proyecto.id)
    .gt("visto_en", new Date(ahora - RELEER).toISOString())
    .not("contact_id", "is", null)
    .order("visto_en", { ascending: false })
    .limit(MAX_RELEER + hechos.size);
  for (const v of (releer ?? []).filter((x) => !hechos.has(x.opp_id)).slice(0, MAX_RELEER)) {
    try {
      const c = await contactoGhl({ token, contactId: v.contact_id as string, fetchImpl });
      if (!c) continue;
      const { lead } = leadDeContactoGhl(v.contact_id as string, c, campos, {});
      if (lead.respuestas.length <= (v.n_respuestas ?? 0)) continue;
      await guardarLeads(proyecto, [{ ...lead, extra: undefined }], { pipelineId: null, origen: "ghl", perfilId: null, repartir: false });
      await db().from("ghl_oportunidades_vistas").update({ n_respuestas: lead.respuestas.length }).eq("proyecto_id", proyecto.id).eq("opp_id", v.opp_id);
      r.completados++;
    } catch (e) {
      r.errores.push(`Releer ${v.contact_id}: ${e instanceof Error ? e.message : e}`);
    }
  }

  if (nuevoHasta !== hasta || !proyecto.ghl_leads_hasta) await db().from("proyectos").update({ ghl_leads_hasta: new Date(nuevoHasta).toISOString() }).eq("id", proyecto.id);
  await db().from("ghl_oportunidades_vistas").delete().eq("proyecto_id", proyecto.id).lt("visto_en", new Date(ahora - GUARDAR_VISTOS).toISOString());
  return r;
}

// El primer pipeline crea el lead (con su origen, reparto y nota); los demás le dan su tarjeta 🔗 en silencio.
// Si ya estaba en la app (p. ej. lo creó su cita), solo se completan sus datos.
async function meterEnPipelines(proyecto: Proyecto, lead: LeadEntrada, nombres: string[], pipesApp: PipeApp[], r: ResultadoLeads) {
  let nuevos = 0;
  let actualizados = 0;
  let existe = await yaExiste(proyecto.id, lead);
  for (const nombre of nombres) {
    const pipe = pipesApp.find((p) => mismoNombre(p.nombre, nombre));
    if (!pipe) {
      r.avisos.push(`El pipeline «${nombre}» no existe en la app`);
      continue;
    }
    const primera = [...(pipe.etapas ?? [])].sort((a, b) => a.orden - b.orden)[0]?.id ?? null;
    const g = await guardarLeads(proyecto, [existe ? { ...lead, extra: undefined } : lead], {
      pipelineId: pipe.id,
      etapaId: primera,
      origen: "ghl",
      perfilId: null,
      repartir: true,
      notaActividad: `Entró desde GHL (API) · ${pipe.nombre}`,
    });
    nuevos += g.insertados;
    actualizados += g.actualizados;
    existe = true;
  }
  return { nuevos, actualizados };
}

async function yaExiste(proyectoId: string, l: LeadEntrada) {
  const [porGhl, porEmail] = await Promise.all([
    l.ghl_contact_id ? db().from("leads").select("id").eq("proyecto_id", proyectoId).eq("ghl_contact_id", l.ghl_contact_id).limit(1) : null,
    l.email ? db().from("leads").select("id").eq("proyecto_id", proyectoId).eq("email", l.email).limit(1) : null,
  ]);
  return !!(porGhl?.data?.length || porEmail?.data?.length);
}
