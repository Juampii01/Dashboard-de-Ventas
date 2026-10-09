import "server-only";
import { db } from "@/lib/datos";

// Límite de intentos (ventana deslizante) guardado en la base de datos (arreglo 4 de la auditoría):
// todas las copias del servidor en Vercel comparten la misma cuenta. Funciones en la migración
// 20261011100000_limite_intentos.sql. `ahora` solo se pasa en los tests.
// Si la base no responde, se deja pasar (y se registra): sin base tampoco funciona el login ni el webhook.

const iso = (ahora?: number) => (ahora === undefined ? undefined : new Date(ahora).toISOString());

async function rpc<T>(funcion: string, args: Record<string, unknown>, siFalla: T): Promise<T> {
  const { data, error } = await db().rpc(funcion, args);
  if (error) {
    console.error(`[límite] ${funcion} falló:`, error.message);
    return siFalla;
  }
  return data as T;
}

// Webhooks: si cabe, lo apunta y devuelve true
export function dentroDelLimite(clave: string, maximo: number, ventanaMs: number, ahora?: number) {
  return rpc<boolean>("limite_dentro", { p_clave: clave, p_maximo: maximo, p_ventana_ms: ventanaMs, p_ahora: iso(ahora) }, true);
}

// Para contar solo los fallos (login): primero se mira, y solo se anota si falla.
export function bloqueado(clave: string, maximo: number, ventanaMs: number, ahora?: number) {
  return rpc<boolean>("limite_bloqueado", { p_clave: clave, p_maximo: maximo, p_ventana_ms: ventanaMs, p_ahora: iso(ahora) }, false);
}
export async function anotar(clave: string, ahora?: number) {
  await rpc<null>("limite_anotar", { p_clave: clave, p_ahora: iso(ahora) }, null);
}

// Solo para los tests
export async function reiniciarLimites() {
  await db().from("limite_intentos").delete().gte("id", 0);
}
