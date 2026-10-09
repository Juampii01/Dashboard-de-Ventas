import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { ErrorUsuario } from "@/lib/resultado";

// Arreglo 3 de la auditoría (decisión de Cristian, 10 oct 2026): el token de GHL y las API keys de
// Fathom se guardan cifradas con AES-256-GCM. La clave maestra vive solo en el servidor
// (variable CLAVE_CIFRADO, 32 bytes en base64): con la base de datos sola no se pueden leer.
// Formato guardado: "v1:" + base64(iv de 12 bytes | etiqueta de 16 bytes | texto cifrado).
const PREFIJO = "v1:";

function claveMaestra() {
  const b64 = process.env.CLAVE_CIFRADO;
  if (!b64) throw new ErrorUsuario("Falta la variable CLAVE_CIFRADO en el servidor (ver .env.example).");
  const clave = Buffer.from(b64, "base64");
  if (clave.length !== 32) throw new ErrorUsuario("CLAVE_CIFRADO tiene que ser de 32 bytes en base64 (ver .env.example).");
  return clave;
}

export function cifrar(texto: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", claveMaestra(), iv);
  const cifrado = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return PREFIJO + Buffer.concat([iv, c.getAuthTag(), cifrado]).toString("base64");
}

// `que` va con artículo («el token de GHL», «la API key de Fathom») para los mensajes
export function descifrar(valor: string, que: string) {
  if (!valor.startsWith(PREFIJO)) throw new ErrorUsuario(`Hay que volver a pegar ${que}: lo guardado no está cifrado.`);
  const clave = claveMaestra();
  const datos = Buffer.from(valor.slice(PREFIJO.length), "base64");
  try {
    const d = createDecipheriv("aes-256-gcm", clave, datos.subarray(0, 12));
    d.setAuthTag(datos.subarray(12, 28));
    return Buffer.concat([d.update(datos.subarray(28)), d.final()]).toString("utf8");
  } catch {
    // Otra clave maestra o un valor alterado
    throw new ErrorUsuario(`Hay que volver a pegar ${que}: no se pudo descifrar lo guardado (¿ha cambiado CLAVE_CIFRADO?).`);
  }
}
