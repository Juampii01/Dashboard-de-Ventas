import "server-only";
import { db, equipo } from "@/lib/datos";
import type { Proyecto } from "@/lib/tipos";
import type { LeadEntrada } from "@/lib/csv";
export { filaALead, type LeadEntrada } from "@/lib/csv";

// Reparte n leads entre los callers activos (turno rotativo) y avanza el turno.
export async function turnosRotativos(proyecto: Proyecto, n: number): Promise<(string | null)[]> {
  const callers = (await equipo(proyecto.id)).filter((p) => p.rol === "caller");
  if (!callers.length || n === 0) return Array(n).fill(null);
  const { data } = await db().from("proyectos").select("rotacion_indice").eq("id", proyecto.id).single();
  const inicio = data?.rotacion_indice ?? 0;
  await db().from("proyectos").update({ rotacion_indice: inicio + n }).eq("id", proyecto.id);
  return Array.from({ length: n }, (_, i) => callers[(inicio + i) % callers.length].id);
}

export async function primeraEtapa(pipelineId: string) {
  const { data } = await db().from("etapas").select("id").eq("pipeline_id", pipelineId).order("orden").limit(1).maybeSingle();
  return data?.id ?? null;
}

// Inserta o actualiza leads (por Contact Id de GHL o por email).
export async function guardarLeads(
  proyecto: Proyecto,
  entradas: LeadEntrada[],
  opciones: { pipelineId: string | null; origen: "csv" | "ghl"; perfilId: string | null; repartir: boolean }
) {
  const etapaId = opciones.pipelineId ? await primeraEtapa(opciones.pipelineId) : null;

  // Leads ya existentes del proyecto
  const existentes = new Map<string, string>();
  for (let i = 0; ; i += 1000) {
    const { data } = await db()
      .from("leads")
      .select("id, ghl_contact_id, email")
      .eq("proyecto_id", proyecto.id)
      .range(i, i + 999);
    (data ?? []).forEach((l) => {
      if (l.ghl_contact_id) existentes.set(`g:${l.ghl_contact_id}`, l.id);
      if (l.email) existentes.set(`e:${l.email.toLowerCase()}`, l.id);
    });
    if (!data || data.length < 1000) break;
  }

  const nuevos: LeadEntrada[] = [];
  const actualizar: { id: string; e: LeadEntrada }[] = [];
  const vistos = new Set<string>();
  let invalidos = 0;
  for (const e of entradas) {
    if (!e.email && !e.telefono && !e.ghl_contact_id) {
      invalidos++;
      continue;
    }
    const clave = e.ghl_contact_id ? `g:${e.ghl_contact_id}` : `e:${e.email}`;
    if (vistos.has(clave)) continue; // duplicado dentro del mismo archivo
    vistos.add(clave);
    const id = (e.ghl_contact_id && existentes.get(`g:${e.ghl_contact_id}`)) || (e.email && existentes.get(`e:${e.email}`));
    if (id) actualizar.push({ id, e });
    else nuevos.push(e);
  }

  const turnos = opciones.repartir && proyecto.modo_reparto === "rotativo" ? await turnosRotativos(proyecto, nuevos.length) : [];

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
    }));
    const { data, error } = await db().from("leads").insert(lote).select("id");
    if (error) throw new Error(`Error guardando leads: ${error.message}`);
    insertados += data.length;
    await db()
      .from("actividades")
      .insert(
        data.map((d) => ({
          proyecto_id: proyecto.id,
          lead_id: d.id,
          perfil_id: opciones.perfilId,
          tipo: opciones.origen === "csv" ? "importacion" : "webhook",
          nota: opciones.origen === "csv" ? "Importado desde CSV" : "Entró desde GHL",
        }))
      );
  }

  // Actualiza datos y respuestas de los que ya existían (no toca pipeline ni asignación)
  for (const { id, e } of actualizar) {
    const cambios: Record<string, unknown> = { etiquetas: e.etiquetas };
    if (e.respuestas.some((r) => r.respuesta)) cambios.respuestas = e.respuestas;
    if (e.telefono) cambios.telefono = e.telefono;
    if (e.nombre) cambios.nombre = e.nombre;
    if (e.apellido) cambios.apellido = e.apellido;
    if (e.ghl_contact_id) cambios.ghl_contact_id = e.ghl_contact_id;
    await db().from("leads").update(cambios).eq("id", id);
  }

  return { insertados, actualizados: actualizar.length, invalidos, repartidos: turnos.filter(Boolean).length };
}
