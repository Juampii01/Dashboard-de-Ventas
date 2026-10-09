"use client";

import { useState } from "react";
import { Check, ShoppingCart, ListChecks, UserX, CalendarClock, XCircle, Ban, ThumbsDown } from "lucide-react";
import { cambiarEstadoCita, reagendarCita } from "./acciones";
import { registrarVenta } from "@/app/(panel)/leads/acciones";
import { useAccion, Mensajes, FormVenta } from "@/components/acciones-lead";
import { Modal } from "@/components/modal";
import type { EstadoCita, Producto } from "@/lib/tipos";

export function AccionesCita({
  cita,
  pasada,
  productos,
  moneda,
}: {
  cita: { id: string; estado: EstadoCita; lead_id: string };
  pasada: boolean;
  productos: Producto[];
  moneda: string;
}) {
  const { pendiente, error, ok, ejecutar } = useAccion();
  const [modal, setModal] = useState<null | "venta" | "reagendar">(null);
  const b = "btn-secundario px-2.5 py-1.5 text-xs";
  const abierta = cita.estado === "pendiente" || cita.estado === "confirmada";
  const estado = (e: EstadoCita, msg: string) => ejecutar(() => cambiarEstadoCita(cita.id, e, ""), msg);

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
      <div className="flex flex-wrap gap-1.5">
        {abierta && !pasada && (
          <>
            {cita.estado === "pendiente" && <button className={b} disabled={pendiente} onClick={() => estado("confirmada", "Confirmada")}><Check className="h-3.5 w-3.5 text-ok" />Confirmar</button>}
            <button className={b} disabled={pendiente} onClick={() => estado("no_califica", "Marcada como no califica")}><Ban className="h-3.5 w-3.5 text-mal" />No califica</button>
            <button className={b} disabled={pendiente} onClick={() => setModal("reagendar")}><CalendarClock className="h-3.5 w-3.5" />Reagendar</button>
            <button className={b} disabled={pendiente} onClick={() => estado("cancelada", "Cancelada")}><XCircle className="h-3.5 w-3.5 text-mal" />Cancelar</button>
          </>
        )}
        {(pasada && abierta) || cita.estado === "seguimiento" ? (
          <>
            <button className="btn-primario px-2.5 py-1.5 text-xs" disabled={pendiente} onClick={() => setModal("venta")}><ShoppingCart className="h-3.5 w-3.5" />Cerrada</button>
            {cita.estado !== "seguimiento" && <button className={b} disabled={pendiente} onClick={() => estado("seguimiento", "En seguimiento")}><ListChecks className="h-3.5 w-3.5 text-aviso" />Seguimiento</button>}
            {cita.estado !== "seguimiento" && <button className={b} disabled={pendiente} onClick={() => estado("no_show", "No show")}><UserX className="h-3.5 w-3.5 text-mal" />No show</button>}
            <button className={b} disabled={pendiente} onClick={() => estado("perdida", "Perdida")}><ThumbsDown className="h-3.5 w-3.5 text-mal" />Perdida</button>
            {cita.estado !== "seguimiento" && <button className={b} disabled={pendiente} onClick={() => setModal("reagendar")}><CalendarClock className="h-3.5 w-3.5" />Reagendar</button>}
          </>
        ) : null}
      </div>
      <Mensajes error={error} ok={ok} />
      {modal === "venta" && (
        <Modal titulo="Registrar venta (cita cerrada)" onCerrar={() => setModal(null)} ancho="max-w-lg">
          <FormVenta
            productos={productos}
            moneda={moneda}
            onEnviar={(fd) => {
              ejecutar(() => registrarVenta(cita.lead_id, fd), "Venta registrada");
              setModal(null);
            }}
          />
        </Modal>
      )}
      {modal === "reagendar" && (
        <Modal titulo="Reagendar cita" onCerrar={() => setModal(null)}>
          <form
            className="space-y-3"
            action={(fd) => {
              ejecutar(() => reagendarCita(cita.id, String(fd.get("fecha"))), "Cita reagendada");
              setModal(null);
            }}
          >
            <div><label className="etiqueta-campo">Nueva fecha y hora</label><input type="datetime-local" name="fecha" required className="campo" /></div>
            <button className="btn-primario w-full">Reagendar</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
