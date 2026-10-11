"use client";

import { useState } from "react";
import { useAccion } from "@/components/acciones-lead";
import { guardarReparto, guardarRotacion } from "./acciones";

type Caller = { id: string; nombre: string; pct: number; horario: boolean };

// Bloque 2 de 1.0 (Cristian, 11 oct 2026): reparto automático de los leads que entran (GHL, landings y CSV).
// Apagado = a mano (o con «Repartir leads» del CRM y la Biblioteca). Encendido = % por caller, que suman 100.
export function RepartoPorcentaje({ auto, soloHorario, callers }: { auto: boolean; soloHorario: boolean; callers: Caller[] }) {
  const [on, setOn] = useState(auto);
  const [horario, setHorario] = useState(soloHorario);
  const [pcts, setPcts] = useState<Record<string, string>>(Object.fromEntries(callers.map((c) => [c.id, String(c.pct)])));
  const { pendiente, error, ejecutar } = useAccion();
  const suma = Math.round(Object.values(pcts).reduce((a, b) => a + (Number(b) || 0), 0) * 100) / 100;
  // A partes iguales; lo que sobra del redondeo va al primero
  const igualar = () => {
    if (!callers.length) return;
    const base = Math.floor(10000 / callers.length) / 100;
    const resto = Math.round((100 - base * callers.length) * 100) / 100;
    setPcts(Object.fromEntries(callers.map((c, i) => [c.id, String(i === 0 ? Math.round((base + resto) * 100) / 100 : base)])));
  };
  if (!callers.length) return <p className="text-sm text-texto-3">No hay callers activos.</p>;
  return (
    <div className="space-y-4">
      <label className="flex items-start gap-2 rounded-lg border border-borde bg-panel-2 p-3 text-sm">
        <input type="checkbox" className="mt-0.5 accent-[var(--primario)]" checked={on} onChange={(e) => setOn(e.target.checked)} />
        <span><b>Repartir solos los leads que entran</b><br /><span className="text-texto-3">De GHL, de las landings y del CSV (si marcas «Repartir» al subirlo). Apagado: se reparten a mano o con «Repartir leads».</span></span>
      </label>
      <label className="flex items-start gap-2 rounded-lg border border-borde bg-panel-2 p-3 text-sm">
        <input type="checkbox" className="mt-0.5 accent-[var(--primario)]" checked={horario} onChange={(e) => setHorario(e.target.checked)} />
        <span><b>Solo a quien esté en su horario</b><br /><span className="text-texto-3">Si en ese momento no hay nadie en su horario, se reparte igual entre todos los que tienen %.</span></span>
      </label>
      <div className="space-y-1.5">
        {callers.map((c) => (
          <div key={c.id} className="flex items-center gap-2 rounded-lg border border-borde bg-panel-2 px-3 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{c.nombre}{!c.horario && <span className="ml-2 text-xs text-aviso">sin horario</span>}</span>
            <input type="number" min={0} max={100} step={1} value={pcts[c.id]} onChange={(e) => setPcts({ ...pcts, [c.id]: e.target.value })} className="campo w-20 py-1 text-right" aria-label={`% de ${c.nombre}`} />
            <span className="text-texto-3">%</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className={suma === 100 || (!on && suma === 0) ? "text-ok" : "text-aviso"}>Suman <b>{suma} %</b>{suma !== 100 && " (tienen que sumar 100)"}</span>
        <button type="button" className="btn-secundario px-3 py-1.5 text-xs" onClick={igualar}>A partes iguales</button>
      </div>
      {error && <p className="text-xs text-mal">{error}</p>}
      <button type="button" className="btn-primario" disabled={pendiente} onClick={() => ejecutar(() => guardarReparto({ auto: on, soloHorario: horario, pcts: Object.fromEntries(Object.entries(pcts).map(([k, v]) => [k, Number(v) || 0])) }), "Reparto guardado")}>Guardar reparto</button>
    </div>
  );
}

const MODOS: { v: "elige" | "propone" | "decide"; t: string; d: string }[] = [
  { v: "elige", t: "Lo elige quien agenda", d: "Como hasta ahora. Si el closer no está libre a esa hora, se avisa pero se puede agendar igual." },
  { v: "propone", t: "Lo propone la rotación", d: "Al elegir la hora sale el closer que toca; quien agenda lo puede cambiar." },
  { v: "decide", t: "Lo decide la rotación", d: "El closer lo pone la app, aunque se intente otro. Si ninguno está libre a esa hora, hay que elegir otra." },
];

// Bloque 3 de 1.0 (Cristian, 11 oct 2026): rotación de closers como los calendarios de GHL.
// Toca el closer con menos citas para su %; si no está libre a esa hora, el siguiente. Todos al 0 % = apagada.
export function RotacionClosers({ modo, closers }: { modo: "elige" | "propone" | "decide"; closers: Caller[] }) {
  const [m, setM] = useState(modo);
  const [pcts, setPcts] = useState<Record<string, string>>(Object.fromEntries(closers.map((c) => [c.id, String(c.pct)])));
  const { pendiente, error, ejecutar } = useAccion();
  const suma = Math.round(Object.values(pcts).reduce((a, b) => a + (Number(b) || 0), 0) * 100) / 100;
  const igualar = () => {
    const base = Math.floor(10000 / closers.length) / 100;
    const resto = Math.round((100 - base * closers.length) * 100) / 100;
    setPcts(Object.fromEntries(closers.map((c, i) => [c.id, String(i === 0 ? Math.round((base + resto) * 100) / 100 : base)])));
  };
  if (!closers.length) return <p className="text-sm text-texto-3">No hay closers activos.</p>;
  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="etiqueta-campo">¿Cómo se elige el closer al agendar?</legend>
        {MODOS.map((x) => (
          <label key={x.v} className="flex items-start gap-2 rounded-lg border border-borde bg-panel-2 p-3 text-sm">
            <input type="radio" name="rotacion_modo" className="mt-0.5 accent-[var(--primario)]" checked={m === x.v} onChange={() => setM(x.v)} />
            <span><b>{x.t}</b><br /><span className="text-texto-3">{x.d}</span></span>
          </label>
        ))}
      </fieldset>
      <div className="space-y-1.5">
        {closers.map((c) => (
          <div key={c.id} className="flex items-center gap-2 rounded-lg border border-borde bg-panel-2 px-3 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{c.nombre}{!c.horario && <span className="ml-2 text-xs text-aviso">sin horario (la rotación se lo salta)</span>}</span>
            <input type="number" min={0} max={100} step={1} value={pcts[c.id]} onChange={(e) => setPcts({ ...pcts, [c.id]: e.target.value })} className="campo w-20 py-1 text-right" aria-label={`% de ${c.nombre}`} />
            <span className="text-texto-3">%</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className={suma === 100 || suma === 0 ? "text-ok" : "text-aviso"}>{suma === 0 ? "Todos al 0 %: rotación apagada" : <>Suman <b>{suma} %</b>{suma !== 100 && " (tienen que sumar 100)"}</>}</span>
        <button type="button" className="btn-secundario px-3 py-1.5 text-xs" onClick={igualar}>A partes iguales</button>
      </div>
      {error && <p className="text-xs text-mal">{error}</p>}
      <button type="button" className="btn-primario" disabled={pendiente} onClick={() => ejecutar(() => guardarRotacion({ modo: m, pcts: Object.fromEntries(Object.entries(pcts).map(([k, v]) => [k, Number(v) || 0])) }), "Rotación guardada")}>Guardar rotación</button>
    </div>
  );
}
