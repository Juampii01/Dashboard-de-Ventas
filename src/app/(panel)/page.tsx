import { redirect } from "next/navigation";
import { getSesion, RUTA_INICIO } from "@/lib/auth";

export default async function Inicio() {
  const { perfil } = await getSesion();
  redirect(RUTA_INICIO[perfil.rol]);
}
