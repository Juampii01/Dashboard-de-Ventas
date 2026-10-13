"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { OFERTAS, ETIQUETA_OFERTA, type Oferta } from "@/lib/oferta";
import { OfertaChip } from "@/components/oferta-chip";
import { RANGO } from "@/lib/biblioteca";
import { RepartirLeads } from "@/components/repartir-leads";
import { PopupLead } from "@/components/popup-lead";

export type FilaTabla = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  pais: string;
  alta: string;
  situacion: string;
  experiencia: string;
  objetivo: string;
  tiempo: string;
  inversion: string;
  inicio: string;
  etiquetas: string[];
  oferta: Oferta | null;
  caller: string | null;
};

const COLS: { k: keyof FilaTabla; t: string }[] = [
  { k: "oferta", t: "Oferta" },
  { k: "nombre", t: "Nombre" },
  { k: "telefono", t: "Teléfono" },
  { k: "pais", t: "País" },
  { k: "email", t: "Email" },
  { k: "alta", t: "Alta" },
  { k: "caller", t: "Caller" },
  { k: "situacion", t: "Situación" },
  { k: "experiencia", t: "Experiencia con AI" },
  { k: "objetivo", t: "Objetivo 90 días" },
  { k: "tiempo", t: "Tiempo / semana" },
  { k: "inversion", t: "Puede invertir" },
  { k: "inicio", t: "Cuándo empezar" },
  { k: "etiquetas", t: "Etiquetas CRM" },
];
const ORDEN_OFERTA = Object.fromEntries(OFERTAS.map((o) => [o.v, o.orden])) as Record<Oferta, number>;

const TONO_INV: Record<string, string> = { "Sí, ahora": "bg-ok", "En los próximos meses": "bg-aviso", "No por ahora": "bg-mal" };
// «Etiquetas CRM» pone primero a quien ya agendó (DFY y llamada) y luego a quien está en webinar1, como la vista
const pesoEtiquetas = (t: string[]) => (t.includes("agendado dfy") ? 0 : t.includes("agenda llamada") ? 1 : t.includes("webinar1") ? 2 : 3);
const POR_PAGINA = 100;


