"use client";

import { useState } from "react";
import { Phone, ClipboardCheck } from "lucide-react";
import { cambiarEstadoCita, reagendarCita } from "../acciones";
import { AccionesCita } from "../acciones-cita";
import { registrarVenta } from "@/app/(panel)/leads/acciones";
import { FilaVentaAcciones } from "@/app/(panel)/ventas/fila-acciones";
import { useAccion, Mensajes, FormVenta } from "@/components/acciones-lead";
import { Modal } from "@/components/modal";
import { SelectorEstrellas } from "@/components/estrellas";
import { useToast } from "@/components/toasts";
import type { SubPostcall } from "@/lib/llamadas";
import type { EstadoCita, Producto } from "@/lib/tipos";

// Post-call como tablero (Paso H6, Cristian 10 oct 2026): mismo estilo que Pre-call.
// Al soltar una cita se hace lo mismo que con sus botones: el estado directo, o la ventana que toca
// (estrellas en Seguimiento y Perdidas, fecha en Reagendadas, venta en Reserva y Cuotas).

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

// A dónde se puede llevar cada cita: los mismos botones que tiene en Post-call (AccionesCita)
const DESTINOS: Partial<Record<SubPostcall, SubPostcall[]>> = {
  pendientes: ["seguimiento", "no_show", "perdida", "reagendadas", "reserva", "cuotas"],
  seguimiento: ["perdida", "reserva", "cuotas"],
};

type Soltada = { cita: TarjetaCitaPC; destino: SubPostcall };

