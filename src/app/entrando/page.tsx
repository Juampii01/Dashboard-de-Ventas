import { redirect } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { destinoTrasEnlace } from "@/lib/enlace";
import { rutaInicio } from "@/lib/permisos";

// Fase 1 (Cristian, 12 oct 2026): al abrir un enlace de acceso, una pantalla de entrada con la marca.
// Desde el 17 oct la bienvenida es una capa del panel que sale al abrir la app (components/bienvenida.tsx), así que
// aquí solo se manda directo a su sección (o a la bienvenida del onboarding, si es su primera vez).
export default async function EntrandoPage({ searchParams }: { searchParams: Promise<{ siguiente?: string }> }) {
  const { perfil, proyecto } = await getSesion();
  if (!perfil.onboarding_completo) redirect("/onboarding");
  const { siguiente } = await searchParams;
  const tras = destinoTrasEnlace(typeof siguiente === "string" ? siguiente : null);
  redirect(tras === "/" ? await rutaInicio(perfil, proyecto.id) : tras);
}
