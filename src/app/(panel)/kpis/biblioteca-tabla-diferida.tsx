"use client";

import { useEffect, useState } from "react";
import { exigirOk } from "@/lib/resultado-cliente";
import { cargarTablaBiblioteca } from "./acciones";
import { TablaBiblioteca, type FilaTabla } from "./biblioteca-tabla";

// Fase 2 (Cristian, 12 oct 2026): la página de la Biblioteca sale con los resúmenes y esta tabla trae sus filas
// justo después (antes iban dentro de la página y la hacían pesar ~770 KB).
export function TablaBibliotecaDiferida({ total }: { total: number }) {
  const [datos, setDatos] = useState<{ filas: FilaTabla[]; callers: { id: string; nombre: string }[] } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let vivo = true;
    exigirOk(cargarTablaBiblioteca())
      .then((d) => vivo && setDatos(d))
      .catch((e) => vivo && setError(e instanceof Error ? e.message : "No se pudieron cargar los leads."));
    return () => {
      vivo = false;
    };
  }, []);
  if (error) return <p className="text-sm text-mal">{error}</p>;
  if (!datos)
    return (
      <div className="animate-pulse space-y-2" aria-busy="true">
        <p className="text-sm text-texto-3">Cargando los {total.toLocaleString("es-ES")} leads…</p>
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-9 rounded-lg bg-panel-2" />)}
      </div>
    );
  return <TablaBiblioteca filas={datos.filas} callers={datos.callers} />;
}
