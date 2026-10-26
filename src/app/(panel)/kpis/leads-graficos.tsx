"use client";

import { useMemo, useState } from "react";
import { porDia, preguntasDe, repartir, respuestasA } from "@/lib/leads-cifras";
import type { LeadVista } from "@/lib/leads-vista";
import { ETIQUETA_ESTADO_CALLER, SIN_PAIS, nombrePais } from "@/lib/formato";
import { ETIQUETA_OFERTA, PREGUNTAS_BIBLIOTECA, preguntaCanonica, type Oferta } from "@/lib/oferta";
import { PREFIJO_ETIQUETA } from "@/lib/canal";
import { GraficoDiario, Seccion } from "@/components/ui";
import { Barras } from "@/components/barras";
import { AnilloPartes } from "@/components/anillo-partes";
import { Desplegable } from "@/components/eleccion";

type Nombrado = { id: string; nombre: string };

// 1c · L4 (Cristian, 26 oct 2026): los gráficos de la pestaña «Leads», de lo elegido arriba (fuente, periodo, país…)
export function GraficosLeads({ leads, pipelines, etapas, gente, fuente, zona, desde, hasta, mapa }: { leads: LeadVista[]; pipelines: Nombrado[]; etapas: Nombrado[]; gente: Nombrado[]; fuente: string | null; zona: string; desde: number | null; hasta: number | null; mapa: React.ReactNode }) {
  const nombre = useMemo(() => {
    const m = new Map([...pipelines, ...etapas, ...gente].map((x) => [x.id, x.nombre]));
    return (id: string | null) => (id ? m.get(id) ?? "—" : null);
  }, [pipelines, etapas, gente]);
  const puntos = useMemo(() => porDia(leads, zona, desde, hasta), [leads, zona, desde, hasta]);
  const conWhatsApp = leads.some((l) => l.etiquetas.includes("leads whatsapp"));
  const columna = (l: LeadVista) => (!fuente ? null : l.pipelineId === fuente ? nombre(l.etapaId) : nombre(l.tarjetas.find((t) => t.pipelineId === fuente)?.etapaId ?? null));
  const canal = (l: LeadVista) => l.etiquetas.find((e) => e.startsWith(PREFIJO_ETIQUETA))?.slice(PREFIJO_ETIQUETA.length) ?? null;
  const barras = (lista: { t: string; n: number; pct: number }[], max = 10) => lista.slice(0, max);

  // Formularios: las 6 de la Biblioteca siempre que alguien las respondiera; el resto, eligiendo la pregunta
  const preguntas = useMemo(() => preguntasDe(leads, preguntaCanonica), [leads]);
  const DE_BIBLIOTECA = new Set(PREGUNTAS_BIBLIOTECA.map((p) => p.texto));
  const otras = preguntas.filter((p) => !DE_BIBLIOTECA.has(p.pregunta));
  const [elegida, setElegida] = useState("");
  const pregunta = otras.some((p) => p.pregunta === elegida) ? elegida : otras[0]?.pregunta ?? "";
  const conBiblioteca = preguntas.find((p) => DE_BIBLIOTECA.has(p.pregunta))?.n ?? 0;

  return (
    <div className="space-y-5">
      <Seccion titulo="Leads por día de alta">
        <GraficoDiario puntos={puntos} formato={(n) => `${n.toLocaleString("es-ES")} leads`} />
        {conWhatsApp && <p className="mt-2 text-xs text-texto-3">Los de WhatsApp se importaron el 26 oct 2026: ese pico no es el día en que entraron al grupo.</p>}
      </Seccion>

      <div className="grid gap-5 lg:grid-cols-2">
        {mapa}
        <Seccion titulo="De dónde vienen">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {!fuente && <AnilloPartes titulo="Por fuente" partes={repartir(leads, (l) => nombre(l.pipelineId), "Sin pipeline")} />}
            <AnilloPartes titulo="Por país" partes={repartir(leads, (l) => nombrePais(l.pais), SIN_PAIS)} />
            <AnilloPartes titulo="Canal de la cita" partes={repartir(leads.filter(canal), canal)} />
          </div>
        </Seccion>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {fuente && (
          <Seccion titulo="Por columna">
            <Barras titulo={`En «${nombre(fuente)}»`} filas={barras(repartir(leads, columna, "—"), 12)} numero />
          </Seccion>
        )}
        <Seccion titulo="Estado de la llamada">
          <Barras titulo="Según el caller" filas={barras(repartir(leads, (l) => ETIQUETA_ESTADO_CALLER[l.estado] ?? l.estado))} numero />
        </Seccion>
        <Seccion titulo="Por caller">
          <Barras titulo="Leads asignados" filas={barras(repartir(leads, (l) => nombre(l.callerId), "Sin caller"), 12)} numero />
        </Seccion>
        <Seccion titulo="Oferta">
          <Barras titulo="Según el formulario de la Biblioteca" filas={barras(repartir(leads, (l) => (l.oferta ? ETIQUETA_OFERTA[l.oferta as Oferta] ?? l.oferta : null), "Sin oferta"))} numero />
        </Seccion>
      </div>

      {conBiblioteca > 0 && (
        <Seccion titulo={`Formulario de la Biblioteca (${conBiblioteca.toLocaleString("es-ES")} lo rellenaron)`}>
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {PREGUNTAS_BIBLIOTECA.map((p) => {
              const r = respuestasA(leads, p.texto, preguntaCanonica, 8);
              return r.total ? <Barras key={p.clave} titulo={`${p.texto} (${r.total})`} filas={r.filas} numero /> : null;
            })}
          </div>
        </Seccion>
      )}

      {otras.length > 0 && (
        <Seccion
          titulo="Otros formularios"
          acciones={
            <Desplegable aria-label="Ver respuestas de" value={pregunta} onChange={(e) => setElegida(e.target.value)} className="campo w-auto max-w-md">
              {otras.map((p) => <option key={p.pregunta} value={p.pregunta}>{`${p.pregunta} (${p.n})`}</option>)}
            </Desplegable>
          }
        >
          {pregunta && (() => {
            const r = respuestasA(leads, pregunta, preguntaCanonica);
            return <Barras titulo={`${pregunta} · ${r.total.toLocaleString("es-ES")} respondieron`} filas={r.filas} numero />;
          })()}
        </Seccion>
      )}
    </div>
  );
}
