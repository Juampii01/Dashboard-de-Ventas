import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, Tag, FileText, History, CalendarDays, ShoppingCart } from "lucide-react";
import { getSesion, esJefe } from "@/lib/auth";
import { db, equipo } from "@/lib/datos";
import { dinero, fechaHora, ETIQUETA_ESTADO_CALLER, ETIQUETA_ESTADO_CITA } from "@/lib/formato";
import { Cabecera, Contenido, Seccion, Insignia, Vacio } from "@/components/ui";
import { AccionesLead } from "@/components/acciones-lead";
import { SelectoresLead } from "./selectores";
import type { Actividad, Cita, Etapa, Lead, Pipeline, Producto, Venta } from "@/lib/tipos";

const ICONO_ACT: Record<string, string> = {
  llamada: "📞",
  whatsapp: "💬",
  nota: "📝",
  cambio_etapa: "➡️",
  asignacion: "👤",
  cita: "📅",
  venta: "💰",
  importacion: "📥",
  webhook: "⚡",
};
const RESULTADO: Record<string, string> = {
  no_contesta: "No contesta",
  llamar_luego: "Llamar luego",
  no_interesa: "No interesa",
  contestado: "Contestó",
  agendada: "Agendada",
  completo: "Pago completo",
  reserva: "Reserva",
  cuotas: "Cuotas",
};

