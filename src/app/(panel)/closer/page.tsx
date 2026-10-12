import Link from "next/link";
import { FileDown, Star, Undo2, Hourglass, Target, Ticket } from "lucide-react";
import { esJefe } from "@/lib/auth";
import { exigirPagina } from "@/lib/permisos";
import { panelObjetivos } from "@/lib/objetivos";
import { PanelObjetivos } from "@/components/barras-objetivos";
import { cargarAgendas, closersVisibles } from "@/lib/agendas-datos";
import { metricasAgendas, type MetricasAgendas } from "@/lib/metricas-agendas";
import { leerPeriodo, rangoNav } from "@/lib/periodos";
import { dinero, pct, hoyEnZona } from "@/lib/formato";
import { Cabecera, Contenido, Kpi, Seccion, Anillo } from "@/components/ui";
import { BarraPeriodo, FiltroUrl } from "@/components/barra-periodo";
import { PestanasAgendas } from "./pestanas";
import { VistaAgendas } from "./vista-agendas";

export default async function AgendasMetricasPage({ searchParams }: PageProps<"/closer">) {
  const { perfil, proyecto } = await exigirPagina("agendas"); // H5
  const jefe = esJefe(perfil);
  // H5 (caso 1): un caller con «Agendas» ve solo las citas que agendó él (y las ventas de esos leads), solo mirar
  const mirar = perfil.rol === "caller";
  const sp = await searchParams;
  const p = leerPeriodo(sp);
  const rango = rangoNav(p.periodo, p.n, proyecto.zona_horaria, p.desde, p.hasta);
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : null);
  const comparativa = jefe && str("vista") === "comparativa";

  const datos = await cargarAgendas(proyecto, !!perfil.es_prueba);
  if (mirar) {
    datos.citas = datos.citas.filter((c) => c.agendada_por === perfil.id);
    const leads = new Set(datos.citas.map((c) => c.lead_id));
    datos.ventas = datos.ventas.filter((v) => leads.has(v.lead_id));
    const ventas = new Set(datos.ventas.map((v) => v.id));
    datos.pagos = datos.pagos.filter((x) => ventas.has(x.venta_id));
  }
  const vis = closersVisibles(perfil, datos.gente, str("closer"));
  const filtros = { productoId: str("producto"), evento: str("evento") };
  const m = metricasAgendas(datos, rango, { closerIds: vis.ids, ...filtros });
  // Quien está de baja (arreglo 11) solo sale en los periodos en que tuvo citas o cobró algo
  // Fase 2: los jefes reciben las dos vistas ya calculadas (el botón Individual/Comparativa cambia al instante)
  const porCloser = jefe ? vis.todos.map((c) => ({ c, m: metricasAgendas(datos, rango, { closerIds: [c.id], ...filtros }) })).filter(({ c, m }) => !("baja" in c && c.baja) || m.agendadas || m.cash) : [];
  const $ = (n: number) => dinero(n, proyecto);
  const panel = jefe ? null : await panelObjetivos(proyecto, perfil); // cada closer ve solo los suyos, su racha y el del equipo (H3-H4)
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]);

  const filtrosComunes = (
    <>
      <FiltroUrl nombre="producto" etiqueta="Producto" todos="Todos los productos" opciones={datos.productos.map((x) => ({ v: x.id, t: x.nombre }))} />
      {datos.eventos.length > 0 && <FiltroUrl nombre="evento" etiqueta="Evento" todos="Todos los eventos" opciones={datos.eventos.map((e) => ({ v: e, t: e }))} />}
      <div className="ml-auto"><BarraPeriodo etiqueta={rango.etiqueta} /></div>
    </>
  );

  return (
    <>
      <Cabecera
        titulo="Agendas"
        subtitulo={`${proyecto.nombre} · ${jefe ? (vis.ids.length === 1 && str("closer") ? vis.closers[0]?.nombre : "todos los closers") : mirar ? `citas que agendó ${perfil.nombre}` : perfil.nombre} · ${rango.etiqueta}`}
        acciones={
          mirar ? undefined : (
            <a href={`/closer/reporte?${qs}`} className="btn-secundario" title="Descarga un PDF con las métricas de este periodo">
              <FileDown className="h-4 w-4" /> Generar reporte
            </a>
          )
        }
      />
      <Contenido>
        <PestanasAgendas activa="/closer" />
        {panel && <PanelObjetivos panel={panel} dinero={$} celebrar={`${perfil.id}-${hoyEnZona(proyecto.zona_horaria)}`} />}
        {jefe ? (
          <VistaAgendas
            inicial={comparativa ? "comparativa" : "individual"}
            filtroIndividual={<FiltroUrl nombre="closer" etiqueta="Closer" todos="Todos los closers" opciones={vis.todos.map((c) => ({ v: c.id, t: c.nombre }))} />}
            resto={filtrosComunes}
            individual={<Individual m={m} moneda={$} />}
            comparativa={<Comparativa filas={porCloser} moneda={$} />}
          />
        ) : (
          <>
            <div className="tarjeta flex flex-wrap items-center gap-2 p-2.5">{filtrosComunes}</div>
            <Individual m={m} moneda={$} />
          </>
        )}

        <details className="tarjeta p-4 text-xs text-texto-2">
          <summary className="cursor-pointer font-medium text-texto">¿Cómo se calcula cada número?</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><b>Agendadas:</b> citas con fecha en el periodo (una cita reagendada no cuenta dos veces).</li>
            <li><b>Asistencias:</b> citas cerradas, en seguimiento o perdidas (hubo llamada).</li>
            <li><b>% cierre:</b> cerradas ÷ asistencias. <b>Call/close:</b> cerradas ÷ agendadas.</li>
            <li><b>Facturación:</b> valor de las ventas de los closers con fecha en el periodo.</li>
            <li><b>Cash collected:</b> lo cobrado al vender + las cuotas cobradas en el periodo − las devoluciones del periodo.</li>
            <li><b>Calificados 4★+:</b> asistencias a las que el closer puso 4 o 5 estrellas.</li>
          </ul>
        </details>
      </Contenido>
    </>
  );
}

