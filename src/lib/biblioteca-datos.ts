import "server-only";
import { db, todas } from "@/lib/datos";
import { calcularOferta, esDeBiblioteca, normalizarRespuestas } from "@/lib/oferta";
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
