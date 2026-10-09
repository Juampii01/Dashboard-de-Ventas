import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

// PDF sencillo y legible: título, subtítulo y bloques de «etiqueta · valor» o tablas.
// La fuente estándar (Helvetica) solo escribe caracteres de Europa occidental (WinAnsi):
// el resto se sustituye para que el PDF no falle.
const PERMITIDOS = /[ -~ -ÿ€–—‘’“”•…]/;
export const limpiar = (s: string) =>
  Array.from(s.replace(/★/g, "*").replace(/[  ]/g, " "))
    .map((c) => (PERMITIDOS.test(c) ? c : "?"))
    .join("");

export type Bloque = { titulo: string; filas: [string, string][] } | { titulo: string; tabla: { cabecera: string[]; filas: string[][] } };

export async function generarPdf(titulo: string, subtitulo: string, bloques: Bloque[]) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(limpiar(titulo));
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);
  const [ancho, alto] = [595.28, 841.89]; // A4
  const margen = 48;
  let pagina: PDFPage = pdf.addPage([ancho, alto]);
  let y = alto - margen;
  const gris = rgb(0.4, 0.42, 0.48);
  const linea = rgb(0.86, 0.87, 0.9);
  const granate = rgb(0.42, 0.05, 0.09);

  const nueva = () => {
    pagina = pdf.addPage([ancho, alto]);
    y = alto - margen;
  };
  const escribir = (t: string, x: number, size: number, font: PDFFont, color = rgb(0.1, 0.11, 0.14), maxAncho?: number) => {
    let s = limpiar(t);
    if (maxAncho) while (s.length > 1 && font.widthOfTextAtSize(s, size) > maxAncho) s = s.slice(0, -2) + "…";
    pagina.drawText(s, { x, y, size, font, color });
  };

  escribir(titulo, margen, 20, negrita, granate);
  y -= 20;
  escribir(subtitulo, margen, 10, normal, gris);
  y -= 28;

  for (const b of bloques) {
    if (y < margen + 60) nueva();
    escribir(b.titulo.toUpperCase(), margen, 9, negrita, gris);
    y -= 14;
    if ("filas" in b) {
      for (const [k, v] of b.filas) {
        if (y < margen) nueva();
        escribir(k, margen, 10.5, normal, rgb(0.25, 0.27, 0.32), 300);
        const vv = limpiar(v);
        pagina.drawText(vv, { x: ancho - margen - negrita.widthOfTextAtSize(vv, 10.5), y, size: 10.5, font: negrita });
        y -= 6;
        pagina.drawLine({ start: { x: margen, y }, end: { x: ancho - margen, y }, thickness: 0.5, color: linea });
        y -= 12;
      }
    } else {
      const n = b.tabla.cabecera.length;
      const anchoCol = (ancho - 2 * margen - 120) / Math.max(n - 1, 1);
      const xCol = (i: number) => (i === 0 ? margen : margen + 120 + (i - 1) * anchoCol);
      b.tabla.cabecera.forEach((c, i) => escribir(c, xCol(i), 8, negrita, gris, i === 0 ? 115 : anchoCol - 4));
      y -= 14;
      for (const fila of b.tabla.filas) {
        if (y < margen) nueva();
        fila.forEach((c, i) => escribir(c, xCol(i), 9, i === 0 ? negrita : normal, undefined, i === 0 ? 115 : anchoCol - 4));
        y -= 6;
        pagina.drawLine({ start: { x: margen, y }, end: { x: ancho - margen, y }, thickness: 0.5, color: linea });
        y -= 12;
      }
    }
    y -= 14;
  }
  const paginas = pdf.getPages();
  paginas.forEach((pg, i) => pg.drawText(limpiar(`Eternity · ${i + 1} de ${paginas.length}`), { x: margen, y: 24, size: 8, font: normal, color: gris }));
  return pdf.save();
}