function Individual({ m, moneda: $ }: { m: MetricasAgendas; moneda: (n: number) => string }) {
  const max = Math.max(m.agendadas, 1);
  const pasos = [
    { t: "Agendadas", n: m.agendadas },
    { t: "Asistencias", n: m.asistencias },
    { t: "Cerradas", n: m.cerradas },
  ];
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <Seccion titulo="Embudo de conversión">
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-ok/30 bg-ok-suave p-3">
            <div className="text-xl font-semibold tabular-nums">{$(m.cash)}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-ok">Cash collected</div>
            <div className="text-[11px] text-texto-3">cobrado, neto de devoluciones</div>
          </div>
          <div className="rounded-lg border border-oro/30 bg-oro-suave p-3">
            <div className="text-xl font-semibold tabular-nums">{$(m.facturacion)}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-oro">Facturación</div>
            <div className="text-[11px] text-texto-3">contratos cerrados</div>
          </div>
        </div>
        <ul className="space-y-3">
          {pasos.map((x, i) => (
            <li key={x.t}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="font-medium">{x.t}</span>
                <span className="tabular-nums"><b>{x.n}</b> <span className="text-xs text-texto-3">· {pct(i === 0 ? "100" : Math.round((x.n / max) * 1000) / 10)}</span></span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-panel-2" title={`${x.t}: ${x.n}`}>
                <div className="h-full rounded-full bg-primario" style={{ width: `${pct((x.n / max) * 100)}`, opacity: 1 - i * 0.22 }} />
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto-2">
          <span>Perdidas <b>{m.perdidas}</b></span>
          <span>No-show <b>{m.noShow}</b></span>
          <span>Reagendadas <b>{m.reagendadas}</b></span>
          <span>Canceladas <b>{m.canceladas}</b></span>
          <span>No califica <b>{m.noCalifica}</b></span>
        </div>
        <p className="mt-2 text-xs text-texto-3">Tasa de cierre <b className="text-texto">{pct(m.pctCierre)}</b> sobre asistencias</p>
      </Seccion>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6">
          <Kpi titulo="% cierre / asist." valor={`${pct(m.pctCierre)}`} icono={Target} tono="ok" detalle={`Call/close ${pct(m.pctCallClose)}`} />
          <Kpi titulo="Ticket medio" valor={$(m.ticketMedio)} icono={Ticket} tono="oro" detalle="por venta cerrada" />
          <Kpi titulo="Calificados 4★+" valor={m.calificados} icono={Star} tono="morado" detalle={`${m.con5} con 5★`} />
          <Kpi titulo="Media estrellas" valor={m.mediaEstrellasCloser ?? "—"} icono={Star} tono="oro" detalle={`del closer · caller ${m.mediaEstrellasCaller ?? "—"}`} />
          <Kpi titulo="Pendientes" valor={m.pendientes} icono={Hourglass} tono="aviso" detalle={`${m.perdidas} perd. · ${m.canceladas} canc.`} />
          <Kpi titulo="Devoluciones" valor={m.devoluciones} icono={Undo2} tono="mal" detalle={`${pct(m.pctDevoluciones)} de las ventas · ${$(m.devuelto)}`} />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Seccion titulo="Agendas por fuente">
            <Barras titulo="Por pipeline" filas={m.porPipeline} />
            <div className="mt-5"><Barras titulo="Por UTM (utm_source)" filas={m.porUtm} /></div>
          </Seccion>
          <Seccion titulo="% Cierre">
            <div className="flex items-center gap-4">
              <Anillo valor={m.pctCierre} color="var(--ok)" tamano={92} />
              <ul className="flex-1 space-y-1 text-sm">
                {[["Cerradas", m.cerradas], ["Perdidas", m.perdidas], ["En seguimiento", m.seguimiento], ["No-show", m.noShow], ["Reagendadas", m.reagendadas], ["Canceladas", m.canceladas]].map(([t, n]) => (
                  <li key={t} className="flex justify-between"><span className="text-texto-2">{t}</span><b className="tabular-nums">{n}</b></li>
                ))}
              </ul>
            </div>
            <dl className="mt-4 divide-y divide-borde border-t border-borde text-sm">
              {[["Tasa de asistencia", `${pct(m.tasaAsistencia)}`], ["Tasa de cancelación", `${pct(m.tasaCancelacion)}`], ["Calificados 4★+", m.calificados], ["Ticket medio", $(m.ticketMedio)], ["Media de estrellas (closer)", m.mediaEstrellasCloser ?? "—"]].map(([t, v]) => (
                <div key={t} className="flex justify-between py-1.5"><dt className="text-texto-2">{t}</dt><dd className="font-medium tabular-nums">{v}</dd></div>
              ))}
            </dl>
          </Seccion>
        </div>
      </div>
    </div>
  );
}

function Barras({ titulo, filas }: { titulo: string; filas: { nombre: string; n: number }[] }) {
  const total = filas.reduce((s, f) => s + f.n, 0);
  const max = Math.max(...filas.map((f) => f.n), 1);
  return (
    <div>
      <div className="mb-2 text-xs font-medium text-texto-2">{titulo}</div>
      {filas.length === 0 ? (
        <p className="text-sm text-texto-3">Sin agendas en este periodo.</p>
      ) : (
        <ul className="space-y-2">
          {filas.slice(0, 8).map((f) => (
            <li key={f.nombre} title={`${f.nombre}: ${f.n} (${pct(Math.round((f.n / total) * 100))})`}>
              <div className="flex justify-between text-sm"><span className="truncate">{f.nombre}</span><span className="tabular-nums text-texto-2">{f.n}</span></div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-panel-2"><div className="h-full rounded-full bg-primario" style={{ width: `${pct((f.n / max) * 100)}` }} /></div>
            </li>
          ))}
          {filas.length > 8 && <li className="text-xs text-texto-3">+ {filas.length - 8} fuentes más</li>}
        </ul>
      )}
    </div>
  );
}

function Comparativa({ filas, moneda: $ }: { filas: { c: { id: string; nombre: string }; m: MetricasAgendas }[]; moneda: (n: number) => string }) {
  const cols: [string, (m: MetricasAgendas) => string | number][] = [
    ["Agendadas", (m) => m.agendadas],
    ["Asistencias", (m) => m.asistencias],
    ["Cerradas", (m) => m.cerradas],
    ["% cierre", (m) => `${pct(m.pctCierre)}`],
    ["No-show", (m) => m.noShow],
    ["Facturación", (m) => $(m.facturacion)],
    ["Cash", (m) => $(m.cash)],
    ["Ticket medio", (m) => $(m.ticketMedio)],
    ["4★+", (m) => m.calificados],
    ["Media ★", (m) => m.mediaEstrellasCloser ?? "—"],
    ["Devol.", (m) => m.devoluciones],
  ];
  return (
    <Seccion titulo="Comparativa de closers">
      {filas.length === 0 ? (
        <p className="text-sm text-texto-3">No hay closers en este proyecto.</p>
      ) : (
        <div className="-mx-4 overflow-x-auto sm:-mx-5">
          <table className="tabla">
            <thead><tr><th>Closer</th>{cols.map(([t]) => <th key={t} className="text-right">{t}</th>)}</tr></thead>
            <tbody>
              {filas.map(({ c, m }) => (
                <tr key={c.id}>
                  <td className="font-medium"><Link href={`/closer?closer=${c.id}`} className="hover:text-primario">{c.nombre}</Link></td>
                  {cols.map(([t, f]) => <td key={t} className="text-right tabular-nums">{f(m)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Seccion>
  );
}
