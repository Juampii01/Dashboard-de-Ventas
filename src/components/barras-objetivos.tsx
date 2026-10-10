import { Target } from "lucide-react";
import { CIFRAS, type Avance } from "@/lib/objetivos";
import { pct } from "@/lib/formato";

// Barras de avance de los objetivos de una persona (Paso H3)
export function BarrasObjetivos({ avances, dinero, vacio }: { avances: Avance[]; dinero: (n: number) => string; vacio?: string }) {
  if (avances.length === 0) return vacio ? <p className="text-sm text-texto-3">{vacio}</p> : null;
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {avances.map((a) => {
        const c = CIFRAS.find((x) => x.v === a.cifra)!;
        const f = (n: number) => (c.dinero ? dinero(n) : n.toLocaleString("es-ES"));
        const listo = a.hecho >= a.meta;
        return (
          <div key={`${a.objetivoId}-${a.etiqueta}`} className="rounded-lg border border-borde bg-panel-2 p-3">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium">{c.t} · {a.etiqueta}</span>
              <span className={`tabular-nums font-semibold ${listo ? "text-ok" : ""}`}>{pct(a.pct)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-borde" role="progressbar" aria-valuenow={Math.min(100, a.pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.t} ${a.etiqueta}`}>
              <div className={`h-full rounded-full ${listo ? "bg-ok" : "bg-primario"}`} style={{ width: `${Math.min(100, a.pct)}%` }} />
            </div>
            <div className="mt-1.5 text-xs text-texto-2 tabular-nums">
              {f(a.hecho)} de {f(a.meta)}
              {!a.dePersona && <span className="text-texto-3"> · objetivo de su rol</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Tarjeta «Mis objetivos» para la pantalla del caller y del closer
export function MisObjetivos({ avances, dinero }: { avances: Avance[]; dinero: (n: number) => string }) {
  if (avances.length === 0) return null;
  return (
    <section className="tarjeta p-4 sm:p-5">
      <h2 className="titulo-seccion mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-primario" /> Mis objetivos</h2>
      <BarrasObjetivos avances={avances} dinero={dinero} />
    </section>
  );
}
