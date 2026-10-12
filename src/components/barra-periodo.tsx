"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { PERIODOS_NAV } from "@/lib/periodos";
import { BarraCarga } from "@/components/barra-carga";

// Día / Semana / Mes / Año / Personalizado + ‹ periodo › + Actualizar. Todo va en la URL (p, n, desde, hasta).
export function BarraPeriodo({ etiqueta, porDefecto = "mes", conActualizar = true }: { etiqueta: string; porDefecto?: string; conActualizar?: boolean }) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();
  const [cargando, iniciar] = useTransition();
  const periodo = params.get("p") ?? porDefecto;
  const n = Number(params.get("n") ?? 0) || 0;
  const [verFechas, setVerFechas] = useState(periodo === "rango");

  function poner(cambios: Record<string, string | null>) {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(cambios)) {
      if (v === null || v === "") p.delete(k);
      else p.set(k, v);
    }
    iniciar(() => router.replace(`${ruta}?${p.toString()}`, { scroll: false }));
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${cargando ? "opacity-70" : ""}`}>
      <BarraCarga activa={cargando} />
      <div className="flex rounded-lg border border-borde bg-panel-2 p-0.5">
        {PERIODOS_NAV.map((x) => (
          <button
            key={x.v}
            type="button"
            onClick={() => {
              if (x.v === "rango") return setVerFechas(true);
              setVerFechas(false);
              poner({ p: x.v, n: null, desde: null, hasta: null });
            }}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${periodo === x.v ? "bg-primario text-white shadow-sm" : "text-texto-2 hover:text-texto"}`}
          >
            {x.t}
          </button>
        ))}
      </div>
      {periodo !== "rango" && (
        <div className="flex items-center rounded-lg border border-borde bg-panel">
          <button type="button" className="p-2 text-texto-2 hover:text-texto" aria-label="Periodo anterior" onClick={() => poner({ n: String(n - 1) })}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-32 px-1 text-center text-sm font-medium">{etiqueta}</span>
          <button type="button" className="p-2 text-texto-2 hover:text-texto" aria-label="Periodo siguiente" onClick={() => poner({ n: String(n + 1) })}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
      {periodo === "rango" && <span className="text-sm font-medium">{etiqueta}</span>}
      {verFechas && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            poner({ p: "rango", n: null, desde: String(f.get("desde")), hasta: String(f.get("hasta")) });
          }}
        >
          <input type="date" name="desde" required defaultValue={params.get("desde") ?? ""} className="campo w-auto" aria-label="Desde" />
          <span className="text-texto-3">→</span>
          <input type="date" name="hasta" required defaultValue={params.get("hasta") ?? ""} className="campo w-auto" aria-label="Hasta" />
          <button className="btn-primario">Aplicar</button>
        </form>
      )}
      {conActualizar && (
        <button type="button" className="btn-secundario" disabled={cargando} onClick={() => iniciar(() => router.refresh())}>
          <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} /> Actualizar
        </button>
      )}
    </div>
  );
}

// Selector simple que va a la URL (closer, producto, evento…)
export function FiltroUrl({ nombre, etiqueta, opciones, todos }: { nombre: string; etiqueta: string; opciones: { v: string; t: string }[]; todos: string }) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();
  const [cargando, iniciar] = useTransition();
  return (
    <>
      <BarraCarga activa={cargando} />
      <select
      aria-label={etiqueta}
      className={`campo w-auto min-w-40 ${cargando ? "opacity-70" : ""}`}
      value={params.get(nombre) ?? ""}
      onChange={(e) => {
        const p = new URLSearchParams(params.toString());
        if (e.target.value) p.set(nombre, e.target.value);
        else p.delete(nombre);
        iniciar(() => router.replace(`${ruta}?${p.toString()}`, { scroll: false }));
      }}
    >
      <option value="">{todos}</option>
      {opciones.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
      </select>
    </>
  );
}
