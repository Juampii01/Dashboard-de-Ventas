"use client";

import { Portal } from "@/components/portal";

// Fase 2 (Cristian, 12 oct 2026): mientras un filtro o el periodo traen datos nuevos del servidor, una barra fina
// arriba del todo (antes solo se atenuaba el filtro y parecía que la app se había colgado).
export function BarraCarga({ activa }: { activa: boolean }) {
  if (!activa) return null;
  return (
    <Portal>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden" role="progressbar" aria-label="Cargando">
        <div className="barra-carga h-full w-2/5 rounded-full bg-primario" />
      </div>
    </Portal>
  );
}
