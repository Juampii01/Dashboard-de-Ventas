import "server-only";
import { db, equipo, escribir } from "@/lib/datos";
import type { Proyecto, Respuesta } from "@/lib/tipos";
import type { LeadEntrada } from "@/lib/csv";
import { enHorario, horarioValido } from "@/lib/horarios";
import { calcularOferta, normalizarRespuestas } from "@/lib/oferta";

// «+34 600-11-22-33», «34600112233» y «600 11 22 33» son el mismo teléfono: con 9 cifras o más
// se comparan las últimas 9 (así el prefijo del país no cuenta). Decisión de Cristian, 9 oct 2026 (V2-12).
export const telefonoClave = (t: string | null) => {
  const d = (t ?? "").replace(/\D/g, "");
  return d.length >= 9 ? d.slice(-9) : d;
};
const telefonoValido = (t: string | null) => telefonoClave(t).length >= 6;
export { filaALead, type LeadEntrada } from "@/lib/csv";

// Reparto automático al entrar (bloque 2 de 1.0, Cristian 11 oct 2026): n leads entre los callers con % > 0, según su %.
// Con «solo a quien esté en su horario», entre los que lo están en ese momento; si no hay nadie, igual entre todos
// los que tienen %. Nunca a perfiles de prueba ni a quien no esté activo (equipo()). Apagado: no se reparte.
export async function repartoAutomatico(proyecto: Proyecto, n: number, ahora = new Date()): Promise<(string | null)[]> {
  if (!proyecto.reparto_auto || n === 0) return Array(n).fill(null);
  const callers = (await equipo(proyecto.id)).filter((p) => p.rol === "caller");
  if (!callers.length) return Array(n).fill(null);
  const { data: filas, error } = await db().from("miembros_proyecto").select("perfil_id, horario, reparto_pct").eq("proyecto_id", proyecto.id).in("perfil_id", callers.map((c) => c.id));
  if (error) throw new Error(`No se pudo leer el reparto: ${error.message}`);
  let candidatos = (filas ?? []).filter((f) => Number(f.reparto_pct) > 0);
  if (proyecto.reparto_solo_horario) {
    const enTurno = candidatos.filter((f) => enHorario(horarioValido(f.horario), ahora, proyecto.zona_horaria));
    if (enTurno.length) candidatos = enTurno;
  }
  if (!candidatos.length) return Array(n).fill(null);
  const { data: elegidos, error: e2 } = await db().rpc("repartir_por_pct", { p_proyecto: proyecto.id, p_n: n, p_candidatos: candidatos.map((c) => c.perfil_id) });
  if (e2) throw new Error(`No se pudo repartir: ${e2.message}`);
  const lista = (elegidos ?? []) as string[];
  return Array.from({ length: n }, (_, i) => lista[i] ?? null);
}

export async function primeraEtapa(pipelineId: string) {
  const { data } = await db().from("etapas").select("id").eq("pipeline_id", pipelineId).order("orden").limit(1).maybeSingle();
  return data?.id ?? null;
}

// Une respuestas sin perder ninguna: las nuevas sustituyen a la misma pregunta, el resto se queda. Las 6 de la
// Biblioteca se guardan con su nombre único, así se sustituyen aunque lleguen con otro nombre (bloque A).
export function unirRespuestas(antes: Respuesta[], nuevas: Respuesta[]) {
  const m = new Map(normalizarRespuestas(antes).map((r) => [r.pregunta.toLowerCase(), r]));
  for (const r of normalizarRespuestas(nuevas)) if (r.respuesta) m.set(r.pregunta.toLowerCase(), r);
  return [...m.values()];
}

type FilaClave = { id: string; ghl_contact_id: string | null; email: string | null; telefono: string | null };
function indexar(filas: FilaClave[], m = new Map<string, string>()) {
  for (const l of filas) {
    if (l.ghl_contact_id) m.set(`g:${l.ghl_contact_id}`, l.id);
    if (l.email) m.set(`e:${l.email.toLowerCase()}`, l.id);
    if (telefonoValido(l.telefono)) m.set(`t:${telefonoClave(l.telefono)}`, l.id);
  }
  return m;
}

