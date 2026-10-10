import { ETIQUETA_OFERTA, type Oferta } from "@/lib/oferta";

// Bloque A: la oferta del lead (según su formulario de la Biblioteca) como etiqueta
const TONO_OFERTA: Record<Oferta, string> = {
  vip_empresas: "bg-oro-suave text-oro",
  vip: "bg-morado/15 text-morado",
  empresas: "bg-primario-suave text-primario",
  grupal: "bg-ok-suave text-ok",
  membresia: "bg-panel-2 text-texto-2",
};

export function OfertaChip({ oferta, vacio = true }: { oferta: Oferta | string | null | undefined; vacio?: boolean }) {
  if (!oferta || !(oferta in TONO_OFERTA)) return vacio ? <span className="text-texto-3">—</span> : null;
  return <span className={`chip whitespace-nowrap ${TONO_OFERTA[oferta as Oferta]}`} title="Oferta según su formulario de la Biblioteca">{ETIQUETA_OFERTA[oferta as Oferta]}</span>;
}
