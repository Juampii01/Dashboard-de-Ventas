import "server-only";
// Leads nuevos de GHL por la API (Cristian, 16 oct 2026: «todo por API, sin workflows»). Cada 30 s, junto a las
// citas, se leen las oportunidades nuevas de GHL y cada una entra en el pipeline de la app con el mismo nombre,
// en la columna del mismo nombre (si no existe, la primera). Decisiones de Cristian (16 oct):
// · solo las nuevas (lo de antes se trae una vez con scripts/igualar-ghl.mjs)
// · los pipelines «0. Agendas …» no: allí GHL crea una oportunidad por cita, y las citas ya las lee la app
// · un pipeline de GHL que no existe en la app se salta y queda en el aviso
// · los leads nuevos se reparten solos a los callers, como los de la Entrada
import { db } from "@/lib/datos";
import { guardarLeads, type LeadEntrada } from "@/lib/leads";
import { camposGhl, contactoGhl, oportunidadesGhl, pipelinesGhl, type ContactoGhl, type OportunidadLeida, type PipelineGhl } from "@/lib/ghl";
import { leadDeContactoGhl } from "@/lib/ghl-lead";
import { mismoNombre } from "@/lib/formato";
import type { Proyecto } from "@/lib/tipos";

type Fetch = typeof fetch;
export type ResultadoLeads = { activado?: boolean; nuevos: number; actualizados: number; completados: number; saltadas: number; avisos: string[]; errores: string[] };

const MIN = 60_000;
const MARGEN = 2 * MIN; // se relee un poco hacia atrás por si GHL entrega alguna fuera de orden (las ya vistas no se repiten)
const MAX_PAGINAS = 5; // 500 oportunidades por lectura como mucho
const MAX_POR_LECTURA = 30; // el resto, en la siguiente (a los 30 s)
const RELEER = 10 * MIN; // las respuestas pueden llegar un poco después: se releen durante 10 min
const MAX_RELEER = 10;
const GUARDAR_VISTAS = 3 * 24 * 60 * MIN;
const AGENDAS = /^0\.\s*agendas\b/i;

// Pipelines y preguntas de GHL cambian poco: se guardan 10 min en memoria
const cache = new Map<string, { hasta: number; pipelines: PipelineGhl[]; campos: Map<string, string> }>();
async function datosFijos(token: string, locationId: string, fetchImpl: Fetch | undefined, ahora: number) {
  const c = cache.get(locationId);
  if (c && c.hasta > ahora && !fetchImpl) return c;
  const [pipelines, campos] = await Promise.all([pipelinesGhl({ token, locationId, fetchImpl }), camposGhl({ token, locationId, fetchImpl })]);
  const nuevo = { hasta: ahora + 10 * MIN, pipelines, campos: new Map(campos.map((x) => [x.id, x.name])) };
  if (!fetchImpl) cache.set(locationId, nuevo);
  return nuevo;
}

const fecha = (o: OportunidadLeida) => new Date(o.createdAt ?? 0).getTime() || 0;