// Arreglo 15: con pocos leads (webhook, landing, «nuevo cliente») se busca solo por sus claves, sin leer
// todos los del proyecto. Con un CSV grande se leen todos de una vez (más rápido que miles de búsquedas).
const POCOS = 50;
async function buscarExistentes(proyectoId: string, entradas: LeadEntrada[]) {
  const sel = "id, ghl_contact_id, email, telefono";
  if (entradas.length > POCOS) {
    const m = new Map<string, string>();
    for (let i = 0; ; i += 1000) {
      const { data, error } = await db().from("leads").select(sel).eq("proyecto_id", proyectoId).order("id").range(i, i + 999);
      if (error) throw new Error(error.message);
      indexar((data ?? []) as FilaClave[], m);
      if (!data || data.length < 1000) break;
    }
    return m;
  }
  const ghl = [...new Set(entradas.map((e) => e.ghl_contact_id).filter((x): x is string => !!x))];
  const emails = [...new Set(entradas.map((e) => e.email?.toLowerCase()).filter((x): x is string => !!x))];
  const tels = [...new Set(entradas.filter((e) => !e.email && telefonoValido(e.telefono)).map((e) => telefonoClave(e.telefono)))];
  const consultas = [
    ghl.length ? db().from("leads").select(sel).eq("proyecto_id", proyectoId).in("ghl_contact_id", ghl) : null,
    emails.length ? db().from("leads").select(sel).eq("proyecto_id", proyectoId).in("email", emails) : null,
    tels.length ? db().from("leads").select(sel).eq("proyecto_id", proyectoId).in("telefono_clave", tels) : null,
  ].filter((q) => q !== null);
  const res = await Promise.all(consultas);
  const m = new Map<string, string>();
  for (const r of res) {
    if (r.error) throw new Error(r.error.message);
    indexar((r.data ?? []) as FilaClave[], m);
  }
  return m;
}

