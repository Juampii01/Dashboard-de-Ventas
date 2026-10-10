import { DollarSign, ShoppingCart, Phone, BarChart3, Users, CalendarDays, ListChecks, UserX, XCircle } from "lucide-react";
import type { calcularFunnel } from "@/lib/metricas";
import { Kpi, Anillo, Seccion, GraficoDiario } from "@/components/ui";

// Tarjetas, tasas y gráficos del Funnel. Lo usan el Funnel del CEO y «Mi Funnel» (Paso H8).
export function CuerpoFunnel({ m, dinero: $ }: { m: ReturnType<typeof calcularFunnel>; dinero: (n: number) => string }) {
  const tasas = [
    { t: "Lead → Agendado", d: "De cada 100 leads que entran, cuántos llegan a agendar.", v: m.tasas.leadAgendado, c: "var(--oro)" },
    { t: "Agendado → Venta", d: "De cada 100 personas que agendan en el periodo, cuántas compran (desde ese día, aunque sea más tarde).", v: m.tasas.agendadoVenta, c: "var(--ok)" },
    { t: "Tasa de no show", d: "De cada 100 citas que ya pasaron, cuántas no se presentan.", v: m.tasas.noShow, c: "var(--primario)" },
    { t: "Tasa de pérdida", d: "De cada 100 leads que llegan al closer, cuántos se pierden.", v: m.tasas.perdida, c: "var(--morado)" },
  ];

  return (
    <>
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
    </>
  );
}
