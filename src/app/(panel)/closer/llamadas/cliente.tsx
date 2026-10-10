"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Plus, Upload, Search, MessageCircle, Phone, ClipboardCheck, RefreshCw, Link2, X } from "lucide-react";
import { Modal } from "@/components/modal";
import { useAccion, Mensajes } from "@/components/acciones-lead";
import { SelectorEstrellas } from "@/components/estrellas";
import { exigirOk } from "@/lib/resultado-cliente";
import { agendarCita } from "@/app/(panel)/leads/acciones";
import { buscarLeadsParaLlamada, cambiarEstadoCita, descartarCitaSinLead, importarCitas, sincronizarGhl, unirCitaSinLead } from "../acciones";
import { useToast } from "@/components/toasts";
import { AccionesCita } from "../acciones-cita";
import type { ColumnaPrecall } from "@/lib/llamadas";
import type { EstadoCita, Producto } from "@/lib/tipos";

type LeadBuscado = { id: string; nombre: string; apellido: string; telefono: string | null; email: string | null };

export function CrearLlamada({ closers, soyCloser }: { closers: { id: string; nombre: string }[]; soyCloser: string | null }) {
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<LeadBuscado[]>([]);
  const [lead, setLead] = useState<LeadBuscado | null>(null);
  const [buscando, iniciar] = useTransition();
  const { pendiente, error, ejecutar } = useAccion();
  const buscar = (texto: string) =>
    iniciar(async () => {
      try {
        setResultados((await exigirOk(buscarLeadsParaLlamada(texto))) as LeadBuscado[]);
      } catch {
        setResultados([]);
      }
    });
  return (
    <>
      <button className="btn-primario" onClick={() => setAbierto(true)}><Plus className="h-4 w-4" /> Crear llamada</button>
      {abierto && (
        <Modal titulo="Crear llamada" onCerrar={() => setAbierto(false)}>
          {!lead ? (
            <div className="space-y-3">
              <label className="etiqueta-campo" htmlFor="cliente-busca-el-lead-nombre-email-o-t">Busca el lead (nombre, email o teléfono)</label>
              <input id="cliente-busca-el-lead-nombre-email-o-t" className="campo" autoFocus value={q} onChange={(e) => { setQ(e.target.value); if (e.target.value.trim().length >= 2) buscar(e.target.value); }} placeholder="Escribe al menos 2 letras…" />
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {resultados.map((l) => (
                  <li key={l.id}><button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-panel-2" onClick={() => setLead(l)}><b>{`${l.nombre} ${l.apellido}`.trim() || "Sin nombre"}</b> <span className="text-texto-3">· {l.telefono ?? l.email ?? ""}</span></button></li>
                ))}
                {!buscando && q.trim().length >= 2 && resultados.length === 0 && <li className="px-3 py-2 text-sm text-texto-3">No hay leads con eso{soyCloser ? " entre tus leads" : ""}.</li>}
              </ul>
            </div>
          ) : (
            <form
              className="space-y-3"
              action={(fd) => {
                ejecutar(() => agendarCita(lead.id, String(fd.get("closer")), String(fd.get("fecha")), String(fd.get("nota") ?? ""), fd.get("estrellas") ? Number(fd.get("estrellas")) : undefined), "Llamada creada");
                setAbierto(false);
                setLead(null);
              }}
            >
              <p className="text-sm">Lead: <b>{`${lead.nombre} ${lead.apellido}`.trim()}</b> <button type="button" className="text-xs text-primario hover:underline" onClick={() => setLead(null)}>cambiar</button></p>
              <div>
                <label className="etiqueta-campo" htmlFor="cliente-closer">Closer</label>
                <select id="cliente-closer" name="closer" required className="campo" defaultValue={soyCloser ?? ""}>{closers.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
              </div>
              <label className="block"><span className="etiqueta-campo">Fecha y hora (hora del proyecto)</span><input type="datetime-local" name="fecha" required className="campo" /></label>
              <label className="block"><span className="etiqueta-campo">Nota</span><textarea name="nota" rows={2} className="campo" /></label>
              <SelectorEstrellas quien="caller" opcional />
              <button className="btn-primario w-full" disabled={pendiente}>Crear llamada</button>
            </form>
          )}
          {error && <p className="mt-2 text-sm text-mal">{error}</p>}
        </Modal>
      )}
    </>
  );
}

export function ImportarCitas() {
  const [abierto, setAbierto] = useState(false);
  const [resultado, setResultado] = useState<{ creadas: number; fallos: string[] } | null>(null);
  const [error, setError] = useState("");
  const [cargando, iniciar] = useTransition();
  return (
    <>
      <button className="btn-secundario" onClick={() => setAbierto(true)}><Upload className="h-4 w-4" /> Importar</button>
      {abierto && (
        <Modal titulo="Importar llamadas desde un CSV" onCerrar={() => { setAbierto(false); setResultado(null); }}>
          <div className="space-y-3 text-sm">
            <p className="text-texto-2">Columnas: <code>email</code> (o <code>telefono</code>), <code>fecha</code> (por ejemplo <code>2026-10-20 17:00</code>, hora del proyecto), <code>closer_email</code> y <code>nota</code> (opcional). El lead tiene que existir ya en la app.</p>
            <input
              type="file"
              accept=".csv,text/csv"
              className="campo"
              disabled={cargando}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setError("");
                const texto = await f.text();
                iniciar(async () => {
                  try {
                    setResultado((await exigirOk(importarCitas(texto))) as { creadas: number; fallos: string[] });
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Algo falló.");
                  }
                });
              }}
            />
            {cargando && <p className="text-texto-3">Importando…</p>}
            {error && <p className="text-mal">{error}</p>}
            {resultado && (
              <div className="rounded-lg bg-panel-2 p-3">
                <p><b>{resultado.creadas}</b> llamadas creadas.</p>
                {resultado.fallos.length > 0 && <ul className="mt-2 max-h-40 list-disc overflow-y-auto pl-5 text-xs text-mal">{resultado.fallos.map((f) => <li key={f}>{f}</li>)}</ul>}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

// Buscador que guarda el texto en la URL (?q=)
export function BuscadorUrl({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [, iniciar] = useTransition();
  const aplicar = () => {
    const p = new URLSearchParams(params.toString());
    if (q.trim()) p.set("q", q.trim());
    else p.delete("q");
    iniciar(() => router.replace(`${ruta}?${p}`, { scroll: false }));
  };
  return (
    <form className="relative min-w-56 flex-1" onSubmit={(e) => { e.preventDefault(); aplicar(); }}>
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-texto-3" />
      <input value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => q !== (params.get("q") ?? "") && aplicar()} placeholder={placeholder} className="campo pl-9" aria-label="Buscar" />
    </form>
  );
}

// Tarjeta del pre-call: Registrar · Mover a · Chat
export function TarjetaPrecall({
  soloMirar = false,
  columnas,
  cita,
  lead,
  fechaTxt,
  agendadaTxt,
  closer,
  productos,
  moneda,
}: {
  soloMirar?: boolean; // H5: un caller con «Agendas», solo mirar
  columnas: ColumnaPrecall[];
  cita: { id: string; estado: EstadoCita; lead_id: string };
  lead: { nombre: string; telefono: string | null };
  fechaTxt: string;
  agendadaTxt: string;
  closer: string | null;
  productos: Producto[];
  moneda: string;
}) {
  const { pendiente, error, ejecutar } = useAccion();
  const [registrar, setRegistrar] = useState(false);
  const tel = (lead.telefono ?? "").replace(/\D/g, "");
  return (
    <div
      draggable={!soloMirar}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", JSON.stringify({ id: cita.id, estado: cita.estado }));
      }}
      className={`${soloMirar ? "" : "cursor-grab"} space-y-2 rounded-lg border border-borde bg-panel p-3 text-sm shadow-sm active:cursor-grabbing ${pendiente ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <a href={`/leads/${cita.lead_id}`} className="font-medium hover:text-primario">{lead.nombre}</a>
        {closer && <span className="chip bg-panel-2 text-texto-3">{closer}</span>}
      </div>
      {lead.telefono && <a href={`tel:${lead.telefono}`} className="flex items-center gap-1.5 text-primario"><Phone className="h-3.5 w-3.5" />{lead.telefono}</a>}
      <div className="text-xs text-texto-2">📅 {fechaTxt}</div>
      <div className="text-[11px] text-texto-3">Agendada el {agendadaTxt}</div>
      {!soloMirar && <div className="flex flex-wrap gap-1.5">
        <button className="btn-secundario px-2 py-1 text-xs" onClick={() => setRegistrar((v) => !v)}><ClipboardCheck className="h-3.5 w-3.5" /> Registrar</button>
        <select
          aria-label="Mover a"
          className="campo w-auto py-1 text-xs"
          value=""
          disabled={pendiente}
          onChange={(e) => e.target.value && ejecutar(() => cambiarEstadoCita(cita.id, e.target.value as EstadoCita, ""), "Movida")}
        >
          <option value="">Mover a…</option>
          {columnas.filter((c) => c.estado !== cita.estado).map((c) => <option key={c.estado} value={c.estado}>{c.titulo}</option>)}
        </select>
        {tel && <a href={`https://wa.me/${tel}`} target="_blank" rel="noreferrer" className="btn-secundario px-2 py-1 text-xs text-ok"><MessageCircle className="h-3.5 w-3.5" /> Chat</a>}
      </div>}
      {registrar && <div className="border-t border-borde pt-2"><AccionesCita cita={cita} pasada productos={productos} moneda={moneda} /></div>}
      <Mensajes error={error} ok="" />
    </div>
  );
}

// Columna del tablero de pre-call (Paso H6): soltar una tarjeta = «Mover a» esta columna
export function ColumnaPrecall({ estado, titulo, color, total, soloMirar = false, children }: { estado: EstadoCita; titulo: string; color: string; total: number; soloMirar?: boolean; children: React.ReactNode }) {
  const { pendiente, ejecutar } = useAccion();
  const [sobre, setSobre] = useState(false);
  return (
    <div
      onDragOver={(ev) => {
        ev.preventDefault();
        setSobre(true);
      }}
      onDragLeave={() => setSobre(false)}
      onDrop={(ev) => {
        ev.preventDefault();
        setSobre(false);
        if (soloMirar) return; // H5: solo mirar
        let datos: { id?: string; estado?: string } = {};
        try {
          datos = JSON.parse(ev.dataTransfer.getData("text/plain"));
        } catch {
          return; // no es una tarjeta de pre-call
        }
        if (datos.id && datos.estado !== estado) ejecutar(() => cambiarEstadoCita(datos.id!, estado, ""), `Movida a «${titulo}»`);
      }}
      className={`flex w-72 shrink-0 flex-col rounded-xl border transition-colors ${sobre ? "border-primario bg-primario-suave/40" : "border-borde bg-panel-2/60"} ${pendiente ? "cursor-progress" : ""}`}
    >
      <div className="flex items-center justify-between border-b border-borde px-3 py-2.5 text-sm font-semibold" style={{ borderTop: `3px solid ${color}`, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
        {titulo}<span className="rounded-full bg-panel px-1.5 text-[11px] tabular-nums text-texto-2">{total}</span>
      </div>
      {children}
    </div>
  );
}

// «Sincronizar GHL»: botón y sincronización automática al abrir (si han pasado más de 10 minutos)
export function SincronizarGhl({ conectado, ultima }: { conectado: boolean; ultima: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const [cargando, iniciar] = useTransition();
  const hecho = useRef(false);
  const lanzar = (auto: boolean) =>
    iniciar(async () => {
      try {
        const r = (await exigirOk(sincronizarGhl(auto ? 10 * 60_000 : undefined))) as { saltada?: boolean; nuevas?: number; actualizadas?: number; canceladas?: number; sinUnir?: number; errores?: string[] };
        if (r.saltada) return;
        if (!auto || r.nuevas || r.actualizadas || r.canceladas) toast(`GHL: ${r.nuevas ?? 0} nuevas · ${r.actualizadas ?? 0} actualizadas${r.canceladas ? ` · ${r.canceladas} canceladas (borradas en GHL)` : ""}${r.sinUnir ? ` · ${r.sinUnir} sin unir` : ""}`);
        if (r.errores?.length) toast(r.errores[0], "error");
        router.refresh();
      } catch (e) {
        if (!auto) toast(e instanceof Error ? e.message : "No se pudo sincronizar.", "error");
      }
    });
  useEffect(() => {
    if (conectado && !hecho.current) {
      hecho.current = true;
      lanzar(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conectado]);
  return (
    <button className="btn-secundario border-oro/40 text-oro" disabled={cargando} onClick={() => lanzar(false)} title={conectado ? (ultima ? `Última: ${ultima}` : "Nunca sincronizado") : "Conecta GHL en Administración → Integraciones"}>
      <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} /> {cargando ? "Sincronizando…" : "Sincronizar GHL"}
    </button>
  );
}

// Una cita de GHL sin unir: unirla a un lead o descartarla
export function FilaSinUnir({ id, titulo, fechaTxt, closer }: { id: string; titulo: string; fechaTxt: string; closer: string }) {
  const { pendiente, error, ejecutar } = useAccion();
  const [q, setQ] = useState("");
  const [res, setRes] = useState<LeadBuscado[]>([]);
  const [, iniciar] = useTransition();
  return (
    <li className="space-y-2 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <b>{titulo || "Cita sin título"}</b>
        <span className="text-xs text-texto-3">{fechaTxt} · {closer}</span>
        <button className="btn-secundario ml-auto px-2 py-1 text-xs hover:text-mal" disabled={pendiente} onClick={() => ejecutar(() => descartarCitaSinLead(id), "Descartada")}><X className="h-3.5 w-3.5" /> Descartar</button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="campo max-w-xs py-1.5 text-sm"
          placeholder="Buscar el lead para unirla…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            const t = e.target.value;
            if (t.trim().length >= 2) iniciar(async () => { try { setRes((await exigirOk(buscarLeadsParaLlamada(t))) as LeadBuscado[]); } catch { setRes([]); } });
          }}
        />
        {res.slice(0, 5).map((l) => (
          <button key={l.id} className="btn-secundario px-2 py-1 text-xs" disabled={pendiente} onClick={() => ejecutar(() => unirCitaSinLead(id, l.id), "Cita unida al lead")}>
            <Link2 className="h-3.5 w-3.5" /> {`${l.nombre} ${l.apellido}`.trim()} <span className="text-texto-3">{l.telefono ?? l.email ?? ""}</span>
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-mal">{error}</p>}
    </li>
  );
}