// Inserta o actualiza leads (por Contact Id de GHL, por email o, si no hay email, por teléfono).
export async function guardarLeads(
  proyecto: Proyecto,
  entradas: LeadEntrada[],
  opciones: {
    pipelineId: string | null;
    etapaId?: string | null; // si no se da, la primera columna del pipeline
    origen: "csv" | "ghl";
    perfilId: string | null;
    repartir: boolean;
    notaActividad?: string;
  }
) {
  const etapaId = opciones.etapaId !== undefined && opciones.etapaId !== null ? opciones.etapaId : opciones.pipelineId ? await primeraEtapa(opciones.pipelineId) : null;

  // Leads ya existentes del proyecto que pueden coincidir
  const existentes = await buscarExistentes(proyecto.id, entradas);

  const nuevos: LeadEntrada[] = [];
  const actualizar: { id: string; e: LeadEntrada }[] = [];
  const vistos = new Set<string>();
  let invalidos = 0;
  for (const e of entradas) {
    if (!e.email && !e.telefono && !e.ghl_contact_id) {
      invalidos++;
      continue;
    }
    const clave = e.ghl_contact_id ? `g:${e.ghl_contact_id}` : e.email ? `e:${e.email}` : `t:${telefonoClave(e.telefono)}`;
    if (vistos.has(clave)) continue; // duplicado dentro del mismo archivo
    vistos.add(clave);
    // El teléfono solo se usa para reconocer al lead cuando no trae email
    const id =
      (e.ghl_contact_id && existentes.get(`g:${e.ghl_contact_id}`)) ||
      (e.email && existentes.get(`e:${e.email}`)) ||
      (!e.email && telefonoValido(e.telefono) && existentes.get(`t:${telefonoClave(e.telefono)}`));
    if (id) actualizar.push({ id, e });
    else nuevos.push(e);
  }

  const turnos = opciones.repartir ? await repartoAutomatico(proyecto, nuevos.length) : [];
  const nombreCaller = new Map<string, string>();
  if (turnos.some(Boolean)) for (const p of await equipo(proyecto.id)) nombreCaller.set(p.id, p.nombre);

  let insertados = 0;
  for (let i = 0; i < nuevos.length; i += 500) {
    const lote = nuevos.slice(i, i + 500).map((e, j) => ({
      proyecto_id: proyecto.id,
      ghl_contact_id: e.ghl_contact_id,
      nombre: e.nombre,
      apellido: e.apellido,
      email: e.email,
      telefono: e.telefono,
      etiquetas: e.etiquetas,
      respuestas: normalizarRespuestas(e.respuestas),
      oferta: calcularOferta({ etiquetas: e.etiquetas, fuente: e.extra?.fuente, respuestas: e.respuestas }),
      origen: opciones.origen,
      pipeline_id: opciones.pipelineId,
      etapa_id: etapaId,
      caller_id: turnos[i + j] ?? null,
      ...(e.creado_en ? { creado_en: e.creado_en } : {}),
      ...(e.extra ? { fuente: e.extra.fuente, evento: e.extra.evento, seguimiento: e.extra.seguimiento, quiz_score: e.extra.quiz_score, datos: e.extra.datos } : {}),
    }));
    let { data, error } = await db().from("leads").insert(lote).select("id, caller_id");
    // Arreglo 16: si otro envío creó el mismo lead a la vez (email o contacto repetido), se insertan de uno
    // en uno y el que choca pasa a «actualizar» en vez de fallar todo el lote.
    if (error?.code === "23505") {
      data = [];
      error = null;
      for (const [k, fila] of lote.entries()) {
        const uno = await db().from("leads").insert(fila).select("id, caller_id").single();
        if (!uno.error) data.push(uno.data);
        else if (uno.error.code === "23505") {
          const e = nuevos[i + k];
          const ya = await buscarExistentes(proyecto.id, [e]);
          const id = (e.ghl_contact_id && ya.get(`g:${e.ghl_contact_id}`)) || (e.email && ya.get(`e:${e.email.toLowerCase()}`));
          if (!id) throw new Error(`Error guardando leads: ${uno.error.message}`);
          actualizar.push({ id, e });
        } else throw new Error(`Error guardando leads: ${uno.error.message}`);
      }
    }
    if (error || !data) throw new Error(`Error guardando leads: ${error?.message}`);
    insertados += data.length;
    await db()
      .from("actividades")
      .insert(
        data.map((d) => ({
          proyecto_id: proyecto.id,
          lead_id: d.id,
          perfil_id: opciones.perfilId,
          tipo: opciones.origen === "csv" ? "importacion" : "webhook",
          nota: opciones.notaActividad ?? (opciones.origen === "csv" ? "Importado desde CSV" : "Entró desde GHL"),
        }))
      );
    // Bloque 2: cada reparto automático queda en el historial del lead
    const repartidos = data.filter((d) => d.caller_id);
    if (repartidos.length) {
      const { error: errHist } = await db().from("actividades").insert(repartidos.map((d) => ({ proyecto_id: proyecto.id, lead_id: d.id, perfil_id: null, tipo: "asignacion", nota: `Caller: ${nombreCaller.get(d.caller_id as string) ?? "—"} · reparto automático (%)` })));
      if (errHist) console.error("[actividad] no se pudo guardar el reparto:", errHist.message);
    }
  }

  // Actualiza los que ya existían SIN perder nada (no toca pipeline ni asignación):
  // etiquetas y respuestas se suman; el origen (fuente, evento, UTM) se queda el primero.
  let cambianOferta = 0;
  for (const { id, e } of actualizar) {
    const { data: antes } = await db().from("leads").select("etiquetas, respuestas, fuente, evento, seguimiento, quiz_score, datos, email, oferta").eq("id", id).single();
    const etiquetas = [...new Set([...(antes?.etiquetas ?? []), ...e.etiquetas])];
    const respuestas = unirRespuestas(antes?.respuestas ?? [], e.respuestas);
    // Bloque A: la oferta se recalcula con los datos nuevos
    const oferta = calcularOferta({ etiquetas, fuente: antes?.fuente || e.extra?.fuente, respuestas });
    if (oferta !== (antes?.oferta ?? null)) cambianOferta++;
    const cambios: Record<string, unknown> = { etiquetas, respuestas, oferta };
    if (e.telefono) cambios.telefono = e.telefono;
    if (e.email && !antes?.email) cambios.email = e.email;
    if (e.nombre) cambios.nombre = e.nombre;
    if (e.apellido) cambios.apellido = e.apellido;
    if (e.ghl_contact_id) cambios.ghl_contact_id = e.ghl_contact_id;
    if (e.extra) {
      if (!antes?.fuente && e.extra.fuente) cambios.fuente = e.extra.fuente;
      if (!antes?.evento && e.extra.evento) cambios.evento = e.extra.evento;
      if (antes?.quiz_score == null && e.extra.quiz_score != null) cambios.quiz_score = e.extra.quiz_score;
      cambios.seguimiento = { ...e.extra.seguimiento, ...(antes?.seguimiento ?? {}) };
      cambios.datos = { ...(antes?.datos ?? {}), ...e.extra.datos };
      const otraVez = [e.extra.evento && e.extra.evento !== antes?.evento ? `evento «${e.extra.evento}»` : "", e.extra.fuente && e.extra.fuente !== antes?.fuente ? `fuente «${e.extra.fuente}»` : ""].filter(Boolean);
      await db().from("actividades").insert({
        proyecto_id: proyecto.id,
        lead_id: id,
        perfil_id: opciones.perfilId,
        tipo: "webhook",
        nota: `${opciones.notaActividad ?? "Volvió a entrar"}${otraVez.length ? ` · ${otraVez.join(" · ")}` : ""}`,
      });
    }
    await escribir(db().from("leads").update(cambios).eq("id", id), "leads");
  }

  return { insertados, actualizados: actualizar.length, invalidos, repartidos: turnos.filter(Boolean).length, cambianOferta };
}

