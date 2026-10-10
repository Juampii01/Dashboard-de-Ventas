import "server-only";
import { db, equipo, escribir } from "@/lib/datos";
import type { Proyecto, Respuesta } from "@/lib/tipos";
import type { LeadEntrada } from "@/lib/csv";
import { enHorario, horarioValido } from "@/lib/horarios";

// «+34 600-11-22-33», «34600112233» y «600 11 22 33» son el mismo teléfono: con 9 cifras o más
// se comparan las últimas 9 (así el prefijo del país no cuenta). Decisión de Cristian, 9 oct 2026 (V2-12).
export const telefonoClave = (t: string | null) => {
  const d = (t ?? "").replace(/\D/g, "");
  return d.length >= 9 ? d.slice(-9) : d;
};
const telefonoValido = (t: string | null) => telefonoClave(t).length >= 6;
export { filaALead, type LeadEntrada } from "@/lib/csv";

// Reparte n leads entre los callers activos (turno rotativo) y avanza el turno.
// Por horarios (V2-11): solo entran los callers que están en su turno; si no hay nadie, todos.
export async function turnosRotativos(proyecto: Proyecto, n: number, ahora = new Date()): Promise<(string | null)[]> {
  let callers = (await equipo(proyecto.id)).filter((p) => p.rol === "caller");
  if (proyecto.modo_reparto === "horarios" && callers.length) {
    const { data: hs } = await db().from("miembros_proyecto").select("perfil_id, horario").eq("proyecto_id", proyecto.id).in("perfil_id", callers.map((c) => c.id));
    const enTurno = callers.filter((c) => enHorario(horarioValido(hs?.find((h) => h.perfil_id === c.id)?.horario), ahora, proyecto.zona_horaria));
    if (enTurno.length) callers = enTurno;
  }
  if (!callers.length || n === 0) return Array(n).fill(null);
  // Arreglo 17: leer y avanzar el turno en un solo paso (en la base), para que dos leads a la vez no vayan al mismo caller
  const { data: inicioDb, error } = await db().rpc("avanzar_rotacion", { p_proyecto: proyecto.id, p_n: n });
  if (error) throw new Error(`No se pudo avanzar el turno del reparto: ${error.message}`);
  const inicio = Number(inicioDb) || 0;
  return Array.from({ length: n }, (_, i) => callers[(inicio + i) % callers.length].id);
}

export async function primeraEtapa(pipelineId: string) {
  const { data } = await db().from("etapas").select("id").eq("pipeline_id", pipelineId).order("orden").limit(1).maybeSingle();
  return data?.id ?? null;
}

// Une respuestas sin perder ninguna: las nuevas sustituyen a la misma pregunta, el resto se queda.
export function unirRespuestas(antes: Respuesta[], nuevas: Respuesta[]) {
  const m = new Map(antes.map((r) => [r.pregunta.toLowerCase(), r]));
  for (const r of nuevas) if (r.respuesta) m.set(r.pregunta.toLowerCase(), r);
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

  const turnos = opciones.repartir && (proyecto.modo_reparto === "rotativo" || proyecto.modo_reparto === "horarios") ? await turnosRotativos(proyecto, nuevos.length) : [];

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
      respuestas: e.respuestas,
      origen: opciones.origen,
      pipeline_id: opciones.pipelineId,
      etapa_id: etapaId,
      caller_id: turnos[i + j] ?? null,
      ...(e.creado_en ? { creado_en: e.creado_en } : {}),
      ...(e.extra ? { fuente: e.extra.fuente, evento: e.extra.evento, seguimiento: e.extra.seguimiento, quiz_score: e.extra.quiz_score, datos: e.extra.datos } : {}),
    }));
    let { data, error } = await db().from("leads").insert(lote).select("id");
    // Arreglo 16: si otro envío creó el mismo lead a la vez (email o contacto repetido), se insertan de uno
    // en uno y el que choca pasa a «actualizar» en vez de fallar todo el lote.
    if (error?.code === "23505") {
      data = [];
      error = null;
      for (const [k, fila] of lote.entries()) {
        const uno = await db().from("leads").insert(fila).select("id").single();
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
  }

  // Actualiza los que ya existían SIN perder nada (no toca pipeline ni asignación):
  // etiquetas y respuestas se suman; el origen (fuente, evento, UTM) se queda el primero.
  for (const { id, e } of actualizar) {
    const { data: antes } = await db().from("leads").select("etiquetas, respuestas, fuente, evento, seguimiento, quiz_score, datos, email").eq("id", id).single();
    const cambios: Record<string, unknown> = {
      etiquetas: [...new Set([...(antes?.etiquetas ?? []), ...e.etiquetas])],
      respuestas: unirRespuestas(antes?.respuestas ?? [], e.respuestas),
    };
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

  return { insertados, actualizados: actualizar.length, invalidos, repartidos: turnos.filter(Boolean).length };
}
