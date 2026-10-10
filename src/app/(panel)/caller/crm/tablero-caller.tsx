"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Phone, Search } from "lucide-react";
import { agendarCita, registrarLlamada, registrarVenta, volverANuevo } from "@/app/(panel)/leads/acciones";
import { useAccion, Mensajes, FormVenta } from "@/components/acciones-lead";
import { Modal } from "@/components/modal";
import { SelectorEstrellas } from "@/components/estrellas";
import { exigirOk } from "@/lib/resultado-cliente";
import { nivel } from "@/lib/prioridad";
import type { EstadoCaller, Producto } from "@/lib/tipos";

export type TarjetaCaller = {
  id: string;
  nombre: string;
  telefono: string | null;
  estado: EstadoCaller;
  llamar_en: string | null;
  puntos: number;
  invertir: string | null;
};

const COLUMNAS: { estado: EstadoCaller; titulo: string; color: string; ayuda: string }[] = [
  { estado: "nuevo", titulo: "Nuevo", color: "#64748b", ayuda: "Sin llamar todavía" },
  { estado: "no_contesta", titulo: "No contesta", color: "#94a3b8", ayuda: "Volver a intentar" },
  { estado: "llamar_luego", titulo: "Llamar luego", color: "#d97706", ayuda: "Con fecha y hora" },
  { estado: "agendado", titulo: "Agendado", color: "#2f55d4", ayuda: "Cita con un closer" },
  { estado: "no_interesa", titulo: "No interesa", color: "#dc2626", ayuda: "Descartado" },
  { estado: "vendido", titulo: "Vendido", color: "#16a34a", ayuda: "Low ticket u otra venta" },
];
const POR_COLUMNA = 40;
type Pendiente = { lead: TarjetaCaller; destino: "llamar_luego" | "agendado" | "vendido" | "no_interesa" };

