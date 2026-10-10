"use server";

import { ErrorUsuario, notaValida, seguro } from "@/lib/resultado";
import { revalidatePath } from "next/cache";
import { getSesion, esJefe } from "@/lib/auth";
import { db, registrarActividad, escribir } from "@/lib/datos";
import { localAIso } from "@/lib/formato";
import { estrellasEntre } from "@/lib/estrellas";
import { planDePagos } from "@/lib/finanzas";
import type { Lead, Perfil, Proyecto } from "@/lib/tipos";
import { leerNumero } from "@/lib/numero";
import { ABIERTAS } from "@/lib/llamadas";

const refrescar = () => revalidatePath("/", "layout");

// Quién puede tocar un lead: jefes, o el caller/closer asignado.
async function leadPermitido(leadId: string): Promise<{ lead: Lead; perfil: Perfil; proyecto: Proyecto }> {
  const { perfil, proyecto } = await getSesion();
  const { data: lead } = await db().from("leads").select("*").eq("id", leadId).eq("proyecto_id", proyecto.id).maybeSingle<Lead>();
  if (!lead) throw new ErrorUsuario("Lead no encontrado.");
  const ok = esJefe(perfil) || lead.caller_id === perfil.id || lead.closer_id === perfil.id;
  if (!ok) throw new ErrorUsuario("Este lead no está asignado a ti.");
  return { lead, perfil, proyecto };
}

async function moverAColumna(lead: Lead, nombres: string[]) {
  if (!lead.pipeline_id) return;
  const { data } = await db().from("etapas").select("id, nombre").eq("pipeline_id", lead.pipeline_id);
  const destino = (data ?? []).find((e) => nombres.includes(e.nombre.toLowerCase()));
  if (destino && destino.id !== lead.etapa_id) await db().from("leads").update({ etapa_id: destino.id }).eq("id", lead.id);
}

const aIso = localAIso;

// ---------- Caller: resultado de la llamada ----------
export async function registrarLlamada(
  leadId: string,
  resultado: "no_contesta" | "llamar_luego" | "no_interesa" | "contestado",
  nota: string,
  llamarEn?: string,
  estrellas?: number
) {
  return seguro(async () => {
    nota = notaValida(nota);
    const { lead, perfil, proyecto } = await leadPermitido(leadId);
    const estado = resultado === "contestado" ? lead.estado_caller : resultado;
    const n = resultado === "no_contesta" ? 1 : resultado === "contestado" && estrellas === undefined ? null : estrellasEntre(estrellas, 2, 5);
    await db()
      .from("leads")
      .update({
        estado_caller: estado,
        llamar_en: resultado === "llamar_luego" && llamarEn ? aIso(llamarEn, proyecto.zona_horaria) : null,
        ...(n ? { estrellas_caller: n } : {}),
      })
      .eq("id", leadId);
    await registrarActividad({ proyecto_id: proyecto.id, lead_id: leadId, perfil_id: perfil.id, tipo: "llamada", resultado, nota: [n ? `${n}★` : "", nota].filter(Boolean).join(" · ") || null });
    if (resultado === "no_interesa") await moverAColumna(lead, ["descartados", "descartado"]);
    refrescar();
  });
}

export async function registrarWhatsapp(leadId: string, nota: string) {
  return seguro(async () => {
    nota = notaValida(nota);
    const { perfil, proyecto } = await leadPermitido(leadId);
    await registrarActividad({ proyecto_id: proyecto.id, lead_id: leadId, perfil_id: perfil.id, tipo: "whatsapp", nota: nota || "Mensaje de WhatsApp enviado" });
    refrescar();
  });
}

export async function anadirNota(leadId: string, nota: string) {
  return seguro(async () => {
    nota = notaValida(nota);
    if (!nota.trim()) return;
    const { perfil, proyecto } = await leadPermitido(leadId);
    await registrarActividad({ proyecto_id: proyecto.id, lead_id: leadId, perfil_id: perfil.id, tipo: "nota", nota: nota.trim() });
    refrescar();
  });
}

