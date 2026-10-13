import Link from "next/link";
import { cargarGuion, rolDelGuion } from "@/lib/guiones-datos";
import { Phone, CalendarCheck, MessageCircle, ShoppingCart, PhoneOff, Users, Inbox, Trophy } from "lucide-react";
import { esJefe } from "@/lib/auth";
import { exigirPagina } from "@/lib/permisos";
import { panelObjetivos } from "@/lib/objetivos";
import { PanelObjetivos } from "@/components/barras-objetivos";
import { db, todas, equipo } from "@/lib/datos";
import { rangoDe, fechaHora, ETIQUETA_ESTADO_CALLER, porcentaje, ahoraMs, pct, dinero, hoyEnZona } from "@/lib/formato";
import { nivel } from "@/lib/prioridad";
import type { Pesos } from "@/lib/cualificacion";
import { colaCaller } from "@/lib/cola";
import { Cabecera, Contenido, Kpi, Seccion, Insignia, Vacio, Avatar } from "@/components/ui";
import { AccionesLead } from "@/components/acciones-lead";
import { Refresco } from "@/components/refresco";
import type { Lead, Producto } from "@/lib/tipos";

const PESTANAS = [
  { v: "llamar", t: "Por llamar" },
  { v: "luego", t: "Llamar luego" },
  { v: "agendados", t: "Agendados" },
  { v: "todos", t: "Todos" },
];

