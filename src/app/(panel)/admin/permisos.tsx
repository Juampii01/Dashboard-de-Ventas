"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useAccion } from "@/components/acciones-lead";
import { Modal } from "@/components/modal";
import { guardarPermisoSeccion, guardarPermisoPersona } from "./acciones";

const ROLES = [
  { v: "director", t: "Directores" },
  { v: "closer", t: "Closers" },
  { v: "caller", t: "Callers" },
] as const;
type RolP = (typeof ROLES)[number]["v"];

export type DatosPermisos = {
  secciones: { v: string; t: string; d: string; grupo: string }[];
  defecto: Record<RolP, string[]>; // lo de siempre de cada rol
  nunca: Record<RolP, string[]>; // lo que no se puede dar
  deRol: Record<string, boolean>; // «rol:seccion» → abierto o cerrado
  dePersona: Record<string, boolean>; // «perfil:seccion» → abierto o cerrado
  puedoDar: string[]; // lo que tiene quien cambia (el CEO, todo)
  soyCeo: boolean;
};

const valorRol = (d: DatosPermisos, rol: RolP, s: string) => d.deRol[`${rol}:${s}`] ?? d.defecto[rol].includes(s);

function Interruptor({ on, etiqueta, disabled, onClick }: { on: boolean; etiqueta: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={etiqueta}
      disabled={disabled}
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 ${on ? "bg-ok" : "bg-apagado"}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

// Tabla por rol (V2-8 ampliada en el Paso H5): todas las secciones. El CEO lo tiene todo siempre.
export function TablaPermisos({ datos }: { datos: DatosPermisos }) {
  const { pendiente, error, ejecutar } = useAccion();
  const grupos = [...new Set(datos.secciones.map((s) => s.grupo))];
  return (
    <div className="space-y-3">
      <div className="-mx-4 overflow-x-auto sm:-mx-5">
        <table className="tabla">
          <thead>
            <tr><th>Sección</th><th className="text-center">CEO</th>{ROLES.map((r) => <th key={r.v} className="text-center">{r.t}</th>)}</tr>
          </thead>
          <tbody>
            {grupos.map((g) => [
              <tr key={g}><td colSpan={5} className="bg-panel-2 text-[11px] font-semibold uppercase tracking-wider text-texto-3">{g}</td></tr>,
              ...datos.secciones.filter((s) => s.grupo === g).map((s) => (
                <tr key={s.v}>
                  <td><div className="font-medium">{s.t}</div><div className="text-xs text-texto-3">{s.d}</div></td>
                  <td className="text-center text-xs text-texto-3">Siempre</td>
                  {ROLES.map((r) => {
                    if (datos.nunca[r.v].includes(s.v)) return <td key={r.v} className="text-center text-xs text-texto-3">{s.v === "mi_funnel" ? "—" : "Nunca"}</td>;
                    const on = valorRol(datos, r.v, s.v);
                    const bloqueado = (!datos.soyCeo && r.v === "director") || (!on && !datos.puedoDar.includes(s.v));
                    return (
                      <td key={r.v} className="text-center">
                        <Interruptor
                          on={on}
                          etiqueta={`${s.t} para ${r.t.toLowerCase()}`}
                          disabled={pendiente || bloqueado}
                          onClick={() => ejecutar(() => guardarPermisoSeccion(r.v, s.v, !on), `${s.t}: ${on ? "quitado a" : "abierto a"} ${r.t.toLowerCase()}`)}
                        />
                      </td>
                    );
                  })}
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>
      {error && <p className="text-sm text-mal">{error}</p>}
    </div>
  );
}

// Ficha de permisos de una persona (Paso H5): manda sobre lo de su rol
export function FichaPermisos({ persona, datos }: { persona: { id: string; nombre: string; rol: RolP }; datos: DatosPermisos }) {
  const [abierta, setAbierta] = useState(false);
  const { pendiente, error, ejecutar } = useAccion();
  const propias = Object.keys(datos.dePersona).filter((k) => k.startsWith(`${persona.id}:`)).length;
  return (
    <>
      <button className="btn-secundario px-2.5 py-1.5 text-xs" onClick={() => setAbierta(true)} title="Permisos de esta persona">
        <ShieldCheck className="h-3.5 w-3.5" /> Permisos{propias ? ` (${propias})` : ""}
      </button>
      {abierta && (
        <Modal titulo={`Permisos de ${persona.nombre}`} onCerrar={() => setAbierta(false)} ancho="max-w-xl">
          <p className="mb-3 text-xs text-texto-3">«Como su rol» sigue la tabla de Permisos. «Sí» o «No» manda sobre su rol, solo para esta persona.</p>
          <div className="max-h-[60vh] space-y-1 overflow-y-auto">
            {datos.secciones.map((s) => {
              const nunca = datos.nunca[persona.rol].includes(s.v);
              const propio = datos.dePersona[`${persona.id}:${s.v}`];
              const delRol = valorRol(datos, persona.rol, s.v);
              const valor = propio === undefined ? "rol" : propio ? "si" : "no";
              return (
                <div key={s.v} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-panel-2">
                  <div className="min-w-0"><div className="text-sm font-medium">{s.t}</div><div className="truncate text-[11px] text-texto-3">{s.d}</div></div>
                  {nunca ? (
                    <span className="text-xs text-texto-3">{s.v === "mi_funnel" ? "No aplica" : "Nunca"}</span>
                  ) : (
                    <select
                      aria-label={`${s.t} para ${persona.nombre}`}
                      className="campo w-auto py-1 text-xs"
                      value={valor}
                      disabled={pendiente}
                      onChange={(e) => {
                        const v = e.target.value;
                        ejecutar(() => guardarPermisoPersona(persona.id, s.v, v === "rol" ? null : v === "si"), `${s.t}: ${v === "rol" ? "como su rol" : v === "si" ? "sí" : "no"}`);
                      }}
                    >
                      <option value="rol">Como su rol ({delRol ? "sí" : "no"})</option>
                      <option value="si" disabled={!datos.puedoDar.includes(s.v)}>Sí</option>
                      <option value="no">No</option>
                    </select>
                  )}
                </div>
              );
            })}
          </div>
          {error && <p className="mt-2 text-sm text-mal">{error}</p>}
        </Modal>
      )}
    </>
  );
}
