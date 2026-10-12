"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Lock, Plus, X } from "lucide-react";
import { useAccion } from "@/components/acciones-lead";
import type { Pregunta } from "@/lib/reportes";
import { guardarPreguntasReporte } from "./acciones";
import { confirmar } from "@/components/dialogos";
import { Pastillas } from "@/components/eleccion";

// Preguntas del reporte de fin de día de un rol (bloque 7 de 1.0). Las fijas (las 3 de las tasas del closer) se
// pueden renombrar pero no quitar ni cambiar de tipo. Los reportes ya enviados se quedan con las suyas.
export function EditorPreguntas({ rol, inicial, fijas, personalizadas }: { rol: "caller" | "closer"; inicial: Pregunta[]; fijas: string[]; personalizadas: boolean }) {
  const [lista, setLista] = useState<Pregunta[]>(inicial);
  const { pendiente, error, ejecutar } = useAccion();
  const poner = (i: number, c: Partial<Pregunta>) => setLista(lista.map((p, j) => (j === i ? { ...p, ...c } : p)));
  const mover = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= lista.length) return;
    const l = [...lista];
    [l[i], l[j]] = [l[j], l[i]];
    setLista(l);
  };
  const nueva = () => setLista([...lista, { clave: `p_${Date.now().toString(36)}`, texto: "", tipo: "numero" }]);
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {lista.map((p, i) => {
          const fija = fijas.includes(p.clave);
          return (
            <div key={p.clave} className="flex flex-wrap items-center gap-2 rounded-lg border border-borde bg-panel-2 px-3 py-2 text-sm">
              <div className="flex flex-col">
                <button type="button" className="rounded p-0.5 text-texto-3 hover:text-texto disabled:opacity-30" disabled={i === 0} onClick={() => mover(i, -1)} aria-label={`Subir «${p.texto || "pregunta nueva"}»`}><ArrowUp className="h-3.5 w-3.5" /></button>
                <button type="button" className="rounded p-0.5 text-texto-3 hover:text-texto disabled:opacity-30" disabled={i === lista.length - 1} onClick={() => mover(i, 1)} aria-label={`Bajar «${p.texto || "pregunta nueva"}»`}><ArrowDown className="h-3.5 w-3.5" /></button>
              </div>
              <input className="campo min-w-48 flex-1 py-1" value={p.texto} onChange={(e) => poner(i, { texto: e.target.value })} placeholder="Texto de la pregunta" aria-label={`Pregunta ${i + 1}`} />
              <Pastillas className="campo w-auto py-1" value={p.tipo} disabled={fija} onChange={(e) => poner(i, { tipo: e.target.value as Pregunta["tipo"] })} aria-label={`Tipo de la pregunta ${i + 1}`}>
                <option value="numero">Número</option>
                <option value="texto">Texto</option>
              </Pastillas>
              <input className="campo min-w-40 flex-1 py-1 text-xs" value={p.ayuda ?? ""} onChange={(e) => poner(i, { ayuda: e.target.value })} placeholder="Ayuda (opcional)" aria-label={`Ayuda de la pregunta ${i + 1}`} />
              {fija ? (
                <span className="inline-flex items-center gap-1 text-xs text-texto-3" title="Se usa para las tasas del closer: se puede renombrar, no quitar"><Lock className="h-3.5 w-3.5" /> fija</span>
              ) : (
                <button type="button" className="rounded p-1 text-texto-3 hover:text-mal" onClick={() => setLista(lista.filter((_, j) => j !== i))} aria-label={`Quitar la pregunta ${i + 1}`}><X className="h-4 w-4" /></button>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secundario px-3 py-1.5 text-xs" onClick={nueva}><Plus className="h-3.5 w-3.5" /> Añadir pregunta</button>
        <button type="button" className="btn-primario" disabled={pendiente} onClick={() => ejecutar(() => guardarPreguntasReporte(rol, lista), "Preguntas guardadas")}>Guardar</button>
        {personalizadas && <button type="button" className="btn-secundario" disabled={pendiente} onClick={() => void confirmar("¿Volver a las preguntas de siempre? Los reportes ya enviados no cambian.").then((ok) => ok && ejecutar(() => guardarPreguntasReporte(rol, null), "Vuelven las de siempre"))}>Volver a las de siempre</button>}
      </div>
      {error && <p className="text-xs text-mal">{error}</p>}
    </div>
  );
}
