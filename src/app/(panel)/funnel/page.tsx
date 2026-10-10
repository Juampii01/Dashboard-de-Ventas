import Link from "next/link";
import { redirect } from "next/navigation";
import {
  DollarSign,
  ShoppingCart,
  Phone,
  BarChart3,
  Users,
  CalendarDays,
  ListChecks,
  UserX,
  XCircle,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { getSesion, esJefe } from "@/lib/auth";
import { cargarBase, calcularFunnel, calcularVendedores } from "@/lib/metricas";
import { db } from "@/lib/datos";
import { dinero, rangoDe, type Periodo, ETIQUETA_ROL, pct } from "@/lib/formato";
import { Cabecera, Contenido, Kpi, Anillo, Seccion, GraficoDiario, Avatar, Vacio } from "@/components/ui";
import { Filtros } from "@/components/filtros";

export default async function FunnelPage({ searchParams }: PageProps<"/funnel">) {
  const { perfil, proyecto } = await getSesion();
  if (!esJefe(perfil)) redirect("/");
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

  const tasas = [
    { t: "Lead → Agendado", d: "De cada 100 leads que entran, cuántos llegan a agendar.", v: m.tasas.leadAgendado, c: "var(--oro)" },
    { t: "Agendado → Venta", d: "De cada 100 leads que agendan, cuántos compran.", v: m.tasas.agendadoVenta, c: "var(--ok)" },
    { t: "Tasa de no show", d: "De cada 100 citas que ya pasaron, cuántas no se presentan.", v: m.tasas.noShow, c: "var(--primario)" },
    { t: "Tasa de pérdida", d: "De cada 100 leads que llegan al closer, cuántos se pierden.", v: m.tasas.perdida, c: "var(--morado)" },
  ];

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

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Kpi titulo="Facturación" valor={$(m.facturacion)} icono={DollarSign} tono="oro" destacado detalle={<>Cash collected: <b className="text-texto">{$(m.cash)}</b></>} />
          <Kpi titulo="Ventas cerradas" valor={m.ventas} icono={ShoppingCart} detalle={m.ventas ? <>Ticket medio {$(m.facturacion / m.ventas)}</> : "Sin ventas en el periodo"} />
          <Kpi titulo="Llamadas realizadas" valor={m.llamadas} icono={Phone} detalle={<>{m.llamadasCaller} de callers · {m.citasHechas} citas hechas</>} />
          <Kpi titulo="Media lead → venta" valor={m.mediaDias === null ? "—" : `${m.mediaDias} d`} icono={BarChart3} detalle="Desde que entra hasta que compra" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
          <Kpi titulo="Total leads" valor={m.totalLeads} icono={Users} cambio={m.cambioLeads} detalle={m.cambioLeads !== null ? "vs periodo anterior" : undefined} />
          <Kpi titulo="Agendados" valor={m.agendados} icono={CalendarDays} cambio={m.cambioAgendados} detalle={m.cambioAgendados !== null ? "vs periodo anterior" : undefined} />
          <Kpi titulo="Seguimiento" valor={m.seguimiento} icono={ListChecks} tono="aviso" detalle="Citas pendientes de decidir" />
          <Kpi titulo="No show" valor={m.noShow} icono={UserX} tono="mal" detalle="No se presentaron" />
          <Kpi titulo="Perdidos" valor={m.perdidos} icono={XCircle} tono="mal" detalle="Perdidos o no califican" />
        </div>

        <Seccion titulo="Tasas de conversión">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {tasas.map((t) => (
              <div key={t.t} className="flex items-center gap-4 rounded-lg border border-borde bg-panel-2 p-3">
                <Anillo valor={t.v} color={t.c} />
                <div>
                  <div className="text-sm font-semibold">{t.t}</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-texto-2">{t.d}</p>
                </div>
              </div>
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Evolución día a día">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-borde bg-panel-2 p-4">
              <div className="titulo-seccion mb-2">Leads que entran</div>
              <GraficoDiario puntos={m.serie.leads} />
            </div>
            <div className="rounded-lg border border-borde bg-panel-2 p-4">
              <div className="titulo-seccion mb-2">Facturación</div>
              <GraficoDiario puntos={m.serie.facturacion} color="var(--oro)" formato={$} />
            </div>
          </div>
        </Seccion>

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
