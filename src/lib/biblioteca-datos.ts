import "server-only";
import { db, todas } from "@/lib/datos";
import { calcularOferta, esDeBiblioteca, normalizarRespuestas, type Oferta } from "@/lib/oferta";
import { filasDeGrupos, resumenBiblioteca, resumenDeFilas, type GrupoBiblioteca } from "@/lib/biblioteca";
import type { Respuesta } from "@/lib/tipos";

// Bloque A: los leads de la Biblioteca de un proyecto, con lo que enseña su tabla
export type FilaBiblioteca = {
  id: string;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  creado_en: string;
  etiquetas: string[];
  respuestas: Respuesta[];
  fuente: string | null;
  oferta: string | null;
  caller_id: string | null;
  closer_id: string | null;
  estado_caller: string;
};

export async function cargarBiblioteca(proyectoId: string) {
  const filas = await todas<FilaBiblioteca>((a, b) =>
    db().from("leads").select("id, nombre, apellido, email, telefono, creado_en, etiquetas, respuestas, fuente, oferta, caller_id, closer_id, estado_caller").eq("proyecto_id", proyectoId).order("id").range(a, b)
  );
  const deBiblioteca = filas.filter((l) => esDeBiblioteca(l));
  await recalcularOfertas(deBiblioteca);
  return deBiblioteca;
}

// Velocidad (17 oct 2026): para el resumen de la página (KPIs → Biblioteca), solo las columnas que usa y sin repasar
// las ofertas (medido: 68 ms por visita para 0 cambios). Las repasa la tabla, que se pide en la misma visita
// justo después de pintar (cargarBiblioteca), así que la regla de las ofertas se sigue aplicando.
export type FilaResumenBiblioteca = Pick<FilaBiblioteca, "id" | "telefono" | "etiquetas" | "respuestas" | "fuente" | "oferta">;
export async function cargarResumenBiblioteca(proyectoId: string) {
  const filas = await todas<FilaResumenBiblioteca>((a, b) =>
    db().from("leads").select("id, telefono, etiquetas, respuestas, fuente, oferta").eq("proyecto_id", proyectoId).order("id").range(a, b)
  );
  return filas.filter((l) => esDeBiblioteca(l));
}

// Pone al día la oferta (y el nombre único de las preguntas) de los que no la tengan bien: así los leads que ya
// estaban antes de existir la oferta, o si la regla cambia, se ordenan solos al abrir la Biblioteca
export async function recalcularOfertas(leads: FilaBiblioteca[]) {
  const cambiar = leads
    .map((l) => ({ l, oferta: calcularOferta(l), respuestas: normalizarRespuestas(l.respuestas ?? []) }))
    .filter(({ l, oferta, respuestas }) => oferta !== l.oferta || JSON.stringify(respuestas) !== JSON.stringify(l.respuestas ?? []));
  for (let i = 0; i < cambiar.length; i += 50) {
    await Promise.all(
      cambiar.slice(i, i + 50).map(async ({ l, oferta, respuestas }) => {
        const { error } = await db().from("leads").update({ oferta, respuestas }).eq("id", l.id);
        if (error) throw new Error(`No se pudo guardar la oferta: ${error.message}`);
        l.oferta = oferta;
        l.respuestas = respuestas;
      })
    );
  }
  return cambiar.length;
}

// Velocidad (17 oct 2026): el resumen de KPIs → Biblioteca con lo pesado hecho en la base (biblioteca_filas, migración
// 20261017160000): llegan las personas agrupadas por lo que respondieron. Si la función no existe o falla, se calcula
// como antes, con todos los leads (plan B). Las cuentas son las mismas en los dos casos (resumenDeFilas).
export async function resumenDeLaBiblioteca(proyectoId: string) {
  // DESACTIVADO (17 oct 2026): con los datos reales no salía igual (faltaban personas). Hasta arreglarlo, como antes.
  const usarBase = false as boolean;
  if (usarBase) {
    const { data, error } = await db().rpc("biblioteca_filas", { p_proyecto: proyectoId });
    if (!error && data) return resumenDeFilas(filasDeGrupos(data as GrupoBiblioteca[]));
  }
  const leads = await cargarResumenBiblioteca(proyectoId);
  return resumenBiblioteca(leads.map((l) => ({ id: l.id, respuestas: l.respuestas, telefono: l.telefono, oferta: l.oferta as Oferta | null })));
}