// 4.4 (Cristian, 11 oct): datos de una cita que llega de GHL. La agenda (KPIs, Ranking y comisión) es de quien marcó
// «Link enviado»; si nadie lo marcó, del caller del lead; sin caller, de nadie. Las estrellas son las que puso el
// caller al enviar el link.
// Decisión de Cristian (12 oct 2026): todo lead con una cita que llega de GHL (webhook o sincronización) pasa al
// pipeline «Orgánico», columna «Agendados». Fase 4: la columna se guarda en el proyecto (`etapa_citas_ghl`, se elige
// en el «⋯» de la columna), así no depende del nombre. Sin ese dato (base aún sin la migración), se busca por nombre.
export async function columnaCitasGhl(proyectoId: string): Promise<{ pipeline_id: string; id: string } | null> {
  const { data: proy } = await db().from("proyectos").select("*").eq("id", proyectoId).maybeSingle();
  if (proy && "etapa_citas_ghl" in proy) {
    if (!proy.etapa_citas_ghl) return null;
    const { data } = await db().from("etapas").select("id, pipeline_id").eq("id", proy.etapa_citas_ghl).maybeSingle();
    return data ?? null;
  }
  const { data: pipe } = await db().from("pipelines").select("id, etapas(id, nombre)").eq("proyecto_id", proyectoId).eq("tipo", "normal").ilike("nombre", "orgánico").maybeSingle();
  const etapa = ((pipe?.etapas ?? []) as { id: string; nombre: string }[]).find((x) => x.nombre.trim().toLowerCase() === "agendados");
  return pipe && etapa ? { pipeline_id: pipe.id, id: etapa.id } : null;
}

export async function moverAAgendadosOrganico(proyectoId: string, leadId: string) {
  const destino = await columnaCitasGhl(proyectoId);
  if (!destino) return;
  await escribir(db().from("leads").update({ pipeline_id: destino.pipeline_id, etapa_id: destino.id }).eq("id", leadId), "leads");
}

export async function datosAgendaGhl(leadId: string): Promise<{ agendada_por: string | null; estrellas_caller: number | null }> {
  const { data } = await db().from("leads").select("link_enviado_por, caller_id, estrellas_caller").eq("id", leadId).maybeSingle();
  return { agendada_por: data?.link_enviado_por ?? data?.caller_id ?? null, estrellas_caller: data?.estrellas_caller ?? null };
}
