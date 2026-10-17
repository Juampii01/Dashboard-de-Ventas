"use server";

import { ErrorUsuario, seguro } from "@/lib/resultado";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { COOKIE_PROYECTO, getSesion } from "@/lib/auth";

const UN_ANO = 60 * 60 * 24 * 365;

// Velocidad (17 oct 2026): lo llama avisos-en-vivo.tsx cuando otro cambia algo del proyecto. Borra todo lo guardado
// en el navegador (no solo la página actual, como router.refresh) y trae de nuevo la página que se está viendo.
export async function refrescarTodo() {
  await getSesion(); // solo con sesión
  revalidatePath("/", "layout");
}

export async function cambiarProyecto(proyectoId: string) {
  return seguro(async () => {
    const { proyectos } = await getSesion();
    if (!proyectos.some((p) => p.id === proyectoId)) throw new ErrorUsuario("Proyecto no permitido.");
    (await cookies()).set(COOKIE_PROYECTO, proyectoId, { path: "/", maxAge: UN_ANO, sameSite: "lax" });
    revalidatePath("/", "layout");
  });
}
