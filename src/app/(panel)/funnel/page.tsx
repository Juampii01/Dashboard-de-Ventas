import Link from "next/link";
import { redirect } from "next/navigation";
import { Phone, Users, Wallet, TrendingUp } from "lucide-react";
import { esJefe } from "@/lib/auth";
import { exigirPagina } from "@/lib/permisos";
import { cargarBase, calcularFunnel, calcularVendedores } from "@/lib/metricas";
import { db } from "@/lib/datos";
import { dinero, rangoDe, type Periodo, ETIQUETA_ROL, pct } from "@/lib/formato";
import { Cabecera, Contenido, Seccion, Avatar, Vacio } from "@/components/ui";
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

  const base = await cargarBase(proyecto);
  const vendedor = base.gente.find((g) => g.id === sp.vendedor) ?? null;
  const { data: productosData } = await db().from("productos").select("id, nombre").eq("proyecto_id", proyecto.id).order("orden");
  const productos = productosData ?? [];
  const producto = productos.find((p) => p.id === sp.producto) ?? null;
  const m = calcularFunnel(base, rango, vendedor, proyecto.zona_horaria, producto?.id ?? null);
  const v = calcularVendedores(base, rango);
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

        <Seccion titulo="Vendedores" acciones={<Link href="/ranking" className="text-sm text-primario hover:underline">Ver ranking →</Link>}>
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="overflow-x-auto rounded-lg border border-borde">
              <div className="flex items-center gap-2 border-b border-borde bg-panel-2 px-3 py-2 text-sm font-semibold">
                <PhoneIcono /> Callers
              </div>
              {v.callers.length === 0 ? (
                <Vacio icono={Users} texto="No hay callers en este proyecto." />
              ) : (
                <table className="tabla">
                  <thead>
                    <tr><th>Caller</th><th>Asignados</th><th>Llamadas</th><th>Agendas</th><th>Ventas</th></tr>
                  </thead>
                  <tbody>
                    {v.callers.map((c) => (
                      <tr key={c.perfil.id}>
                        <td><div className="flex items-center gap-2"><Avatar nombre={c.perfil.nombre} tamano="h-7 w-7 text-[10px]" />{c.perfil.nombre}</div></td>
                        <td className="tabular-nums">{c.asignados}</td>
                        <td className="tabular-nums">{c.llamadas}</td>
                        <td className="tabular-nums">{c.agendas}</td>
                        <td className="tabular-nums">{c.ventas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="overflow-x-auto rounded-lg border border-borde">
              <div className="flex items-center gap-2 border-b border-borde bg-panel-2 px-3 py-2 text-sm font-semibold">
                <TrendingUp className="h-4 w-4 text-primario" /> Closers
              </div>
              {v.closers.length === 0 ? (
                <Vacio icono={Users} texto="No hay closers en este proyecto." />
              ) : (
                <table className="tabla">
                  <thead>
                    <tr><th>Closer</th><th>Citas</th><th>Asistidas</th><th>Ventas</th><th>% cierre</th><th>Facturación</th></tr>
                  </thead>
                  <tbody>
                    {v.closers.map((c) => (
                      <tr key={c.perfil.id}>
                        <td><div className="flex items-center gap-2"><Avatar nombre={c.perfil.nombre} tamano="h-7 w-7 text-[10px]" />{c.perfil.nombre}</div></td>
                        <td className="tabular-nums">{c.citas}</td>
                        <td className="tabular-nums">{c.asistidas}</td>
                        <td className="tabular-nums">{c.ventas}</td>
                        <td className="tabular-nums">{pct(c.tasaCierre)}</td>
                        <td className="tabular-nums">{$(c.facturacion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </Seccion>

        <Seccion titulo="KPIs por persona" acciones={<Link href={`/kpis?${new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => typeof e[1] === "string" && ["periodo", "desde", "hasta"].includes(e[0]))).toString()}`} className="text-sm text-primario hover:underline">Ver KPIs →</Link>}>
          <TablasKpis kpis={calcularKpis(base, rango, proyecto.zona_horaria)} dinero={$} />
        </Seccion>

        <div className="flex items-center gap-2 text-xs text-texto-3">
          <Wallet className="h-3.5 w-3.5" /> Facturación = valor total de los contratos cerrados. Cash collected = dinero ya cobrado (pagos iniciales + cuotas cobradas en el periodo − devoluciones del periodo).
        </div>
      </Contenido>
    </>
  );
}

function PhoneIcono() {
  return <Phone className="h-4 w-4 text-primario" />;
}
