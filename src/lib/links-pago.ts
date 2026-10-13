// Fase 7 (Cristian, 12 oct 2026): un programa puede tener varios links de pago (un pago, 2 meses, 4 semanas…).
// Al pulsar «Links de pago» salen todos en una ventana. El de Reserva va aparte y vale para cualquier programa.
export type LinkPago = { nombre: string; url: string };

export const MAX_LINKS = 12;
export const esHttps = (u: string) => /^https:\/\/[^\s]+$/i.test(u.trim());

// Limpia la lista que llega del editor o de la base: sin vacíos, solo https, sin repetidos y con nombre
export function linksValidos(v: unknown): LinkPago[] {
  if (!Array.isArray(v)) return [];
  const vistos = new Set<string>();
  const fuera: LinkPago[] = [];
  for (const x of v) {
    if (!x || typeof x !== "object") continue;
    const url = typeof (x as LinkPago).url === "string" ? (x as LinkPago).url.trim() : "";
    const nombre = typeof (x as LinkPago).nombre === "string" ? (x as LinkPago).nombre.trim().slice(0, 60) : "";
    if (!url || !esHttps(url) || vistos.has(url)) continue;
    vistos.add(url);
    fuera.push({ nombre: nombre || "Link de pago", url });
    if (fuera.length >= MAX_LINKS) break;
  }
  return fuera;
}

// Los links que se enseñan de un producto: su lista o, si está vacía, el link de pago de siempre
export function linksDe(p: { links_pago?: unknown; link_pago?: string | null }): LinkPago[] {
  const lista = linksValidos(p.links_pago);
  if (lista.length) return lista;
  return p.link_pago && esHttps(p.link_pago) ? [{ nombre: "Link de pago", url: p.link_pago }] : [];
}
