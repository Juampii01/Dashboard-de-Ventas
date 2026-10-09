import type { Respuesta } from "@/lib/tipos";
import { notaLead, type Pesos } from "@/lib/cualificacion";

// Puntuación simple (sin IA) para ordenar a quién llamar primero,
// según las respuestas del formulario. Más alto = antes.
export function puntuacion(respuestas: Respuesta[]): number {
  let p = 0;
  for (const r of respuestas) {
    const q = r.pregunta.toLowerCase();
    const a = (r.respuesta ?? "").toLowerCase();
    if (q.includes("invertir")) p += a.startsWith("sí") || a.startsWith("si") ? 40 : a.startsWith("en los") ? 20 : 0;
    if (q.includes("cuándo") || q.includes("cuando")) p += a.includes("ya mismo") ? 25 : a.includes("este mes") ? 15 : 0;
    if (q.includes("tiempo")) p += a.includes("más de 20") ? 15 : a.includes("10 a 20") ? 12 : a.includes("5 a 10") ? 8 : 0;
    if (q.includes("situación") || q.includes("situacion")) p += a.includes("negocio") || a.includes("agencia") ? 12 : a.includes("freelance") ? 8 : a.includes("empleado") ? 5 : 0;
    if (q.includes("experiencia")) p += a.includes("vendí") ? 8 : a.includes("automatizo") ? 6 : a.includes("chatgpt") ? 3 : 0;
  }
  return p;
}

export function nivel(p: number): { texto: string; tono: "ok" | "aviso" | "neutro" } {
  if (p >= 70) return { texto: "Prioridad A", tono: "ok" };
  if (p >= 40) return { texto: "Prioridad B", tono: "aviso" };
  return { texto: "Prioridad C", tono: "neutro" };
}

// Priorización con IA (V2-11, decisión de Cristian): si hay Scoring IA, la nota 0-100 que sale de él
// (50 = neutro si sus respuestas no aparecen en el scoring); si no, la puntuación simple de siempre.
export function puntosLead(respuestas: Respuesta[], pesos: Pesos | null) {
  if (pesos && Object.keys(pesos).length) return notaLead(respuestas, pesos) ?? 50;
  return puntuacion(respuestas);
}
