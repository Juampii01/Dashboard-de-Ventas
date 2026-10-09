"use server";

import { ErrorUsuario, seguro } from "@/lib/resultado";
import { revalidatePath } from "next/cache";
import { getSesion, esJefe } from "@/lib/auth";
import { db, registrarActividad } from "@/lib/datos";
import { localAIso } from "@/lib/formato";
import { estrellasEntre } from "@/lib/estrellas";
import type { Lead, Perfil, Proyecto } from "@/lib/tipos";

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
    const { perfil, proyecto } = await leadPermitido(leadId);
    await registrarActividad({ proyecto_id: proyecto.id, lead_id: leadId, perfil_id: perfil.id, tipo: "whatsapp", nota: nota || "Mensaje de WhatsApp enviado" });
    refrescar();
  });
}

export async function anadirNota(leadId: string, nota: string) {
  return seguro(async () => {
    if (!nota.trim()) return;
    const { perfil, proyecto } = await leadPermitido(leadId);
    await registrarActividad({ proyecto_id: proyecto.id, lead_id: leadId, perfil_id: perfil.id, tipo: "nota", nota: nota.trim() });
    refrescar();
  });
}

// ---------- Agendar cita con un closer ----------
export async function agendarCita(leadId: string, closerId: string, fechaLocal: string, nota: string, estrellas?: number) {
  return seguro(async () => {
    const { lead, perfil, proyecto } = await leadPermitido(leadId);
    if (!fechaLocal) throw new ErrorUsuario("Elige fecha y hora.");
    const n = estrellasEntre(estrellas, 2, 5);
    const { data: closer } = await db()
      .from("miembros_proyecto")
      .select("perfil_id, perfiles!inner(rol, nombre)")
      .eq("proyecto_id", proyecto.id)
      .eq("perfil_id", closerId)
      .eq("perfiles.rol", "closer")
      .maybeSingle();
    if (!closer) throw new ErrorUsuario("Elige un closer del proyecto.");
    const fecha = aIso(fechaLocal, proyecto.zona_horaria);
    await db().from("citas").insert({ proyecto_id: proyecto.id, lead_id: leadId, closer_id: closerId, agendada_por: perfil.id, fecha, nota: nota || null, estrellas_caller: n });
    await db().from("leads").update({ estado_caller: "agendado", closer_id: closerId, llamar_en: null, estrellas_caller: n }).eq("id", leadId);
    const nombreCloser = (closer as unknown as { perfiles: { nombre: string } }).perfiles.nombre;
    await registrarActividad({ proyecto_id: proyecto.id, lead_id: leadId, perfil_id: perfil.id, tipo: "cita", resultado: "agendada", nota: `Cita con ${nombreCloser} · ${n}★${nota ? ` · ${nota}` : ""}` });
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
      const v = Number(String(formData.get(k) ?? "").replace(",", "."));
      return Number.isFinite(v) ? v : NaN;
    };
    const facturacion = num("facturacion");
    const cash = num("cash");
    if (!(facturacion > 0)) throw new ErrorUsuario("La facturación tiene que ser mayor que 0.");
    if (!(cash >= 0) || cash > facturacion) throw new ErrorUsuario("El cash collected tiene que estar entre 0 y la facturación.");
    const tipo = String(formData.get("tipo_pago") ?? "completo") as "completo" | "reserva" | "cuotas";
    const cuotas = tipo === "cuotas" ? Math.max(2, Math.round(num("num_cuotas")) || 2) : null;
    const metodo = String(formData.get("metodo") ?? "stripe");
    const fechaTxt = String(formData.get("fecha") ?? "");
    const fecha = fechaTxt ? aIso(`${fechaTxt}T12:00`, proyecto.zona_horaria) : new Date().toISOString();
    // Desde la cita (closer), las estrellas de cómo era el prospecto son obligatorias
    const estrellasCloser = formData.get("desde_cita") ? estrellasEntre(formData.get("estrellas"), 1, 5) : null;
    // La cita abierta de este lead (pasará a «cerrada»)
    const { data: cita } = await db()
      .from("citas")
      .select("id, closer_id")
      .eq("lead_id", leadId)
      .in("estado", ["pendiente", "confirmada", "seguimiento"])
      .order("fecha", { ascending: false })
      .limit(1)
      .maybeSingle();
    // Vendedor: al cerrar una cita, la venta es del closer de esa cita aunque la cierre
    // el director o el CEO; si no, quien la registra (o a quien elija un jefe).
    let vendedor = perfil.id;
    const vendedorForm = String(formData.get("vendedor") ?? "");
    if (formData.get("desde_cita") && cita?.closer_id) vendedor = cita.closer_id;
    else if (esJefe(perfil) && vendedorForm) vendedor = vendedorForm;
  
    const { error } = await db().from("ventas").insert({
      proyecto_id: proyecto.id,
      lead_id: leadId,
      producto_id: producto.id,
      vendedor_id: vendedor,
      facturacion,
      cash_collected: cash,
      tipo_pago: tipo,
      num_cuotas: cuotas,
      metodo,
      nota: String(formData.get("nota") ?? "") || null,
      fecha,
    });
    if (error) throw new ErrorUsuario(error.message);
  
    await db().from("leads").update({ estado_caller: "vendido" }).eq("id", leadId);
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
    await db().from("leads").update({ etapa_id: etapa.id, pipeline_id: etapa.pipeline_id }).eq("id", lead.id);
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
    await db().from("leads").update({ [campo]: personaId || null }).eq("id", leadId);
    const { data: p } = personaId ? await db().from("perfiles").select("nombre").eq("id", personaId).single() : { data: null };
    await registrarActividad({ proyecto_id: proyecto.id, lead_id: leadId, perfil_id: perfil.id, tipo: "asignacion", nota: `${campo === "caller_id" ? "Caller" : "Closer"}: ${p?.nombre ?? "sin asignar"}` });
    refrescar();
  });
}

// Tablero del caller: devolver un lead a «Nuevo» (por ejemplo, si se marcó por error).
export async function volverANuevo(leadId: string) {
  return seguro(async () => {
    const { perfil, proyecto } = await leadPermitido(leadId);
    await db().from("leads").update({ estado_caller: "nuevo", llamar_en: null }).eq("id", leadId);
    await registrarActividad({ proyecto_id: proyecto.id, lead_id: leadId, perfil_id: perfil.id, tipo: "nota", nota: "Devuelto a «Nuevo» en el tablero del caller" });
    refrescar();
  });
}
