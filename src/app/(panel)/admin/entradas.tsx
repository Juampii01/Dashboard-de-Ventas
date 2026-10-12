"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, Trash2, RefreshCw, Save } from "lucide-react";
import { sinVaciar } from "@/components/sin-vaciar";
import { useAccion, Mensajes } from "@/components/acciones-lead";
import { Copiar } from "./cliente";
import { borrarEntrada, crearEntrada, guardarEntrada, nuevaDireccionEntrada } from "./acciones";
import { OPERADORES, type Regla } from "@/lib/entrada";
import { confirmar } from "@/components/dialogos";
import { Desplegable, Pastillas } from "@/components/eleccion";

type Pipe = { id: string; nombre: string; etapas: { id: string; nombre: string }[] };
type Res = { ok?: string; error?: string } | null;

function SelectorDestino({
  pipelines,
  pipeline,
  etapa,
  onCambio,
  vacio = "Sin pipeline",
}: {
  pipelines: Pipe[];
  pipeline: string | null;
  etapa: string | null;
  onCambio: (p: string | null, e: string | null) => void;
  vacio?: string;
}) {
  const etapas = pipelines.find((p) => p.id === pipeline)?.etapas ?? [];
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Desplegable className="campo" value={pipeline ?? ""} onChange={(e) => onCambio(e.target.value || null, null)} aria-label="Pipeline">
        <option value="">{vacio}</option>
        {pipelines.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
      </Desplegable>
      <Desplegable className="campo" value={etapa ?? ""} disabled={!pipeline} onChange={(e) => onCambio(pipeline, e.target.value || null)} aria-label="Columna">
        <option value="">Primera columna</option>
        {etapas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
      </Desplegable>
    </div>
  );
}

export function NuevaEntrada({ pipelines }: { pipelines: Pipe[] }) {
  const [estado, accion, enviando] = useActionState(crearEntrada, null as Res);
  const [destino, setDestino] = useState<{ p: string | null; e: string | null }>({ p: pipelines[0]?.id ?? null, e: null });
  // 1.1 (11 oct 2026): al crearla, el nombre se borra (antes se quedaba y se podía crear dos veces); si falla, se queda
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado?.ok) form.current?.reset();
  }, [estado]);
  return (
    <form ref={form} onSubmit={sinVaciar(accion)} className="space-y-3">
      <label className="block"><span className="etiqueta-campo">Nombre (el de la landing)</span><input name="nombre" required className="campo" placeholder="Ej. Opt-in masterclass" /></label>
      <div>
        <span className="etiqueta-campo">Pipeline y columna por defecto</span>
        <SelectorDestino pipelines={pipelines} pipeline={destino.p} etapa={destino.e} onCambio={(p, e) => setDestino({ p, e })} />
        <input type="hidden" name="pipeline_id" value={destino.p ?? ""} />
        <input type="hidden" name="etapa_id" value={destino.e ?? ""} />
      </div>
      <Mensajes error={estado?.error ?? ""} ok={estado?.ok ?? ""} />
      <button className="btn-primario w-full" disabled={enviando}>{enviando ? "Creando…" : "Crear entrada"}</button>
    </form>
  );
}

export type EntradaVista = {
  id: string;
  nombre: string;
  url: string;
  activa: boolean;
  pipeline_id: string | null;
  etapa_id: string | null;
  reglas: Regla[];
  campos: string[]; // los nombres de campo que han llegado (para elegir en las reglas)
};

const REGLA_VACIA: Regla = { campo: "", operador: "igual", valor: "", pipeline_id: null, etapa_id: null, etiqueta: "" };

