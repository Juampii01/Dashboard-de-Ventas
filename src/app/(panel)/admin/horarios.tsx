"use client";

import { useState } from "react";
import { useAccion } from "@/components/acciones-lead";
import { DIAS_SEMANA, type Horario } from "@/lib/horarios";
import { guardarHorario } from "./acciones";

// Turno de un caller para el reparto por horarios (hora del proyecto)
export function EditorHorario({ perfilId, nombre, horario }: { perfilId: string; nombre: string; horario: Horario }) {
  const [dias, setDias] = useState<number[]>(horario?.dias ?? [1, 2, 3, 4, 5]);
  const [desde, setDesde] = useState(horario?.desde ?? "09:00");
  const [hasta, setHasta] = useState(horario?.hasta ?? "14:00");
  const { pendiente, error, ejecutar } = useAccion();
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-borde bg-panel-2 px-3 py-2 text-sm">
      <span className="w-32 truncate font-medium">{nombre}</span>
      <div className="flex gap-0.5" role="group" aria-label={`Días de ${nombre}`}>
        {DIAS_SEMANA.map((d, i) => {
          const on = dias.includes(i + 1);
          return <button key={d} type="button" aria-pressed={on} onClick={() => setDias(on ? dias.filter((x) => x !== i + 1) : [...dias, i + 1])} className={`h-7 w-7 rounded text-xs ${on ? "bg-primario text-white" : "bg-panel text-texto-3"}`}>{d}</button>;
        })}
      </div>
      <input type="time" value={desde} onChange={(e) => setDesde(e.target.value)} className="campo w-auto py-1" aria-label="Desde" />
      <span className="text-texto-3">a</span>
      <input type="time" value={hasta} onChange={(e) => setHasta(e.target.value)} className="campo w-auto py-1" aria-label="Hasta" />
      <button className="btn-secundario px-2 py-1 text-xs" disabled={pendiente} onClick={() => ejecutar(() => guardarHorario(perfilId, { dias, desde, hasta }), "Horario guardado")}>Guardar</button>
      {horario && <button className="text-xs text-texto-3 hover:text-mal" disabled={pendiente} onClick={() => ejecutar(() => guardarHorario(perfilId, null), "Horario quitado")}>Quitar</button>}
      {!horario && <span className="text-xs text-aviso">Sin horario</span>}
      {error && <span className="w-full text-xs text-mal">{error}</span>}
    </div>
  );
}
