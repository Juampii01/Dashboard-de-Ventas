"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, PhoneCall, Search, ShoppingCart, UserX, Users } from "lucide-react";
import { cargandoDatos } from "@/lib/pantalla-lista";
import { exigirOk } from "@/lib/resultado-cliente";
import { cargarLeadsPestana } from "./acciones";
import { descompactarLeads, type LeadsCompactos, type LeadVista } from "@/lib/leads-vista";
import { cifras, compararFuentes, embudo, filtrarLeads, filtrarSinFuente, paisDe, repartir } from "@/lib/leads-cifras";
import { ETIQUETA_ESTADO_CALLER, SIN_PAIS, nombrePais, pct } from "@/lib/formato";
import { PREGUNTAS_BIBLIOTECA, preguntaCanonica, respuestasBiblioteca } from "@/lib/oferta";
import { PREFIJO_ETIQUETA } from "@/lib/canal";
import { Kpi, Seccion } from "@/components/ui";
import { Embudo } from "@/components/embudo";
import { Desplegable } from "@/components/eleccion";
import { OfertaChip } from "@/components/oferta-chip";
import { PopupLead } from "@/components/popup-lead";
import { MapaPaises } from "@/components/mapa-paises";
import { GraficosLeads } from "./leads-graficos";
import { AccionesLeads, CORTO } from "./leads-acciones";

// 1c (Cristian, 26 oct 2026): KPIs → «Leads». Todos los leads del proyecto para decidir a quién llamar, ver cómo rinde
// cada fuente (pipeline, con sus 🔗) y conocer al público. Los datos llegan compactos justo después de pintar
// (lib/leads-kpis.ts) y todo lo demás se calcula aquí: cambiar un filtro no pide nada a la base.
export function PestanaLeads({ desde, hasta, zona }: { desde: number | null; hasta: number | null; zona: string }) {
  const [datos, setDatos] = useState<LeadsCompactos | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let vivo = true;
    // Mientras llegan, la precarga del menú espera (lib/pantalla-lista.ts), como la tabla de la Biblioteca
    const listo = cargandoDatos();
    exigirOk(cargarLeadsPestana())
      .then((d) => vivo && setDatos(d as LeadsCompactos))
      .catch((e) => vivo && setError(e instanceof Error ? e.message : "No se pudieron cargar los leads."))
      .finally(listo);
    return () => {
      vivo = false;
      listo();
    };
  }, []);
  const vista = useMemo(() => (datos ? descompactarLeads(datos) : null), [datos]);
  if (error) return <p className="text-sm text-mal">{error}</p>;
  if (!vista)
    return (
      // data-datos-pendientes: llega en el HTML desde el principio; mientras está, el menú no precarga (lib/pantalla-lista.ts)
      <div className="animate-pulse space-y-3" aria-busy="true" data-datos-pendientes="">
        <p className="text-sm text-texto-3">Cargando todos los leads…</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-xl bg-panel-2" />)}</div>
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-9 rounded-lg bg-panel-2" />)}
      </div>
    );
  return <Contenido vista={vista} desde={desde} hasta={hasta} zona={zona} />;
}

type Vista = ReturnType<typeof descompactarLeads>;

