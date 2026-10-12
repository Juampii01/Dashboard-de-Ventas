import { NextResponse, type NextRequest } from "next/server";
import { createSessionClient } from "@/lib/supabase/server";
import { destinoTrasEnlace } from "@/lib/enlace";

// Bloque 6 (Cristian, 11 oct 2026): aquí llega el enlace mágico que manda un administrador desde la ficha.
// Comprueba el código con Supabase, deja la sesión iniciada (cookies) y lleva a la app; si el enlace ya se usó o
// caducó, vuelve al login con un aviso. Fase 1 (12 oct): los accesos y «pide un enlace» llevan a crear la contraseña.
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const tipo = request.nextUrl.searchParams.get("type");
  const siguiente = request.nextUrl.searchParams.get("siguiente");
  const destino = request.nextUrl.clone();
  destino.search = "";
  if (tokenHash && tipo === "magiclink") {
    const supabase = await createSessionClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
    if (!error) {
      const [ruta, consulta] = destinoTrasEnlace(siguiente).split("?");
      destino.pathname = ruta;
      if (consulta) destino.search = `?${consulta}`;
      return NextResponse.redirect(destino);
    }
  }
  destino.pathname = "/login";
  destino.searchParams.set("error", "enlace");
  return NextResponse.redirect(destino);
}
