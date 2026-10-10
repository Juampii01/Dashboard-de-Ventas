import { redirect } from "next/navigation";
import { getSesion, esJefe } from "@/lib/auth";
import { db, todas, equipo } from "@/lib/datos";
import { Cabecera, Contenido } from "@/components/ui";
import { TableroCrm, type LeadTarjeta } from "./tablero";
import type { Etapa, Pipeline } from "@/lib/tipos";

export default async function CrmPage({ searchParams }: PageProps<"/crm">) {
  const { perfil, proyecto } = await getSesion();
  if (!esJefe(perfil)) redirect("/");
  const sp = await searchParams;

  const { data: pipelinesData } = await db().from("pipelines").select("*").eq("proyecto_id", proyecto.id).order("orden");
  const pipelines = (pipelinesData ?? []) as Pipeline[];
  const pipeline = pipelines.find((p) => p.id === sp.pipeline) ?? pipelines[0] ?? null;

  const [etapasData, leads, gente, conteos] = await Promise.all([
    pipeline ? db().from("etapas").select("*").eq("pipeline_id", pipeline.id).order("orden") : Promise.resolve({ data: [] }),
    pipeline
      ? todas<LeadTarjeta>((a, b) =>
          db()
            .from("leads")
            .select("id, nombre, apellido, email, telefono, etapa_id, caller_id, closer_id, estado_caller, creado_en, etiquetas, respuestas")
            .eq("proyecto_id", proyecto.id)
            .eq("pipeline_id", pipeline.id)
            .order("creado_en", { ascending: false })
            .order("id").range(a, b)
        )
      : Promise.resolve([] as LeadTarjeta[]),
    equipo(proyecto.id),
    Promise.all(
      pipelines.map(async (p) => {
        const { count } = await db().from("leads").select("id", { count: "exact", head: true }).eq("pipeline_id", p.id);
        return [p.id, count ?? 0] as const;
      })
    ),
  ]);

  return (
    <>
      <Cabecera titulo="CRM" subtitulo={`${proyecto.nombre} · pipelines, columnas y leads`} />
      <Contenido>
        <TableroCrm
          pipelines={pipelines}
          pipeline={pipeline}
          etapas={(etapasData.data ?? []) as Etapa[]}
          leads={leads}
          conteos={Object.fromEntries(conteos)}
          callers={gente.filter((g) => g.rol === "caller").map((g) => ({ id: g.id, nombre: g.nombre }))}
          closers={gente.filter((g) => g.rol === "closer").map((g) => ({ id: g.id, nombre: g.nombre }))}
        />
      </Contenido>
    </>
  );
}
