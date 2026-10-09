import { NextResponse, type NextRequest } from "next/server";
import { getSesion, esJefe } from "@/lib/auth";
import { datosEstudio } from "@/lib/cualificacion-datos";
import { csvExcel, nombreArchivo } from "@/lib/csv-excel";

// Cualificación › Estudio a CSV (se abre con Excel). Solo director y CEO.
export async function GET(request: NextRequest) {
  const { perfil, proyecto } = await getSesion();
  if (!esJefe(perfil)) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const preg = request.nextUrl.searchParams.getAll("preg");
  const filas = await datosEstudio(proyecto.id, preg.length ? preg : undefined);
  const num = (n: number) => n.toFixed(2).replace(".", ",");
  const csv = csvExcel(
    ["Pregunta", "Respuesta", "Leads", "Llamadas", "Cerradas", "% cierre", `Cash (${proyecto.moneda})`, "Cash por llamada"],
    filas.map((f) => [f.pregunta, f.respuesta, f.leads, f.llamadas, f.cerradas, f.cierre, num(f.cash), num(f.cashPorLlamada)])
  );
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="cualificacion-${nombreArchivo(proyecto.nombre)}.csv"`, "Cache-Control": "no-store" } });
}