export function TableroCaller({
  leads: iniciales,
  closers,
  productos,
  moneda,
  zona,
}: {
  leads: TarjetaCaller[];
  closers: { id: string; nombre: string }[];
  productos: Producto[];
  moneda: string;
  zona: string;
}) {
  const { pendiente, error, ok, ejecutar } = useAccion();
  const [movidos, setMovidos] = useState<Record<string, EstadoCaller>>({});
  const [sobre, setSobre] = useState<EstadoCaller | null>(null);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [modal, setModal] = useState<Pendiente | null>(null);
  const [q, setQ] = useState("");
  const [verMas, setVerMas] = useState<Record<string, number>>({});

  const leads = useMemo(() => {
    const t = q.trim().toLowerCase();
    return iniciales
      .map((l) => (movidos[l.id] ? { ...l, estado: movidos[l.id] } : l))
      .filter((l) => !t || l.nombre.toLowerCase().includes(t) || (l.telefono ?? "").includes(t))
      .sort((a, b) => b.puntos - a.puntos);
  }, [iniciales, movidos, q]);

  const fmt = new Intl.DateTimeFormat("es-ES", { timeZone: zona, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  // Mueve en pantalla al momento y deshace si el servidor falla
  function mover(lead: TarjetaCaller, destino: EstadoCaller, accion: () => Promise<unknown>, mensaje: string) {
    setMovidos((m) => ({ ...m, [lead.id]: destino }));
    ejecutar(async () => {
      try {
        await exigirOk(accion());
      } catch (e) {
        setMovidos((m) => {
          const c = { ...m };
          delete c[lead.id];
          return c;
        });
        throw e;
      }
    }, mensaje);
  }

  function soltar(destino: EstadoCaller, idArrastrado: string) {
    setSobre(null);
    setArrastrando(null);
    const lead = leads.find((l) => l.id === idArrastrado);
    if (!lead || lead.estado === destino) return;
    if (destino === "llamar_luego" || destino === "agendado" || destino === "vendido" || destino === "no_interesa") {
      if (destino === "vendido" && productos.length === 0) return;
      setModal({ lead, destino });
      return;
    }
    if (destino === "nuevo") mover(lead, destino, () => volverANuevo(lead.id), `${lead.nombre} → Nuevo`);
    else mover(lead, destino, () => registrarLlamada(lead.id, "no_contesta", ""), `${lead.nombre} → No contesta`);
  }

  return (
    <div className="space-y-3">
      <div className="tarjeta flex flex-wrap items-center gap-3 p-2.5">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-texto-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o teléfono…" className="campo pl-9" />
        </div>
        <p className="text-xs text-texto-3">Al soltar en «Llamar luego», «Agendado», «No interesa» o «Vendido» te pedimos los datos que faltan.</p>
      </div>
      <Mensajes error={error} ok={ok} />

      <div className={`flex gap-3 overflow-x-auto pb-3 ${pendiente ? "cursor-progress" : ""}`}>
        {COLUMNAS.map((c) => {
          const enColumna = leads.filter((l) => l.estado === c.estado);
          const limite = verMas[c.estado] ?? POR_COLUMNA;
          return (
            <div
              key={c.estado}
              onDragOver={(e) => {
                e.preventDefault();
                setSobre(c.estado);
              }}
              onDragLeave={() => setSobre((s) => (s === c.estado ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                soltar(c.estado, e.dataTransfer.getData("text/plain") || arrastrando || "");
              }}
              className={`flex w-64 shrink-0 flex-col rounded-xl border bg-panel-2/60 transition-colors ${sobre === c.estado ? "border-primario bg-primario-suave/40" : "border-borde"}`}
            >
              <div className="border-b border-borde px-3 py-2.5" style={{ borderTop: `3px solid ${c.color}`, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                <div className="flex items-center justify-between text-sm font-semibold">{c.titulo}<span className="rounded-full bg-panel px-1.5 text-[11px] tabular-nums text-texto-2">{enColumna.length}</span></div>
                <div className="text-[11px] text-texto-3">{c.ayuda}</div>
              </div>
              <div className="flex max-h-[calc(100vh-300px)] min-h-32 flex-col gap-2 overflow-y-auto p-2">
                {enColumna.slice(0, limite).map((l) => {
                  const n = nivel(l.puntos);
                  return (
                    <Link
                      key={l.id}
                      href={`/leads/${l.id}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", l.id);
                        setArrastrando(l.id);
                      }}
                      className={`block rounded-lg border border-borde bg-panel p-2.5 text-sm shadow-sm transition hover:border-primario/60 ${arrastrando === l.id ? "opacity-40" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium">{l.nombre}</span>
                        <span className={`chip shrink-0 ${n.tono === "ok" ? "bg-ok-suave text-ok" : n.tono === "aviso" ? "bg-aviso-suave text-aviso" : "bg-panel-2 text-texto-3"}`}>{n.texto.replace("Prioridad ", "")}</span>
                      </div>
                      {l.telefono && <div className="mt-1 flex items-center gap-1.5 text-xs text-texto-3"><Phone className="h-3 w-3" />{l.telefono}</div>}
                      {l.estado === "llamar_luego" && l.llamar_en && <div className="mt-1 text-xs text-aviso">⏰ {fmt.format(new Date(l.llamar_en))}</div>}
                      {l.invertir && <div className="mt-1 text-[11px] text-texto-3">💰 {l.invertir}</div>}
                    </Link>
                  );
                })}
                {enColumna.length > limite && (
                  <button onClick={() => setVerMas((v) => ({ ...v, [c.estado]: limite + POR_COLUMNA }))} className="rounded-lg py-2 text-xs text-primario hover:bg-primario-suave">
                    Ver {Math.min(POR_COLUMNA, enColumna.length - limite)} más de {enColumna.length - limite}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal?.destino === "llamar_luego" && (
        <Modal titulo={`Llamar luego a ${modal.lead.nombre}`} onCerrar={() => setModal(null)}>
          <form
            className="space-y-3"
            action={(fd) => {
              const l = modal.lead;
              mover(l, "llamar_luego", () => registrarLlamada(l.id, "llamar_luego", String(fd.get("nota") ?? ""), String(fd.get("cuando") ?? ""), Number(fd.get("estrellas"))), `${l.nombre} → Llamar luego`);
              setModal(null);
            }}
          >
            <label className="block"><span className="etiqueta-campo">¿Cuándo?</span><input type="datetime-local" name="cuando" required className="campo" /></label>
            <label className="block"><span className="etiqueta-campo">Nota</span><textarea name="nota" rows={3} className="campo" /></label>
            <SelectorEstrellas quien="caller" />
            <button className="btn-primario w-full">Guardar</button>
          </form>
        </Modal>
      )}
      {modal?.destino === "agendado" && (
        <Modal titulo={`Agendar a ${modal.lead.nombre}`} onCerrar={() => setModal(null)}>
          <form
            className="space-y-3"
            action={(fd) => {
              const l = modal.lead;
              mover(l, "agendado", () => agendarCita(l.id, String(fd.get("closer")), String(fd.get("fecha")), String(fd.get("nota") ?? ""), Number(fd.get("estrellas"))), `${l.nombre} → Agendado`);
              setModal(null);
            }}
          >
            <div>
              <label className="etiqueta-campo" htmlFor="tablero-caller-closer">Closer</label>
              <select id="tablero-caller-closer" name="closer" required className="campo">{closers.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
            </div>
            <label className="block"><span className="etiqueta-campo">Fecha y hora (hora del proyecto)</span><input type="datetime-local" name="fecha" required className="campo" /></label>
            <label className="block"><span className="etiqueta-campo">Nota para el closer</span><textarea name="nota" rows={3} className="campo" /></label>
            <SelectorEstrellas quien="caller" />
            <button className="btn-primario w-full">Agendar</button>
          </form>
        </Modal>
      )}
      {modal?.destino === "no_interesa" && (
        <Modal titulo={`${modal.lead.nombre}: no le interesa`} onCerrar={() => setModal(null)}>
          <form
            className="space-y-3"
            action={(fd) => {
              const l = modal.lead;
              mover(l, "no_interesa", () => registrarLlamada(l.id, "no_interesa", String(fd.get("nota") ?? ""), undefined, Number(fd.get("estrellas"))), `${l.nombre} → No interesa`);
              setModal(null);
            }}
          >
            <SelectorEstrellas quien="caller" />
            <label className="block"><span className="etiqueta-campo">Nota (opcional)</span><textarea name="nota" rows={2} className="campo" /></label>
            <button className="btn-primario w-full">Guardar</button>
          </form>
        </Modal>
      )}
      {modal?.destino === "vendido" && (
        <Modal titulo={`Venta a ${modal.lead.nombre}`} onCerrar={() => setModal(null)} ancho="max-w-lg">
          <FormVenta
            productos={productos}
            moneda={moneda}
            onEnviar={(fd) => {
              const l = modal.lead;
              mover(l, "vendido", () => registrarVenta(l.id, fd), `${l.nombre} → Vendido`);
              setModal(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
