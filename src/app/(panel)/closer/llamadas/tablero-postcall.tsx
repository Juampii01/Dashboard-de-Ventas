"use client";

import { useState } from "react";
import { Phone, ClipboardCheck } from "lucide-react";
import { cambiarEstadoCita, reagendarCita } from "../acciones";
import { AccionesCita } from "../acciones-cita";
import { registrarVenta } from "@/app/(panel)/leads/acciones";
import { borrarVenta, cambiarFormaPago, registrarCobro } from "@/app/(panel)/ventas/acciones";
import { FilaVentaAcciones } from "@/app/(panel)/ventas/fila-acciones";
import { useAccion, Mensajes, FormVenta } from "@/components/acciones-lead";
import { Modal } from "@/components/modal";
import { SelectorEstrellas } from "@/components/estrellas";
import { useToast } from "@/components/toasts";
import { exigirOk } from "@/lib/resultado-cliente";
import type { SubPostcall } from "@/lib/llamadas";
import type { EstadoCita, Producto } from "@/lib/tipos";

// Post-call como tablero (Paso H6, Cristian 10 oct 2026): mismo estilo que Pre-call y todo se mueve,
// arrastrando o con «Mover a…». Citas: a cualquier columna (en Seguimiento y Perdidas se piden las
// estrellas, en Reagendadas la fecha y en Reserva o Cuotas la venta). Ventas: Reserva ↔ Cuotas cambia la
// forma de pago; a cualquier otra columna se borra la venta y su cita pasa a esa columna.

export type TarjetaCitaPC = {
  id: string;
  lead_id: string;
  estado: EstadoCita;
  nombre: string;
  telefono: string | null;
  fechaTxt: string;
  quien: string; // «Agendó X» o «Calendario GHL»
  nota: string | null;
  closer: string | null;
  pasada: boolean;
};
export type TarjetaVentaPC = { id: string; lead_id: string; nombre: string; detalle: string; facturacionTxt: string; faltaTxt: string; pendiente: number; cobrado: number; devuelta: boolean };
export type ColumnaPC = { v: SubPostcall; t: string; d: string; color: string; citas?: TarjetaCitaPC[]; ventas?: TarjetaVentaPC[] };

type Item = { clase: "cita"; cita: TarjetaCitaPC; origen: SubPostcall } | { clase: "venta"; venta: TarjetaVentaPC; origen: SubPostcall };
// Ventana abierta al soltar: lo que falta pedir antes de mover
type Ventana = { item: Item; destino: SubPostcall };

const DIRECTO: Partial<Record<SubPostcall, EstadoCita>> = { pendientes: "pendiente", no_show: "no_show", cancelada: "cancelada" };
const esVenta = (v: SubPostcall) => v === "reserva" || v === "cuotas" || v === "cerradas";

