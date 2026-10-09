import "server-only";

// Límite de intentos en memoria (ventana deslizante).
// AVISO: vive en la memoria de cada servidor. En local y con un solo servidor es exacto;
// en Vercel cada instancia lleva su propia cuenta, así que el límite real puede ser algo mayor.
const registros = new Map<string, number[]>();

export function dentroDelLimite(clave: string, maximo: number, ventanaMs: number, ahora = Date.now()) {
  const recientes = (registros.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
  if (recientes.length >= maximo) {
    registros.set(clave, recientes);
    return false;
  }
  recientes.push(ahora);
  registros.set(clave, recientes);
  // Limpieza para que el mapa no crezca sin fin
  if (registros.size > 5000) {
    for (const [k, v] of registros) if (!v.some((t) => ahora - t < ventanaMs)) registros.delete(k);
  }
  return true;
}

// Para contar solo los fallos (login): primero se mira, y solo se anota si falla.
export function bloqueado(clave: string, maximo: number, ventanaMs: number, ahora = Date.now()) {
  return (registros.get(clave) ?? []).filter((t) => ahora - t < ventanaMs).length >= maximo;
}
export function anotar(clave: string, ahora = Date.now()) {
  registros.set(clave, [...(registros.get(clave) ?? []), ahora]);
}

export function reiniciarLimites() {
  registros.clear();
}
