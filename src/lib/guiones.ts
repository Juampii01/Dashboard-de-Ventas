// Fase 6 · Guion de llamadas (Cristian, 12 oct 2026): un guion para el caller y otro para el closer, por pasos,
// cada paso con su checklist y sus pistas, y una lista de objeciones con su respuesta. Lo editan el CEO y los
// directores; mientras no pongan el suyo, sale este de ejemplo. Sin base de datos: se prueba con tests.

export type RolGuion = "caller" | "closer";
export type PasoGuion = { id: string; titulo: string; texto: string; checklist: string[]; pistas: string[] };
export type Objecion = { id: string; objecion: string; respuesta: string };
export type Guion = { pasos: PasoGuion[]; objeciones: Objecion[] };
// Lo que marcó una persona en una llamada: por paso, los índices de su checklist marcados
export type Marcas = Record<string, number[]>;

export const LIMITES = { pasos: 15, checklist: 10, pistas: 8, objeciones: 30, texto: 1500, linea: 200 };

const id = (prefijo: string, i: number) => `${prefijo}${i + 1}`;

// Guiones de ejemplo (Cristian, 12 oct: «exacto, ponlo así»; los reales los carga él después)
export const GUION_EJEMPLO: Record<RolGuion, Guion> = {
  caller: {
    pasos: [
      { id: "p1", titulo: "Saludo y permiso", texto: "Hola {nombre}, soy {tu nombre} de Código MaestrIA. Te escribo porque descargaste la biblioteca de recursos. ¿Tienes 3 minutos?", checklist: ["Me presenté con nombre y empresa", "Pedí permiso para hablar"], pistas: ["Sonríe al hablar: se nota en la voz", "Si no puede, agenda otro momento con «Llamar luego»"] },
      { id: "p2", titulo: "Situación", texto: "¿A qué te dedicas ahora mismo y qué te llevó a descargar la biblioteca?", checklist: ["Sé a qué se dedica", "Sé por qué descargó la biblioteca"], pistas: ["Mira antes sus respuestas del formulario en la ficha", "Escucha más de lo que hablas"] },
      { id: "p3", titulo: "Objetivo y dolor", texto: "¿Qué te gustaría conseguir en los próximos 90 días? ¿Qué te lo está impidiendo hoy?", checklist: ["Tengo su objetivo con una cifra", "Tengo lo que le frena"], pistas: ["Repite su objetivo con sus palabras"] },
      { id: "p4", titulo: "Encaje", texto: "Por lo que me cuentas, tiene sentido que hables con {closer}, que te enseña cómo lo hacemos. ¿Te viene bien esta semana?", checklist: ["Le expliqué el siguiente paso", "Aceptó la llamada"], pistas: ["Si duda, usa las objeciones de abajo"] },
      { id: "p5", titulo: "Cierre: link de agenda", texto: "Te mando ahora el link para que elijas la hora que mejor te venga.", checklist: ["Mandé el link", "Confirmé que le llegó"], pistas: ["Marca «Link enviado» con sus estrellas"] },
    ],
    objeciones: [
      { id: "o1", objecion: "No tengo tiempo", respuesta: "Lo entiendo. Justo por eso la llamada es corta y te dice si encaja contigo o no. ¿Qué día tienes 30 minutos?" },
      { id: "o2", objecion: "No tengo dinero", respuesta: "En esta llamada no se compra nada: es para ver si tiene sentido. Si encaja, hay varias formas de pago." },
      { id: "o3", objecion: "Mándame información", respuesta: "Claro. Para mandarte lo que de verdad te sirve, ¿qué es lo que más te interesa conseguir?" },
      { id: "o4", objecion: "Lo tengo que pensar", respuesta: "Perfecto. ¿Qué es lo que te gustaría tener claro para decidir? Lo vemos en la llamada." },
    ],
  },
  closer: {
    pasos: [
      { id: "p1", titulo: "Conexión", texto: "Hola {nombre}, gracias por venir. Antes de nada, ¿cómo estás y desde dónde nos conectas?", checklist: ["Rompí el hielo", "Expliqué cómo va la llamada"], pistas: ["Lee la nota del caller y sus estrellas antes de empezar"] },
      { id: "p2", titulo: "Diagnóstico", texto: "Cuéntame tu situación ahora mismo y qué has probado hasta hoy.", checklist: ["Situación actual", "Lo que ha probado", "Por qué ahora"], pistas: ["Pregunta, no vendas todavía"] },
      { id: "p3", titulo: "Objetivo y coste de no actuar", texto: "¿Dónde quieres estar en 12 meses? ¿Qué pasa si sigues igual?", checklist: ["Objetivo con cifra", "Coste de no hacer nada"], pistas: ["Deja silencios: que lo piense"] },
      { id: "p4", titulo: "Presentación", texto: "Te cuento cómo lo hacemos y qué resultados tienen otros como tú.", checklist: ["Expliqué el programa", "Conté un caso parecido"], pistas: ["Conecta cada parte con su objetivo"] },
      { id: "p5", titulo: "Cierre", texto: "¿Ves que esto te lleva a tu objetivo? La inversión es {precio}. ¿Cómo prefieres hacerlo?", checklist: ["Di el precio", "Pregunté por la forma de pago", "Registré el resultado"], pistas: ["Tras decir el precio, calla", "Usa los links de pago de Programas"] },
    ],
    objeciones: [
      { id: "o1", objecion: "Es caro", respuesta: "Entiendo. Comparado con seguir igual 12 meses más, ¿cuánto te cuesta no hacerlo? Además hay pago en cuotas." },
      { id: "o2", objecion: "Lo tengo que hablar con mi pareja", respuesta: "Me parece bien. Si fuera solo tu decisión, ¿lo harías? ¿Qué crees que te va a preguntar?" },
      { id: "o3", objecion: "No es el momento", respuesta: "¿Qué tendría que pasar para que sea el momento? Lo que me cuentas suele empeorar si se espera." },
      { id: "o4", objecion: "Necesito pensarlo", respuesta: "Claro. ¿Qué parte quieres pensar? Mejor resolverlo ahora que me tienes aquí." },
    ],
  },
};

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const lineas = (v: unknown, max: number) => (Array.isArray(v) ? v.map((x) => texto(x, LIMITES.linea)).filter(Boolean).slice(0, max) : []);

