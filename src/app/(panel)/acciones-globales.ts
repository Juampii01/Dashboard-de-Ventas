"use server";

import { ErrorUsuario, seguro } from "@/lib/resultado";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { COOKIE_PROYECTO, getSesion } from "@/lib/auth";

const UN_ANO = 60 * 60 * 24 * 365;

export async function cambiarTema() {
  const jar = await cookies();
  const actual = jar.get("eternity_tema")?.value === "claro" ? "claro" : "oscuro";
  jar.set("eternity_tema", actual === "claro" ? "oscuro" : "claro", { path: "/", maxAge: UN_ANO, sameSite: "lax" });
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
