"use client";

import { useState, useTransition } from "react";
import { Sparkles, Send } from "lucide-react";
import { Modal } from "@/components/modal";
import { exigirOk } from "@/lib/resultado-cliente";
import { coachIa } from "@/app/(panel)/leads/coach";

type Consejo = { idea: string; frases: string[]; pregunta: string };

// Coach de IA (versión sencilla): escribe lo que dice el lead y Claude te dice cómo responder
export function CoachIa({ leadId, className = "btn-secundario justify-start" }: { leadId: string | null; className?: string }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [historial, setHistorial] = useState<{ dijo: string; c: Consejo }[]>([]);
  const [error, setError] = useState("");
  const [cargando, iniciar] = useTransition();
  const preguntar = () =>
    iniciar(async () => {
      setError("");
      try {
        const c = (await exigirOk(coachIa(leadId, texto))) as Consejo;
        setHistorial((h) => [{ dijo: texto, c }, ...h]);
        setTexto("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo preguntar al coach.");
      }
    });
  return (
    <>
      <button type="button" className={className} onClick={() => setAbierto(true)}><Sparkles className="h-4 w-4 text-oro" /> Coach IA</button>
      {abierto && (
        <Modal titulo="Coach de IA" onCerrar={() => setAbierto(false)} ancho="max-w-lg">
          <div className="space-y-3 text-sm">
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!cargando) preguntar(); }}>
              <input value={texto} onChange={(e) => setTexto(e.target.value)} className="campo" placeholder="Ej. «Me parece caro» o «Tengo que hablarlo con mi pareja»" aria-label="Lo que dice el lead" autoFocus />
              <button className="btn-primario" disabled={cargando || texto.trim().length < 3} aria-label="Preguntar"><Send className="h-4 w-4" /></button>
            </form>
            {cargando && <p className="text-texto-3">Pensando…</p>}
            {error && <p className="text-mal">{error}</p>}
            {historial.map((h, i) => (
              <div key={i} className={`space-y-2 rounded-lg border border-borde p-3 ${i ? "opacity-70" : ""}`}>
                <div className="text-xs text-texto-3">El lead: «{h.dijo}»</div>
                <p>{h.c.idea}</p>
                <ul className="space-y-1">{h.c.frases.map((f, j) => <li key={j} className="rounded bg-panel-2 px-2 py-1">💬 {f}</li>)}</ul>
                {h.c.pregunta && <p className="text-primario">❓ {h.c.pregunta}</p>}
              </div>
            ))}
            {!historial.length && !cargando && <p className="text-xs text-texto-3">Escribe lo que acaba de decir el lead y pulsa enviar. Usa el contexto del negocio de «Configurar IA». No se guarda nada.</p>}
          </div>
        </Modal>
      )}
    </>
  );
}
