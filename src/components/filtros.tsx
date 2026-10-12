"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { CalendarRange, Search } from "lucide-react";
import { Desplegable } from "@/components/eleccion";

const PERIODOS = [
  { v: "hoy", t: "Hoy" },
  { v: "semana", t: "Semana" },
  { v: "mes", t: "Mes" },
  { v: "todo", t: "Todo" },
];

// Barra de filtros: vendedor, periodo, fechas y búsqueda. Todo va en la URL.
export function Filtros({
  vendedores,
  productos,
  conBusqueda = false,
  periodoPorDefecto = "mes",
}: {
  vendedores?: { id: string; nombre: string; rol: string }[];
  productos?: { id: string; nombre: string }[];
  conBusqueda?: boolean;
  periodoPorDefecto?: string;
}) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();
  const [cargando, iniciar] = useTransition();
  const periodo = params.get("periodo") ?? periodoPorDefecto;
  const [verFechas, setVerFechas] = useState(periodo === "rango");
  const [q, setQ] = useState(params.get("q") ?? "");

  function poner(cambios: Record<string, string | null>) {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(cambios)) {
      if (v === null || v === "") p.delete(k);
      else p.set(k, v);
    }
    iniciar(() => router.replace(`${ruta}?${p.toString()}`, { scroll: false }));
  }

  return (
    <div className={`tarjeta flex flex-wrap items-center gap-2 p-2.5 ${cargando ? "opacity-70" : ""}`}>
      {vendedores && (
        <Desplegable
          aria-label="Vendedor"
          className="campo w-auto min-w-44"
          value={params.get("vendedor") ?? ""}
          onChange={(e) => poner({ vendedor: e.target.value })}
        >
          <option value="">Todo el equipo</option>
          {vendedores.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nombre} · {v.rol}
            </option>
          ))}
        </Desplegable>
      )}
      {productos && (
        <Desplegable
          aria-label="Producto"
          className="campo w-auto min-w-44"
          value={params.get("producto") ?? ""}
          onChange={(e) => poner({ producto: e.target.value })}
        >
          <option value="">Todos los productos</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </Desplegable>
      )}
      <div className="flex rounded-lg border border-borde bg-panel-2 p-0.5">
        {PERIODOS.map((p) => (
          <button
            key={p.v}
            onClick={() => {
              setVerFechas(false);
              poner({ periodo: p.v, desde: null, hasta: null });
            }}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              periodo === p.v ? "bg-primario text-white shadow-sm" : "text-texto-2 hover:text-texto"
            }`}
          >
            {p.t}
          </button>
        ))}
      </div>
      <button
        onClick={() => setVerFechas((v) => !v)}
        className={`btn-secundario ${periodo === "rango" ? "border-primario text-primario" : ""}`}
      >
        <CalendarRange className="h-4 w-4" /> Fechas
      </button>
      {verFechas && (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            poner({ periodo: "rango", desde: String(f.get("desde")), hasta: String(f.get("hasta")) });
          }}
        >
          <input type="date" name="desde" required defaultValue={params.get("desde") ?? ""} className="campo w-auto" />
          <span className="text-texto-3">→</span>
          <input type="date" name="hasta" required defaultValue={params.get("hasta") ?? ""} className="campo w-auto" />
          <button className="btn-primario">Aplicar</button>
        </form>
      )}
      {conBusqueda && (
        <form
          className="relative ml-auto min-w-56 flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            poner({ q });
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-texto-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={() => q !== (params.get("q") ?? "") && poner({ q })}
            placeholder="Buscar lead por nombre, email o teléfono…"
            className="campo pl-9"
          />
        </form>
      )}
    </div>
  );
}
