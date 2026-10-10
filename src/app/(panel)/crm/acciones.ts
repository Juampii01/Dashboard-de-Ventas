"use server";

import { exigirSeccion } from "@/lib/permisos";
import { ErrorUsuario, seguro } from "@/lib/resultado";
import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { exigir, esJefe, puedeAdmin, getSesion } from "@/lib/auth";
import { COLUMNAS_PRECALL } from "@/lib/llamadas";
import type { EstadoCaller } from "@/lib/tipos";
import { db, registrarActividad, escribir } from "@/lib/datos";
import { guardarLeads, primeraEtapa } from "@/lib/leads";
import { filaALead, mapaValido } from "@/lib/csv";
import { borrarSubida, leerSubida, prepararSubida } from "@/lib/subidas";

const refrescar = () => revalidatePath("/", "layout");

// ---------- Importar CSV ----------
// Enlace firmado para que el navegador suba el CSV directo a Supabase (sin pasar por Vercel)
export async function prepararSubidaCsv() {
  return seguro(async () => {
    await exigirSeccion("crm"); // H5
    const { proyecto } = await exigir(esJefe);
    return prepararSubida("importaciones", proyecto.id);
  });
}

export async function importarCsv(_prev: unknown, formData: FormData) {
  const ruta = String(formData.get("archivo_ruta") ?? "");
  // Arreglo 30: mismo envoltorio que el resto (lo inesperado no enseña detalles internos)
  return seguro(async () => {
    await exigirSeccion("crm"); // H5
    const { perfil, proyecto } = await exigir(esJefe);
    if (!ruta) return { error: "Elige un archivo CSV." };
    const texto = await (await leerSubida("importaciones", ruta, proyecto.id)).text();
    // Ya está leído: el archivo no se guarda
    await borrarSubida("importaciones", ruta);
    const res = Papa.parse<Record<string, string>>(texto.replace(/^﻿/, ""), { header: true, skipEmptyLines: true });
    if (!res.data.length) return { error: "El CSV no tiene filas." };
    const pipelineId = String(formData.get("pipeline") ?? "") || null;
    if (pipelineId) {
      const { data } = await db().from("pipelines").select("id").eq("id", pipelineId).eq("proyecto_id", proyecto.id).maybeSingle();
      if (!data) return { error: "Ese pipeline no es de este proyecto." };
    }
    let mapaBruto: unknown = null;
    try {
      mapaBruto = JSON.parse(String(formData.get("mapa") ?? "null"));
    } catch {
      mapaBruto = null;
    }
    const mapa = mapaValido(mapaBruto, res.meta.fields ?? []);
    const r = await guardarLeads(proyecto, res.data.map((f) => filaALead(f, mapa)), {
      pipelineId,
      origen: "csv",
      perfilId: perfil.id,
      repartir: formData.get("repartir") === "on",
    });
    refrescar();
    return { ok: `Importados ${r.insertados} leads nuevos · ${r.actualizados} actualizados · ${r.repartidos} repartidos a callers${r.invalidos ? ` · ${r.invalidos} filas sin email ni teléfono` : ""}.` };
  });
}

// ---------- Pipelines y columnas ----------
// Paso H7 (Cristian, 10 oct 2026): las columnas y los pipelines solo los tocan el CEO y el director con Administración
export async function crearPipeline(nombre: string) {
  return seguro(async () => {
    await exigirSeccion("crm"); // H5
    const { proyecto } = await exigir(puedeAdmin);
    const n = nombre.trim();
    if (!n) throw new ErrorUsuario("Pon un nombre.");
    const { count } = await db().from("pipelines").select("id", { count: "exact", head: true }).eq("proyecto_id", proyecto.id);
    const { data, error } = await db().from("pipelines").insert({ proyecto_id: proyecto.id, nombre: n, orden: count ?? 0 }).select().single();
    if (error) throw new ErrorUsuario(error.message);
    // Con sus columnas unidas a los estados del caller (H7)
    await escribir(db().from("etapas").insert([
      { pipeline_id: data.id, nombre: "Nuevos", orden: 0, color: "#64748b", estado_caller: "nuevo" },
      { pipeline_id: data.id, nombre: "No contesta", orden: 1, color: "#94a3b8", estado_caller: "no_contesta" },
      { pipeline_id: data.id, nombre: "Llamar luego", orden: 2, color: "#d97706", estado_caller: "llamar_luego" },
      { pipeline_id: data.id, nombre: "Agendados", orden: 3, color: "#2f55d4", estado_caller: "agendado" },
      { pipeline_id: data.id, nombre: "Cerrados", orden: 4, color: "#16a34a", estado_caller: "vendido" },
      { pipeline_id: data.id, nombre: "Descartados", orden: 5, color: "#dc2626", estado_caller: "no_interesa" },
    ]), "etapas");
    refrescar();
    return data.id as string;
  });
}

