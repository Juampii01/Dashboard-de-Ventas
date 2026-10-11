"use client";

import { sinVaciar } from "@/components/sin-vaciar";
import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { enviarReporte } from "./acciones";
import { tasasCloser, type Pregunta } from "@/lib/reportes";
import { Modal } from "@/components/modal";

export function NuevoReporte({ rol, sugeridos, preguntas }: { rol: "caller" | "closer"; sugeridos: Record<string, number>; preguntas: Pregunta[] }) {
  const [abierto, setAbierto] = useState(false);
  const [paso, setPaso] = useState(0);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [estado, accion, enviando] = useActionState(enviarReporte, null as null | { ok?: string; error?: string });
  const numeros = preguntas.filter((p) => p.tipo === "numero");
  const textos = preguntas.filter((p) => p.tipo === "texto");
  const hoy = new Date().toLocaleDateString("en-CA");

  return (
    <>
      <button className="btn-primario" onClick={() => { setAbierto(true); setPaso(0); }}><Plus className="h-4 w-4" /> Crear nuevo reporte</button>
      {abierto && (
        <Modal titulo="Reporte de fin de día" onCerrar={() => setAbierto(false)} ancho="max-w-xl">
          {estado?.ok ? (
            <div className="space-y-4 py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ok-suave text-2xl text-ok">✓</div>
              <p className="font-medium">{estado.ok}</p>
              <button className="btn-secundario" onClick={() => setAbierto(false)}>Cerrar</button>
            </div>
          ) : (
            <form onSubmit={sinVaciar(accion)} className="space-y-4">
              <div className="flex gap-1.5">{[0, 1].map((i) => <span key={i} className={`h-1 flex-1 rounded-full ${i <= paso ? "bg-primario" : "bg-borde"}`} />)}</div>
              <div className={paso === 0 ? "space-y-4" : "hidden"}>
                <div>
                  <label className="etiqueta-campo" htmlFor="formulario-dia">Día</label>
                  <input id="formulario-dia" type="date" name="fecha" defaultValue={hoy} max={hoy} className="campo" />
                </div>
                <p className="text-xs text-texto-3">Hemos rellenado los números con lo que registraste hoy en el panel. Corrígelos si hace falta.</p>
                <div className="grid grid-cols-2 gap-3">
                  {numeros.map((p) => (
                    <div key={p.clave} className={p.destacada ? "col-span-2 rounded-lg border border-oro/40 bg-oro-suave p-3" : ""}>
                      <label className="etiqueta-campo" htmlFor={`rep-${p.clave}`}>{p.texto}</label>
                      <input id={`rep-${p.clave}`}
                        name={p.clave}
                        type="number"
                        min={0}
                        step={1}
                        required
                        defaultValue={sugeridos[p.clave] ?? 0}
                        onChange={(e) => setValores((v) => ({ ...v, [p.clave]: e.target.value }))}
                        className="campo text-lg font-semibold tabular-nums"
                      />
                      {p.ayuda && <p className="mt-1 text-xs text-texto-3">{p.ayuda}</p>}
                    </div>
                  ))}
                </div>
                {rol === "closer" && (() => {
                  const t = tasasCloser({ ...Object.fromEntries(numeros.map((p) => [p.clave, sugeridos[p.clave] ?? 0])), ...valores });
                  return (
                    <div className="grid grid-cols-2 gap-3 rounded-lg border border-dashed border-borde bg-panel-2 p-3 text-center">
                      <div><div className="text-xl font-semibold text-primario">{t.agendamiento}</div><div className="text-[11px] uppercase tracking-wider text-texto-3">Tasa de agendamiento</div></div>
                      <div><div className="text-xl font-semibold text-ok">{t.cierre}</div><div className="text-[11px] uppercase tracking-wider text-texto-3">Tasa de cierre</div></div>
                    </div>
                  );
                })()}
                <button type="button" className="btn-primario w-full" onClick={() => setPaso(1)}>Siguiente →</button>
              </div>
              <div className={paso === 1 ? "space-y-4" : "hidden"}>
                {textos.map((p) => (
                  <div key={p.clave}>
                    <label className="etiqueta-campo" htmlFor={`rep-${p.clave}`}>{p.texto}</label>
                    <textarea id={`rep-${p.clave}`} name={p.clave} rows={3} required className="campo" />
                    {p.ayuda && <p className="mt-1 text-xs text-texto-3">{p.ayuda}</p>}
                  </div>
                ))}
                {estado?.error && <p className="rounded-lg bg-mal-suave px-3 py-2 text-sm text-mal">{estado.error}</p>}
                <div className="flex gap-2">
                  <button type="button" className="btn-secundario" onClick={() => setPaso(0)}>← Atrás</button>
                  <button className="btn-primario flex-1" disabled={enviando}>{enviando ? "Enviando…" : "Enviar mi reporte ✓"}</button>
                </div>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
