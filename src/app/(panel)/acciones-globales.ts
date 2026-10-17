"use server";

import { ErrorUsuario, seguro } from "@/lib/resultado";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { COOKIE_PROYECTO, getSesion } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";

const UN_ANO = 60 * 60 * 24 * 365;

// Velocidad (17 oct 2026): lo llama avisos-en-vivo.tsx cuando otro cambia algo del proyecto. Borra todo lo guardado
// en el navegador (no solo la página actual, como router.refresh) y trae de nuevo la página que se está viendo.
export async function refrescarTodo() {
  await getSesion(); // solo con sesión
  revalidatePath("/", "layout");
}

// Sesión para el tiempo real (17 oct 2026). El navegador NO renueva la sesión (si lo hacía a la vez que el servidor,
// una renovación invalidaba la otra y podía sacar a la persona de la app): la pide aquí, ya renovada por el proxy.
export async function tokenTiempoReal(): Promise<string | null> {
  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function cambiarProyecto(proyectoId: string) {
  return seguro(async () => {
    const { proyectos } = await getSesion();
    if (!proyectos.some((p) => p.id === proyectoId)) throw new ErrorUsuario("Proyecto no permitido.");
    (await cookies()).set(COOKIE_PROYECTO, proyectoId, { path: "/", maxAge: UN_ANO, sameSite: "lax" });
    revalidatePath("/", "layout");
  });
}
