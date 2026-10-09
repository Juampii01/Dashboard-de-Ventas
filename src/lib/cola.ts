import { puntosLead } from "@/lib/prioridad";
import type { Pesos } from "@/lib/cualificacion";
import type { Lead } from "@/lib/tipos";

export type PestanaCola = "llamar" | "luego" | "agendados" | "todos";

// Cola del caller: qué leads salen en cada pestaña y en qué orden.
// «Por llamar»: nuevos, no contesta y «llamar luego» cuya hora ya llegó.
export function colaCaller<T extends Pick<Lead, "estado_caller" | "llamar_en" | "respuestas" | "creado_en">>(leads: T[], pestana: string, ahora: number, pesos: Pesos | null = null) {
  return leads
    .map((l) => ({ ...l, puntos: puntosLead(l.respuestas, pesos) }))
    .filter((l) => {
      if (pestana === "llamar")
        return l.estado_caller === "nuevo" || l.estado_caller === "no_contesta" || (l.estado_caller === "llamar_luego" && !!l.llamar_en && new Date(l.llamar_en).getTime() <= ahora);
      if (pestana === "luego") return l.estado_caller === "llamar_luego";
      if (pestana === "agendados") return l.estado_caller === "agendado" || l.estado_caller === "vendido";
      return true;
    })
    .sort((a, b) => {
      if (pestana === "luego") return (a.llamar_en ?? "").localeCompare(b.llamar_en ?? "");
      const venceA = a.estado_caller === "llamar_luego" ? 1 : 0;
      const venceB = b.estado_caller === "llamar_luego" ? 1 : 0;
      if (venceA !== venceB) return venceB - venceA;
      const nuevoA = a.estado_caller === "nuevo" ? 1 : 0;
      const nuevoB = b.estado_caller === "nuevo" ? 1 : 0;
      if (nuevoA !== nuevoB) return nuevoB - nuevoA;
      return b.puntos - a.puntos || b.creado_en.localeCompare(a.creado_en);
    });
}
