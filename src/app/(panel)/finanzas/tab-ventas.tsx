import Link from "next/link";
import { FileDown, Hourglass, CalendarClock, AlertTriangle, Ban } from "lucide-react";
import { detalleVencimientos, pendienteDe } from "@/lib/finanzas";
import { enRango } from "@/lib/periodos";
import { coincide } from "@/lib/llamadas";
import { dinero, fecha, hoyEnZona, type Rango } from "@/lib/formato";
import { Insignia, Kpi, Seccion } from "@/components/ui";
import { BuscadorUrl } from "@/app/(panel)/closer/llamadas/cliente";
import type { Proyecto } from "@/lib/tipos";
import type { DatosFinanzas } from "./cargar";
import { AccionesVencimiento, NuevoDeudor } from "./cliente";
import { FilaVentaAcciones } from "@/app/(panel)/ventas/fila-acciones";

type SP = Record<string, string | string[] | undefined>;
const TIPO: Record<string, string> = { completo: "Completo", reserva: "Reserva", cuotas: "Cuotas" };
const str = (sp: SP, k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");

function enlace(sp: SP, cambios: Record<string, string | null>) {
  const p = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]);
  for (const [k, v] of Object.entries(cambios)) {
    if (v === null) p.delete(k);
    else p.set(k, v);
  }
  return `/finanzas?${p}`;
}

export function Chips({ sp, nombre, opciones }: { sp: SP; nombre: string; opciones: [string, string][] }) {
  const actual = str(sp, nombre);
  return (
    <div className="flex flex-wrap rounded-lg border border-borde bg-panel p-0.5">
      {opciones.map(([v, t]) => <Link key={v} href={enlace(sp, { [nombre]: v || null })} className={`rounded-md px-3 py-1.5 text-sm ${actual === v ? "bg-primario text-white" : "text-texto-2"}`}>{t}</Link>)}
    </div>
  );
}

export function TabVentas({ d, rango, proyecto, sp, jefe }: { d: DatosFinanzas; rango: Rango; proyecto: Proyecto; sp: SP; jefe: boolean }) {
  const ver = str(sp, "ver") || "transacciones";
  return (
    <>
      <Chips sp={sp} nombre="ver" opciones={[["", "Transacciones"], ["pendientes", "Pagos pendientes"]]} />
      {ver === "pendientes" ? <Pendientes d={d} proyecto={proyecto} sp={sp} /> : <Transacciones d={d} rango={rango} proyecto={proyecto} sp={sp} jefe={jefe} />}
    </>
  );
}

