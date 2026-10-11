"use server";

import { exigirSeccion } from "@/lib/permisos";
import { getSesion } from "@/lib/auth";
import { ErrorUsuario, seguro } from "@/lib/resultado";
import { localAIso } from "@/lib/formato";
import { closerLibreA } from "@/lib/agenda-libre";
import { closerDeRotacion, estadoRotacion } from "@/lib/rotacion";
import { TEXTO_MOTIVO } from "@/lib/disponibilidad";

// Bloque 3 de 1.0: al elegir la hora en una ventana de agendar, qué closer propone o decide la rotación
// y si el closer elegido está libre (si no, se avisa; con «lo elige quien agenda» se puede agendar igual).
export async function consultarAgenda(fechaLocal: string, closerId: string | null) {
  return seguro(async () => {
    await exigirSeccion("cola", "crm", "agendas", "clientes");
    const { proyecto } = await getSesion();
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(fechaLocal)) throw new ErrorUsuario("Fecha no válida.");
    const inicio = new Date(localAIso(fechaLocal, proyecto.zona_horaria));
    const base = await estadoRotacion(proyecto);
    let propuesto: string | null = null;
    if (base.encendida && base.modo !== "elige") propuesto = (await closerDeRotacion(proyecto, inicio)).closer;
    const efectivo = base.encendida && base.modo === "decide" ? propuesto : closerId;
    let aviso: string | null = null;
    if (efectivo) {
      const libre = await closerLibreA(proyecto, efectivo, inicio);
      if (!libre.libre) aviso = `${base.nombres.get(efectivo) ?? "Ese closer"}: ${TEXTO_MOTIVO[libre.motivo].toLowerCase()}.`;
    }
    return {
      modo: base.encendida ? base.modo : ("elige" as const),
      propuesto: propuesto ? { id: propuesto, nombre: base.nombres.get(propuesto) ?? "—" } : null,
      ningunoLibre: base.encendida && base.modo !== "elige" && !propuesto,
      aviso,
    };
  });
}
