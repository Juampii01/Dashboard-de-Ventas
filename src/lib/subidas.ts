import "server-only";
import { db } from "@/lib/datos";
import { ErrorUsuario } from "@/lib/resultado";
import { MAX_SUBIDA } from "@/lib/subir-cliente";

// Vercel no acepta peticiones de más de 4,5 MB: los archivos no pasan por el servidor de la app.
// El servidor da un enlace firmado (solo vale para esa ruta), el navegador sube directo a Supabase
// y la acción recibe solo la ruta. Cada bucket limita tamaño y tipo (migración 20261011090000).
const BUCKETS = {
  recursos: "pdf",
  importaciones: "csv",
} as const;
export type BucketSubida = keyof typeof BUCKETS;

export async function prepararSubida(bucket: BucketSubida, proyectoId: string) {
  const ruta = `${proyectoId}/${crypto.randomUUID()}.${BUCKETS[bucket]}`;
  const { data, error } = await db().storage.from(bucket).createSignedUploadUrl(ruta);
  if (error || !data) throw new Error(`No se pudo preparar la subida: ${error?.message}`);
  return { ruta, url: data.signedUrl };
}

// Solo rutas que haya podido crear prepararSubida para este proyecto
export function rutaDeSubidaValida(bucket: BucketSubida, ruta: string, proyectoId: string) {
  return new RegExp(`^${proyectoId}/[0-9a-f-]{36}\\.${BUCKETS[bucket]}$`).test(ruta);
}

export async function leerSubida(bucket: BucketSubida, ruta: string, proyectoId: string): Promise<Blob> {
  if (!rutaDeSubidaValida(bucket, ruta, proyectoId)) throw new ErrorUsuario("Archivo no válido. Vuelve a elegirlo.");
  const { data, error } = await db().storage.from(bucket).download(ruta);
  if (error || !data) throw new ErrorUsuario("No se encontró el archivo subido. Vuelve a elegirlo.");
  if (data.size > MAX_SUBIDA) {
    await borrarSubida(bucket, ruta);
    throw new ErrorUsuario("El archivo pesa más de 15 MB.");
  }
  return data;
}

export async function borrarSubida(bucket: BucketSubida, ruta: string) {
  await db().storage.from(bucket).remove([ruta]);
}