export async function leerLeadsGhl(proyecto: Proyecto & { ghl_location_id: string | null }, token: string, opciones: { fetchImpl?: Fetch; ahora?: Date } = {}): Promise<ResultadoLeads> {
  const { fetchImpl } = opciones;
  const ahora = (opciones.ahora ?? new Date()).getTime();
  const r: ResultadoLeads = { nuevos: 0, actualizados: 0, completados: 0, saltadas: 0, avisos: [], errores: [] };
  const locationId = proyecto.ghl_location_id;
  // Sin la migración 20261017130000 el campo no viene: no se hace nada
  if (!locationId || !("ghl_leads_hasta" in proyecto)) return r;

  // Primera vez: solo se marca desde dónde (lo anterior entra con el repaso único). Las de ese momento quedan como
  // vistas: si no, el margen de 2 min de la lectura siguiente las metería.
  if (!proyecto.ghl_leads_hasta) {
    const { ops } = await oportunidadesGhl({ token, locationId, limite: 20, fetchImpl });
    const desde = ops[0]?.createdAt && fecha(ops[0]) ? new Date(fecha(ops[0])).toISOString() : new Date(ahora).toISOString();
    const vistas = ops.filter((o) => o.id).map((o) => ({ proyecto_id: proyecto.id, opp_id: o.id, contact_id: null, n_respuestas: 0, visto_en: new Date(ahora).toISOString() }));
    if (vistas.length) {
      const { error } = await db().from("ghl_oportunidades_vistas").upsert(vistas);
      if (error) throw new Error(`No se pudo guardar ghl_oportunidades_vistas: ${error.message}`);
    }
    await db().from("proyectos").update({ ghl_leads_hasta: desde }).eq("id", proyecto.id);
    return { ...r, activado: true };
  }
  const hasta = new Date(proyecto.ghl_leads_hasta).getTime();
  const corte = hasta - MARGEN;

  // 1 · Las oportunidades creadas después del corte (las más nuevas primero, página a página)
  const recientes: OportunidadLeida[] = [];
  let despuesDe: { startAfter: number; startAfterId: string } | null = null;
  for (let pag = 0; pag < MAX_PAGINAS; pag++) {
    const { ops, siguiente } = await oportunidadesGhl({ token, locationId, limite: 100, despuesDe, fetchImpl });
    recientes.push(...ops.filter((o) => o.id && fecha(o) > corte));
    if (!ops.length || fecha(ops[ops.length - 1]) <= corte || !siguiente) break;
    despuesDe = siguiente;
  }

  // 2 · Fuera las ya vistas
  const { data: vistasFilas, error: errVistas } = recientes.length
    ? await db().from("ghl_oportunidades_vistas").select("opp_id").eq("proyecto_id", proyecto.id).in("opp_id", recientes.map((o) => o.id))
    : { data: [], error: null };
  if (errVistas) throw new Error(`No se pudo leer ghl_oportunidades_vistas: ${errVistas.message}`);
  const yaVistas = new Set((vistasFilas ?? []).map((v) => v.opp_id as string));
  const pendientes = recientes.filter((o) => !yaVistas.has(o.id)).sort((a, b) => fecha(a) - fecha(b)).slice(0, MAX_POR_LECTURA);

  const { pipelines, campos } = await datosFijos(token, locationId, fetchImpl, ahora);
  const { data: pipesApp } = await db().from("pipelines").select("id, nombre, etapas(id, nombre, orden)").eq("proyecto_id", proyecto.id).eq("tipo", "normal");

  // 3 · Cada una a su pipeline. Se va en orden (de la más vieja a la más nueva): si GHL falla, se para ahí y la
  // siguiente lectura sigue desde esa.
  let nuevoHasta = hasta;
  const contactos = new Map<string, ContactoGhl | null>();
  for (const op of pendientes) {
    const pGhl = pipelines.find((p) => p.id === op.pipelineId);
    const marcar = (n = 0) => db().from("ghl_oportunidades_vistas").upsert({ proyecto_id: proyecto.id, opp_id: op.id, contact_id: op.contactId ?? null, n_respuestas: n, visto_en: new Date(ahora).toISOString() });
    const avanzar = () => (nuevoHasta = Math.max(nuevoHasta, fecha(op)));

    if (!pGhl || AGENDAS.test(pGhl.name)) {
      if (!pGhl) r.avisos.push(`Oportunidad ${op.id}: su pipeline de GHL no aparece en la lista`);
      r.saltadas++;
      await marcar();
      avanzar();
      continue;
    }
    const pApp = (pipesApp ?? []).find((p) => mismoNombre(p.nombre, pGhl.name));
    if (!pApp) {
      r.avisos.push(`El pipeline «${pGhl.name}» de GHL no existe en la app: su lead no se ha metido`);
      r.saltadas++;
      await marcar();
      avanzar();
      continue;
    }
    if (!op.contactId) {
      r.saltadas++;
      await marcar();
      avanzar();
      continue;
    }

    let contacto: ContactoGhl | null;
    try {
      contacto = contactos.has(op.contactId) ? contactos.get(op.contactId)! : await contactoGhl({ token, contactId: op.contactId, fetchImpl });
      contactos.set(op.contactId, contacto);
    } catch (e) {
      r.errores.push(`Contacto ${op.contactId}: ${e instanceof Error ? e.message : e}`);
      break;
    }
    if (!contacto) {
      r.saltadas++;
      await marcar();
      avanzar();
      continue;
    }

    const etapaGhl = pGhl.stages?.find((s) => s.id === op.pipelineStageId)?.name;
    const etapas = ((pApp.etapas ?? []) as { id: string; nombre: string; orden: number }[]).sort((a, b) => a.orden - b.orden);
    const etapa = (etapaGhl && etapas.find((x) => mismoNombre(x.nombre, etapaGhl))) || etapas[0] || null;
    const datos = leadDeContactoGhl(op.contactId, contacto, campos, { fuente: op.source ?? contacto.source ?? null, creadoEn: op.createdAt ?? null, oportunidad: op.id, pipeline: pGhl.name });

    try {
      // Si ya estaba (p. ej. entró antes por la Entrada), solo se completan sus datos, sin otra nota en el historial
      const existe = await yaExiste(proyecto.id, datos.lead);
      const lead: LeadEntrada = existe ? { ...datos.lead, extra: undefined } : datos.lead;
      const g = await guardarLeads(proyecto, [lead], {
        pipelineId: pApp.id,
        etapaId: etapa?.id ?? null, // solo cuenta si es nuevo en este pipeline (el que ya está no se mueve)
        origen: "ghl",
        perfilId: null,
        repartir: true,
        notaActividad: `Entró desde GHL (API) · ${pGhl.name}`,
      });
      r.nuevos += g.insertados;
      r.actualizados += g.actualizados;
    } catch (e) {
      r.errores.push(`Oportunidad ${op.id}: ${e instanceof Error ? e.message : e}`);
      break;
    }
    await marcar(datos.lead.respuestas.length);
    avanzar();
  }

  // 4 · Las de los últimos 10 min se releen: si GHL tiene ya más respuestas, se completan
  const hechas = new Set(pendientes.map((o) => o.id));
  const { data: releer } = await db()
    .from("ghl_oportunidades_vistas")
    .select("opp_id, contact_id, n_respuestas")
    .eq("proyecto_id", proyecto.id)
    .gt("visto_en", new Date(ahora - RELEER).toISOString())
    .not("contact_id", "is", null)
    .order("visto_en", { ascending: false })
    .limit(MAX_RELEER + hechas.size);
  for (const v of (releer ?? []).filter((x) => !hechas.has(x.opp_id)).slice(0, MAX_RELEER)) {
    try {
      const c = await contactoGhl({ token, contactId: v.contact_id as string, fetchImpl });
      if (!c) continue;
      const { lead } = leadDeContactoGhl(v.contact_id as string, c, campos, {});
      if (lead.respuestas.length <= (v.n_respuestas ?? 0)) continue;
      if (!(await yaExiste(proyecto.id, lead))) continue; // la saltada (sin pipeline en la app) no se crea aquí
      await guardarLeads(proyecto, [{ ...lead, extra: undefined }], { pipelineId: null, origen: "ghl", perfilId: null, repartir: false });
      await db().from("ghl_oportunidades_vistas").update({ n_respuestas: lead.respuestas.length }).eq("proyecto_id", proyecto.id).eq("opp_id", v.opp_id);
      r.completados++;
    } catch (e) {
      r.errores.push(`Releer ${v.opp_id}: ${e instanceof Error ? e.message : e}`);
    }
  }

  if (nuevoHasta > hasta) await db().from("proyectos").update({ ghl_leads_hasta: new Date(nuevoHasta).toISOString() }).eq("id", proyecto.id);
  await db().from("ghl_oportunidades_vistas").delete().eq("proyecto_id", proyecto.id).lt("visto_en", new Date(ahora - GUARDAR_VISTAS).toISOString());
  return r;
}

async function yaExiste(proyectoId: string, l: LeadEntrada) {
  const [porGhl, porEmail] = await Promise.all([
    l.ghl_contact_id ? db().from("leads").select("id").eq("proyecto_id", proyectoId).eq("ghl_contact_id", l.ghl_contact_id).limit(1) : null,
    l.email ? db().from("leads").select("id").eq("proyecto_id", proyectoId).eq("email", l.email).limit(1) : null,
  ]);
  return !!(porGhl?.data?.length || porEmail?.data?.length);
}
