"use client";

import type { ReactNode } from "react";
import { useToast } from "@/components/toasts";

// Cristian (13 oct 2026): al pulsar el teléfono de un lead se copia y sale el aviso; no abre la app Teléfono (tel:).
export function TelefonoCopiable({ telefono, className, children }: { telefono: string; className?: string; children?: ReactNode }) {
  const aviso = useToast();
  async function copiar(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(telefono);
      aviso(`Teléfono copiado: ${telefono}`);
    } catch {
      aviso("No se pudo copiar el teléfono. Cópialo a mano.", "error");
    }
  }
  return (
    <button type="button" onClick={copiar} draggable={false} title="Copiar teléfono" className={`cursor-copy text-left ${className ?? ""}`}>
      {children ?? telefono}
    </button>
  );
}