export default async function LeadPage({ params }: PageProps<"/leads/[id]">) {
  const { id } = await params;
  const { perfil, proyecto } = await getSesion();
  const { data: lead } = await db().from("leads").select("*").eq("id", id).eq("proyecto_id", proyecto.id).maybeSingle<Lead>();
  if (!lead) notFound();
  const jefe = esJefe(perfil);
  if (!jefe && lead.caller_id !== perfil.id && lead.closer_id !== perfil.id) notFound();

  const [acts, citas, ventas, gente, productos, pipelines, etapas] = await Promise.all([
    db().from("actividades").select("*").eq("lead_id", id).order("creado_en", { ascending: false }).limit(100),
    db().from("citas").select("*").eq("lead_id", id).order("fecha", { ascending: false }),
    db().from("ventas").select("*, productos(nombre)").eq("lead_id", id).order("fecha", { ascending: false }),
    equipo(proyecto.id),
    db().from("productos").select("*").eq("proyecto_id", proyecto.id).eq("activo", true).order("orden"),
    db().from("pipelines").select("*").eq("proyecto_id", proyecto.id).order("orden"),
    db().from("etapas").select("*, pipelines!inner(proyecto_id)").eq("pipelines.proyecto_id", proyecto.id).order("orden"),
  ]);
  const nombre = (pid: string | null) => gente.find((g) => g.id === pid)?.nombre ?? "—";
  const pipeline = (pipelines.data as Pipeline[]).find((p) => p.id === lead.pipeline_id);
  const etapa = (etapas.data as Etapa[]).find((e) => e.id === lead.etapa_id);
  const nombreCompleto = `${lead.nombre} ${lead.apellido}`.trim() || "Sin nombre";

  return (
    <>
      <Cabecera
        titulo={nombreCompleto}
        subtitulo={
          <span className="flex flex-wrap items-center gap-2">
            <Link href={jefe ? `/crm${pipeline ? `?pipeline=${pipeline.id}` : ""}` : perfil.rol === "closer" ? "/closer" : "/caller"} className="inline-flex items-center gap-1 text-primario hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" /> Volver
            </Link>
            {pipeline && <>· {pipeline.nombre}</>}
            {etapa && <Insignia tono="primario">{etapa.nombre}</Insignia>}
            <Insignia>{ETIQUETA_ESTADO_CALLER[lead.estado_caller]}</Insignia>
            <span className="text-texto-3">· entró el {fechaHora(lead.creado_en, proyecto)} · origen {lead.origen.toUpperCase()}</span>
          </span>
        }
      />
      <Contenido>
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            <Seccion titulo="Respuestas del formulario">
              {lead.respuestas.length === 0 ? (
                <Vacio icono={FileText} texto="Este lead no tiene respuestas de formulario." />
              ) : (
                <dl className="grid gap-3 sm:grid-cols-2">
                  {lead.respuestas.map((r) => (
                    <div key={r.pregunta} className="rounded-lg border border-borde bg-panel-2 p-3">
                      <dt className="text-xs text-texto-3">{r.pregunta}</dt>
                      <dd className="mt-1 font-medium">{r.respuesta || <span className="text-texto-3">Sin responder</span>}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </Seccion>

            <Seccion titulo="Historial">
              {(acts.data as Actividad[]).length === 0 ? (
                <Vacio icono={History} texto="Sin actividad todavía." />
              ) : (
                <ol className="relative space-y-4 border-l border-borde pl-5">
                  {(acts.data as Actividad[]).map((a) => (
                    <li key={a.id} className="relative">
                      <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-panel text-[11px] ring-1 ring-borde">{ICONO_ACT[a.tipo] ?? "•"}</span>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <b>{a.perfil_id ? nombre(a.perfil_id) : "Sistema"}</b>
                        <span className="text-texto-2">{a.tipo.replace("_", " ")}</span>
                        {a.resultado && <Insignia tono="primario">{RESULTADO[a.resultado] ?? a.resultado}</Insignia>}
                        <span className="ml-auto text-xs text-texto-3">{fechaHora(a.creado_en, proyecto)}</span>
                      </div>
                      {a.nota && <p className="mt-0.5 text-sm text-texto-2">{a.nota}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </Seccion>
          </div>

          <div className="space-y-5">
            <Seccion titulo="Datos">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-texto-3" />{lead.telefono ?? "—"}</li>
                <li className="flex items-center gap-2 break-all"><Mail className="h-4 w-4 shrink-0 text-texto-3" />{lead.email ?? "—"}</li>
                <li className="flex flex-wrap items-center gap-1.5"><Tag className="h-4 w-4 text-texto-3" />{lead.etiquetas.length ? lead.etiquetas.map((t) => <Insignia key={t}>{t}</Insignia>) : "—"}</li>
                {lead.llamar_en && <li className="text-aviso">Llamar el {fechaHora(lead.llamar_en, proyecto)}</li>}
              </ul>
              <div className="mt-4 border-t border-borde pt-4">
                <SelectoresLead
                  leadId={lead.id}
                  jefe={jefe}
                  etapaId={lead.etapa_id}
                  callerId={lead.caller_id}
                  closerId={lead.closer_id}
                  pipelines={(pipelines.data as Pipeline[]).map((p) => ({ ...p, etapas: (etapas.data as Etapa[]).filter((e) => e.pipeline_id === p.id) }))}
                  callers={gente.filter((g) => g.rol === "caller").map((g) => ({ id: g.id, nombre: g.nombre }))}
                  closers={gente.filter((g) => g.rol === "closer").map((g) => ({ id: g.id, nombre: g.nombre }))}
                />
              </div>
            </Seccion>

            <Seccion titulo="Acciones">
              <AccionesLead
                leadId={lead.id}
                telefono={lead.telefono}
                closers={gente.filter((g) => g.rol === "closer").map((g) => ({ id: g.id, nombre: g.nombre }))}
                productos={(productos.data ?? []) as Producto[]}
                rol={perfil.rol}
                vendedores={jefe ? gente.filter((g) => g.rol === "closer" || g.rol === "caller").map((g) => ({ id: g.id, nombre: g.nombre })) : undefined}
                moneda={proyecto.moneda}
                compacto
              />
            </Seccion>

            <Seccion titulo="Citas">
              {(citas.data as Cita[]).length === 0 ? (
                <Vacio icono={CalendarDays} texto="Sin citas." />
              ) : (
                <ul className="space-y-2 text-sm">
                  {(citas.data as Cita[]).map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-borde bg-panel-2 px-3 py-2">
                      <div>
                        <div className="font-medium">{fechaHora(c.fecha, proyecto)}</div>
                        <div className="text-xs text-texto-3">con {nombre(c.closer_id)}</div>
                      </div>
                      <Insignia tono={c.estado === "cerrada" ? "ok" : c.estado === "no_show" || c.estado === "perdida" ? "mal" : "primario"}>{ETIQUETA_ESTADO_CITA[c.estado]}</Insignia>
                    </li>
                  ))}
                </ul>
              )}
            </Seccion>

            <Seccion titulo="Ventas">
              {(ventas.data ?? []).length === 0 ? (
                <Vacio icono={ShoppingCart} texto="Sin ventas." />
              ) : (
                <ul className="space-y-2 text-sm">
                  {(ventas.data as (Venta & { productos: { nombre: string } | null })[]).map((v) => (
                    <li key={v.id} className="rounded-lg border border-borde bg-panel-2 px-3 py-2">
                      <div className="flex justify-between font-medium"><span>{v.productos?.nombre ?? "Producto"}</span><span className="text-oro">{dinero(Number(v.facturacion), proyecto)}</span></div>
                      <div className="text-xs text-texto-3">Cobrado {dinero(Number(v.cash_collected), proyecto)} · {RESULTADO[v.tipo_pago]} · {nombre(v.vendedor_id)} · {fechaHora(v.fecha, proyecto)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </Seccion>
          </div>
        </div>
      </Contenido>
    </>
  );
}
