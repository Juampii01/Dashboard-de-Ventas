"use client";

import { useState, useTransition } from "react";
import { Shuffle } from "lucide-react";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toasts";
import { exigirOk } from "@/lib/resultado-cliente";
import { MODOS_REPARTO, type ModoReparto } from "@/lib/reparto";
import { OFERTAS } from "@/lib/oferta";
import { previsualizarReparto, repartirLeads, type PeticionReparto } from "@/app/(panel)/crm/reparto";

type Persona = { id: string; nombre: string };
type Vista = { disponibles: number; total: number; porCaller: { id: string; nombre: string; n: number; carga: number | null }[] };

// Bloque A (Cristian, 11 oct 2026): «Repartir leads» a mano entre callers, con vista previa. En la Biblioteca y en el CRM.
export function RepartirLeads({
  callers,
  fijo,
  ofertaInicial,
  etiqueta = "Repartir leads",
}: {
  callers: Persona[];
  fijo?: Partial<PeticionReparto>; // filtros que vienen de la pantalla (p. ej. pipeline del CRM, solo Biblioteca)
  ofertaInicial?: string | null;
  etiqueta?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [origen, setOrigen] = useState<"sin_asignar" | "reasignar">("sin_asignar");
  const [deCallers, setDeCallers] = useState<string[]>([]);
  const [oferta, setOferta] = useState(ofertaInicial ?? "");
  const [elegidos, setElegidos] = useState<string[]>(callers.map((c) => c.id));
  const [modo, setModo] = useState<ModoReparto>("equitativo");
  const [numero, setNumero] = useState("20");
  const [vista, setVista] = useState<Vista | null>(null);
  const [error, setError] = useState("");
  const [pendiente, iniciar] = useTransition();
  const toast = useToast();

  const peticion = (): PeticionReparto => ({
    ...fijo,
    origen,
    deCallers: origen === "reasignar" ? deCallers : undefined,
    oferta: oferta || null,
    callers: elegidos,
    modo,
    ...(modo === "fijo" ? { porPersona: Number(numero) } : modo === "tope" ? { tope: Number(numero) } : { n: Number(numero) }),
  });
  const cambiar = <T,>(f: (v: T) => void) => (v: T) => {
    f(v);
    setVista(null); // cualquier cambio obliga a volver a ver la vista previa
  };
  const ver = () => {
    setError("");
    iniciar(async () => {
      try {
        setVista((await exigirOk(previsualizarReparto(peticion()))) as Vista);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Algo falló.");
      }
    });
  };
  const repartir = () => {
    setError("");
    iniciar(async () => {
      try {
        const r = (await exigirOk(repartirLeads(peticion()))) as { repartidos: number };
        toast(`${r.repartidos} leads repartidos`);
        setAbierto(false);
        setVista(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Algo falló.");
      }
    });
  };
  const alternar = (lista: string[], id: string) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]);
  const textoNumero = modo === "fijo" ? "¿Cuántos a cada caller?" : modo === "tope" ? "Tope de leads sin trabajar por caller" : "¿Cuántos leads en total?";

  return (
    <>
      <button
        className="btn-primario"
        onClick={() => {
          // Al abrir, el filtro de oferta que tenga la pantalla en ese momento (p. ej. el chip «VIP» de la Biblioteca)
          setOferta(ofertaInicial ?? "");
          setVista(null);
          setAbierto(true);
        }}
      >
        <Shuffle className="h-4 w-4" /> {etiqueta}
      </button>
      {abierto && (
        <Modal titulo="Repartir leads" onCerrar={() => setAbierto(false)} ancho="max-w-xl">
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              {[
                { v: "sin_asignar", t: "Los que no tienen caller" },
                { v: "reasignar", t: "Reasignar los de unos callers" },
              ].map((o) => (
                <button key={o.v} type="button" onClick={() => cambiar(setOrigen)(o.v as typeof origen)} className={`rounded-full px-3 py-1 ${origen === o.v ? "bg-primario text-white" : "bg-panel-2 text-texto-2"}`}>{o.t}</button>
              ))}
            </div>
            {origen === "reasignar" && (
              <div>
                <div className="etiqueta-campo">Quitar a</div>
                <div className="flex flex-wrap gap-2">
                  {callers.map((c) => (
                    <label key={c.id} className="flex items-center gap-1.5 rounded-lg bg-panel-2 px-2 py-1"><input type="checkbox" checked={deCallers.includes(c.id)} onChange={() => cambiar(setDeCallers)(alternar(deCallers, c.id))} />{c.nombre}</label>
                  ))}
                </div>
              </div>
            )}
            <label className="block">
              <span className="etiqueta-campo">Oferta (de la Biblioteca)</span>
              <select className="campo" value={oferta} onChange={(e) => cambiar(setOferta)(e.target.value)}>
                <option value="">Todas</option>
                {OFERTAS.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
              </select>
            </label>
            <div>
              <div className="etiqueta-campo">Entre estos callers</div>
              <div className="flex flex-wrap gap-2">
                {callers.map((c) => (
                  <label key={c.id} className="flex items-center gap-1.5 rounded-lg bg-panel-2 px-2 py-1"><input type="checkbox" checked={elegidos.includes(c.id)} onChange={() => cambiar(setElegidos)(alternar(elegidos, c.id))} />{c.nombre}</label>
                ))}
                {callers.length === 0 && <span className="text-texto-3">No hay callers en este proyecto.</span>}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="etiqueta-campo">Cómo</span>
                <select className="campo" value={modo} onChange={(e) => cambiar(setModo)(e.target.value as ModoReparto)}>
                  {MODOS_REPARTO.map((m) => <option key={m.v} value={m.v}>{m.t}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="etiqueta-campo">{textoNumero}</span>
                <input className="campo" type="number" min={1} value={numero} onChange={(e) => cambiar(setNumero)(e.target.value)} />
              </label>
            </div>
            <p className="text-xs text-texto-3">{MODOS_REPARTO.find((m) => m.v === modo)?.d}. Se reparten primero los más nuevos.</p>
            {vista && (
              <div className="rounded-lg border border-borde p-3">
                <div className="mb-2 font-medium">Se repartirán {vista.total} de {vista.disponibles} disponibles</div>
                <ul className="space-y-1">
                  {vista.porCaller.map((c) => (
                    <li key={c.id} className="flex justify-between"><span>{c.nombre}{c.carga !== null ? <span className="text-xs text-texto-3"> · ya tiene {c.carga} sin trabajar</span> : null}</span><b className="tabular-nums">{c.n}</b></li>
                  ))}
                </ul>
              </div>
            )}
            {error && <p className="rounded-lg bg-mal-suave px-3 py-2 text-mal">{error}</p>}
            <div className="flex gap-2">
              <button className="btn-secundario flex-1" disabled={pendiente} onClick={ver}>Ver reparto</button>
              <button className="btn-primario flex-1" disabled={pendiente || !vista || !vista.total} onClick={repartir}>Repartir {vista ? vista.total : ""}</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
