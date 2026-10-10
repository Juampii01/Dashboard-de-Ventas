"use client";

import { useState } from "react";
import { useAccion } from "@/components/acciones-lead";
import { Modal } from "@/components/modal";
import { EditorHorario } from "@/components/editor-horario";
import { resumenHorario, type Horario } from "@/lib/horarios";
import type { AjustesCalendario } from "@/lib/disponibilidad";
import { guardarCalendario } from "./acciones";

type Persona = { id: string; nombre: string; rol: "caller" | "closer"; horario: Horario; propios: AjustesCalendario | null };

// Bloque 1 de 1.0: el administrador ve y cambia el horario de cada caller y closer, y los ajustes de las llamadas
export function HorariosEquipo({ personas, zona, general }: { personas: Persona[]; zona: string; general: AjustesCalendario }) {
  // Se guarda el id: así, al guardar, la ventana enseña los datos al día
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const editando = personas.find((p) => p.id === editandoId) ?? null;
  if (!personas.length) return <p className="text-sm text-texto-3">No hay callers ni closers activos.</p>;
  return (
    <>
      <ul className="space-y-1.5">
        {personas.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-borde bg-panel-2 px-3 py-2 text-sm">
            <span className="w-36 truncate font-medium">{p.nombre}</span>
            <span className="w-14 text-xs text-texto-3">{p.rol === "caller" ? "Caller" : "Closer"}</span>
            <span className={`min-w-0 flex-1 truncate text-xs ${p.horario ? "text-texto-2" : "text-aviso"}`}>
              {resumenHorario(p.horario)}
              {p.horario && Object.keys(p.horario.fechas).length > 0 && ` · ${Object.keys(p.horario.fechas).length} día(s) sueltos`}
              {p.propios && " · llamadas con ajustes propios"}
            </span>
            <button type="button" className="btn-secundario px-2 py-1 text-xs" onClick={() => setEditandoId(p.id)} aria-label={`Editar el horario de ${p.nombre}`}>Editar</button>
          </li>
        ))}
      </ul>
      {editando && (
        <Modal titulo={`Horario de ${editando.nombre}`} onCerrar={() => setEditandoId(null)} ancho="max-w-3xl">
          <div className="max-h-[75vh] space-y-6 overflow-y-auto pr-1">
            <EditorHorario inicial={editando.horario} zona={zona} perfilId={editando.id} />
            {editando.rol === "closer" && (
              <div className="space-y-2 border-t border-borde pt-4">
                <h3 className="font-semibold">Sus llamadas</h3>
                <p className="text-xs text-texto-3">Si no le pones unos propios, usa los del proyecto ({general.duracion} min, descanso {general.descanso} min…).</p>
                <FormAjustes key={JSON.stringify(editando.propios)} perfilId={editando.id} inicial={editando.propios ?? general} propios={!!editando.propios} />
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

// Duración, descanso, aviso mínimo y máximo por día. perfilId null = los del proyecto.
export function FormAjustes({ perfilId, inicial, propios = false }: { perfilId: string | null; inicial: AjustesCalendario; propios?: boolean }) {
  const [a, setA] = useState({ duracion: String(inicial.duracion), descanso: String(inicial.descanso), avisoH: String(inicial.aviso / 60), max: inicial.max_dia === null ? "" : String(inicial.max_dia) });
  const { pendiente, error, ejecutar } = useAccion();
  const valor = () => ({ duracion: Number(a.duracion), descanso: Number(a.descanso), aviso: Math.round(Number(a.avisoH) * 60), max_dia: a.max.trim() === "" ? null : Number(a.max) });
  const campo = (k: keyof typeof a, etiqueta: string, ayuda: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="etiqueta-campo">{etiqueta}</span>
      <input className="campo" type="number" value={a[k]} onChange={(e) => setA({ ...a, [k]: e.target.value })} {...extra} />
      <span className="text-xs text-texto-3">{ayuda}</span>
    </label>
  );
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {campo("duracion", "Duración de la llamada (min)", "De 5 a 480", { min: 5, max: 480, step: 5 })}
        {campo("descanso", "Descanso tras cada llamada (min)", "0 = sin descanso", { min: 0, max: 240, step: 5 })}
        {campo("avisoH", "Aviso mínimo para agendar (horas)", "0 = se puede agendar ya", { min: 0, max: 720, step: 0.5 })}
        {campo("max", "Máximo de llamadas al día", "Vacío = sin máximo", { min: 1, max: 100, placeholder: "Sin máximo" })}
      </div>
      {error && <p className="text-xs text-mal">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primario" disabled={pendiente} onClick={() => ejecutar(() => guardarCalendario(perfilId, valor()), "Ajustes guardados")}>Guardar</button>
        {perfilId && propios && (
          <button type="button" className="btn-secundario" disabled={pendiente} onClick={() => ejecutar(() => guardarCalendario(perfilId, null), "Vuelve a los del proyecto")}>Usar los del proyecto</button>
        )}
      </div>
    </div>
  );
}
