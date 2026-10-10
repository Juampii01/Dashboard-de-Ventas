import { redirect } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { rutaInicio } from "@/lib/permisos";

// Paso H5: la de su rol si la tiene; si se la quitaron, la primera sección que tenga permitida
export default async function Inicio() {
  const { perfil, proyecto } = await getSesion();
  redirect(await rutaInicio(perfil, proyecto.id));
}