async function pipelineDelProyecto(pipelineId: string, proyectoId: string) {
  const { data } = await db().from("pipelines").select("id").eq("id", pipelineId).eq("proyecto_id", proyectoId).maybeSingle();
  if (!data) throw new ErrorUsuario("Pipeline no encontrado.");
}

export async function renombrarPipeline(pipelineId: string, nombre: string) {
  return seguro(async () => {
    await exigirSeccion("crm"); // H5
    const { proyecto } = await exigir(puedeAdmin);
    await pipelineDelProyecto(pipelineId, proyecto.id);
    await escribir(db().from("pipelines").update({ nombre: nombre.trim() }).eq("id", pipelineId), "pipelines");
    refrescar();
  });
}

export async function borrarPipeline(pipelineId: string) {
  return seguro(async () => {
    await exigirSeccion("crm"); // H5
    const { proyecto } = await exigir(puedeAdmin);
    await pipelineDelProyecto(pipelineId, proyecto.id);
    await escribir(db().from("leads").update({ pipeline_id: null, etapa_id: null }).eq("pipeline_id", pipelineId), "leads");
    await escribir(db().from("pipelines").delete().eq("id", pipelineId), "pipelines");
    refrescar();
  });
}

async function etapaDelProyecto(etapaId: string, proyectoId: string) {
  const { data } = await db().from("etapas").select("id, pipeline_id, pipelines!inner(proyecto_id)").eq("id", etapaId).eq("pipelines.proyecto_id", proyectoId).maybeSingle();
  if (!data) throw new ErrorUsuario("Columna no encontrada.");
  return data as unknown as { id: string; pipeline_id: string };
}

export async function crearEtapa(pipelineId: string, nombre: string, color: string) {
  return seguro(async () => {
    await exigirSeccion("crm"); // H5
    const { proyecto } = await exigir(puedeAdmin);
    await pipelineDelProyecto(pipelineId, proyecto.id);
    const { count } = await db().from("etapas").select("id", { count: "exact", head: true }).eq("pipeline_id", pipelineId);
    await escribir(db().from("etapas").insert({ pipeline_id: pipelineId, nombre: nombre.trim() || "Nueva columna", orden: count ?? 0, color }), "etapas");
    refrescar();
  });
}

export async function editarEtapa(etapaId: string, nombre: string, color: string) {
  return seguro(async () => {
    await exigirSeccion("crm"); // H5
    const { proyecto } = await exigir(puedeAdmin);
    await etapaDelProyecto(etapaId, proyecto.id);
    await escribir(db().from("etapas").update({ nombre: nombre.trim(), color }).eq("id", etapaId), "etapas");
    refrescar();
  });
}

export async function moverEtapa(etapaId: string, direccion: -1 | 1) {
  return seguro(async () => {
    await exigirSeccion("crm"); // H5
    const { proyecto } = await exigir(puedeAdmin);
    const e = await etapaDelProyecto(etapaId, proyecto.id);
    const { data: etapas } = await db().from("etapas").select("id, orden").eq("pipeline_id", e.pipeline_id).order("orden");
    const lista = etapas ?? [];
    const i = lista.findIndex((x) => x.id === etapaId);
    const j = i + direccion;
    if (i < 0 || j < 0 || j >= lista.length) return;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    await Promise.all(lista.map((x, k) => db().from("etapas").update({ orden: k }).eq("id", x.id)));
    refrescar();
  });
}

