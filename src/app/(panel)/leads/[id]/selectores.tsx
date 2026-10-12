"use client";

import { asignarDesdeFicha, cambiarEtapaLead } from "../acciones";
import { useAccion, Mensajes } from "@/components/acciones-lead";
import type { Etapa, Pipeline } from "@/lib/tipos";
import { Desplegable } from "@/components/eleccion";

type Persona = { id: string; nombre: string };

export function SelectoresLead({
  leadId,
  jefe,
  etapaId,
  callerId,
  closerId,
  pipelines,
  callers,
  closers,
}: {
  leadId: string;
  jefe: boolean;
  etapaId: string | null;
  callerId: string | null;
  closerId: string | null;
  pipelines: (Pipeline & { etapas: Etapa[] })[];
  callers: Persona[];
  closers: Persona[];
}) {
  const { pendiente, error, ok, ejecutar } = useAccion();
  const nombre = (lista: Persona[], id: string | null) => lista.find((p) => p.id === id)?.nombre ?? "Sin asignar";
  if (!jefe) {
    return (
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-texto-3">Caller</dt><dd>{nombre(callers, callerId)}</dd>
        <dt className="text-texto-3">Closer</dt><dd>{nombre(closers, closerId)}</dd>
      </dl>
    );
  }
  return (
    <div className="space-y-3">
      <div>
        <label className="etiqueta-campo" htmlFor="selectores-pipeline-y-columna">Pipeline y columna</label>
        <Desplegable id="selectores-pipeline-y-columna" className="campo" value={etapaId ?? ""} disabled={pendiente} onChange={(e) => ejecutar(() => cambiarEtapaLead(leadId, e.target.value), "Lead movido")}>
          {!etapaId && <option value="">Sin columna</option>}
          {pipelines.map((p) => (
            <optgroup key={p.id} label={p.nombre}>
              {p.etapas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </optgroup>
          ))}
        </Desplegable>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="etiqueta-campo" htmlFor="selectores-caller">Caller</label>
          <Desplegable id="selectores-caller" className="campo" value={callerId ?? ""} disabled={pendiente} onChange={(e) => ejecutar(() => asignarDesdeFicha(leadId, "caller_id", e.target.value), "Caller asignado")}>
            <option value="">Sin asignar</option>
            {callers.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Desplegable>
        </div>
        <div>
          <label className="etiqueta-campo" htmlFor="selectores-closer">Closer</label>
          <Desplegable id="selectores-closer" className="campo" value={closerId ?? ""} disabled={pendiente} onChange={(e) => ejecutar(() => asignarDesdeFicha(leadId, "closer_id", e.target.value), "Closer asignado")}>
            <option value="">Sin asignar</option>
            {closers.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Desplegable>
        </div>
      </div>
      <Mensajes error={error} ok={ok} />
    </div>
  );
}
