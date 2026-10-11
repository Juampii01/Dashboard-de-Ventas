"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useAccion } from "@/components/acciones-lead";
import { borrarPasoCloser, guardarPasoCloser, marcarPasoCloser } from "./acciones";

type Paso = { id: string; nombre: string };

export function ChecklistCliente({ leadId, pasos, hechos }: { leadId: string; pasos: Paso[]; hechos: Record<string, string> }) {
  const { pendiente, error, ejecutar } = useAccion();
  const hechosN = pasos.filter((p) => hechos[p.id]).length;
  return (
    <div className="space-y-1.5">
      <div className="h-1.5 overflow-hidden rounded-full bg-borde"><div className="h-full rounded-full bg-ok transition-all" style={{ width: `${pasos.length ? (hechosN / pasos.length) * 100 : 0}%` }} /></div>
      {pasos.map((p) => (
        <label key={p.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-panel-2">
          <input type="checkbox" className="accent-[var(--primario)]" checked={!!hechos[p.id]} disabled={pendiente} onChange={(e) => ejecutar(() => marcarPasoCloser(leadId, p.id, e.target.checked), e.target.checked ? `${p.nombre}: hecho` : `${p.nombre}: sin hacer`)} />
          <span className={`flex-1 ${hechos[p.id] ? "text-texto-3 line-through" : ""}`}>{p.nombre}</span>
          {hechos[p.id] && <span className="text-xs text-texto-3">{new Date(hechos[p.id]).toLocaleDateString("es-ES")}</span>}
        </label>
      ))}
      {error && <p className="text-xs text-mal">{error}</p>}
    </div>
  );
}

export function EditorPasosCloser({ pasos }: { pasos: Paso[] }) {
  const [nuevo, setNuevo] = useState("");
  const { pendiente, error, ejecutar } = useAccion();
  return (
    <div className="space-y-2">
      {pasos.map((p) => <FilaPaso key={p.id} paso={p} />)}
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); ejecutar(async () => { const r = await guardarPasoCloser(null, nuevo); if (!(r && typeof r === "object" && "error" in r)) setNuevo(""); return r; }, "Punto añadido"); }}>
        <input className="campo flex-1" value={nuevo} onChange={(e) => setNuevo(e.target.value)} placeholder="Nuevo punto (ej. Grupo de WhatsApp creado)" aria-label="Nuevo punto del onboarding" />
        <button className="btn-secundario" disabled={pendiente || !nuevo.trim()}><Plus className="h-4 w-4" /> Añadir</button>
      </form>
      {error && <p className="text-xs text-mal">{error}</p>}
    </div>
  );
}

function FilaPaso({ paso }: { paso: Paso }) {
  const [nombre, setNombre] = useState(paso.nombre);
  const { pendiente, error, ejecutar } = useAccion();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input className="campo flex-1 py-1.5" value={nombre} onChange={(e) => setNombre(e.target.value)} aria-label={`Nombre del punto ${paso.nombre}`} />
      <button type="button" className="btn-secundario px-2 py-1 text-xs" disabled={pendiente || nombre.trim() === paso.nombre} onClick={() => ejecutar(() => guardarPasoCloser(paso.id, nombre), "Punto guardado")}>Guardar</button>
      <button type="button" className="rounded p-1.5 text-texto-3 hover:text-mal" disabled={pendiente} onClick={() => confirm(`¿Quitar «${paso.nombre}»? Se quita de la checklist de todos los clientes.`) && ejecutar(() => borrarPasoCloser(paso.id), "Punto quitado")} aria-label={`Quitar el punto ${paso.nombre}`}><Trash2 className="h-4 w-4" /></button>
      {error && <span className="w-full text-xs text-mal">{error}</span>}
    </div>
  );
}

export function FiltroCloser({ closers, valor }: { closers: Paso[]; valor: string }) {
  const router = useRouter();
  return (
    <select className="campo w-auto" value={valor} aria-label="Closer" onChange={(e) => router.push(e.target.value ? `/onboarding-closers?closer=${e.target.value}` : "/onboarding-closers")}>
      <option value="">Todos los closers</option>
      {closers.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
    </select>
  );
}