export async function borrarEtapa(etapaId: string) {
  return seguro(async () => {
    await exigirSeccion("crm"); // H5
    const { proyecto } = await exigir(puedeAdmin);
    const e = await etapaDelProyecto(etapaId, proyecto.id);
    const destino = await primeraEtapa(e.pipeline_id);
    const otra = destino === etapaId
      ? (await db().from("etapas").select("id").eq("pipeline_id", e.pipeline_id).neq("id", etapaId).order("orden").limit(1).maybeSingle()).data?.id ?? null
      : destino;
    await escribir(db().from("leads").update({ etapa_id: otra }).eq("etapa_id", etapaId), "leads");
    await escribir(db().from("etapas").delete().eq("id", etapaId), "etapas");
    refrescar();
  });
}

// Unir una columna a un estado del lead (o quitar la unión con null). Un estado, una columna por pipeline.
const ESTADOS: EstadoCaller[] = ["nuevo", "no_contesta", "llamar_luego", "agendado", "no_interesa", "vendido"];
export async function unirEstado(etapaId: string, estado: string | null) {
  return seguro(async () => {
    await exigirSeccion("crm"); // H5
    const { proyecto } = await exigir(puedeAdmin);
    const e = await etapaDelProyecto(etapaId, proyecto.id);
    if (estado !== null && !ESTADOS.includes(estado as EstadoCaller)) throw new ErrorUsuario("Estado no válido.");
    if (estado) {
      const { data: otra } = await db().from("etapas").select("nombre").eq("pipeline_id", e.pipeline_id).eq("estado_caller", estado).neq("id", etapaId).maybeSingle();
      if (otra) throw new ErrorUsuario(`La columna «${otra.nombre}» ya está unida a ese estado: quítasela antes.`);
    }
    await escribir(db().from("etapas").update({ estado_caller: estado }).eq("id", etapaId), "etapas");
    refrescar();
  });
}

