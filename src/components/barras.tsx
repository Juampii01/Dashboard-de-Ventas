import { pct as formatoPct } from "@/lib/formato";

// Barras horizontales con su % (Bloque A, la Biblioteca de KPIs). 1c (26 oct 2026): las usa también la pestaña «Leads»;
// `numero` añade cuántos son al lado del %.
export type Barra = { t: string; n: number; pct: number };

export function Barras({ titulo, filas, marcadas = [], numero = false }: { titulo: string; filas: Barra[]; marcadas?: string[]; numero?: boolean }) {
  const max = Math.max(1, ...filas.map((f) => f.pct));
  return (
    <div>
      <div className="mb-2 text-sm font-medium">{titulo}</div>
      <ul className="space-y-1.5">
        {filas.map((f) => (
          <li key={f.t} className={`grid ${numero ? "grid-cols-[minmax(0,10rem)_1fr_3rem_3.5rem]" : "grid-cols-[minmax(0,10rem)_1fr_3.5rem]"} items-center gap-2 text-sm`}>
            <span className="truncate text-texto-2" title={f.t}>{f.t}</span>
            <span className="h-2.5 overflow-hidden rounded-full bg-panel-2"><span className={`block h-full rounded-full ${marcadas.includes(f.t) ? "bg-oro" : "bg-primario"}`} style={{ width: `${(f.pct / max) * 100}%` }} /></span>
            {numero && <span className="text-right tabular-nums text-texto-3">{f.n.toLocaleString("es-ES")}</span>}
            <span className="text-right tabular-nums">{formatoPct(f.pct)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
