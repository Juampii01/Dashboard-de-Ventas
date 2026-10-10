"use server";

import { exigirSeccion } from "@/lib/permisos";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { ErrorUsuario, seguro } from "@/lib/resultado";
import { db, escribir } from "@/lib/datos";
import { getSesion, esJefe } from "@/lib/auth";
import { procesarLlamadasGhl, sincronizarLlamadasGhl } from "@/lib/ghl-llamadas-sync";

// Trae de GHL las llamadas nuevas; la transcripción y el análisis van después de responder
export async function sincronizarLlamadasAhora() {
  return seguro(async () => {
    await exigirSeccion("grabadas"); // H5
    const { proyecto } = await getSesion();
    let r: { nuevas: number };
    try {
      r = await sincronizarLlamadasGhl(proyecto.id);
    } catch (e) {
      throw new ErrorUsuario(e instanceof Error ? e.message : "No se pudo hablar con GHL.");
    }
    after(() => procesarLlamadasGhl(proyecto.id, { max: 4 }).then(() => undefined));
    revalidatePath("/", "layout");
    return r;
  });
}

export async function reintentarLlamada(id: string) {
  return seguro(async () => {
    await exigirSeccion("grabadas"); // H5
    const { perfil, proyecto } = await getSesion();
    const { data: l } = await db().from("llamadas_ghl").select("perfil_id").eq("id", id).eq("proyecto_id", proyecto.id).maybeSingle();
    if (!l || (!esJefe(perfil) && l.perfil_id !== perfil.id)) throw new ErrorUsuario("Esa llamada no es tuya.");
    await escribir(db().from("llamadas_ghl").update({ estado: "pendiente", error: null }).eq("id", id), "llamadas_ghl");
    after(() => procesarLlamadasGhl(proyecto.id, { max: 3 }).then(() => undefined));
    revalidatePath("/", "layout");
  });
}