// Pre-call (H7): el admin cambia nombre, color y orden de sus 4 columnas; siguen siendo los 4 estados de la cita
export async function guardarColumnasPrecall(lista: { estado: string; titulo: string; color: string }[]) {
  return seguro(async () => {
    await exigirSeccion("crm"); // H5
    const { proyecto } = await exigir(puedeAdmin);
    const validos = COLUMNAS_PRECALL.map((c) => c.estado as string);
    if (lista.length !== validos.length || new Set(lista.map((c) => c.estado)).size !== validos.length || !lista.every((c) => validos.includes(c.estado)))
      throw new ErrorUsuario("Tienen que estar las 4 columnas de Pre-call, una vez cada una.");
    const limpias = lista.map((c) => {
      const titulo = c.titulo.trim();
      if (!titulo || titulo.length > 40) throw new ErrorUsuario("Cada columna necesita un nombre (máximo 40 caracteres).");
      if (!/^(#[0-9a-fA-F]{6}|var\(--[a-z0-9-]+\))$/.test(c.color)) throw new ErrorUsuario("Color no válido.");
      return { estado: c.estado, titulo, color: c.color };
    });
    await escribir(db().from("proyectos").update({ precall_columnas: limpias }).eq("id", proyecto.id), "proyectos");
    refrescar();
  });
}

// ---------- Mover y asignar leads ----------
export async function moverLead(leadId: string, etapaId: string) {
  return seguro(async () => {
    await exigirSeccion("crm"); // H5
    // Paso H7: cada uno mueve sus leads (el caller los suyos, el closer los suyos; los jefes, todos)
    const { perfil, proyecto } = await getSesion();
    const e = await etapaDelProyecto(etapaId, proyecto.id);
    const { data: lead } = await db().from("leads").select("id, etapa_id, estado_caller, caller_id, closer_id").eq("id", leadId).eq("proyecto_id", proyecto.id).maybeSingle();
    if (!lead) throw new ErrorUsuario("Lead no encontrado.");
    if (!esJefe(perfil) && lead.caller_id !== perfil.id && lead.closer_id !== perfil.id) throw new ErrorUsuario("Este lead no está asignado a ti.");
    if (lead.etapa_id === etapaId) return;
    const { data: etapa } = await db().from("etapas").select("nombre, estado_caller").eq("id", etapaId).single();
    // Una columna unida a un estado solo se alcanza cambiando el estado (su botón o su ventana), para no desincronizar
    if (etapa?.estado_caller && etapa.estado_caller !== lead.estado_caller) throw new ErrorUsuario(`«${etapa.nombre}» está unida a un estado: usa su botón para mover el lead ahí.`);
    await escribir(db().from("leads").update({ etapa_id: etapaId, pipeline_id: e.pipeline_id }).eq("id", leadId), "leads");
    await registrarActividad({ proyecto_id: proyecto.id, lead_id: leadId, perfil_id: perfil.id, tipo: "cambio_etapa", nota: `Movido a «${etapa?.nombre}»` });
    refrescar();
  });
}

export async function asignarLeads(leadIds: string[], callerId: string | null | undefined, closerId?: string | null) {
  return seguro(async () => {
    await exigirSeccion("crm"); // H5
    const { perfil, proyecto } = await exigir(esJefe);
    if (!leadIds.length) return;
    // Arreglo 29: solo se asigna a callers/closers de este proyecto
    for (const [id, rol] of [[callerId, "caller"], [closerId, "closer"]] as const) {
      if (!id) continue;
      const { data } = await db().from("miembros_proyecto").select("perfil_id, perfiles!inner(rol)").eq("proyecto_id", proyecto.id).eq("perfil_id", id).eq("perfiles.rol", rol).maybeSingle();
      if (!data) throw new ErrorUsuario(`Esa persona no es ${rol} de este proyecto.`);
    }
    const cambios: Record<string, string | null> = {};
    if (callerId !== undefined) cambios.caller_id = callerId || null;
    if (closerId !== undefined) cambios.closer_id = closerId || null;
    await escribir(db().from("leads").update(cambios).in("id", leadIds).eq("proyecto_id", proyecto.id), "leads");
    const { data: personas } = await db().from("perfiles").select("id, nombre").in("id", [callerId, closerId].filter(Boolean) as string[]);
    const nombre = (id?: string | null) => personas?.find((p) => p.id === id)?.nombre ?? "nadie";
    await db().from("actividades").insert(
      leadIds.map((id) => ({
        proyecto_id: proyecto.id,
        lead_id: id,
        perfil_id: perfil.id,
        tipo: "asignacion",
        nota: [callerId !== undefined && `Caller: ${nombre(callerId)}`, closerId !== undefined && `Closer: ${nombre(closerId)}`].filter(Boolean).join(" · "),
      }))
    );
    refrescar();
  });
}

export async function crearLeadManual(formData: FormData) {
  return seguro(async () => {
    await exigirSeccion("crm"); // H5
    const { perfil, proyecto } = await exigir(esJefe);
    const nombre = String(formData.get("nombre") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase() || null;
    const telefono = String(formData.get("telefono") ?? "").trim() || null;
    const pipelineId = String(formData.get("pipeline") ?? "") || null;
    if (!nombre || (!email && !telefono)) throw new ErrorUsuario("Pon nombre y email o teléfono.");
    if (pipelineId) await pipelineDelProyecto(pipelineId, proyecto.id); // arreglo 29
    const [n, ...resto] = nombre.split(" ");
    const etapaId = pipelineId ? await primeraEtapa(pipelineId) : null;
    const { data, error } = await db()
      .from("leads")
      .insert({ proyecto_id: proyecto.id, nombre: n, apellido: resto.join(" "), email, telefono, origen: "manual", pipeline_id: pipelineId, etapa_id: etapaId })
      .select("id")
      .single();
    if (error) throw new ErrorUsuario(error.code === "23505" ? "Ya existe un lead con ese email." : error.message);
    await registrarActividad({ proyecto_id: proyecto.id, lead_id: data.id, perfil_id: perfil.id, tipo: "nota", nota: "Lead creado a mano" });
    refrescar();
  });
}
