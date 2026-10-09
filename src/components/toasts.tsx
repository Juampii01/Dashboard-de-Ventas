"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

// Avisos flotantes abajo a la derecha. Se quedan 5 s (los errores 8 s) y se pueden cerrar.
type Toast = { id: number; texto: string; tipo: "ok" | "error" };
const Contexto = createContext<(texto: string, tipo?: Toast["tipo"]) => void>(() => {});

export function useToast() {
  return useContext(Contexto);
}

export function ProveedorToasts({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const quitar = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const mostrar = useCallback(
    (texto: string, tipo: Toast["tipo"] = "ok") => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t.slice(-3), { id, texto, tipo }]);
      setTimeout(() => quitar(id), tipo === "error" ? 8000 : 5000);
    },
    [quitar]
  );
  return (
    <Contexto value={mostrar}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tipo === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm shadow-panel ${
              t.tipo === "ok" ? "border-ok/30 bg-panel text-texto" : "border-mal/40 bg-mal-suave text-mal"
            }`}
          >
            {t.tipo === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
            <span className="flex-1">{t.texto}</span>
            <button onClick={() => quitar(t.id)} className="rounded p-0.5 text-texto-3 hover:text-texto" aria-label="Cerrar aviso">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </Contexto>
  );
}