export function TableroPostcall({ columnas, productos, moneda, jefe }: { columnas: ColumnaPC[]; productos: Producto[]; moneda: string; jefe: boolean }) {
  const { pendiente, error, ejecutar } = useAccion();
  const toast = useToast();
  const [sobre, setSobre] = useState<SubPostcall | null>(null);
  const [ventana, setVentana] = useState<Soltada | null>(null);
  const titulo = (v: SubPostcall) => columnas.find((c) => c.v === v)?.t ?? v;

  function soltar(destino: SubPostcall, texto: string) {
    let d: { id?: string; origen?: SubPostcall } = {};
    try {
      d = JSON.parse(texto);
    } catch {
      return; // no es una tarjeta de Post-call
    }
    if (!d.id || !d.origen || d.origen === destino) return;
    const cita = columnas.find((c) => c.v === d.origen)?.citas?.find((x) => x.id === d.id);
    if (!cita) return;
    if (!DESTINOS[d.origen]?.includes(destino)) {
      toast(`Desde «${titulo(d.origen)}» no se puede pasar a «${titulo(destino)}».`, "error");
      return;
    }
    if (destino === "no_show") ejecutar(() => cambiarEstadoCita(cita.id, "no_show", ""), `${cita.nombre} → No-show`);
    else setVentana({ cita, destino });
  }

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
                {col.citas?.map((c) => <TarjetaCita key={c.id} c={c} origen={col.v} arrastrable={!!DESTINOS[col.v]} productos={productos} moneda={moneda} />)}
                {col.ventas?.map((v) => (
                  <div key={v.id} className="space-y-1.5 rounded-lg border border-borde bg-panel p-3 text-sm shadow-sm">
                    <a href={`/leads/${v.lead_id}`} className="font-medium hover:text-primario">{v.nombre}</a>
                    <div className="text-xs text-texto-3">{v.detalle}</div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="tabular-nums">{v.facturacionTxt}</span>
                      <span className="text-aviso">Falta {v.faltaTxt}</span>
                    </div>
                    <div className="relative flex justify-end">
                      <FilaVentaAcciones ventaId={v.id} pendiente={v.pendiente} cobrado={v.cobrado} devuelta={v.devuelta} jefe={jefe} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <Mensajes error={error} ok="" />

      {ventana && (ventana.destino === "seguimiento" || ventana.destino === "perdida") && (
        <Modal titulo={`${ventana.cita.nombre} → ${titulo(ventana.destino)}`} onCerrar={() => setVentana(null)}>
          <form
            className="space-y-3"
            action={(fd) => {
              const e = ventana.destino as "seguimiento" | "perdida";
              ejecutar(() => cambiarEstadoCita(ventana.cita.id, e, String(fd.get("nota") ?? ""), Number(fd.get("estrellas"))), e === "seguimiento" ? "En seguimiento" : "Perdida");
              setVentana(null);
            }}
          >
            <SelectorEstrellas quien="closer" />
            <label className="block"><span className="etiqueta-campo">Nota (opcional)</span><textarea name="nota" rows={2} className="campo" placeholder={ventana.destino === "seguimiento" ? "Qué falta para que decida" : "Por qué no compró"} /></label>
            <button className="btn-primario w-full">Guardar</button>
          </form>
        </Modal>
      )}
      {ventana && ventana.destino === "reagendadas" && (
        <Modal titulo={`Reagendar a ${ventana.cita.nombre}`} onCerrar={() => setVentana(null)}>
          <form
            className="space-y-3"
            action={(fd) => {
              ejecutar(() => reagendarCita(ventana.cita.id, String(fd.get("fecha"))), "Cita reagendada");
              setVentana(null);
            }}
          >
            <label className="block"><span className="etiqueta-campo">Nueva fecha y hora</span><input type="datetime-local" name="fecha" required className="campo" /></label>
            <button className="btn-primario w-full">Reagendar</button>
          </form>
        </Modal>
      )}
      {ventana && (ventana.destino === "reserva" || ventana.destino === "cuotas") && (
        <Modal titulo={`Registrar venta de ${ventana.cita.nombre} (${ventana.destino === "reserva" ? "reserva" : "cuotas"})`} onCerrar={() => setVentana(null)} ancho="max-w-lg">
          <FormVenta
            productos={productos}
            moneda={moneda}
            desdeCita
            tipoInicial={ventana.destino}
            onEnviar={(fd) => {
              const leadId = ventana.cita.lead_id;
              ejecutar(() => registrarVenta(leadId, fd), "Venta registrada");
              setVentana(null);
            }}
          />
        </Modal>
      )}
    </>
  );
}

function TarjetaCita({ c, origen, arrastrable, productos, moneda }: { c: TarjetaCitaPC; origen: SubPostcall; arrastrable: boolean; productos: Producto[]; moneda: string }) {
  const [registrar, setRegistrar] = useState(false);
  return (
    <div
      draggable={arrastrable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", JSON.stringify({ id: c.id, origen }));
      }}
      className={`space-y-2 rounded-lg border border-borde bg-panel p-3 text-sm shadow-sm ${arrastrable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <a href={`/leads/${c.lead_id}`} className="font-medium hover:text-primario">{c.nombre}</a>
        {c.closer && <span className="chip bg-panel-2 text-texto-3">{c.closer}</span>}
      </div>
      {c.telefono && <a href={`tel:${c.telefono}`} className="flex items-center gap-1.5 text-primario"><Phone className="h-3.5 w-3.5" />{c.telefono}</a>}
      <div className="text-xs text-texto-2">📅 {c.fechaTxt}</div>
      <div className="text-[11px] text-texto-3">{c.quien}</div>
      {c.nota && <div className="text-xs text-texto-2">📝 {c.nota}</div>}
      {arrastrable && (
        <>
          <button className="btn-secundario px-2 py-1 text-xs" onClick={() => setRegistrar((v) => !v)}><ClipboardCheck className="h-3.5 w-3.5" /> Registrar</button>
          {registrar && <div className="border-t border-borde pt-2"><AccionesCita cita={{ id: c.id, estado: c.estado, lead_id: c.lead_id }} pasada={c.pasada} productos={productos} moneda={moneda} /></div>}
        </>
      )}
    </div>
  );
}
