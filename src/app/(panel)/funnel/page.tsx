import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { esJefe } from "@/lib/auth";
import { exigirPagina } from "@/lib/permisos";
import { cargarBase, calcularFunnel } from "@/lib/metricas";
import { db } from "@/lib/datos";
import { dinero, rangoDe, type Periodo, ETIQUETA_ROL } from "@/lib/formato";
import { Cabecera, Contenido, Seccion } from "@/components/ui";
import { Filtros } from "@/components/filtros";
import { TablasKpis } from "@/components/tablas-kpis";
import { CuerpoFunnel } from "@/components/cuerpo-funnel";
import { calcularKpis } from "@/lib/kpis";

export default async function FunnelPage({ searchParams }: PageProps<"/funnel">) {
  const { perfil, proyecto } = await exigirPagina("funnel"); // H5
  if (!esJefe(perfil)) redirect("/mi-funnel"); // a un caller o closer con «Funnel», solo lo suyo = «Mi Funnel»
  const sp = await searchParams;
  const periodo = (typeof sp.periodo === "string" ? sp.periodo : "mes") as Periodo;
  const rango = rangoDe(periodo, proyecto.zona_horaria, sp.desde as string, sp.hasta as string);
  // 13 oct: KPIs → «Por persona» usa la barra de periodo de Agendas (p = dia/semana/mes/anio/rango; «Todo» no existe allí → mes)
  const enlaceKpis = `/kpis?${new URLSearchParams({
    vista: "personas",
    ...(typeof sp.desde === "string" && typeof sp.hasta === "string" ? { p: "rango", desde: sp.desde, hasta: sp.hasta } : { p: periodo === "hoy" ? "dia" : periodo === "semana" ? "semana" : "mes" }),
  }).toString()}`;

  // Velocidad (17 oct 2026): los productos, a la vez que el resto (antes, después)
  const [base, { data: productosData }] = await Promise.all([
    cargarBase(proyecto),
    db().from("productos").select("id, nombre").eq("proyecto_id", proyecto.id).order("orden"),
  ]);
  const vendedor = base.gente.find((g) => g.id === sp.vendedor) ?? null;
  const productos = productosData ?? [];
  const producto = productos.find((p) => p.id === sp.producto) ?? null;
  const m = calcularFunnel(base, rango, vendedor, proyecto.zona_horaria, producto?.id ?? null);
  const $ = (n: number) => dinero(n, proyecto);
  const vendedores = base.gente
    .filter((g) => g.rol === "caller" || g.rol === "closer")
    .map((g) => ({ id: g.id, nombre: g.nombre, rol: ETIQUETA_ROL[g.rol] }));


  return (
    <>
      <Cabecera
        titulo="Funnel"
        subtitulo={
          <>
            {proyecto.nombre} · {rango.etiqueta}
            {vendedor && <> · {vendedor.nombre}</>}
            {producto && <> · solo ventas de «{producto.nombre}»</>}
          </>
        }
      />
      <Contenido>
        <Filtros vendedores={vendedores} productos={productos} />

        <CuerpoFunnel m={m} dinero={$} />


        <Seccion titulo="KPIs por persona" acciones={<Link href={enlaceKpis} className="text-sm text-primario hover:underline">Ver KPIs →</Link>}>
          <TablasKpis kpis={calcularKpis(base, rango, proyecto.zona_horaria)} dinero={$} />
        </Seccion>

        <div className="flex items-center gap-2 text-xs text-texto-3">
          <Wallet className="h-3.5 w-3.5" /> Facturación = valor total de los contratos cerrados. Cash collected = dinero ya cobrado (pagos iniciales + cuotas cobradas en el periodo − devoluciones del periodo).
        </div>
      </Contenido>
    </>
  );
}
