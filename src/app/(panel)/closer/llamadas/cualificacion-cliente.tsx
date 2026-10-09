"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useToast } from "@/components/toasts";
import { exigirOk } from "@/lib/resultado-cliente";
import { calcularScoringIa } from "../analisis/acciones";

export function CalcularScoring({ hay }: { hay: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const [cargando, iniciar] = useTransition();
  return (
    <button
      className="btn-primario"
      disabled={cargando}
      onClick={() =>
        iniciar(async () => {
          try {
            const r = (await exigirOk(calcularScoringIa())) as { respuestas: number };
            toast(`Scoring listo: ${r.respuestas} respuestas con puntos`);
            router.refresh();
          } catch (e) {
            toast(e instanceof Error ? e.message : "Falló", "error");
          }
        })
      }
    >
      <Sparkles className="h-4 w-4" /> {cargando ? "La IA está calculando…" : hay ? "Recalcular scoring con IA" : "Calcular scoring con IA"}
    </button>
  );
}