// Limpia un guion que llega de la base o del editor: recorta, quita vacíos y pone ids únicos
export function guionValido(v: unknown): Guion | null {
  if (!v || typeof v !== "object") return null;
  const g = v as { pasos?: unknown; objeciones?: unknown };
  const pasos = (Array.isArray(g.pasos) ? g.pasos : [])
    .map((p) => p as Record<string, unknown>)
    .map((p) => ({ titulo: texto(p?.titulo, 80), texto: texto(p?.texto, LIMITES.texto), checklist: lineas(p?.checklist, LIMITES.checklist), pistas: lineas(p?.pistas, LIMITES.pistas) }))
    .filter((p) => p.titulo)
    .slice(0, LIMITES.pasos)
    .map((p, i) => ({ id: id("p", i), ...p }));
  const objeciones = (Array.isArray(g.objeciones) ? g.objeciones : [])
    .map((o) => o as Record<string, unknown>)
    .map((o) => ({ objecion: texto(o?.objecion, LIMITES.linea), respuesta: texto(o?.respuesta, LIMITES.texto) }))
    .filter((o) => o.objecion && o.respuesta)
    .slice(0, LIMITES.objeciones)
    .map((o, i) => ({ id: id("o", i), ...o }));
  if (!pasos.length) return null;
  return { pasos, objeciones };
}

// Cuántos puntos de la checklist marcó (y de cuántos), solo con los pasos que existen en el guion
export function resumenMarcas(guion: Guion, marcas: Marcas) {
  let hechos = 0;
  let total = 0;
  for (const p of guion.pasos) {
    total += p.checklist.length;
    hechos += new Set((marcas[p.id] ?? []).filter((i) => Number.isInteger(i) && i >= 0 && i < p.checklist.length)).size;
  }
  return { hechos, total };
}

// «{nombre}» y compañía del texto del guion, con los datos del lead
export function rellenar(textoGuion: string, datos: Record<string, string | null | undefined>) {
  return textoGuion.replace(/\{(\w[\w ]*)\}/g, (todo, clave: string) => datos[clave.trim()] || todo);
}
