"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, RotateCcw } from "lucide-react";
import { useToast } from "@/components/toasts";
import { useAccion } from "@/components/acciones-lead";
import { exigirOk } from "@/lib/resultado-cliente";
import { reintentarLlamada, sincronizarLlamadasAhora } from "./acciones";

export function SincronizarLlamadas({ conectado }: { conectado: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const [cargando, iniciar] = useTransition();
  return (
    <button className="btn-secundario border-oro/40 text-oro" disabled={cargando || !conectado} title={conectado ? "Trae de GHL las llamadas contestadas de más de 1 minuto" : "Conecta GHL en Administración → Integraciones"} onClick={() => iniciar(async () => { try { const r = (await exigirOk(sincronizarLlamadasAhora())) as { nuevas: number }; toast(r.nuevas ? `${r.nuevas} llamadas nuevas: se transcriben y analizan en segundo plano` : "No hay llamadas nuevas"); router.refresh(); } catch (e) { toast(e instanceof Error ? e.message : "Falló", "error"); } })}>
      <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} /> {cargando ? "Trayendo…" : "Traer llamadas de GHL"}
    </button>
  );
}

export function Reintentar({ id }: { id: string }) {
  const { pendiente, error, ejecutar } = useAccion();
  return (
    <span className="inline-flex flex-col items-end">
      <button className="btn-secundario px-2 py-1 text-xs" disabled={pendiente} onClick={() => ejecutar(() => reintentarLlamada(id), "En cola otra vez")}><RotateCcw className="h-3.5 w-3.5" /> Reintentar</button>
      {error && <span className="text-xs text-mal">{error}</span>}
    </span>
  );
}
