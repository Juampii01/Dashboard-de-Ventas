"use client";

import { useAccion } from "@/components/acciones-lead";
import { guardarPermisoSeccion } from "./acciones";

const ROLES = [
  { v: "director", t: "Directores" },
  { v: "closer", t: "Closers" },
  { v: "caller", t: "Callers" },
] as const;

// Interruptores por sección y por rol (V2-8). El CEO lo ve todo siempre.
export function TablaPermisos({ secciones, permitidos }: { secciones: { v: string; t: string; d: string }[]; permitidos: string[] }) {
  const { pendiente, error, ejecutar } = useAccion();
  const tiene = new Set(permitidos);
  return (
    <div className="space-y-3">
      <div className="-mx-4 overflow-x-auto sm:-mx-5">
        <table className="tabla">
          <thead>
            <tr><th>Sección</th><th className="text-center">CEO</th>{ROLES.map((r) => <th key={r.v} className="text-center">{r.t}</th>)}</tr>
          </thead>
          <tbody>
            {secciones.map((s) => (
              <tr key={s.v}>
                <td><div className="font-medium">{s.t}</div><div className="text-xs text-texto-3">{s.d}</div></td>
                <td className="text-center text-xs text-texto-3">Siempre</td>
                {ROLES.map((r) => {
                  const on = tiene.has(`${r.v}:${s.v}`);
                  return (
                    <td key={r.v} className="text-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        aria-label={`${s.t} para ${r.t.toLowerCase()}`}
                        disabled={pendiente}
                        onClick={() => ejecutar(() => guardarPermisoSeccion(r.v, s.v, !on), `${s.t}: ${on ? "quitado a" : "abierto a"} ${r.t.toLowerCase()}`)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? "bg-ok" : "bg-apagado"}`}
                      >
                        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <p className="text-sm text-mal">{error}</p>}
    </div>
  );
}
