"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { borrarVenta, registrarCobro } from "./acciones";
import { useAccion, Mensajes } from "@/components/acciones-lead";
import { Modal } from "@/components/modal";

export function FilaVentaAcciones({ ventaId, pendiente, jefe }: { ventaId: string; pendiente: number; jefe: boolean }) {
  const { pendiente: cargando, error, ok, ejecutar } = useAccion();
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="flex items-center justify-end gap-1">
      {pendiente > 0 && (
        <button className="btn-secundario px-2 py-1 text-xs" disabled={cargando} onClick={() => setAbierto(true)} title="Registrar cobro de cuota o resto">
          <Plus className="h-3.5 w-3.5" /> Cobro
        </button>
      )}
      {jefe && (
        <button
          className="rounded-md p-1.5 text-texto-3 hover:bg-mal-suave hover:text-mal"
          disabled={cargando}
          title="Borrar venta"
          onClick={() => confirm("¿Borrar esta venta? No se puede deshacer.") && ejecutar(() => borrarVenta(ventaId))}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      {(error || ok) && <div className="absolute"><Mensajes error={error} ok={ok} /></div>}
      {abierto && (
        <Modal titulo="Registrar cobro" onCerrar={() => setAbierto(false)}>
          <form
            className="space-y-3"
            action={(fd) => {
              ejecutar(() => registrarCobro(ventaId, String(fd.get("importe")), String(fd.get("metodo"))), "Cobro registrado");
              setAbierto(false);
            }}
          >
            <p className="text-sm text-texto-2">Queda pendiente: <b>{pendiente.toFixed(2)}</b></p>
            <div><label className="etiqueta-campo">Importe cobrado</label><input name="importe" inputMode="decimal" required defaultValue={pendiente.toFixed(2)} className="campo" /></div>
            <div>
              <label className="etiqueta-campo">Método</label>
              <select name="metodo" className="campo"><option value="stripe">Stripe</option><option value="transferencia">Transferencia</option><option value="otro">Otro</option></select>
            </div>
            <button className="btn-primario w-full">Guardar cobro</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
