import { redirect } from "next/navigation";
import { getSesion, esJefe } from "@/lib/auth";
import { cargarBase } from "@/lib/metricas";
import { calcularKpis } from "@/lib/kpis";
import { dinero, rangoDe, type Periodo } from "@/lib/formato";
import { Cabecera, Contenido, Seccion } from "@/components/ui";
import { Filtros } from "@/components/filtros";
import { TablasKpis, ExplicacionKpis } from "@/components/tablas-kpis";

// KPIs de cada caller y closer (Paso H2). Solo director y CEO (decisión de Cristian, 10 oct 2026).
export default async function KpisPage({ searchParams }: PageProps<"/kpis">) {
  const { perfil, proyecto } = await getSesion();
  if (!esJefe(perfil)) redirect("/");
  const sp = await searchParams;
  const periodo = (typeof sp.periodo === "string" ? sp.periodo : "mes") as Periodo;
  const rango = rangoDe(periodo, proyecto.zona_horaria, sp.desde as string, sp.hasta as string);
  const kpis = calcularKpis(await cargarBase(proyecto), rango, proyecto.zona_horaria);

  return (
    <>
      <Cabecera titulo="KPIs" subtitulo={`${proyecto.nombre} · ${rango.etiqueta}`} />
      <Contenido>
        <Filtros />
        <Seccion titulo="Por persona">
          <TablasKpis kpis={kpis} dinero={(n) => dinero(n, proyecto)} />
        </Seccion>
        <Seccion titulo="¿Cómo se calcula cada número?">
          <ExplicacionKpis />
        </Seccion>
      </Contenido>
    </>
  );
}
