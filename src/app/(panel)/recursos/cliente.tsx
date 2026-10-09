"use client";

import { sinVaciar } from "@/components/sin-vaciar";
import { useActionState, useState } from "react";
import { Plus, Trash2, Copy, Check, Pencil } from "lucide-react";
import { borrarRecurso, crearRecurso, guardarLinkPago } from "./acciones";
import { useAccion } from "@/components/acciones-lead";
import { Modal } from "@/components/modal";

export function NuevoRecurso() {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState("pdf");
  const [estado, accion, enviando] = useActionState(crearRecurso, null as null | { ok?: string; error?: string });
  return (
    <>
      <button className="btn-primario" onClick={() => setAbierto(true)}><Plus className="h-4 w-4" /> Nuevo recurso</button>
      {abierto && (
        <Modal titulo="Nuevo recurso" onCerrar={() => setAbierto(false)} ancho="max-w-lg">
          <form onSubmit={sinVaciar(accion)} className="space-y-3">
            <div><label className="etiqueta-campo">Título</label><input name="titulo" required className="campo" placeholder="Ej: Guion de apertura" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="etiqueta-campo">Tipo</label>
                <select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className="campo">
                  <option value="pdf">PDF</option><option value="enlace">Enlace</option><option value="guion">Guion</option><option value="video">Vídeo</option>
                </select>
              </div>
              <div>
                <label className="etiqueta-campo">Para</label>
                <select name="para_rol" className="campo"><option value="todos">Todo el equipo</option><option value="caller">Solo callers</option><option value="closer">Solo closers</option></select>
              </div>
            </div>
            {tipo === "pdf" && <div><label className="etiqueta-campo">Archivo PDF (máx. 15 MB)</label><input type="file" name="archivo" accept="application/pdf" required className="campo" /></div>}
            {(tipo === "enlace" || tipo === "video") && <div><label className="etiqueta-campo">{tipo === "video" ? "Enlace del vídeo (YouTube, Loom, Drive…)" : "Enlace"}</label><input name="url" type="url" required className="campo" placeholder="https://" /></div>}
            {tipo === "guion" && <div><label className="etiqueta-campo">Guion</label><textarea name="contenido" rows={10} required className="campo font-mono text-xs" /></div>}
            {estado?.error && <p className="rounded-lg bg-mal-suave px-3 py-2 text-sm text-mal">{estado.error}</p>}
            {estado?.ok && <p className="rounded-lg bg-ok-suave px-3 py-2 text-sm text-ok">{estado.ok}</p>}
            <button className="btn-primario w-full" disabled={enviando}>{enviando ? "Guardando…" : "Guardar"}</button>
          </form>
        </Modal>
      )}
    </>
  );
}

export function BorrarRecurso({ id }: { id: string }) {
  const { pendiente, ejecutar } = useAccion();
  return (
    <button className="rounded-md p-1 text-texto-3 hover:bg-mal-suave hover:text-mal" disabled={pendiente} title="Borrar" onClick={() => confirm("¿Borrar este recurso?") && ejecutar(() => borrarRecurso(id))}>
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

export function CopiarLink({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <a href={url} target="_blank" rel="noreferrer" className="truncate text-xs text-primario hover:underline">{url}</a>
      <button
        className="btn-secundario shrink-0 px-2 py-1 text-xs"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 1500);
        }}
      >
        {copiado ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}{copiado ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

export function EditarLink({ productoId, actual }: { productoId: string; actual: string }) {
  const { pendiente, error, ejecutar } = useAccion();
  return (
    <>
      <button
        className="rounded-md p-1 text-texto-3 hover:bg-panel hover:text-texto"
        disabled={pendiente}
        title="Editar link de pago"
        onClick={() => {
          const url = prompt("Link de pago (Stripe u otro). Déjalo vacío para quitarlo.", actual);
          if (url !== null) ejecutar(() => guardarLinkPago(productoId, url));
        }}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      {error && <span className="text-xs text-mal">{error}</span>}
    </>
  );
}

export function VerGuion({ titulo, contenido }: { titulo: string; contenido: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button className="text-sm text-primario hover:underline" onClick={() => setAbierto(true)}>Leer guion →</button>
      {abierto && (
        <Modal titulo={titulo} onCerrar={() => setAbierto(false)} ancho="max-w-2xl">
          <pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-lg bg-panel-2 p-4 font-sans text-sm leading-relaxed">{contenido}</pre>
        </Modal>
      )}
    </>
  );
}