// ---------- Agendar cita con un closer ----------
export async function agendarCita(leadId: string, closerId: string, fechaLocal: string, nota: string, estrellas?: number) {
  return seguro(async () => {
    nota = notaValida(nota);
    const { lead, perfil, proyecto } = await leadPermitido(leadId);
    if (!fechaLocal) throw new ErrorUsuario("Elige fecha y hora.");
    // El caller dice cómo fue su llamada (2 a 5); si agenda un jefe o un closer, es opcional
    const n = perfil.rol === "caller" || estrellas !== undefined ? estrellasEntre(estrellas, 2, 5) : null;
    const { data: closer } = await db()
      .from("miembros_proyecto")
      .select("perfil_id, perfiles!inner(rol, nombre)")
      .eq("proyecto_id", proyecto.id)
      .eq("perfil_id", closerId)
      .eq("perfiles.rol", "closer")
      .maybeSingle();
    if (!closer) throw new ErrorUsuario("Elige un closer del proyecto.");
    const fecha = aIso(fechaLocal, proyecto.zona_horaria);
    await escribir(db().from("citas").insert({ proyecto_id: proyecto.id, lead_id: leadId, closer_id: closerId, agendada_por: perfil.id, fecha, nota: nota || null, estrellas_caller: n }), "citas");
    // Arreglo 9: si agenda un jefe o un closer sin estrellas, no se borran las que puso el caller
    await escribir(db().from("leads").update({ estado_caller: "agendado", closer_id: closerId, llamar_en: null, ...(n !== null ? { estrellas_caller: n } : {}) }).eq("id", leadId), "leads");
    const nombreCloser = (closer as unknown as { perfiles: { nombre: string } }).perfiles.nombre;
    await registrarActividad({ proyecto_id: proyecto.id, lead_id: leadId, perfil_id: perfil.id, tipo: "cita", resultado: "agendada", nota: `Cita con ${nombreCloser}${n ? ` · ${n}★` : ""}${nota ? ` · ${nota}` : ""}` });
    await moverAColumna(lead, ["agendados", "agendado"]);
    refrescar();
  });
}

// ---------- Registrar venta ----------
export async function registrarVenta(leadId: string, formData: FormData) {
  return seguro(async () => {
    const { lead, perfil, proyecto } = await leadPermitido(leadId);
    const productoId = String(formData.get("producto") ?? "");
    const { data: producto } = await db().from("productos").select("*").eq("id", productoId).eq("proyecto_id", proyecto.id).maybeSingle();
    if (!producto) throw new ErrorUsuario("Elige un producto.");
    if (perfil.rol === "caller" && !producto.vende_caller) throw new ErrorUsuario("Como caller solo puedes registrar productos que vende el caller (low ticket).");
  
    const num = (k: string) => {
      const v = leerNumero(formData.get(k));
      return Number.isFinite(v) ? v : NaN;
    };
    const facturacion = num("facturacion");
    const cash = num("cash");
    if (!(facturacion > 0)) throw new ErrorUsuario("La facturación tiene que ser mayor que 0.");
    if (!(cash >= 0) || cash > facturacion) throw new ErrorUsuario("El cash collected tiene que estar entre 0 y la facturación.");
    // Arreglo 29: lo que antes solo comprobaba la base (y el usuario veía su mensaje técnico)
    const tipo = String(formData.get("tipo_pago") ?? "completo") as "completo" | "reserva" | "cuotas";
    if (!["completo", "reserva", "cuotas"].includes(tipo)) throw new ErrorUsuario("Elige cómo paga (completo, reserva o cuotas).");
    const cuotas = tipo === "cuotas" ? Math.max(2, Math.round(num("num_cuotas")) || 2) : null;
    if (cuotas !== null && cuotas > 60) throw new ErrorUsuario("Como mucho 60 cuotas.");
    const metodo = String(formData.get("metodo") ?? "stripe");
    if (!["stripe", "transferencia", "otro"].includes(metodo)) throw new ErrorUsuario("Elige el método de pago.");
    const fechaTxt = String(formData.get("fecha") ?? "");
    const fecha = fechaTxt ? aIso(`${fechaTxt}T12:00`, proyecto.zona_horaria) : new Date().toISOString();
    // Desde la cita (closer), las estrellas de cómo era el prospecto son obligatorias
    const estrellasCloser = formData.get("desde_cita") ? estrellasEntre(formData.get("estrellas"), 1, 5) : null;
    // La cita abierta de este lead (pasará a «cerrada»)
    const { data: cita } = await db()
      .from("citas")
      .select("id, closer_id")
      .eq("lead_id", leadId)
      .in("estado", [...ABIERTAS, "seguimiento"]) // arreglo 8: también «confirmación pendiente»
      .order("fecha", { ascending: false })
      .limit(1)
      .maybeSingle();
    // Vendedor: al cerrar una cita, la venta es del closer de esa cita aunque la cierre
    // el director o el CEO; si no, quien la registra (o a quien elija un jefe).
    let vendedor = perfil.id;
    const vendedorForm = String(formData.get("vendedor") ?? "");
    if (formData.get("desde_cita") && cita?.closer_id) vendedor = cita.closer_id;
    else if (esJefe(perfil) && vendedorForm) {
      const { data: delProyecto } = await db().from("miembros_proyecto").select("perfil_id").eq("proyecto_id", proyecto.id).eq("perfil_id", vendedorForm).maybeSingle();
      if (!delProyecto) throw new ErrorUsuario("El vendedor elegido no es de este proyecto.");
      vendedor = vendedorForm;
    }
  
    const { data: nueva, error } = await db().from("ventas").insert({
      proyecto_id: proyecto.id,
      lead_id: leadId,
      producto_id: producto.id,
      vendedor_id: vendedor,
      facturacion,
      cash_collected: cash,
      tipo_pago: tipo,
      num_cuotas: cuotas,
      metodo,
      nota: notaValida(String(formData.get("nota") ?? "")) || null,
      fecha,
    }).select("id").single();
    if (error) throw new ErrorUsuario(error.message);
    // Reserva o cuotas: lo que falta queda en «Pagos pendientes» con sus fechas (se pueden cambiar en Finanzas)
    const plazos = planDePagos({ facturacion, cobradoHoy: cash, tipo, numCuotas: cuotas, fecha });
    if (plazos.length) await db().from("vencimientos").insert(plazos.map((x) => ({ ...x, proyecto_id: proyecto.id, venta_id: nueva.id, lead_id: leadId })));
  
    await escribir(db().from("leads").update({ estado_caller: "vendido" }).eq("id", leadId), "leads");
    if (cita) await db().from("citas").update({ estado: "cerrada", ...(estrellasCloser ? { estrellas_closer: estrellasCloser } : {}) }).eq("id", cita.id);
    await registrarActividad({
      proyecto_id: proyecto.id,
      lead_id: leadId,
      perfil_id: perfil.id,
      tipo: "venta",
      resultado: tipo,
      nota: `${producto.nombre} · facturación ${facturacion} · cobrado ${cash}`,
    });
    const nombreProd = producto.nombre.toLowerCase();
    await moverAColumna(lead, [
      ...(nombreProd.includes("low") ? ["low ticket"] : []),
      ...(nombreProd.includes("vip") ? ["vip"] : []),
      ...(nombreProd.includes("grupal") ? ["grupal"] : []),
      "cerrados",
      "cerrado",
    ]);
    refrescar();
  });
}

