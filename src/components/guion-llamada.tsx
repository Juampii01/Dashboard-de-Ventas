"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Copy, Lightbulb, Search, ShieldQuestion, Check } from "lucide-react";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toasts";
import { guardarMarcasGuion } from "@/app/(panel)/guiones/acciones";
import { rellenar, resumenMarcas, type Guion, type Marcas } from "@/lib/guiones";

export type ResultadoGuion = { clave: string; texto: string; icono: ReactNode };

// Fase 6 · La llamada siguiendo el guion: al pulsar «Llamar» no se abre ninguna app (Cristian, 12 oct): sale esto.
// Pasos con su checklist y pistas, objeciones con su respuesta y, al final, los botones de resultado de siempre.
// Lo marcado se guarda al elegir el resultado (para que el CEO y los directores lo revisen en «Guiones»).
export function GuionLlamada({
  leadId,
  nombreLead,
  telefono,
  miNombre,
  guion,
  resultados,
  onResultado,
  onCerrar,
}: {
  leadId: string;
  nombreLead: string;
  telefono: string | null;
  miNombre: string;
  guion: Guion;
  resultados: ResultadoGuion[];
  onResultado: (clave: string) => void;
  onCerrar: () => void;
}) {
  const toast = useToast();
  const [marcas, setMarcas] = useState<Marcas>({});
  const [paso, setPaso] = useState(guion.pasos[0]?.id ?? "");
  const [busca, setBusca] = useState("");
  const [abierta, setAbierta] = useState<string | null>(null);
  const datos = { nombre: nombreLead.split(" ")[0], "tu nombre": miNombre };
  const { hechos, total } = resumenMarcas(guion, marcas);
  const objeciones = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return guion.objeciones.filter((o) => !t || o.objecion.toLowerCase().includes(t) || o.respuesta.toLowerCase().includes(t));
  }, [busca, guion.objeciones]);

  function marcar(pasoId: string, i: number) {
    setMarcas((m) => {
      const ya = new Set(m[pasoId] ?? []);
      if (ya.has(i)) ya.delete(i);
      else ya.add(i);
      return { ...m, [pasoId]: [...ya] };
    });
  }

  function terminar(clave: string) {
    // Se guarda en segundo plano: el resultado se abre al momento
    void guardarMarcasGuion(leadId, marcas, clave).then((r) => {
      if (r && typeof r === "object" && "error" in r && r.error) toast(String(r.error), "error");
    });
    onResultado(clave);
  }

  return (
    <Modal titulo={`Llamada a ${nombreLead}`} onCerrar={onCerrar} ancho="max-w-5xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-panel-2 px-4 py-3">
          <div>
            <div className="text-xs text-texto-3">Su teléfono</div>
            <div className="text-xl font-semibold tabular-nums">{telefono ?? "Sin teléfono"}</div>
          </div>
          {telefono && (
            <button
              type="button"
              className="btn-secundario"
              onClick={() => {
                void navigator.clipboard?.writeText(telefono).then(() => toast("Número copiado"));
              }}
            >
              <Copy className="h-4 w-4" /> Copiar número
            </button>
          )}
          <div className="text-right">
            <div className="text-xs text-texto-3">Checklist</div>
            <div className="text-xl font-semibold tabular-nums">{hechos}/{total}</div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <ol className="space-y-2">
            {guion.pasos.map((p, i) => {
              const activo = p.id === paso;
              const marcados = new Set(marcas[p.id] ?? []);
              const completo = p.checklist.length > 0 && marcados.size === p.checklist.length;
              return (
                <li key={p.id} className={`rounded-xl border transition ${activo ? "border-primario bg-panel shadow-sm" : "border-borde bg-panel-2/50"}`}>
                  <button type="button" className="flex w-full items-center gap-3 px-3 py-2.5 text-left" onClick={() => setPaso(activo ? "" : p.id)} aria-expanded={activo}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${completo ? "bg-ok text-white" : activo ? "bg-primario text-white" : "bg-panel text-texto-2"}`}>
                      {completo ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <span className="flex-1 font-medium">{p.titulo}</span>
                    {p.checklist.length > 0 && <span className="text-xs tabular-nums text-texto-3">{marcados.size}/{p.checklist.length}</span>}
                  </button>
                  {activo && (
                    <div className="space-y-3 px-3 pb-3 pl-13">
                      {p.texto && <p className="whitespace-pre-line rounded-lg bg-primario-suave/60 px-3 py-2 text-sm">{rellenar(p.texto, datos)}</p>}
                      {p.checklist.length > 0 && (
                        <div className="space-y-1">
                          {p.checklist.map((c, j) => (
                            <label key={j} className="flex items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-panel-2">
                              <input type="checkbox" checked={marcados.has(j)} onChange={() => marcar(p.id, j)} />
                              <span className={marcados.has(j) ? "text-texto-3 line-through" : ""}>{c}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {p.pistas.length > 0 && (
                        <ul className="space-y-1 text-xs text-texto-2">
                          {p.pistas.map((x, j) => (
                            <li key={j} className="flex gap-1.5"><Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-oro" />{x}</li>
                          ))}
                        </ul>
                      )}
                      {i < guion.pasos.length - 1 && (
                        <button type="button" className="btn-secundario px-2.5 py-1 text-xs" onClick={() => setPaso(guion.pasos[i + 1].id)}>Siguiente paso →</button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold"><ShieldQuestion className="h-4 w-4 text-primario" /> Objeciones</div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-3" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} className="campo pl-9" placeholder="Busca lo que te dice…" aria-label="Buscar objeción" />
            </div>
            <div className="max-h-[45vh] space-y-1.5 overflow-y-auto">
              {objeciones.length === 0 && <p className="py-4 text-center text-xs text-texto-3">No hay ninguna con eso.</p>}
              {objeciones.map((o) => (
                <div key={o.id} className="rounded-lg border border-borde bg-panel">
                  <button type="button" className="w-full px-3 py-2 text-left text-sm font-medium" onClick={() => setAbierta(abierta === o.id ? null : o.id)} aria-expanded={abierta === o.id}>
                    «{o.objecion}»
                  </button>
                  {abierta === o.id && <p className="border-t border-borde px-3 py-2 text-sm text-texto-2">{rellenar(o.respuesta, datos)}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-borde pt-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-texto-3">¿Cómo ha ido?</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {resultados.map((r) => (
              <button key={r.clave} type="button" className="btn-secundario justify-center" onClick={() => terminar(r.clave)}>
                {r.icono} {r.texto}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
