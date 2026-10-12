"use client";

import { useState, type ReactNode } from "react";

// Fase 2 (Cristian, 12 oct 2026): «Individual ↔ Comparativa» era un enlace que volvía a pedir toda la página al
// servidor (~1 s sin ninguna señal). Ahora las dos vistas llegan ya calculadas y el botón solo cambia cuál se ve:
// es instantáneo. La dirección se actualiza para que al recargar siga en la misma vista.
export function VistaAgendas({ inicial, filtroIndividual, resto, individual, comparativa }: { inicial: "individual" | "comparativa"; filtroIndividual: ReactNode; resto: ReactNode; individual: ReactNode; comparativa: ReactNode }) {
  const [vista, setVista] = useState(inicial);
  const cambiar = (v: "individual" | "comparativa") => {
    setVista(v);
    const u = new URL(window.location.href);
    if (v === "comparativa") u.searchParams.set("vista", "comparativa");
    else u.searchParams.delete("vista");
    window.history.replaceState(window.history.state, "", u);
  };
  const boton = (v: "individual" | "comparativa", texto: string) => (
    <button type="button" onClick={() => cambiar(v)} aria-pressed={vista === v} className={`rounded-md px-3 py-1.5 text-sm ${vista === v ? "bg-primario text-white" : "text-texto-2"}`}>
      {texto}
    </button>
  );
  return (
    <>
      <div className="tarjeta flex flex-wrap items-center gap-2 p-2.5">
        <div className="flex rounded-lg border border-borde bg-panel-2 p-0.5">
          {boton("individual", "Individual")}
          {boton("comparativa", "Comparativa")}
        </div>
        {vista === "individual" && filtroIndividual}
        {resto}
      </div>
      {vista === "comparativa" ? comparativa : individual}
    </>
  );
}
