"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { ModalImportar } from "@/app/(panel)/crm/tablero";
import type { Pipeline } from "@/lib/tipos";

// «Actualizar con CSV» de la Biblioteca: la misma subida de leads del CRM (añade los nuevos y pone al día los que
// ya están, sin duplicar; recalcula su oferta)
export function ActualizarCsv({ pipelines, pipelineId }: { pipelines: Pipeline[]; pipelineId?: string }) {
  const [abierto, setAbierto] = useState(false);
  const router = useRouter();
  return (
    <>
      <button className="btn-secundario" onClick={() => setAbierto(true)}><Upload className="h-4 w-4" /> Actualizar con CSV</button>
      {abierto && <ModalImportar pipelines={pipelines} pipelineId={pipelineId} onCerrar={() => { setAbierto(false); router.refresh(); }} />}
    </>
  );
}
