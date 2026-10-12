import { getSesion } from "@/lib/auth";
import { destinoTrasEnlace } from "@/lib/enlace";
import { PantallaEntrada } from "./cliente";

// Fase 1 (Cristian, 12 oct 2026): al abrir un enlace de acceso, unos segundos de pantalla de entrada con la marca
// antes de llegar a la app (o a la bienvenida, si es su primera vez).
export default async function EntrandoPage({ searchParams }: { searchParams: Promise<{ siguiente?: string }> }) {
  const { perfil } = await getSesion();
  const { siguiente } = await searchParams;
  const destino = perfil.onboarding_completo ? destinoTrasEnlace(typeof siguiente === "string" ? siguiente : null) : "/onboarding";
  return <PantallaEntrada nombre={perfil.nombre.split(" ")[0]} destino={destino} primeraVez={!perfil.onboarding_completo} />;
}