export function TableroPostcall({ columnas, productos, moneda, jefe, soloMirar = false }: { columnas: ColumnaPC[]; productos: Producto[]; moneda: string; jefe: boolean; soloMirar?: boolean }) {
  const { pendiente, error, ejecutar } = useAccion();
  const toast = useToast();
  const [sobre, setSobre] = useState<SubPostcall | null>(null);
  const [ventana, setVentana] = useState<Ventana | null>(null);
  const titulo = (v: SubPostcall) => columnas.find((c) => c.v === v)?.t ?? v;
  const nombre = (i: Item) => (i.clase === "cita" ? i.cita.nombre : i.venta.nombre);

  // Borra la venta y devuelve su cita (la que estaba «cerrada»), o avisa si no hay
  async function quitarVenta(venta: TarjetaVentaPC) {
    const r = (await exigirOk(borrarVenta(venta.id))) as { aviso: string | null; citaId: string | null };
    if (r.aviso) toast(r.aviso, "error");
    if (!r.citaId) throw new Error("Venta borrada. Su cita no se ha movido: el lead tiene otra venta o no tenía cita cerrada.");
    return r.citaId;
  }

  function mover(item: Item, destino: SubPostcall) {
    if (item.origen === destino) return;
    // Venta entre Reserva, Cuotas y Cerradas
    if (item.clase === "venta" && esVenta(destino)) {
      const pagada = item.venta.pendiente <= 0.001;
      if (destino === "cerradas") {
        // Cerradas = pagadas del todo: se registra el cobro de lo que falta (criterio de Claude, 10 oct 2026)
        if (pagada) toast("Esta venta ya está pagada del todo.");
        else setVentana({ item, destino });
      } else if (pagada) toast(`Esta venta ya está pagada del todo: no hay nada que pasar a ${destino === "cuotas" ? "cuotas" : "reserva"}.`, "error");
      else if (destino === "cuotas") setVentana({ item, destino });
      else if (confirm(`¿Pasar la venta de ${item.venta.nombre} a reserva? Lo que falta (${item.venta.faltaTxt}) queda en un solo plazo a 30 días.`))
        ejecutar(() => cambiarFormaPago(item.venta.id, "reserva"), `${item.venta.nombre} → Reserva`);
      return;
    }
    const estado = DIRECTO[destino];
    if (estado) {
      if (item.clase === "cita") ejecutar(() => cambiarEstadoCita(item.cita.id, estado, ""), `${item.cita.nombre} → ${titulo(destino)}`);
      else if (confirm(`¿Borrar la venta de ${item.venta.nombre} (${item.venta.facturacionTxt}) y pasar su cita a «${titulo(destino)}»? Se borran también sus cobros y plazos; no se puede deshacer.`))
        ejecutar(async () => exigirOk(cambiarEstadoCita(await quitarVenta(item.venta), estado, "")), `${item.venta.nombre} → ${titulo(destino)}`);
      return;
    }
    setVentana({ item, destino }); // estrellas, fecha o venta
  }

  function soltar(destino: SubPostcall, texto: string) {
    if (soloMirar) return; // H5: un caller con «Agendas», solo mirar
    let d: { clase?: string; id?: string; origen?: SubPostcall } = {};
    try {
      d = JSON.parse(texto);
    } catch {
      return; // no es una tarjeta de Post-call
    }
    const col = columnas.find((c) => c.v === d.origen);
    const cita = d.clase === "cita" ? col?.citas?.find((x) => x.id === d.id) : undefined;
    const venta = d.clase === "venta" ? col?.ventas?.find((x) => x.id === d.id) : undefined;
    if (cita) mover({ clase: "cita", cita, origen: d.origen! }, destino);
    else if (venta) mover({ clase: "venta", venta, origen: d.origen! }, destino);
  }

  // Lo que hace el formulario de la ventana: si la tarjeta es una venta, primero se borra
  const citaDe = async (i: Item) => (i.clase === "cita" ? i.cita.id : await quitarVenta(i.venta));
  const avisoBorrar = (i: Item) =>
    i.clase === "venta" ? <p className="rounded-lg bg-mal-suave px-3 py-2 text-xs text-mal">Se borrará la venta de {i.venta.nombre} ({i.venta.facturacionTxt}) con sus cobros y plazos. No se puede deshacer.</p> : null;

  return (
    <>
      <div className={`flex gap-3 overflow-x-auto pb-2 ${pendiente ? "cursor-progress" : ""}`}>
        {columnas.map((col) => {
          const total = (col.citas?.length ?? 0) + (col.ventas?.length ?? 0);
          return (
            <div
              key={col.v}
              onDragOver={(ev) => {
                ev.preventDefault();
                setSobre(col.v);
              }}
              onDragLeave={() => setSobre((s) => (s === col.v ? null : s))}
              onDrop={(ev) => {
                ev.preventDefault();
                setSobre(null);
                soltar(col.v, ev.dataTransfer.getData("text/plain"));
              }}
              className={`flex w-72 shrink-0 flex-col rounded-xl border transition-colors ${sobre === col.v ? "border-primario bg-primario-suave/40" : "border-borde bg-panel-2/60"}`}
            >
              <div className="border-b border-borde px-3 py-2.5" style={{ borderTop: `3px solid ${col.color}`, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                <div className="flex items-center justify-between text-sm font-semibold">
                  {col.t}
                  <span className="rounded-full bg-panel px-1.5 text-[11px] tabular-nums text-texto-2">{total}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-texto-3">{col.d}</div>
              </div>
              <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto p-2">
                {total === 0 && <p className="py-6 text-center text-xs text-texto-3">Sin llamadas</p>}
                {col.citas?.map((c) => (
                  <TarjetaCita key={c.id} c={c} origen={col.v} columnas={columnas} productos={productos} moneda={moneda} soloMirar={soloMirar} onMover={(dest) => mover({ clase: "cita", cita: c, origen: col.v }, dest)} />
                ))}
                {col.ventas?.map((v) => (
                  <div
                    key={v.id}
                    draggable={!soloMirar}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", JSON.stringify({ clase: "venta", id: v.id, origen: col.v }));
                    }}
                    className={`space-y-1.5 rounded-lg border border-borde bg-panel p-3 text-sm shadow-sm ${soloMirar ? "" : "cursor-grab active:cursor-grabbing"}`}
                  >
                    <a href={`/leads/${v.lead_id}`} className="font-medium hover:text-primario">{v.nombre}</a>
                    <div className="text-xs text-texto-3">{v.detalle}</div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="tabular-nums">{v.facturacionTxt}</span>
                      {v.pendiente > 0.001 ? <span className="text-aviso">Falta {v.faltaTxt}</span> : <span className="text-ok">Pagada</span>}
                    </div>
                    {!soloMirar && <div className="relative flex flex-wrap items-center justify-between gap-1.5">
                      <MoverA origen={col.v} columnas={columnas} onMover={(dest) => mover({ clase: "venta", venta: v, origen: col.v }, dest)} />
                      <FilaVentaAcciones ventaId={v.id} pendiente={v.pendiente} cobrado={v.cobrado} devuelta={v.devuelta} jefe={jefe} />
                    </div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <Mensajes error={error} ok="" />

      {ventana && (ventana.destino === "seguimiento" || ventana.destino === "perdida") && (
        <Modal titulo={`${nombre(ventana.item)} → ${titulo(ventana.destino)}`} onCerrar={() => setVentana(null)}>
          <form
            className="space-y-3"
            action={(fd) => {
              const { item, destino } = ventana;
              const e = destino as "seguimiento" | "perdida";
              ejecutar(async () => exigirOk(cambiarEstadoCita(await citaDe(item), e, String(fd.get("nota") ?? ""), Number(fd.get("estrellas")))), e === "seguimiento" ? "En seguimiento" : "Perdida");
              setVentana(null);
            }}
          >
            {avisoBorrar(ventana.item)}
            <SelectorEstrellas quien="closer" />
            <label className="block"><span className="etiqueta-campo">Nota (opcional)</span><textarea name="nota" rows={2} className="campo" placeholder={ventana.destino === "seguimiento" ? "Qué falta para que decida" : "Por qué no compró"} /></label>
            <button className="btn-primario w-full">Guardar</button>
          </form>
        </Modal>
      )}
      {ventana && ventana.destino === "reagendadas" && (
        <Modal titulo={`Reagendar a ${nombre(ventana.item)}`} onCerrar={() => setVentana(null)}>
          <form
            className="space-y-3"
            action={(fd) => {
              const { item } = ventana;
              ejecutar(async () => exigirOk(reagendarCita(await citaDe(item), String(fd.get("fecha")))), "Cita reagendada");
              setVentana(null);
            }}
          >
            {avisoBorrar(ventana.item)}
            <label className="block"><span className="etiqueta-campo">Nueva fecha y hora</span><input type="datetime-local" name="fecha" required className="campo" /></label>
            <button className="btn-primario w-full">Reagendar</button>
          </form>
        </Modal>
      )}
      {ventana && ventana.item.clase === "cita" && esVenta(ventana.destino) && (
        <Modal titulo={`Registrar venta de ${ventana.item.cita.nombre} (${ventana.destino === "reserva" ? "reserva" : ventana.destino === "cuotas" ? "cuotas" : "pago completo"})`} onCerrar={() => setVentana(null)} ancho="max-w-lg">
          <FormVenta
            productos={productos}
            moneda={moneda}
            desdeCita
            tipoInicial={ventana.destino === "cerradas" ? "completo" : (ventana.destino as "reserva" | "cuotas")}
            onEnviar={(fd) => {
              if (ventana.item.clase !== "cita") return;
              const { lead_id, id } = ventana.item.cita;
              fd.set("cita_id", id); // cierra esta cita, aunque estuviera terminada
              ejecutar(() => registrarVenta(lead_id, fd), "Venta registrada");
              setVentana(null);
            }}
          />
        </Modal>
      )}
      {ventana && ventana.item.clase === "venta" && ventana.destino === "cerradas" && (
        <Modal titulo={`Cobrar lo que falta de ${ventana.item.venta.nombre}`} onCerrar={() => setVentana(null)}>
          <form
            className="space-y-3"
            action={(fd) => {
              if (ventana.item.clase !== "venta") return;
              const v = ventana.item.venta;
              ejecutar(() => registrarCobro(v.id, String(fd.get("importe")), String(fd.get("metodo")), String(fd.get("fecha") ?? "")), `${v.nombre} → Cerradas`);
              setVentana(null);
            }}
          >
            <p className="text-sm text-texto-2">«Cerradas» son las ventas pagadas del todo. Para pasarla, registra el cobro de lo que falta: <b>{ventana.item.venta.faltaTxt}</b>.</p>
            <label className="block"><span className="etiqueta-campo">Importe cobrado</span><input name="importe" inputMode="decimal" required defaultValue={ventana.item.venta.pendiente.toFixed(2)} className="campo" /></label>
            <label className="block">
              <span className="etiqueta-campo">Método</span>
              <select name="metodo" className="campo" defaultValue="stripe"><option value="stripe">Stripe</option><option value="transferencia">Transferencia</option><option value="otro">Otro</option></select>
            </label>
            <label className="block"><span className="etiqueta-campo">Fecha del cobro (vacía = hoy)</span><input name="fecha" type="date" className="campo" /></label>
            <button className="btn-primario w-full">Registrar cobro</button>
          </form>
        </Modal>
      )}
      {ventana && ventana.item.clase === "venta" && ventana.destino === "cuotas" && (
        <Modal titulo={`Pasar a cuotas la venta de ${ventana.item.venta.nombre}`} onCerrar={() => setVentana(null)}>
          <form
            className="space-y-3"
            action={(fd) => {
              if (ventana.item.clase !== "venta") return;
              const v = ventana.item.venta;
              ejecutar(() => cambiarFormaPago(v.id, "cuotas", String(fd.get("cuotas"))), `${v.nombre} → Cuotas`);
              setVentana(null);
            }}
          >
            <p className="text-sm text-texto-2">Falta por cobrar <b>{ventana.item.venta.faltaTxt}</b>. Se reparte en cuotas mensuales desde el mes que viene; lo ya cobrado se queda como está.</p>
            <label className="block"><span className="etiqueta-campo">¿En cuántas cuotas lo que falta?</span><input name="cuotas" type="number" min={1} max={60} required defaultValue={3} className="campo" /></label>
            <button className="btn-primario w-full">Pasar a cuotas</button>
          </form>
        </Modal>
      )}
    </>
  );
}

// «Mover a…»: lo mismo que arrastrar (sirve en el móvil)
function MoverA({ origen, columnas, onMover }: { origen: SubPostcall; columnas: ColumnaPC[]; onMover: (d: SubPostcall) => void }) {
  return (
    <select aria-label="Mover a" className="campo w-auto py-1 text-xs" value="" onChange={(e) => e.target.value && onMover(e.target.value as SubPostcall)}>
      <option value="">Mover a…</option>
      {columnas.filter((c) => c.v !== origen).map((c) => <option key={c.v} value={c.v}>{c.t}</option>)}
    </select>
  );
}

function TarjetaCita({ c, origen, columnas, productos, moneda, soloMirar, onMover }: { c: TarjetaCitaPC; origen: SubPostcall; columnas: ColumnaPC[]; productos: Producto[]; moneda: string; soloMirar: boolean; onMover: (d: SubPostcall) => void }) {
  const [registrar, setRegistrar] = useState(false);
  return (
    <div
      draggable={!soloMirar}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", JSON.stringify({ clase: "cita", id: c.id, origen }));
      }}
      className={`space-y-2 rounded-lg border border-borde bg-panel p-3 text-sm shadow-sm ${soloMirar ? "" : "cursor-grab active:cursor-grabbing"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <a href={`/leads/${c.lead_id}`} className="font-medium hover:text-primario">{c.nombre}</a>
        {c.closer && <span className="chip bg-panel-2 text-texto-3">{c.closer}</span>}
      </div>
      {c.telefono && <a href={`tel:${c.telefono}`} className="flex items-center gap-1.5 text-primario"><Phone className="h-3.5 w-3.5" />{c.telefono}</a>}
      <div className="text-xs text-texto-2">📅 {c.fechaTxt}</div>
      <div className="text-[11px] text-texto-3">{c.quien}</div>
      {c.nota && <div className="text-xs text-texto-2">📝 {c.nota}</div>}
      {!soloMirar && <div className="flex flex-wrap gap-1.5">
        {(origen === "pendientes" || origen === "seguimiento") && (
          <button className="btn-secundario px-2 py-1 text-xs" onClick={() => setRegistrar((v) => !v)}><ClipboardCheck className="h-3.5 w-3.5" /> Registrar</button>
        )}
        <MoverA origen={origen} columnas={columnas} onMover={onMover} />
      </div>}
      {registrar && <div className="border-t border-borde pt-2"><AccionesCita cita={{ id: c.id, estado: c.estado, lead_id: c.lead_id }} pasada={c.pasada} productos={productos} moneda={moneda} /></div>}
    </div>
  );
}
