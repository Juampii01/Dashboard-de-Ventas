import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, List } from "lucide-react";
import { getSesion, esJefe } from "@/lib/auth";
import { db, todas, equipo } from "@/lib/datos";
import { puntosLead } from "@/lib/prioridad";
import type { Pesos } from "@/lib/cualificacion";
import { Cabecera, Contenido, Vacio, Avatar } from "@/components/ui";
import { TableroCaller, type TarjetaCaller } from "./tablero-caller";
import { Refresco } from "@/components/refresco";
import type { Lead, Producto } from "@/lib/tipos";

export default async function CrmCallerPage({ searchParams }: PageProps<"/caller/crm">) {
  const { perfil, proyecto } = await getSesion();
  const jefe = esJefe(perfil);
  if (!jefe && perfil.rol !== "caller") redirect("/");
  const sp = await searchParams;
  const gente = await equipo(proyecto.id);
  const callers = gente.filter((g) => g.rol === "caller");
  const caller = jefe ? callers.find((c) => c.id === sp.caller) ?? callers[0] : perfil;

  if (!caller) {
    return (
      <>
        <Cabecera titulo="CRM de callers" />
        <Contenido><Vacio icono={Users} texto="No hay callers en este proyecto." /></Contenido>
      </>
    );
  }

  const [leads, { data: productos }, { data: scoring }] = await Promise.all([
    todas<Lead>((a, b) => db().from("leads").select("*").eq("proyecto_id", proyecto.id).eq("caller_id", caller.id).order("creado_en", { ascending: false }).order("id").range(a, b)),
    db().from("productos").select("*").eq("proyecto_id", proyecto.id).eq("activo", true).eq("vende_caller", true).order("orden"),
    db().from("scoring_ia").select("pesos").eq("proyecto_id", proyecto.id).maybeSingle(),
  ]);
  const pesos = (scoring?.pesos ?? null) as Pesos | null; // priorización con IA (V2-11)
  const tarjetas: TarjetaCaller[] = leads.map((l) => ({
    id: l.id,
    nombre: `${l.nombre} ${l.apellido}`.trim() || "Sin nombre",
    telefono: l.telefono,
    estado: l.estado_caller,
    llamar_en: l.llamar_en,
    puntos: puntosLead(l.respuestas, pesos),
    invertir: l.respuestas.find((r) => r.pregunta.toLowerCase().includes("invertir"))?.respuesta ?? null,
  }));

  return (
    <>
      <Cabecera
        titulo={jefe ? "CRM de callers" : "Mi CRM"}
        subtitulo={`${jefe ? caller.nombre + " · " : ""}${leads.length} leads · arrastra cada lead a la columna de su resultado`}
        acciones={
          <>
            {jefe && (
              <div className="flex flex-wrap gap-1 rounded-xl border border-borde bg-panel p-1">
                {callers.map((c) => (
                  <Link key={c.id} href={`/caller/crm?caller=${c.id}`} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${c.id === caller.id ? "bg-primario text-white" : "text-texto-2 hover:bg-panel-2"}`}>
                    <Avatar nombre={c.nombre} tamano="h-6 w-6 text-[9px]" />{c.nombre.split(" ")[0]}
                  </Link>
                ))}
              </div>
            )}
            <Link href={jefe ? `/caller?caller=${caller.id}` : "/caller"} className="btn-secundario"><List className="h-4 w-4" /> Ver como cola</Link>
          </>
        }
      />
      <Contenido>
        <Refresco segundos={60} />
        <TableroCaller
          leads={tarjetas}
          closers={gente.filter((g) => g.rol === "closer").map((g) => ({ id: g.id, nombre: g.nombre }))}
          productos={(productos ?? []) as Producto[]}
          moneda={proyecto.moneda}
          zona={proyecto.zona_horaria}
        />
      </Contenido>
    </>
  );
}
