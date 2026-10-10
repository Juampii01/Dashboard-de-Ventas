import { esJefe, puedeAdmin } from "@/lib/auth";
import { exigirPagina } from "@/lib/permisos";
import { db, todas, equipo } from "@/lib/datos";
import { columnasPrecall } from "@/lib/llamadas";
import { Cabecera, Contenido } from "@/components/ui";
import { FiltroUrl } from "@/components/barra-periodo";
import { Refresco } from "@/components/refresco";
import { TableroCrm, type LeadTarjeta } from "./tablero";
import type { Etapa, Pipeline, Producto } from "@/lib/tipos";

// Un solo CRM para todos (Paso H7, decisiones de Cristian del 10 oct 2026): las mismas columnas del pipeline.
// Director y CEO ven todos los leads (con filtro por persona); el caller y el closer, «Mi CRM» con los suyos.
// Las columnas, los pipelines y Pre-call solo los tocan el CEO y el director con Administración.
export default async function CrmPage({ searchParams }: PageProps<"/crm">) {
  const { perfil, proyecto } = await exigirPagina("crm"); // H5
  const jefe = esJefe(perfil);
  const sp = await searchParams;
  const gente = await equipo(proyecto.id);
  const persona = jefe ? gente.find((g) => g.id === sp.persona && (g.rol === "caller" || g.rol === "closer")) ?? null : perfil;
  // Los leads de una persona: los que tiene asignados como caller o como closer
  const deLaPersona = <Q extends { or: (f: string) => Q }>(q: Q) => (persona ? q.or(`caller_id.eq.${persona.id},closer_id.eq.${persona.id}`) : q);

  const { data: pipelinesData } = await db().from("pipelines").select("*").eq("proyecto_id", proyecto.id).order("orden");
  const pipelines = (pipelinesData ?? []) as Pipeline[];
  const pipeline = pipelines.find((p) => p.id === sp.pipeline) ?? pipelines[0] ?? null;

  const [etapasData, leads, conteos, { data: productos }] = await Promise.all([
    pipeline ? db().from("etapas").select("*").eq("pipeline_id", pipeline.id).order("orden") : Promise.resolve({ data: [] }),
    pipeline
      ? todas<LeadTarjeta>((a, b) =>
          deLaPersona(
            db()
              .from("leads")
              .select("id, nombre, apellido, email, telefono, etapa_id, caller_id, closer_id, estado_caller, creado_en, etiquetas, respuestas")
              .eq("proyecto_id", proyecto.id)
              .eq("pipeline_id", pipeline.id)
          )
            .order("creado_en", { ascending: false })
            .order("id")
            .range(a, b)
        )
      : Promise.resolve([] as LeadTarjeta[]),
    Promise.all(
      pipelines.map(async (p) => {
        const { count } = await deLaPersona(db().from("leads").select("id", { count: "exact", head: true }).eq("pipeline_id", p.id));
        return [p.id, count ?? 0] as const;
      })
    ),
    // «Vendido» abre la venta: el caller solo vende lo que vende el caller (low ticket)
    perfil.rol === "caller"
      ? db().from("productos").select("*").eq("proyecto_id", proyecto.id).eq("activo", true).eq("vende_caller", true).order("orden")
      : db().from("productos").select("*").eq("proyecto_id", proyecto.id).eq("activo", true).order("orden"),
  ]);

  return (
    <>
      <Cabecera
        titulo={jefe ? "CRM" : "Mi CRM"}
        subtitulo={`${proyecto.nombre} · ${jefe ? (persona ? `leads de ${persona.nombre}` : "todos los leads") : `${perfil.nombre} · tus leads`}`}
        acciones={
          jefe ? (
            <FiltroUrl
              nombre="persona"
              etiqueta="Persona"
              todos="Todos los leads"
              opciones={gente.filter((g) => g.rol === "caller" || g.rol === "closer").map((g) => ({ v: g.id, t: `${g.nombre} · ${g.rol}` }))}
            />
          ) : undefined
        }
      />
      <Contenido>
        {!jefe && <Refresco segundos={60} />}
        <TableroCrm
          pipelines={pipelines}
          pipeline={pipeline}
          etapas={(etapasData.data ?? []) as Etapa[]}
          leads={leads}
          conteos={Object.fromEntries(conteos)}
          callers={gente.filter((g) => g.rol === "caller").map((g) => ({ id: g.id, nombre: g.nombre }))}
          closers={gente.filter((g) => g.rol === "closer").map((g) => ({ id: g.id, nombre: g.nombre }))}
          admin={puedeAdmin(perfil)}
          jefe={jefe}
          productos={(productos ?? []) as Producto[]}
          moneda={proyecto.moneda}
          estrellasOpcionales={perfil.rol !== "caller"}
          precall={columnasPrecall(proyecto.precall_columnas)}
        />
      </Contenido>
    </>
  );
}
