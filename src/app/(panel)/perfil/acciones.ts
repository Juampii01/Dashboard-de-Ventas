"use server";

import { revalidatePath } from "next/cache";
import { getSesion, puedeAdmin } from "@/lib/auth";
import { db, escribir } from "@/lib/datos";
import { ErrorUsuario, seguro } from "@/lib/resultado";
import { horarioValido } from "@/lib/horarios";

const refrescar = () => revalidatePath("/", "layout");

// «Mi perfil» (bloque 1 de 1.0): cada persona cambia sus datos, su contraseña y su horario
export async function guardarMiPerfil(datos: { nombre: string; telefono: string; whatsapp: string }) {
  return seguro(async () => {
    const { perfil } = await getSesion();
    const nombre = datos.nombre.trim();
    if (!nombre) throw new ErrorUsuario("El nombre es obligatorio.");
    if (nombre.length > 120 || datos.telefono.length > 40 || datos.whatsapp.length > 40) throw new ErrorUsuario("Algún dato es demasiado largo.");
    await escribir(db().from("perfiles").update({ nombre, telefono: datos.telefono.trim() || null, whatsapp: datos.whatsapp.trim() || null }).eq("id", perfil.id), "perfiles");
    refrescar();
  });
}

export async function cambiarMiPassword(nueva: string, repetida: string) {
  return seguro(async () => {
    const { perfil } = await getSesion();
    if (nueva.length < 8) throw new ErrorUsuario("La contraseña necesita al menos 8 caracteres.");
    if (nueva !== repetida) throw new ErrorUsuario("Las dos contraseñas no coinciden.");
    const { error } = await db().auth.admin.updateUserById(perfil.id, { password: nueva });
    if (error) throw new ErrorUsuario(error.message);
  });
}

// El horario lo cambia la propia persona (en «Mi perfil» o en el onboarding) o un administrador (CEO o director
// con Administración). Cristian, 11 oct 2026. Siempre en la hora del proyecto; solo para callers y closers.
export async function guardarHorario(perfilId: string, horario: unknown) {
  return seguro(async () => {
    const { perfil, proyecto } = await getSesion();
    if (perfilId !== perfil.id && !puedeAdmin(perfil)) throw new ErrorUsuario("Solo puedes cambiar tu propio horario.");
    const { data: quien } = await db().from("perfiles").select("rol").eq("id", perfilId).maybeSingle();
    if (quien?.rol !== "caller" && quien?.rol !== "closer") throw new ErrorUsuario("El horario es para callers y closers.");
    const h = horarioValido(horario);
    if (!h) throw new ErrorUsuario("Pon al menos un tramo en algún día, con la hora de inicio antes que la de fin (HH:MM).");
    const { data, error } = await db().from("miembros_proyecto").update({ horario: h }).eq("proyecto_id", proyecto.id).eq("perfil_id", perfilId).select("perfil_id");
    if (error) throw new ErrorUsuario(error.message);
    if (!data?.length) throw new ErrorUsuario("Esa persona no está en este proyecto.");
    refrescar();
  });
}
