// Orden al arrastrar (Fase 4): el elemento arrastrado ocupa el sitio de aquel sobre el que se suelta.
// Devuelve una lista nueva (no toca la original); si algo no cuadra, la devuelve igual.
export function reordenar<T>(lista: readonly T[], desde: T, hasta: T): T[] {
  const i = lista.indexOf(desde);
  const j = lista.indexOf(hasta);
  if (i < 0 || j < 0 || i === j) return [...lista];
  const copia = lista.filter((_, k) => k !== i);
  copia.splice(j, 0, desde);
  return copia;
}

// Tipos de lo que se arrastra, para no confundir una columna con una tarjeta
export const ARRASTRE_COLUMNA = "application/x-eternity-columna";
export const ARRASTRE_PIPELINE = "application/x-eternity-pipeline";