export default async function CallerPage({ searchParams }: PageProps<"/caller">) {
  const { perfil, proyecto } = await exigirPagina("cola"); // H5
  const { guion } = await cargarGuion(proyecto.id, rolDelGuion(perfil.rol)); // Fase 6
  const jefe = esJefe(perfil);
  // H5: a un closer con «Mis leads», sus leads como closer (lo suyo), en forma de cola
  const comoCloser = perfil.rol === "closer";
  const sp = await searchParams;
  const gente = await equipo(proyecto.id, !!perfil.es_prueba);
  const callers = gente.filter((g) => g.rol === "caller");
  const caller = jefe ? callers.find((c) => c.id === sp.caller) ?? callers[0] : perfil;
  const pestana = typeof sp.vista === "string" ? sp.vista : "llamar";

  if (!caller) {
    return (
      <>
        <Cabecera titulo="Callers" />
        <Contenido><Vacio icono={Users} texto="No hay callers en este proyecto. Créalos en Administración." /></Contenido>
      </>
    );
  }

  const hoy = rangoDe("hoy", proyecto.zona_horaria);
  const [leads, actsHoy, citasHoy, ventasHoy, productos, scoring] = await Promise.all([
    todas<Lead>((a, b) => db().from("leads").select("*").eq("proyecto_id", proyecto.id).eq(comoCloser ? "closer_id" : "caller_id", caller.id).order("id").range(a, b)),
    db().from("actividades").select("tipo, resultado").eq("perfil_id", caller.id).eq("proyecto_id", proyecto.id).gte("creado_en", hoy.desde!.toISOString()),
    db().from("citas").select("id", { count: "exact", head: true }).eq("agendada_por", caller.id).gte("creado_en", hoy.desde!.toISOString()),
    db().from("ventas").select("id", { count: "exact", head: true }).eq("vendedor_id", caller.id).gte("fecha", hoy.desde!.toISOString()),
    db().from("productos").select("*").eq("proyecto_id", proyecto.id).eq("activo", true).order("orden"),
    db().from("scoring_ia").select("pesos").eq("proyecto_id", proyecto.id).maybeSingle(),
  ]);
  const panel = await panelObjetivos(proyecto, caller); // objetivos del caller que se está viendo, su racha y el del equipo (H3-H4)
  const pesos = (scoring.data?.pesos ?? null) as Pesos | null; // priorización con IA (V2-11)
  const acts = actsHoy.data ?? [];
  const llamadas = acts.filter((a) => a.tipo === "llamada").length;
  const noContesta = acts.filter((a) => a.tipo === "llamada" && a.resultado === "no_contesta").length;
  const whatsapps = acts.filter((a) => a.tipo === "whatsapp").length;

  const ahora = ahoraMs();
  const filtrados = colaCaller(leads, pestana, ahora, pesos);
  const vencidos = leads.filter((l) => (l.estado_caller === "llamar_luego" || l.estado_caller === "link_enviado") && l.llamar_en && new Date(l.llamar_en).getTime() <= ahora);
  const seleccionado = filtrados.find((l) => l.id === sp.lead) ?? filtrados[0] ?? null;
  const base = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    if (jefe) p.set("caller", caller.id);
    p.set("vista", pestana);
    Object.entries(extra).forEach(([k, v]) => p.set(k, v));
    return `/caller?${p.toString()}`;
  };
  const closers = gente.filter((g) => g.rol === "closer").map((g) => ({ id: g.id, nombre: g.nombre }));

  return (
    <>
      <Cabecera
        titulo={jefe ? "Callers" : "Mis leads"}
        subtitulo={jefe ? `Viendo la cola de ${caller.nombre}` : `${leads.length} leads asignados · ordenados por prioridad`}
        acciones={
          <>
            {jefe && (
              <div className="flex flex-wrap gap-1 rounded-xl border border-borde bg-panel p-1">
                {callers.map((c) => (
                  <Link key={c.id} href={`/caller?caller=${c.id}`} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${c.id === caller.id ? "bg-primario text-white" : "text-texto-2 hover:bg-panel-2"}`}>
                    <Avatar nombre={c.nombre} tamano="h-6 w-6 text-[9px]" />{c.nombre.split(" ")[0]}
                  </Link>
                ))}
              </div>
            )}
            <Link href="/ranking" className="btn-secundario"><Trophy className="h-4 w-4 text-oro" /> Ranking del equipo</Link>
          </>
        }
      />
      <Contenido>
        <Refresco segundos={60} />
        <PanelObjetivos panel={panel} dinero={(n: number) => dinero(n, proyecto)} celebrar={jefe ? null : `${caller.id}-${hoyEnZona(proyecto.zona_horaria)}`} />
        {vencidos.length > 0 && (
          <Link href={`/caller?${new URLSearchParams({ ...(jefe ? { caller: caller.id } : {}), vista: "llamar", lead: vencidos[0].id })}`} className="flex items-center gap-3 rounded-xl border border-aviso/40 bg-aviso-suave px-4 py-3 text-sm text-aviso hover:brightness-105">
            <span className="text-lg">⏰</span>
            <span className="flex-1">
              <b>{vencidos.length === 1 ? "Te toca 1 llamada programada" : `Te tocan ${vencidos.length} llamadas programadas`}</b>
              {" "}· la primera: {`${vencidos[0].nombre} ${vencidos[0].apellido}`.trim()} ({fechaHora(vencidos[0].llamar_en!, proyecto)}). Están las primeras en «Por llamar».
            </span>
            <span className="font-medium">Llamar ahora →</span>
          </Link>
        )}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
          <Kpi titulo="Llamadas hoy" valor={llamadas} icono={Phone} detalle={`${leads.length} leads asignados`} />
          <Kpi titulo="No contestan" valor={noContesta} icono={PhoneOff} tono="mal" detalle={`${pct(porcentaje(noContesta, llamadas))} de las llamadas`} />
          <Kpi titulo="Agendas hoy" valor={citasHoy.count ?? 0} icono={CalendarCheck} tono="ok" detalle={`${pct(porcentaje(citasHoy.count ?? 0, llamadas - noContesta))} de los contactos`} />
          <Kpi titulo="WhatsApps hoy" valor={whatsapps} icono={MessageCircle} tono="ok" />
          <Kpi titulo="Ventas low ticket hoy" valor={ventasHoy.count ?? 0} icono={ShoppingCart} tono="oro" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <div className="tarjeta flex max-h-[calc(100vh-280px)] min-h-96 flex-col overflow-hidden">
            <div className="flex gap-1 border-b border-borde p-2">
              {PESTANAS.map((p) => (
                <Link key={p.v} href={`/caller?${new URLSearchParams({ ...(jefe ? { caller: caller.id } : {}), vista: p.v })}`} className={`flex-1 rounded-md px-2 py-1.5 text-center text-xs font-medium ${pestana === p.v ? "bg-primario-suave text-primario" : "text-texto-2 hover:bg-panel-2"}`}>
                  {p.t}
                </Link>
              ))}
            </div>
            <div className="border-b border-borde px-3 py-2 text-xs text-texto-3">{filtrados.length} leads</div>
            <ul className="flex-1 divide-y divide-borde overflow-y-auto">
              {filtrados.length === 0 && <li><Vacio icono={Inbox} texto="Nada por aquí. ¡Buen trabajo!" /></li>}
              {filtrados.slice(0, 300).map((l) => {
                const n = nivel(l.puntos);
                return (
                  <li key={l.id}>
                    <Link href={base({ lead: l.id })} className={`block px-3 py-2.5 hover:bg-panel-2 ${seleccionado?.id === l.id ? "bg-primario-suave/50" : ""}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{`${l.nombre} ${l.apellido}`.trim()}</span>
                        <Insignia tono={n.tono}>{n.texto}</Insignia>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between text-xs text-texto-3">
                        <span>{l.telefono}</span>
                        <span>{l.estado_caller === "llamar_luego" && l.llamar_en ? `⏰ ${fechaHora(l.llamar_en, proyecto)}` : l.estado_caller === "link_enviado" && l.llamar_en ? `🔗 Link enviado · insistir ${fechaHora(l.llamar_en, proyecto)}` : ETIQUETA_ESTADO_CALLER[l.estado_caller]}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {seleccionado ? (
            <div className="space-y-5">
              <Seccion>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold">{`${seleccionado.nombre} ${seleccionado.apellido}`.trim()}</h2>
                    <p className="text-sm text-texto-2">{seleccionado.telefono} · {seleccionado.email}</p>
                    <p className="mt-1 text-xs text-texto-3">Entró el {fechaHora(seleccionado.creado_en, proyecto)} · {seleccionado.etiquetas.join(", ")}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Insignia tono={nivel(seleccionado.puntos).tono}>{nivel(seleccionado.puntos).texto} · {seleccionado.puntos} pts{pesos ? " · IA" : ""}</Insignia>
                    <Link href={`/leads/${seleccionado.id}`} className="text-xs text-primario hover:underline">Ver ficha completa →</Link>
                  </div>
                </div>
                <div className="mt-4">
                  <AccionesLead
                    leadId={seleccionado.id}
                    telefono={seleccionado.telefono}
                    closers={closers}
                    productos={(productos.data ?? []) as Producto[]}
                    rol={perfil.rol}
                    linkAgenda={proyecto.link_agenda}
                    moneda={proyecto.moneda}
                    guion={guion}
                    nombreLead={`${seleccionado.nombre} ${seleccionado.apellido}`.trim()}
                    miNombre={perfil.nombre}
                  />
                </div>
              </Seccion>
              <Seccion titulo="Lo que respondió en el formulario">
                <dl className="grid gap-3 sm:grid-cols-2">
                  {seleccionado.respuestas.map((r) => (
                    <div key={r.pregunta} className="rounded-lg border border-borde bg-panel-2 p-3">
                      <dt className="text-xs text-texto-3">{r.pregunta}</dt>
                      <dd className="mt-1 font-medium">{r.respuesta || <span className="text-texto-3">Sin responder</span>}</dd>
                    </div>
                  ))}
                </dl>
              </Seccion>
            </div>
          ) : (
            <div className="tarjeta"><Vacio icono={Inbox} texto={leads.length ? "Elige un lead de la lista." : "Todavía no tienes leads asignados. Tu director te los asigna desde el CRM."} /></div>
          )}
        </div>
      </Contenido>
    </>
  );
}