function Transacciones({ d, rango, proyecto, sp, jefe }: { d: DatosFinanzas; rango: Rango; proyecto: Proyecto; sp: SP; jefe: boolean }) {
  const $ = (n: number) => dinero(n, proyecto);
  const q = str(sp, "q");
  const tipo = str(sp, "tipo");
  const filas = d.ventas
    .filter((v) => enRango(v.fecha, rango) && (!tipo || v.tipo_pago === tipo) && coincide(q, d.leads.get(v.lead_id)?.nombre, d.leads.get(v.lead_id)?.email, d.producto.get(v.producto_id ?? "")))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const cobrado = (id: string, cash: number) => cash + d.pagos.filter((p) => p.venta_id === id).reduce((s, p) => s + p.importe, 0);
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]);
  return (
    <Seccion
      titulo={`${filas.length} ${filas.length === 1 ? "venta" : "ventas"} · ${$(filas.reduce((s, v) => s + v.facturacion, 0))}`}
      acciones={
        <div className="flex flex-wrap items-center gap-2">
          <BuscadorUrl placeholder="Buscar cliente o programa…" />
          <Chips sp={sp} nombre="tipo" opciones={[["", "Todas"], ["completo", "Completo"], ["reserva", "Reserva"], ["cuotas", "Cuotas"]]} />
          <a href={`/finanzas/exportar?${qs}`} className="btn-secundario"><FileDown className="h-4 w-4" /> Exportar Excel</a>
        </div>
      }
    >
      {filas.length === 0 ? (
        <p className="py-6 text-center text-sm text-texto-3">No hay ventas en este periodo{q || tipo ? " con ese filtro" : ""}.</p>
      ) : (
        <div className="-mx-4 overflow-x-auto sm:-mx-5">
          <table className="tabla">
            <thead><tr><th>Fecha</th><th>Cliente</th><th>Programa</th><th>Vendedor</th><th>Pago</th><th className="text-right">Facturación</th><th className="text-right">Cobrado</th><th className="text-right">Falta</th><th></th></tr></thead>
            <tbody>
              {filas.map((v) => (
                <tr key={v.id}>
                  <td className="whitespace-nowrap text-texto-2">{fecha(v.fecha, proyecto)}</td>
                  <td><Link href={`/leads/${v.lead_id}`} className="hover:text-primario">{d.leads.get(v.lead_id)?.nombre ?? "—"}</Link></td>
                  <td className="text-texto-2">{d.producto.get(v.producto_id ?? "") ?? "—"}</td>
                  <td className="text-texto-2">{d.persona.get(v.vendedor_id ?? "")?.nombre ?? "—"}</td>
                  <td>{TIPO[v.tipo_pago] ?? v.tipo_pago}{v.tipo_pago === "cuotas" && v.num_cuotas ? ` · ${v.num_cuotas}` : ""} <span className="text-xs text-texto-3">{v.metodo}</span></td>
                  <td className="text-right tabular-nums">{$(v.facturacion)}</td>
                  <td className="text-right tabular-nums">{$(cobrado(v.id, v.cash_collected))}{v.devuelto ? <div className="text-xs text-mal">−{$(v.devuelto)} devuelto</div> : null}</td>
                  <td className="text-right tabular-nums">{pendienteDe(v, d.pagos) > 0 ? <span className="text-aviso">{$(pendienteDe(v, d.pagos))}</span> : "—"}</td>
                  <td className="relative"><FilaVentaAcciones ventaId={v.id} pendiente={pendienteDe(v, d.pagos)} cobrado={cobrado(v.id, v.cash_collected)} devuelta={!!v.devuelto} jefe={jefe} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Seccion>
  );
}

function Pendientes({ d, proyecto, sp }: { d: DatosFinanzas; proyecto: Proyecto; sp: SP }) {
  const $ = (n: number) => dinero(n, proyecto);
  const hoy = hoyEnZona(proyecto.zona_horaria);
  const det = detalleVencimientos(d.vencimientos, d.pagos, hoy);
  const venta = new Map(d.ventas.map((v) => [v.id, v]));
  const clase = (v: (typeof d.vencimientos)[number]) => (!v.venta_id ? "deudor" : venta.get(v.venta_id)?.tipo_pago === "cuotas" ? "cuotas" : "reserva");
  const todos = d.vencimientos.map((v) => ({ v, ...det.get(v.id)!, clase: clase(v), quien: v.nombre ?? d.leads.get(v.lead_id ?? "")?.nombre ?? "—" }));
  const suma = (e: string[]) => todos.filter((x) => e.includes(x.estado)).reduce((s, x) => s + x.falta, 0);
  const estado = str(sp, "estado");
  const tipo = str(sp, "tipo");
  const q = str(sp, "q");
  const lista = todos.filter(
    (x) =>
      (estado === "completados" ? x.estado === "pagado" : estado === "no_paga" ? x.estado === "no_paga" : x.estado === "por_vencer" || x.estado === "vencido") &&
      (!tipo || x.clase === tipo) &&
      coincide(q, x.quien)
  );
  const ETQ = { pagado: ["Cobrado", "ok"], por_vencer: ["Por vencer", "primario"], vencido: ["Vencido", "mal"], no_paga: ["No paga", "neutro"] } as const;
  const porMes = new Map<string, { pendiente: number; vencido: number; cobrado: number }>();
  for (const x of todos) {
    const m = x.v.vence_el.slice(0, 7);
    const fila = porMes.get(m) ?? { pendiente: 0, vencido: 0, cobrado: 0 };
    if (x.estado === "pagado") fila.cobrado += x.v.importe;
    else if (x.estado === "vencido") fila.vencido += x.falta;
    else if (x.estado === "por_vencer") fila.pendiente += x.falta;
    porMes.set(m, fila);
  }
  return (
    <>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi titulo="Total por cobrar" valor={$(suma(["por_vencer", "vencido"]))} icono={Hourglass} tono="aviso" />
        <Kpi titulo="Por vencer" valor={$(suma(["por_vencer"]))} icono={CalendarClock} />
        <Kpi titulo="Vencidos" valor={$(suma(["vencido"]))} icono={AlertTriangle} tono="mal" />
        <Kpi titulo="No paga" valor={$(suma(["no_paga"]))} icono={Ban} tono="mal" />
      </div>
      <Seccion
        acciones={
          <div className="flex w-full flex-wrap items-center gap-2">
            <Chips sp={sp} nombre="estado" opciones={[["", "Pendientes"], ["completados", "Completados"], ["no_paga", "No paga"], ["resumen", "Resumen"]]} />
            {estado !== "resumen" && <Chips sp={sp} nombre="tipo" opciones={[["", "Todos"], ["cuotas", "Cuotas"], ["reserva", "Reservas"], ["deudor", "Deudores"]]} />}
            {estado !== "resumen" && <BuscadorUrl placeholder="Buscar quién debe…" />}
            <div className="ml-auto"><NuevoDeudor /></div>
          </div>
        }
      >
        {estado === "resumen" ? (
          porMes.size === 0 ? <p className="py-6 text-center text-sm text-texto-3">No hay pagos pendientes.</p> : (
            <div className="-mx-4 overflow-x-auto sm:-mx-5">
              <table className="tabla">
                <thead><tr><th>Mes de vencimiento</th><th className="text-right">Por vencer</th><th className="text-right">Vencido</th><th className="text-right">Cobrado</th></tr></thead>
                <tbody>{[...porMes.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([m, f]) => <tr key={m}><td>{m}</td><td className="text-right tabular-nums">{$(f.pendiente)}</td><td className="text-right tabular-nums text-mal">{f.vencido ? $(f.vencido) : "—"}</td><td className="text-right tabular-nums text-ok">{f.cobrado ? $(f.cobrado) : "—"}</td></tr>)}</tbody>
              </table>
            </div>
          )
        ) : lista.length === 0 ? (
          <p className="py-6 text-center text-sm text-texto-3">Nada por aquí.</p>
        ) : (
          <div className="-mx-4 overflow-x-auto sm:-mx-5">
            <table className="tabla">
              <thead><tr><th>Vence</th><th>Quién</th><th>Tipo</th><th className="text-right">Importe</th><th className="text-right">Falta</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {lista.sort((a, b) => a.v.vence_el.localeCompare(b.v.vence_el)).map((x) => (
                  <tr key={x.v.id}>
                    <td className="whitespace-nowrap">{x.v.vence_el.split("-").reverse().join("/")}</td>
                    <td>{x.v.lead_id ? <Link href={`/leads/${x.v.lead_id}`} className="hover:text-primario">{x.quien}</Link> : x.quien}</td>
                    <td className="text-texto-2">{x.clase === "cuotas" ? `Cuota ${x.v.numero}` : x.clase === "reserva" ? "Resto de reserva" : "Deudor"}</td>
                    <td className="text-right tabular-nums">{$(x.v.importe)}</td>
                    <td className="text-right tabular-nums">{x.falta ? $(x.falta) : "—"}</td>
                    <td><Insignia tono={ETQ[x.estado][1]}>{ETQ[x.estado][0]}</Insignia></td>
                    <td className="text-right">
                      <AccionesVencimiento id={x.v.id} deVenta={!!x.v.venta_id} estado={x.estado === "pagado" ? "pagado" : x.v.estado} venceEl={x.v.vence_el} />
                      {x.v.venta_id && x.estado !== "pagado" && x.estado !== "no_paga" && venta.get(x.v.venta_id) && <div className="relative mt-1"><FilaVentaAcciones ventaId={x.v.venta_id} pendiente={pendienteDe(venta.get(x.v.venta_id)!, d.pagos)} cobrado={0} devuelta jefe={false} /></div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-texto-3">Los plazos de una venta (reserva o cuotas) se crean solos al vender y se dan por cobrados al registrar el cobro («Cobro»). Los cobros tapan los plazos por orden de fecha.</p>
      </Seccion>
    </>
  );
}