export function EditorEntrada({ entrada, pipelines }: { entrada: EntradaVista; pipelines: Pipe[] }) {
  const { pendiente, error, ejecutar } = useAccion();
  const [nombre, setNombre] = useState(entrada.nombre);
  const [activa, setActiva] = useState(entrada.activa);
  const [destino, setDestino] = useState({ p: entrada.pipeline_id, e: entrada.etapa_id });
  const [reglas, setReglas] = useState<Regla[]>(entrada.reglas);
  const cambiarRegla = (i: number, c: Partial<Regla>) => setReglas((rs) => rs.map((r, j) => (j === i ? { ...r, ...c } : r)));
  const listaCampos = `campos-${entrada.id}`;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="block"><span className="etiqueta-campo">Nombre</span><input className="campo" value={nombre} onChange={(e) => setNombre(e.target.value)} /></label>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" className="interruptor" checked={activa} onChange={(e) => setActiva(e.target.checked)} /> Activa</label>
      </div>

      <div>
        <div className="etiqueta-campo">Dirección (pégala en la landing para que envíe aquí el mismo JSON que manda a GHL)</div>
        <code className="block break-all rounded-lg border border-borde bg-panel-2 p-2.5 text-xs">{entrada.url}</code>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <Copiar texto={entrada.url} etiqueta="Copiar dirección" />
          <button
            type="button"
            className="btn-secundario text-xs"
            disabled={pendiente}
            onClick={() => void confirmar("La dirección actual dejará de funcionar y habrá que poner la nueva en la landing. ¿Seguir?").then((ok) => ok && ejecutar(() => nuevaDireccionEntrada(entrada.id), "Dirección nueva creada"))}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Nueva dirección
          </button>
        </div>
      </div>

      <div>
        <div className="etiqueta-campo">Si no se cumple ninguna regla, el lead va a</div>
        <SelectorDestino pipelines={pipelines} pipeline={destino.p} etapa={destino.e} onCambio={(p, e) => setDestino({ p, e })} />
      </div>

      <div>
        <div className="etiqueta-campo">Reglas (como en el workflow de GHL)</div>
        <p className="mb-2 text-xs text-texto-3">Se aplican todas las que se cumplen, en orden. La última que elige pipeline manda; las etiquetas se suman. Solo cuentan para leads nuevos: a uno que ya existe no se le mueve de columna.</p>
        <datalist id={listaCampos}>{entrada.campos.map((c) => <option key={c} value={c} />)}</datalist>
        <ul className="space-y-2">
          {reglas.map((r, i) => (
            <li key={i} className="space-y-2 rounded-lg border border-borde bg-panel-2 p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto]">
                <input className="campo" list={listaCampos} placeholder="Campo (p. ej. quiz_completed)" value={r.campo} onChange={(e) => cambiarRegla(i, { campo: e.target.value })} aria-label="Campo" />
                <Pastillas className="campo" value={r.operador} onChange={(e) => cambiarRegla(i, { operador: e.target.value as Regla["operador"] })} aria-label="Condición">
                  {OPERADORES.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
                </Pastillas>
                <input className="campo" placeholder="Valor (p. ej. true)" value={r.valor ?? ""} disabled={r.operador === "existe" || r.operador === "no_existe"} onChange={(e) => cambiarRegla(i, { valor: e.target.value })} aria-label="Valor" />
                <button type="button" className="rounded-md p-2 text-texto-3 hover:bg-mal-suave hover:text-mal" title="Quitar regla" onClick={() => setReglas((rs) => rs.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
                <SelectorDestino pipelines={pipelines} pipeline={r.pipeline_id ?? null} etapa={r.etapa_id ?? null} vacio="No cambiar el pipeline" onCambio={(p, e) => cambiarRegla(i, { pipeline_id: p, etapa_id: e })} />
                <input className="campo" placeholder="Añadir etiqueta (opcional)" value={r.etiqueta ?? ""} onChange={(e) => cambiarRegla(i, { etiqueta: e.target.value })} aria-label="Etiqueta" />
              </div>
            </li>
          ))}
        </ul>
        <button type="button" className="btn-secundario mt-2 text-xs" onClick={() => setReglas((rs) => [...rs, { ...REGLA_VACIA }])}>
          <Plus className="h-3.5 w-3.5" /> Añadir regla
        </button>
      </div>

      {error && <p className="rounded-lg bg-mal-suave px-3 py-2 text-sm text-mal">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primario"
          disabled={pendiente}
          onClick={() => ejecutar(() => guardarEntrada(entrada.id, { nombre, activa, pipeline_id: destino.p, etapa_id: destino.e, reglas: reglas.filter((r) => r.campo.trim()) }), "Entrada guardada")}
        >
          <Save className="h-4 w-4" /> Guardar
        </button>
        <button
          type="button"
          className="btn-secundario hover:text-mal"
          disabled={pendiente}
          onClick={() => void confirmar("¿Borrar esta entrada? La landing dejará de poder enviar aquí. Los leads y envíos ya recibidos se quedan.").then((ok) => ok && ejecutar(() => borrarEntrada(entrada.id), "Entrada borrada"))}
        >
          <Trash2 className="h-4 w-4" /> Borrar
        </button>
      </div>
    </div>
  );
}