export function TablaBiblioteca({ filas, callers }: { filas: FilaTabla[]; callers: { id: string; nombre: string }[] }) {
  const [q, setQ] = useState("");
  const [solo, setSolo] = useState<Oferta | "">("");
  const [sinCaller, setSinCaller] = useState(false);
  const [col, setCol] = useState<keyof FilaTabla>("oferta");
  const [dir, setDir] = useState(1);
  const [limite, setLimite] = useState(POR_PAGINA);
  const [ficha, setFicha] = useState<FilaTabla | null>(null);

  const cuenta = useMemo(() => Object.fromEntries(OFERTAS.map((o) => [o.v, filas.filter((f) => f.oferta === o.v).length])), [filas]);
  const visibles = useMemo(() => {
    const t = q.trim().toLowerCase();
    const clave = (f: FilaTabla): string | number => {
      const v = f[col];
      if (col === "oferta") return f.oferta ? ORDEN_OFERTA[f.oferta] : 9;
      if (col === "alta") return f.alta ? Date.parse(f.alta) : 0;
      if (col === "etiquetas") return pesoEtiquetas(f.etiquetas);
      const r = RANGO[col as keyof typeof RANGO];
      if (r) return v ? r[v as string] ?? 9 : 99;
      return v ? String(v).toLowerCase() : "￿";
    };
    return filas
      .filter((f) => (!solo || f.oferta === solo) && (!sinCaller || !f.caller))
      .filter((f) => !t || `${f.nombre} ${f.telefono ?? ""} ${f.pais} ${f.email ?? ""} ${f.etiquetas.join(" ")}`.toLowerCase().includes(t))
      .sort((a, b) => {
        const x = clave(a);
        const y = clave(b);
        if (x < y) return -dir;
        if (x > y) return dir;
        return (a.oferta ? ORDEN_OFERTA[a.oferta] : 9) - (b.oferta ? ORDEN_OFERTA[b.oferta] : 9) || b.alta.localeCompare(a.alta);
      });
  }, [filas, q, solo, sinCaller, col, dir]);

  const ordenar = (k: keyof FilaTabla) => {
    if (k === col) setDir(-dir);
    else {
      setCol(k);
      setDir(k === "alta" ? -1 : 1);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-texto-3">
        Haz clic en una fila para ver sus datos. Clic en el título de una columna para ordenar; otro clic invierte el orden. «Puede invertir», «Tiempo» y «Cuándo empezar» se ordenan de más a menos listo. Lo de «invertir» lo dice la persona en el formulario: no es dinero comprobado.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setSolo("")} className={`chip ${!solo ? "bg-primario text-white" : "bg-panel-2 text-texto-2"}`}>Todos <small className="ml-1 opacity-80">{filas.length}</small></button>
        {OFERTAS.map((o) => (
          <button key={o.v} onClick={() => setSolo(o.v)} className={`chip ${solo === o.v ? "bg-primario text-white" : "bg-panel-2 text-texto-2"}`}>{o.t} <small className="ml-1 opacity-80">{cuenta[o.v]}</small></button>
        ))}
        <label className="ml-2 flex items-center gap-1.5 text-sm text-texto-2"><input type="checkbox" className="interruptor" checked={sinCaller} onChange={(e) => setSinCaller(e.target.checked)} /> Sin caller</label>
        <div className="ml-auto"><RepartirLeads callers={callers} fijo={{ soloBiblioteca: true }} ofertaInicial={solo || null} etiqueta={`Repartir ${solo ? ETIQUETA_OFERTA[solo] : "leads"}`} /></div>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-texto-3" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, teléfono, país, email o etiqueta…" className="campo pl-9" aria-label="Buscar leads de la Biblioteca" />
      </div>
      <div className="text-xs text-texto-3">Mostrando {Math.min(limite, visibles.length)} de {visibles.length} ({filas.length} en total)</div>
      <div className="-mx-4 overflow-x-auto sm:-mx-5">
        <table className="tabla">
          <thead>
            <tr>
              {COLS.map((c) => (
                <th key={c.k} aria-sort={col === c.k ? (dir === 1 ? "ascending" : "descending") : "none"}>
                  <button type="button" className="flex items-center gap-1 whitespace-nowrap" onClick={() => ordenar(c.k)}>
                    {c.t}<span className="text-texto-3">{col === c.k ? (dir === 1 ? "▲" : "▼") : "↕"}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.slice(0, limite).map((f) => (
              <tr key={f.id} tabIndex={0} className="cursor-pointer hover:bg-panel-2" onClick={(e) => !(e.target as HTMLElement).closest("a") && setFicha(f)} onKeyDown={(e) => e.key === "Enter" && setFicha(f)}>
                <td><OfertaChip oferta={f.oferta} /></td>
                <td className="whitespace-nowrap font-medium">{f.nombre || "—"}</td>
                <td className="whitespace-nowrap">{f.telefono ? f.telefono : "—"}</td>
                <td className="whitespace-nowrap">{f.pais}</td>
                <td>{f.email ? <a href={`mailto:${f.email}`} className="text-primario hover:underline">{f.email}</a> : "—"}</td>
                <td className="whitespace-nowrap tabular-nums">{f.alta ? new Date(f.alta).toLocaleDateString("es-ES") : "—"}</td>
                <td className="whitespace-nowrap text-texto-2">{f.caller ?? "—"}</td>
                <td>{f.situacion || "—"}</td>
                <td>{f.experiencia || "—"}</td>
                <td>{f.objetivo || "—"}</td>
                <td className="whitespace-nowrap">{f.tiempo || "—"}</td>
                <td className="whitespace-nowrap">{f.inversion ? <span className="inline-flex items-center gap-1.5"><i className={`h-2 w-2 rounded-full ${TONO_INV[f.inversion] ?? "bg-texto-3"}`} />{f.inversion}</span> : "—"}</td>
                <td className="whitespace-nowrap">{f.inicio || "—"}</td>
                <td><div className="flex flex-wrap gap-1">{f.etiquetas.map((t) => <span key={t} className="chip bg-panel-2 text-texto-3">{t}</span>)}</div></td>
              </tr>
            ))}
            {visibles.length === 0 && <tr><td colSpan={COLS.length} className="py-6 text-center text-texto-3">No hay leads con ese filtro.</td></tr>}
          </tbody>
        </table>
      </div>
      {visibles.length > limite && <button onClick={() => setLimite((l) => l + POR_PAGINA)} className="w-full rounded-lg py-2 text-sm text-primario hover:bg-panel-2">Ver {Math.min(POR_PAGINA, visibles.length - limite)} más</button>}

      {ficha && <PopupLead leadId={ficha.id} nombre={ficha.nombre} onCerrar={() => setFicha(null)} />}
    </div>
  );
}