function Contenido({ vista, desde, hasta, zona }: { vista: Vista; desde: number | null; hasta: number | null; zona: string }) {
  const { pipelines, etapas, gente, leads } = vista;
  const [fuente, setFuente] = useState<string | null>(null);
  const [pais, setPais] = useState("");
  const [sinCaller, setSinCaller] = useState(false);
  const [q, setQ] = useState("");

  const base = useMemo(() => ({ desde, hasta, pais, sinCaller, q }), [desde, hasta, pais, sinCaller, q]);
  const sinFuente = useMemo(() => filtrarSinFuente(leads, base), [leads, base]);
  const visibles = useMemo(() => filtrarLeads(leads, { ...base, pipelineId: fuente }), [leads, base, fuente]);
  // El filtro de país enseña los países de lo elegido sin contar el propio país (si no, solo saldría el elegido)
  const paises = useMemo(() => repartir(filtrarLeads(leads, { ...base, pais: "", pipelineId: fuente }), paisDe, SIN_PAIS), [leads, base, fuente]);
  const c = cifras(visibles);
  const fuentes = useMemo(() => compararFuentes(sinFuente, pipelines), [sinFuente, pipelines]);
  const hayWhatsApp = visibles.some((l) => l.etiquetas.includes("leads whatsapp"));

  return (
    <div className="space-y-5">
      {/* Qué ver: fuente (con su número), país, sin caller y búsqueda */}
      <div className="tarjeta space-y-3 p-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Fuente">
          {fuentes.map((f) => (
            <button key={f.id ?? "todos"} type="button" role="tab" aria-selected={fuente === f.id} onClick={() => setFuente(f.id)} className={`chip ${fuente === f.id ? "bg-primario text-white" : "bg-panel-2 text-texto-2 hover:text-texto"}`}>
              {f.nombre} <small className="ml-1 tabular-nums opacity-80">{f.pasos[0].n.toLocaleString("es-ES")}</small>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-texto-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, email, teléfono, país o etiqueta…" className="campo pl-9" aria-label="Buscar leads" />
          </div>
          <Desplegable aria-label="País" value={pais} onChange={(e) => setPais(e.target.value)} className="campo w-auto min-w-44" title="País del lead (por el código de su teléfono)">
            <option value="">Todos los países</option>
            {paises.map((p) => <option key={p.t} value={p.t}>{`${nombrePais(p.t)} (${p.n})`}</option>)}
          </Desplegable>
          <label className="flex items-center gap-1.5 text-sm text-texto-2"><input type="checkbox" className="interruptor" checked={sinCaller} onChange={(e) => setSinCaller(e.target.checked)} /> Sin caller</label>
        </div>
        {hayWhatsApp && (desde !== null || hasta !== null) && (
          <p className="text-xs text-texto-3">Ojo: los de WhatsApp se importaron el 26 oct 2026 y esa es su fecha de alta (no el día en que entraron al grupo).</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi titulo="Leads" valor={c.total.toLocaleString("es-ES")} icono={Users} detalle={fuente ? pipelines.find((p) => p.id === fuente)?.nombre : "Todas las fuentes"} />
        <Kpi titulo="Sin caller" valor={c.sinCaller.n.toLocaleString("es-ES")} icono={UserX} tono="aviso" detalle={`${pct(c.sinCaller.pct)} del total`} />
        <Kpi titulo="Contactados" valor={c.contactados.n.toLocaleString("es-ES")} icono={PhoneCall} detalle={`${pct(c.contactados.pct)} · llamada, WhatsApp o agenda`} />
        <Kpi titulo="Agendados" valor={c.agendados.n.toLocaleString("es-ES")} icono={CalendarCheck} tono="ok" detalle={`${pct(c.agendados.pct)} del total`} />
        <Kpi titulo="Compraron" valor={c.compran.n.toLocaleString("es-ES")} icono={ShoppingCart} tono="oro" detalle={`${pct(c.compran.pct)} del total`} />
      </div>

      {/* Uno debajo de otro: al lado de la tabla, el embudo quedaba estrecho y cortaba los pasos pequeños («Co…») */}
      <div className="space-y-5">
        <Seccion titulo="Cómo rinde cada fuente">
          <div className="-mx-4 overflow-x-auto sm:-mx-5">
            <table className="tabla">
              <thead>
                <tr><th>Fuente</th><th className="text-right">Leads</th><th className="text-right">Sin caller</th><th className="text-right">Contactados</th><th className="text-right">Contestan</th><th className="text-right">Agendan</th><th className="text-right">Asisten</th><th className="text-right">Compran</th></tr>
              </thead>
              <tbody>
                {fuentes.map((f) => (
                  <tr key={f.id ?? "todos"} className={`cursor-pointer hover:bg-panel-2 ${fuente === f.id ? "bg-primario-suave/40" : ""}`} onClick={() => setFuente(f.id)}>
                    <td className="whitespace-nowrap font-medium">{f.nombre}</td>
                    <td className="text-right tabular-nums">{f.pasos[0].n.toLocaleString("es-ES")}</td>
                    <td className="text-right tabular-nums">{f.sinCaller.toLocaleString("es-ES")}</td>
                    {f.pasos.slice(1).map((p) => (
                      <td key={p.t} className="whitespace-nowrap text-right tabular-nums">{p.n.toLocaleString("es-ES")} <small className="text-texto-3">{pct(p.pct)}</small></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-texto-3">De los leads de cada fuente (con sus 🔗), cuántos llegaron a cada paso hasta hoy. «Todos» cuenta a cada persona una vez. Clic en una fila para elegirla.</p>
        </Seccion>
        <Seccion titulo="Embudo">
          <Embudo titulo="Embudo de los leads elegidos" pasos={embudo(visibles).map((p) => ({ t: p.t, n: p.n }))} />
          <p className="mt-2 text-xs text-texto-3">La misma tanda de arriba abajo: de estos leads, cuántos se contactaron, contestaron, agendaron, asistieron y compraron hasta hoy. No es el embudo de «Por persona», que cuenta lo que pasó en el periodo.</p>
        </Seccion>
      </div>

      {/* L4 y L5: gráficos y mapa de lo elegido */}
      <GraficosLeads
        leads={visibles}
        pipelines={pipelines}
        etapas={etapas}
        gente={gente}
        fuente={fuente}
        zona={zona}
        desde={desde}
        hasta={hasta}
        mapa={
          <Seccion titulo="Mapa">
            <MapaPaises paises={repartir(visibles, paisDe, SIN_PAIS).map((p) => ({ pais: p.t, n: p.n }))} />
          </Seccion>
        }
      />

      <Seccion titulo="Todos los datos" acciones={<AccionesLeads leads={visibles} pipelines={pipelines} etapas={etapas} gente={gente} fuente={fuente} callers={gente.filter((g) => g.rol === "caller" && !g.baja)} />}>
        <TablaLeads leads={visibles} pipelines={pipelines} etapas={etapas} gente={gente} fuente={fuente} />
      </Seccion>
    </div>
  );
}

const POR_PAGINA = 100;
// Títulos cortos (CORTO, en leads-acciones.tsx), como en la tabla de la Biblioteca; la pregunta entera, al pasar el ratón
const NOMBRE_PREGUNTA = Object.fromEntries(PREGUNTAS_BIBLIOTECA.map((p) => [p.clave, p.texto]));
const DE_BIBLIOTECA = new Set(PREGUNTAS_BIBLIOTECA.map((p) => p.texto));

function TablaLeads({ leads, pipelines, etapas, gente, fuente }: { leads: LeadVista[]; pipelines: Vista["pipelines"]; etapas: Vista["etapas"]; gente: Vista["gente"]; fuente: string | null }) {
  const nombre = useMemo(() => {
    const m = new Map<string, string>([...pipelines, ...etapas, ...gente].map((x) => [x.id, x.nombre]));
    return (id: string | null) => (id ? m.get(id) ?? "—" : "—");
  }, [pipelines, etapas, gente]);
  const [col, setCol] = useState("alta");
  const [dir, setDir] = useState(-1);
  const [limite, setLimite] = useState(POR_PAGINA);
  const [ficha, setFicha] = useState<LeadVista | null>(null);

  // Dónde está en lo elegido: su columna en ese pipeline (la principal o la de su 🔗)
  const donde = (l: LeadVista) => {
    if (!fuente || l.pipelineId === fuente) return { pipeline: nombre(l.pipelineId), columna: nombre(l.etapaId) };
    const t = l.tarjetas.find((x) => x.pipelineId === fuente);
    return { pipeline: `🔗 ${nombre(fuente)}`, columna: nombre(t?.etapaId ?? null) };
  };
  const filas = useMemo(
    () =>
      leads.map((l) => {
        const r = respuestasBiblioteca(l.respuestas);
        const otras = l.respuestas.filter((x) => x.respuesta && !DE_BIBLIOTECA.has(preguntaCanonica(x.pregunta))).length;
        const canal = l.etiquetas.find((e) => e.startsWith(PREFIJO_ETIQUETA))?.slice(PREFIJO_ETIQUETA.length) ?? null;
        return { l, r, otras, canal, d: donde(l) };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leads, fuente, nombre]
  );
  type Fila = (typeof filas)[number];
  const COLS: { k: string; t: string; d?: string; v: (f: Fila) => string | number | null }[] = [
    { k: "nombre", t: "Nombre", v: (f) => f.l.nombre || null },
    { k: "telefono", t: "Teléfono", v: (f) => f.l.telefono },
    { k: "pais", t: "País", v: (f) => nombrePais(f.l.pais) },
    { k: "email", t: "Email", v: (f) => f.l.email },
    { k: "pipeline", t: "Pipeline → columna", v: (f) => `${f.d.pipeline} ${f.d.columna}` },
    { k: "caller", t: "Caller", v: (f) => (f.l.callerId ? nombre(f.l.callerId) : null) },
    { k: "closer", t: "Closer", v: (f) => (f.l.closerId ? nombre(f.l.closerId) : null) },
    { k: "estado", t: "Estado", v: (f) => ETIQUETA_ESTADO_CALLER[f.l.estado] ?? f.l.estado },
    { k: "estrellas", t: "★", v: (f) => f.l.estrellas },
    { k: "oferta", t: "Oferta", v: (f) => f.l.oferta },
    { k: "canal", t: "Canal", v: (f) => f.canal },
    { k: "fuente", t: "Origen", v: (f) => f.l.fuente },
    { k: "alta", t: "Alta", v: (f) => f.l.alta },
    ...PREGUNTAS_BIBLIOTECA.map((p) => ({ k: p.clave, t: CORTO[p.clave], d: NOMBRE_PREGUNTA[p.clave], v: (f: Fila) => f.r[p.clave] || null })),
    { k: "otras", t: "Otras respuestas", v: (f) => f.otras || null },
    { k: "etiquetas", t: "Etiquetas", v: (f) => f.l.etiquetas.join(", ") || null },
  ];
  const ordenadas = useMemo(() => {
    const c = COLS.find((x) => x.k === col) ?? COLS[0];
    return [...filas].sort((a, b) => {
      const x = c.v(a);
      const y = c.v(b);
      if (x === y) return b.l.alta - a.l.alta;
      if (x === null) return 1; // los vacíos, siempre al final
      if (y === null) return -1;
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "es")) * dir;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filas, col, dir]);
  const ordenar = (k: string) => {
    if (k === col) setDir(-dir);
    else {
      setCol(k);
      setDir(k === "alta" || k === "estrellas" || k === "otras" ? -1 : 1);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-texto-3">
        Mostrando {Math.min(limite, ordenadas.length).toLocaleString("es-ES")} de {ordenadas.length.toLocaleString("es-ES")}. Clic en una fila para ver todos sus datos y formularios; clic en un título para ordenar.
      </div>
      <div className="-mx-4 overflow-x-auto sm:-mx-5">
        <table className="tabla">
          <thead>
            <tr>
              {COLS.map((c) => (
                <th key={c.k} aria-sort={col === c.k ? (dir === 1 ? "ascending" : "descending") : "none"}>
                  <button type="button" className="flex items-center gap-1 whitespace-nowrap" title={c.d} onClick={() => ordenar(c.k)}>
                    {c.t}<span className="text-texto-3">{col === c.k ? (dir === 1 ? "▲" : "▼") : "↕"}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordenadas.slice(0, limite).map(({ l, r, otras, canal, d }) => (
              <tr key={l.id} tabIndex={0} className="cursor-pointer hover:bg-panel-2" onClick={(e) => !(e.target as HTMLElement).closest("a") && setFicha(l)} onKeyDown={(e) => e.key === "Enter" && setFicha(l)}>
                <td className="whitespace-nowrap font-medium">{l.nombre || <span className="text-texto-3">Sin nombre</span>}</td>
                <td className="whitespace-nowrap">{l.telefono ?? "—"}</td>
                <td className="whitespace-nowrap">{nombrePais(l.pais)}</td>
                <td>{l.email ? <a href={`mailto:${l.email}`} className="text-primario hover:underline">{l.email}</a> : "—"}</td>
                <td className="whitespace-nowrap text-texto-2">{d.pipeline} → {d.columna}{l.tarjetas.length > 0 && !fuente ? <span className="text-texto-3" title={l.tarjetas.map((t) => nombre(t.pipelineId)).join(" · ")}> · 🔗{l.tarjetas.length}</span> : null}</td>
                <td className="whitespace-nowrap text-texto-2">{l.callerId ? nombre(l.callerId) : "—"}</td>
                <td className="whitespace-nowrap text-texto-2">{l.closerId ? nombre(l.closerId) : "—"}</td>
                <td className="whitespace-nowrap">{ETIQUETA_ESTADO_CALLER[l.estado] ?? l.estado}</td>
                <td className="tabular-nums">{l.estrellas ?? "—"}</td>
                <td><OfertaChip oferta={l.oferta} /></td>
                <td className="whitespace-nowrap">{canal ?? "—"}</td>
                <td className="whitespace-nowrap text-texto-2">{l.fuente ?? "—"}</td>
                <td className="whitespace-nowrap tabular-nums">{new Date(l.alta).toLocaleDateString("es-ES")}</td>
                {PREGUNTAS_BIBLIOTECA.map((p) => <td key={p.clave} className="whitespace-nowrap">{r[p.clave] || "—"}</td>)}
                <td className="tabular-nums">{otras || "—"}</td>
                <td><div className="flex gap-1 whitespace-nowrap">{l.etiquetas.map((t) => <span key={t} className="chip bg-panel-2 text-texto-3">{t}</span>)}</div></td>
              </tr>
            ))}
            {ordenadas.length === 0 && <tr><td colSpan={COLS.length} className="py-6 text-center text-texto-3">No hay leads con esos filtros.</td></tr>}
          </tbody>
        </table>
      </div>
      {ordenadas.length > limite && <button onClick={() => setLimite((x) => x + POR_PAGINA)} className="w-full rounded-lg py-2 text-sm text-primario hover:bg-panel-2">Ver {Math.min(POR_PAGINA, ordenadas.length - limite)} más</button>}
      {ficha && <PopupLead leadId={ficha.id} nombre={ficha.nombre} onCerrar={() => setFicha(null)} />}
    </div>
  );
}

