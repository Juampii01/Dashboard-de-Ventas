"use client";

import { agendarCita, registrarLlamada, registrarVenta } from "@/app/(panel)/leads/acciones";
import { FormVenta } from "@/components/acciones-lead";
import { Modal } from "@/components/modal";
import { SelectorEstrellas } from "@/components/estrellas";
import type { Producto } from "@/lib/tipos";

// Ventanas que se abren al soltar un lead en una columna unida a un estado (Paso H7). Son las mismas que
// tenía el CRM del caller: cada una hace lo mismo que su botón (y el servidor mueve la tarjeta a esa columna).
export type DestinoConVentana = "llamar_luego" | "agendado" | "no_interesa" | "vendido";

export function VentanaEstado({
  lead,
  destino,
  closers,
  productos,
  moneda,
  estrellasOpcionales,
  onCerrar,
  onGuardar,
}: {
  lead: { id: string; nombre: string };
  destino: DestinoConVentana;
  closers: { id: string; nombre: string }[];
  productos: Producto[];
  moneda: string;
  estrellasOpcionales: boolean; // al agendar, solo el caller está obligado a poner estrellas
  onCerrar: () => void;
  onGuardar: (accion: () => Promise<unknown>, mensaje: string) => void;
}) {
  const guardar = (accion: () => Promise<unknown>, mensaje: string) => {
    onGuardar(accion, mensaje);
    onCerrar();
  };
  if (destino === "llamar_luego")
    return (
      <Modal titulo={`Llamar luego a ${lead.nombre}`} onCerrar={onCerrar}>
        <form
          className="space-y-3"
          action={(fd) => guardar(() => registrarLlamada(lead.id, "llamar_luego", String(fd.get("nota") ?? ""), String(fd.get("cuando") ?? ""), Number(fd.get("estrellas"))), `${lead.nombre} → Llamar luego`)}
        >
          <label className="block"><span className="etiqueta-campo">¿Cuándo?</span><input type="datetime-local" name="cuando" required className="campo" /></label>
          <label className="block"><span className="etiqueta-campo">Nota</span><textarea name="nota" rows={3} className="campo" /></label>
          <SelectorEstrellas quien="caller" />
          <button className="btn-primario w-full">Guardar</button>
        </form>
      </Modal>
    );
  if (destino === "agendado")
    return (
      <Modal titulo={`Agendar a ${lead.nombre}`} onCerrar={onCerrar}>
        <form
          className="space-y-3"
          action={(fd) =>
            guardar(() => agendarCita(lead.id, String(fd.get("closer")), String(fd.get("fecha")), String(fd.get("nota") ?? ""), fd.get("estrellas") ? Number(fd.get("estrellas")) : undefined), `${lead.nombre} → Agendado`)
          }
        >
          <div>
            <label className="etiqueta-campo" htmlFor="ventana-estado-closer">Closer</label>
            <select id="ventana-estado-closer" name="closer" required className="campo">{closers.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
          </div>
          <label className="block"><span className="etiqueta-campo">Fecha y hora (hora del proyecto)</span><input type="datetime-local" name="fecha" required className="campo" /></label>
          <label className="block"><span className="etiqueta-campo">Nota para el closer</span><textarea name="nota" rows={3} className="campo" /></label>
          <SelectorEstrellas quien="caller" opcional={estrellasOpcionales} />
          <button className="btn-primario w-full">Agendar</button>
        </form>
      </Modal>
    );
  if (destino === "no_interesa")
    return (
      <Modal titulo={`${lead.nombre}: no le interesa`} onCerrar={onCerrar}>
        <form className="space-y-3" action={(fd) => guardar(() => registrarLlamada(lead.id, "no_interesa", String(fd.get("nota") ?? ""), undefined, Number(fd.get("estrellas"))), `${lead.nombre} → No interesa`)}>
          <SelectorEstrellas quien="caller" />
          <label className="block"><span className="etiqueta-campo">Nota (opcional)</span><textarea name="nota" rows={2} className="campo" /></label>
          <button className="btn-primario w-full">Guardar</button>
        </form>
      </Modal>
    );
  return (
    <Modal titulo={`Venta a ${lead.nombre}`} onCerrar={onCerrar} ancho="max-w-lg">
      <FormVenta productos={productos} moneda={moneda} onEnviar={(fd) => guardar(() => registrarVenta(lead.id, fd), `${lead.nombre} → Vendido`)} />
    </Modal>
  );
}
