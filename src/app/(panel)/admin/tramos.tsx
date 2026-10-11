"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useAccion } from "@/components/acciones-lead";
import type { Tramo } from "@/lib/comisiones";
import { guardarTramos } from "./acciones";

// Bloque 4 de 1.0 (Cristian, 10 y 11 oct 2026): tramos de comisión de callers o de closers. El % del tramo que se
// alcanza en el mes vale para toda la facturación de ese mes (se reinicia cada mes y se paga sobre lo cobrado).
export function EditorTramos({ rol, inicial, moneda }: { rol: "caller" | "closer"; inicial: Tramo[]; moneda: string }) {
  const [filas, setFilas] = useState(inicial.map((t) => ({ desde: String(t.desde), pct: String(t.pct) })));
  const { pendiente, error, ejecutar } = useAccion();
  const fmt = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: moneda, maximumFractionDigits: 0, useGrouping: "always" }).format(n);
  const poner = (i: number, k: "desde" | "pct", v: string) => setFilas(filas.map((f, j) => (j === i ? { ...f, [k]: v } : f)));
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {filas.map((f, i) => {
          const sig = filas[i + 1];
          return (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-borde bg-panel-2 px-3 py-2 text-sm">
              <span className="text-texto-3">Desde</span>
              <input type="number" min={0} step={100} value={f.desde} disabled={i === 0} onChange={(e) => poner(i, "desde", e.target.value)} className="campo w-28 py-1 text-right" aria-label={`Tramo ${i + 1}: desde`} />
              <span className="w-32 text-xs text-texto-3">{sig ? `hasta ${fmt(Number(sig.desde) - 1)}` : "en adelante"}</span>
              <input type="number" min={0} max={100} step={0.5} value={f.pct} onChange={(e) => poner(i, "pct", e.target.value)} className="campo w-20 py-1 text-right" aria-label={`Tramo ${i + 1}: %`} />
              <span className="text-texto-3">%</span>
              {i > 0 && <button type="button" className="rounded p-1 text-texto-3 hover:bg-panel hover:text-mal" onClick={() => setFilas(filas.filter((_, j) => j !== i))} aria-label={`Quitar el tramo ${i + 1}`}><X className="h-3.5 w-3.5" /></button>}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secundario px-3 py-1.5 text-xs" onClick={() => setFilas([...filas, { desde: String((Number(filas[filas.length - 1]?.desde) || 0) + 10000), pct: filas[filas.length - 1]?.pct ?? "0" }])}><Plus className="h-3.5 w-3.5" /> Añadir tramo</button>
        <button type="button" className="btn-primario" disabled={pendiente} onClick={() => ejecutar(() => guardarTramos(rol, filas.map((f) => ({ desde: Number(f.desde), pct: Number(f.pct) }))), "Tramos guardados")}>Guardar</button>
      </div>
      {error && <p className="text-xs text-mal">{error}</p>}
    </div>
  );
}
