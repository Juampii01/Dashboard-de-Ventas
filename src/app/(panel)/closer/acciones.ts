"use server";

import { ErrorUsuario, seguro } from "@/lib/resultado";
import { revalidatePath } from "next/cache";
import { getSesion, esJefe } from "@/lib/auth";
import { db, registrarActividad } from "@/lib/datos";
import { localAIso, ETIQUETA_ESTADO_CITA } from "@/lib/formato";
import type { Cita, EstadoCita } from "@/lib/tipos";

const PERMITIDOS: EstadoCita[] = ["pendiente", "confirmada", "no_califica", "seguimiento", "no_show", "cancelada", "perdida", "cerrada"];

async function citaPermitida(citaId: string) {
  const { perfil, proyecto } = await getSesion();
  const { data: cita } = await db().from("citas").select("*").eq("id", citaId).eq("proyecto_id", proyecto.id).maybeSingle<Cita>();
  if (!cita) throw new ErrorUsuario("Cita no encontrada.");
  if (!esJefe(perfil) && cita.closer_id !== perfil.id) throw new ErrorUsuario("Esta cita no es tuya.");
  return { cita, perfil, proyecto };
}

export async function cambiarEstadoCita(citaId: string, estado: EstadoCita, nota: string) {
  return seguro(async () => {
    if (!PERMITIDOS.includes(estado)) throw new ErrorUsuario("Estado no válido.");
    const { cita, perfil, proyecto } = await citaPermitida(citaId);
    await db().from("citas").update({ estado, nota: nota || cita.nota }).eq("id", citaId);
    await registrarActividad({
      proyecto_id: proyecto.id,
      lead_id: cita.lead_id,
      perfil_id: perfil.id,
      tipo: "cita",
      resultado: estado,
      nota: `Cita → ${ETIQUETA_ESTADO_CITA[estado]}${nota ? ` · ${nota}` : ""}`,
    });
    // Mover el lead en el CRM según el resultado
    const columna: Partial<Record<EstadoCita, string[]>> = {
      seguimiento: ["en seguimiento", "seguimiento"],
      perdida: ["descartados", "descartado"],
      no_califica: ["descartados", "descartado"],
    };
    const nombres = columna[estado];
    if (nombres) {
      const { data: lead } = await db().from("leads").select("id, pipeline_id").eq("id", cita.lead_id).single();
      if (lead?.pipeline_id) {
        const { data: etapas } = await db().from("etapas").select("id, nombre").eq("pipeline_id", lead.pipeline_id);
        const destino = (etapas ?? []).find((e) => nombres.includes(e.nombre.toLowerCase()));
        if (destino) await db().from("leads").update({ etapa_id: destino.id }).eq("id", lead.id);
      }
    }
    revalidatePath("/", "layout");
  });
}

export async function reagendarCita(citaId: string, fechaLocal: string) {
  return seguro(async () => {
    const { cita, perfil, proyecto } = await citaPermitida(citaId);
    if (!fechaLocal) throw new ErrorUsuario("Elige la nueva fecha.");
    const fecha = localAIso(fechaLocal, proyecto.zona_horaria);
    await db().from("citas").update({ estado: "reagendada" }).eq("id", citaId);
    await db().from("citas").insert({
      proyecto_id: proyecto.id,
      lead_id: cita.lead_id,
      closer_id: cita.closer_id,
      agendada_por: cita.agendada_por ?? perfil.id, // la agenda sigue siendo mérito de quien la consiguió
      fecha,
      nota: cita.nota,
    });
    await registrarActividad({ proyecto_id: proyecto.id, lead_id: cita.lead_id, perfil_id: perfil.id, tipo: "cita", resultado: "reagendada", nota: "Cita reagendada" });
    revalidatePath("/", "layout");
  });
}
