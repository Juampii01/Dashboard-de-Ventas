"use server";

import { exigirSeccion } from "@/lib/permisos";
import { getSesion } from "@/lib/auth";
import { ErrorUsuario, seguro } from "@/lib/resultado";
import { localAIso } from "@/lib/formato";
import { db } from "@/lib/datos";
import { closerLibreA, tieneHorario } from "@/lib/agenda-libre";
import { TEXTO_MOTIVO } from "@/lib/disponibilidad";

// Al elegir la hora en una ventana de agendar a mano: si el closer elegido está libre (si no, se avisa y se puede
// agendar igual). La rotación de closers se quitó el 11 oct (4.4): el closer de las citas por link lo pone GHL.
export async function consultarAgenda(fechaLocal: string, closerId: string | null) {
  return seguro(async () => {
    await exigirSeccion("cola", "crm", "agendas", "clientes");
    const { proyecto } = await getSesion();
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(fechaLocal)) throw new ErrorUsuario("Fecha no válida.");
    const inicio = new Date(localAIso(fechaLocal, proyecto.zona_horaria));
    let aviso: string | null = null;
    if (closerId) {
      const libre = await closerLibreA(proyecto, closerId, inicio);
      if (!libre.libre) {
        const sinHorario = libre.motivo === "fuera_horario" && !(await tieneHorario(proyecto.id, closerId));
        const { data: p } = await db().from("perfiles").select("nombre").eq("id", closerId).maybeSingle();
        aviso = `${p?.nombre ?? "Ese closer"}: ${sinHorario ? "no tiene horario puesto" : TEXTO_MOTIVO[libre.motivo].toLowerCase()}.`;
      }
    }
    return { aviso };
  });
}
