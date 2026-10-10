import { esJefe, puedeAdmin } from "@/lib/auth";
import { exigirPagina } from "@/lib/permisos";
import { db, todas, equipo } from "@/lib/datos";
import { calcularNivel, filasPermisoPipeline } from "@/lib/pipelines";
import { cargarCitasVentas, columnasCloser } from "@/lib/tablero-closers";
import { ABIERTAS } from "@/lib/llamadas";
import { Cabecera, Contenido } from "@/components/ui";
import { FiltroUrl } from "@/components/barra-periodo";
import { Refresco } from "@/components/refresco";
import { TableroCrm, type LeadTarjeta } from "./tablero";
import type { Etapa, Pipeline, Producto } from "@/lib/tipos";

// Un solo CRM para todos (Paso H7) con los pipelines del equipo (Paso 0, como GHL): los de origen (Webinar 1…),
// «Callers» (los leads con caller, por el resultado de su llamada) y «Closers» (Pre-call y Post-call juntos).
// Cada pipeline tiene sus permisos: Editar (también columnas), Ver (mueve sus tarjetas) o Sin acceso.
// Director y CEO ven todo (con filtro por persona); el caller y el closer, «Mi CRM» con lo suyo.
export default async function CrmPage({ searchParams }: PageProps<"/crm">) {
  const { perfil, proyecto } = await exigirPagina("crm"); // H5
  const jefe = esJefe(perfil);
  const sp = await searchParams;
  const gente = await equipo(proyecto.id, !!perfil.es_prueba);
  const persona = jefe ? gente.find((g) => g.id === sp.persona && (g.rol === "caller" || g.rol === "closer")) ?? null : perfil;
  // Los leads de una persona: los que tiene asignados como caller o como closer
  const deLaPersona = <Q extends { or: (f: string) => Q }>(q: Q) => (persona ? q.or(`caller_id.eq.${persona.id},closer_id.eq.${persona.id}`) : q);

  const { data: pipelinesData } = await db().from("pipelines").select("*").eq("proyecto_id", proyecto.id).order("orden");
  const todos = (pipelinesData ?? []) as Pipeline[];
  const filas = await filasPermisoPipeline(todos.map((p) => p.id));
  const niveles = Object.fromEntries(todos.map((p) => [p.id, calcularNivel(perfil, p, filas)]));
  const pipelines = todos.filter((p) => niveles[p.id] !== "sin_acceso");
  const pipeline = pipelines.find((p) => p.id === sp.pipeline) ?? pipelines[0] ?? null;

  // «Closers»: qué citas ve cada uno (como Agendas): el closer las suyas; el caller las que agendó (solo mirar)
  const closersIds = gente.filter((g) => g.rol === "closer").map((g) => g.id);
  const deCloser = !persona ? closersIds : persona.rol === "closer" ? [persona.id] : closersIds;
  const agendadasPor = persona?.rol === "caller" ? persona.id : null;

  const etapasQ = pipeline ? db().from("etapas").select("*").eq("pipeline_id", pipeline.id).order("orden") : Promise.resolve({ data: [] });
  const leadsQ =
    pipeline && pipeline.tipo !== "closers"
      ? todas<LeadTarjeta & { etapa_callers_id: string | null }>((a, b) => {
          let q = db()
            .from("leads")
            .select("id, nombre, apellido, email, telefono, etapa_id, etapa_callers_id, caller_id, closer_id, estado_caller, creado_en, etiquetas, respuestas, oferta")
            .eq("proyecto_id", proyecto.id);
          // «Callers»: solo los leads con caller (Cristian, 10 oct 2026)
          q = pipeline.tipo === "callers" ? q.not("caller_id", "is", null) : q.eq("pipeline_id", pipeline.id);
          return deLaPersona(q).order("creado_en", { ascending: false }).order("id").range(a, b);
        })
      : Promise.resolve([]);
  const [etapasData, leadsCrudos, conteos, { data: productos }] = await Promise.all([
    etapasQ,
    leadsQ,
    Promise.all(
      pipelines.map(async (p) => {
        if (p.tipo === "closers") {
          let q = db().from("citas").select("id", { count: "exact", head: true }).eq("proyecto_id", proyecto.id).in("estado", [...ABIERTAS]).in("closer_id", deCloser.length ? deCloser : ["00000000-0000-0000-0000-000000000000"]);
          if (agendadasPor) q = q.eq("agendada_por", agendadasPor);
          return [p.id, (await q).count ?? 0] as const;
        }
        const base = db().from("leads").select("id", { count: "exact", head: true }).eq("proyecto_id", proyecto.id);
        const { count } = await deLaPersona(p.tipo === "callers" ? base.not("caller_id", "is", null) : base.eq("pipeline_id", p.id));
        return [p.id, count ?? 0] as const;
      })
    ),
    // «Vendido» abre la venta: el caller solo vende lo que vende el caller (low ticket)
    perfil.rol === "caller"
      ? db().from("productos").select("*").eq("proyecto_id", proyecto.id).eq("activo", true).eq("vende_caller", true).order("orden")
      : db().from("productos").select("*").eq("proyecto_id", proyecto.id).eq("activo", true).order("orden"),
  ]);
  const etapas = (etapasData.data ?? []) as Etapa[];
  // En «Callers» la columna de cada lead es la de su llamada
  const leads: LeadTarjeta[] = leadsCrudos.map(({ etapa_callers_id, ...l }) => (pipeline?.tipo === "callers" ? { ...l, etapa_id: etapa_callers_id } : l));

  let closers: ReturnType<typeof columnasCloser> | null = null;
  if (pipeline?.tipo === "closers") {
    const { citas, ventas } = await cargarCitasVentas(proyecto.id, deCloser, agendadasPor);
    const nombrePersona = (id: string | null) => gente.find((g) => g.id === id)?.nombre ?? "—";
    closers = columnasCloser(etapas, citas, ventas, { proyecto, jefe, nombrePersona });
  }

  const nivel = pipeline ? niveles[pipeline.id] : "ver";
  const admin = puedeAdmin(perfil);
  return (
    <>
      <Cabecera
        titulo={jefe ? "CRM" : "Mi CRM"}
        subtitulo={`${proyecto.nombre} · ${jefe ? (persona ? `de ${persona.nombre}` : "todo el equipo") : `${perfil.nombre} · lo tuyo`}`}
        acciones={
          jefe ? (
            <FiltroUrl
              nombre="persona"
              etiqueta="Persona"
              todos="Todo el equipo"
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
          etapas={etapas}
          leads={leads}
          conteos={Object.fromEntries(conteos)}
          callers={gente.filter((g) => g.rol === "caller").map((g) => ({ id: g.id, nombre: g.nombre }))}
          closers={gente.filter((g) => g.rol === "closer").map((g) => ({ id: g.id, nombre: g.nombre }))}
          admin={admin}
          editar={nivel === "editar"}
          jefe={jefe}
          productos={(productos ?? []) as Producto[]}
          moneda={proyecto.moneda}
          estrellasOpcionales={perfil.rol !== "caller"}
          tableroClosers={closers ? { ...closers, soloMirar: perfil.rol === "caller" } : null}
          permisos={
            admin && pipeline
              ? {
                  filas: filas.filter((f) => f.pipeline_id === pipeline.id),
                  gente: gente.filter((g) => g.rol !== "ceo").map((g) => ({ id: g.id, nombre: g.nombre, rol: g.rol })),
                }
              : null
          }
        />
      </Contenido>
    </>
  );
}