// ---------- Jefes: mover / asignar desde la ficha ----------
export async function cambiarEtapaLead(leadId: string, etapaId: string) {
  return seguro(async () => {
    const { lead, perfil, proyecto } = await leadPermitido(leadId);
    if (!esJefe(perfil)) throw new ErrorUsuario("Solo el director o el CEO mueven leads en el CRM.");
    const { data: etapa } = await db().from("etapas").select("id, nombre, pipeline_id, pipelines!inner(proyecto_id)").eq("id", etapaId).eq("pipelines.proyecto_id", proyecto.id).maybeSingle();
    if (!etapa) throw new ErrorUsuario("Columna no encontrada.");
    await escribir(db().from("leads").update({ etapa_id: etapa.id, pipeline_id: etapa.pipeline_id }).eq("id", lead.id), "leads");
    await registrarActividad({ proyecto_id: proyecto.id, lead_id: lead.id, perfil_id: perfil.id, tipo: "cambio_etapa", nota: `Movido a «${etapa.nombre}»` });
    refrescar();
  });
}

export async function asignarDesdeFicha(leadId: string, campo: "caller_id" | "closer_id", personaId: string) {
  return seguro(async () => {
    const { perfil, proyecto } = await leadPermitido(leadId);
    if (!esJefe(perfil)) throw new ErrorUsuario("Solo el director o el CEO asignan leads.");
    if (personaId) {
      const { data } = await db().from("miembros_proyecto").select("perfil_id").eq("proyecto_id", proyecto.id).eq("perfil_id", personaId).maybeSingle();
      if (!data) throw new ErrorUsuario("Esa persona no está en el proyecto.");
    }
    await escribir(db().from("leads").update({ [campo]: personaId || null }).eq("id", leadId), "leads");
    const { data: p } = personaId ? await db().from("perfiles").select("nombre").eq("id", personaId).single() : { data: null };
    await registrarActividad({ proyecto_id: proyecto.id, lead_id: leadId, perfil_id: perfil.id, tipo: "asignacion", nota: `${campo === "caller_id" ? "Caller" : "Closer"}: ${p?.nombre ?? "sin asignar"}` });
    refrescar();
  });
}

// Tablero del caller: devolver un lead a «Nuevo» (por ejemplo, si se marcó por error).
export async function volverANuevo(leadId: string) {
  return seguro(async () => {
    const { perfil, proyecto } = await leadPermitido(leadId);
    await escribir(db().from("leads").update({ estado_caller: "nuevo", llamar_en: null }).eq("id", leadId), "leads");
    await registrarActividad({ proyecto_id: proyecto.id, lead_id: leadId, perfil_id: perfil.id, tipo: "nota", nota: "Devuelto a «Nuevo» en el tablero del caller" });
    refrescar();
  });
}
