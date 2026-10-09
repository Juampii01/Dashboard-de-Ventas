"use server";

import { ErrorUsuario, seguro } from "@/lib/resultado";
import { revalidatePath } from "next/cache";
import { exigir, puedeRecursos } from "@/lib/auth";
import { db } from "@/lib/datos";

const TIPOS = ["pdf", "enlace", "guion", "video"] as const;
const ROLES = ["todos", "caller", "closer"] as const;

function urlValida(u: string) {
  try {
    const x = new URL(u);
    return x.protocol === "https:" || x.protocol === "http:";
  } catch {
    return false;
  }
}

export async function crearRecurso(_prev: unknown, formData: FormData) {
  try {
    const { perfil, proyecto } = await exigir(puedeRecursos);
    const titulo = String(formData.get("titulo") ?? "").trim();
    const tipo = String(formData.get("tipo")) as (typeof TIPOS)[number];
    const paraRol = String(formData.get("para_rol") ?? "todos") as (typeof ROLES)[number];
    if (!titulo) return { error: "Pon un título." };
    if (!TIPOS.includes(tipo) || !ROLES.includes(paraRol)) return { error: "Tipo no válido." };

    const fila: Record<string, unknown> = { proyecto_id: proyecto.id, titulo, tipo, para_rol: paraRol, creado_por: perfil.id };
    if (tipo === "guion") {
      const contenido = String(formData.get("contenido") ?? "").trim();
      if (!contenido) return { error: "Escribe el guion." };
      fila.contenido = contenido;
    } else if (tipo === "pdf") {
      const archivo = formData.get("archivo");
      if (!(archivo instanceof File) || archivo.size === 0) return { error: "Elige un PDF." };
      if (archivo.type !== "application/pdf") return { error: "El archivo tiene que ser PDF." };
      if (archivo.size > 15 * 1024 * 1024) return { error: "El PDF pesa más de 15 MB." };
      // El tipo lo dice el navegador y se puede falsear: se comprueba que el archivo empieza como un PDF de verdad
      const cabecera = new TextDecoder().decode(new Uint8Array(await archivo.slice(0, 5).arrayBuffer()));
      if (cabecera !== "%PDF-") return { error: "El archivo no es un PDF válido." };
      const ruta = `${proyecto.id}/${crypto.randomUUID()}.pdf`;
      const { error } = await db().storage.from("recursos").upload(ruta, archivo, { contentType: "application/pdf" });
      if (error) return { error: `No se pudo subir: ${error.message}` };
      fila.archivo_path = ruta;
    } else {
      const url = String(formData.get("url") ?? "").trim();
      if (!urlValida(url)) return { error: "Pon un enlace válido (https://…)." };
      fila.url = url;
    }
    const { error } = await db().from("recursos").insert(fila);
    if (error) return { error: error.message };
    revalidatePath("/recursos");
    return { ok: "Recurso añadido." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error." };
  }
}

export async function borrarRecurso(id: string) {
  return seguro(async () => {
    const { proyecto } = await exigir(puedeRecursos);
    const { data } = await db().from("recursos").select("archivo_path").eq("id", id).eq("proyecto_id", proyecto.id).maybeSingle();
    if (!data) throw new ErrorUsuario("Recurso no encontrado.");
    if (data.archivo_path) await db().storage.from("recursos").remove([data.archivo_path]);
    await db().from("recursos").delete().eq("id", id);
    revalidatePath("/recursos");
  });
}

export async function guardarLinkPago(productoId: string, url: string) {
  return seguro(async () => {
    const { proyecto } = await exigir(puedeRecursos);
    const limpio = url.trim();
    if (limpio && !urlValida(limpio)) throw new ErrorUsuario("Pon un enlace válido (https://…).");
    await db().from("productos").update({ link_pago: limpio || null }).eq("id", productoId).eq("proyecto_id", proyecto.id);
    revalidatePath("/recursos");
  });
}
