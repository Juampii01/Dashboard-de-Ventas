import { Flame, Target, Users } from "lucide-react";
import { CIFRAS } from "@/lib/objetivos-constantes";
import type { Avance } from "@/lib/objetivos";
import { pct } from "@/lib/formato";
import { Anillo } from "@/components/ui";
import { Celebracion } from "@/components/celebracion";

const cifra = (v: Avance["cifra"]) => CIFRAS.find((x) => x.v === v)!;
const formato = (a: Avance, dinero: (n: number) => string) => (n: number) => (cifra(a.cifra).dinero ? dinero(n) : n.toLocaleString("es-ES"));

// Barras de avance de los objetivos (Paso H3)
export function BarrasObjetivos({ avances, dinero, vacio, sinNotaRol }: { avances: Avance[]; dinero: (n: number) => string; vacio?: string; sinNotaRol?: boolean }) {
  if (avances.length === 0) return vacio ? <p className="text-sm text-texto-3">{vacio}</p> : null;
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {avances.map((a) => {
        const c = cifra(a.cifra);
        const f = formato(a, dinero);
        const listo = a.hecho >= a.meta;
        return (
          <div key={`${a.objetivoId}-${a.etiqueta}`} className="rounded-lg border border-borde bg-panel-2 px-2.5 py-2">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="font-medium">{c.t} · {a.etiqueta}</span>
              <span className={`tabular-nums font-semibold ${listo ? "text-ok" : ""}`}>{pct(a.pct)}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-borde" role="progressbar" aria-valuenow={Math.min(100, a.pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.t} ${a.etiqueta}`}>
              <div className={`h-full rounded-full ${listo ? "bg-ok" : "bg-primario"}`} style={{ width: `${Math.min(100, a.pct)}%` }} />
            </div>
            <div className="mt-1 text-[11px] text-texto-2 tabular-nums">
              {f(a.hecho)} de {f(a.meta)}
              {!a.dePersona && !sinNotaRol && <span className="text-texto-3"> · objetivo de su rol</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Objetivo de hoy en grande (H4): anillo, «te faltan X» y «¡Cumplido!»
function Hoy({ avances, dinero }: { avances: Avance[]; dinero: (n: number) => string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {avances.map((a) => {
        const f = formato(a, dinero);
        const listo = a.hecho >= a.meta;
        return (
          <div key={a.objetivoId} className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${listo ? "border-ok/40 bg-ok-suave" : "border-borde bg-panel-2"}`}>
            <Anillo valor={a.pct} tamano={68} color={listo ? "var(--ok)" : "var(--primario)"} />
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-texto-3">{cifra(a.cifra).t} hoy</div>
              <div className="text-lg font-bold leading-tight tabular-nums">{f(a.hecho)} <span className="text-sm font-medium text-texto-2">de {f(a.meta)}</span></div>
              <div className={`text-xs font-medium ${listo ? "text-ok" : "text-texto-2"}`}>{listo ? "¡Cumplido! 🎉" : `Te faltan ${f(a.meta - a.hecho)}`}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type Panel = { mios: Avance[]; racha: { dias: number; mas: boolean } | null; equipo: Avance[] };

// «Mis objetivos» arriba de «Mis leads» y «Mis agendas» (H3 + H4). `clave` identifica a la persona y el día
// para que la celebración salga una sola vez; solo cuando quien mira es la propia persona.
export function PanelObjetivos({ panel, dinero, celebrar }: { panel: Panel; dinero: (n: number) => string; celebrar: string | null }) {
  const hoy = panel.mios.filter((a) => a.periodo === "dia");
  const resto = panel.mios.filter((a) => a.periodo !== "dia");
  if (panel.mios.length === 0 && panel.equipo.length === 0) return null;
  const hoyCumplido = hoy.length > 0 && hoy.every((a) => a.hecho >= a.meta);
  return (
    <section className="tarjeta space-y-2 px-3.5 py-2.5 sm:px-4">
      {panel.mios.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="titulo-seccion flex items-center gap-2"><Target className="h-4 w-4 text-primario" /> Mis objetivos</h2>
            {panel.racha && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${panel.racha.dias ? "bg-aviso-suave text-aviso" : "bg-panel-2 text-texto-2"}`} title="Días seguidos cumpliendo todos tus objetivos diarios (los días sin objetivo no cortan la racha)">
                <Flame className="h-3.5 w-3.5" />
                {panel.racha.dias ? `${panel.racha.dias}${panel.racha.mas ? "+" : ""} ${panel.racha.dias === 1 ? "día" : "días"} seguidos` : "Empieza tu racha hoy"}
              </span>
            )}
          </div>
          {hoy.length > 0 && <Hoy avances={hoy} dinero={dinero} />}
          <BarrasObjetivos avances={resto} dinero={dinero} />
        </>
      )}
      {panel.equipo.length > 0 && (
        <div>
          <h3 className="titulo-seccion mb-1.5 flex items-center gap-2"><Users className="h-4 w-4 text-primario" /> Objetivo del equipo</h3>
          <BarrasObjetivos avances={panel.equipo} dinero={dinero} sinNotaRol />
        </div>
      )}
      {celebrar && hoyCumplido && <Celebracion clave={celebrar} />}
    </section>
  );
}
