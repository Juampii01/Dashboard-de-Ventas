"use server";

import { exigirSeccion } from "@/lib/permisos";
import { ErrorUsuario, seguro } from "@/lib/resultado";
import { revalidatePath } from "next/cache";
import { exigir, puedeRecursos } from "@/lib/auth";
import { db, escribir } from "@/lib/datos";
import { borrarSubida, leerSubida, prepararSubida } from "@/lib/subidas";

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

// Enlace firmado para que el navegador suba el PDF directo a Supabase (sin pasar por Vercel)
export async function prepararSubidaPdf() {
  return seguro(async () => {
    await exigirSeccion("recursos"); // H5
    const { proyecto } = await exigir(puedeRecursos);
    return prepararSubida("recursos", proyecto.id);
  });
}

export async function crearRecurso(_prev: unknown, formData: FormData) {
  // Arreglo 30: mismo envoltorio que el resto (lo inesperado no enseña detalles internos)
  return seguro(async () => {
    await exigirSeccion("recursos"); // H5
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
      // El navegador ya lo subió directo a Supabase (prepararSubidaPdf); aquí llega solo la ruta
      const ruta = String(formData.get("archivo_ruta") ?? "");
      if (!ruta) return { error: "Elige un PDF." };
      const { count } = await db().from("recursos").select("id", { count: "exact", head: true }).eq("archivo_path", ruta);
      if (count) return { error: "Ese archivo ya está guardado. Vuelve a elegirlo." };
      const archivo = await leerSubida("recursos", ruta, proyecto.id);
      // El tipo lo dice el navegador y se puede falsear: se comprueba que el archivo empieza como un PDF de verdad
      const cabecera = new TextDecoder().decode(new Uint8Array(await archivo.slice(0, 5).arrayBuffer()));
      if (cabecera !== "%PDF-") {
        await borrarSubida("recursos", ruta);
        return { error: "El archivo no es un PDF válido." };
      }
      fila.archivo_path = ruta;
    } else {
      const url = String(formData.get("url") ?? "").trim();
      if (!urlValida(url)) return { error: "Pon un enlace válido (https://…)." };
      fila.url = url;
    }
    const { error } = await db().from("recursos").insert(fila);
    if (error) {
      if (fila.archivo_path) await borrarSubida("recursos", fila.archivo_path as string);
      return { error: error.message };
    }
    revalidatePath("/recursos");
    return { ok: "Recurso añadido." };
  });
}

export async function borrarRecurso(id: string) {
  return seguro(async () => {
    await exigirSeccion("recursos"); // H5
    const { proyecto } = await exigir(puedeRecursos);
    const { data } = await db().from("recursos").select("archivo_path").eq("id", id).eq("proyecto_id", proyecto.id).maybeSingle();
    if (!data) throw new ErrorUsuario("Recurso no encontrado.");
    if (data.archivo_path) await db().storage.from("recursos").remove([data.archivo_path]);
    await escribir(db().from("recursos").delete().eq("id", id), "recursos");
    revalidatePath("/recursos");
  });
}

export async function guardarLinkPago(productoId: string, url: string) {
  return seguro(async () => {
    await exigirSeccion("recursos"); // H5
    const { proyecto } = await exigir(puedeRecursos);
    const limpio = url.trim();
    if (limpio && !urlValida(limpio)) throw new ErrorUsuario("Pon un enlace válido (https://…).");
    await escribir(db().from("productos").update({ link_pago: limpio || null }).eq("id", productoId).eq("proyecto_id", proyecto.id), "productos");
    revalidatePath("/recursos");
  });
}
