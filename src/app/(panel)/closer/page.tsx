import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, CheckCircle2, UserX, Percent, DollarSign, Wallet, Inbox, Trophy } from "lucide-react";
import { getSesion, esJefe } from "@/lib/auth";
import { db, todas, equipo } from "@/lib/datos";
import { dinero, fechaHora, rangoDe, porcentaje, ahoraMs, ETIQUETA_ESTADO_CITA } from "@/lib/formato";
import { Cabecera, Contenido, Kpi, Insignia, Vacio, Avatar } from "@/components/ui";
import { AccionesCita } from "./acciones-cita";
import type { Cita, Lead, Producto } from "@/lib/tipos";

const PESTANAS = [
  { v: "pre", t: "Pre-call", d: "Próximas: confírmalas antes de la llamada" },
  { v: "post", t: "Post-call", d: "Ya pasaron: registra el resultado" },
  { v: "seguimiento", t: "Seguimiento", d: "Leads pendientes de decidir" },
  { v: "historial", t: "Historial", d: "Todas las citas cerradas" },
];
const ABIERTAS = ["pendiente", "confirmada"];

type CitaConLead = Cita & { leads: Pick<Lead, "id" | "nombre" | "apellido" | "telefono" | "email" | "respuestas"> };

export default async function CloserPage({ searchParams }: PageProps<"/closer">) {
  const { perfil, proyecto } = await getSesion();
  const jefe = esJefe(perfil);
  if (!jefe && perfil.rol !== "closer") redirect("/");
  const sp = await searchParams;
  const gente = await equipo(proyecto.id);
  const closers = gente.filter((g) => g.rol === "closer");
  const filtro = jefe ? (typeof sp.closer === "string" ? sp.closer : "") : perfil.id;
  const pestana = typeof sp.vista === "string" ? sp.vista : "pre";

  const [citas, productos] = await Promise.all([
    todas<CitaConLead>((a, b) => {
      let q = db().from("citas").select("*, leads(id, nombre, apellido, telefono, email, respuestas)").eq("proyecto_id", proyecto.id);
      if (filtro) q = q.eq("closer_id", filtro);
      return q.order("fecha").range(a, b);
    }),
    db().from("productos").select("*").eq("proyecto_id", proyecto.id).eq("activo", true).order("orden"),
  ]);
  const mes = rangoDe("mes", proyecto.zona_horaria);
  const hoy = rangoDe("hoy", proyecto.zona_horaria);
  let qv = db().from("ventas").select("facturacion, cash_collected").eq("proyecto_id", proyecto.id).gte("fecha", mes.desde!.toISOString()).lt("fecha", mes.hasta!.toISOString());
  if (filtro) qv = qv.eq("vendedor_id", filtro);
  const { data: ventasMes } = await qv;

  const ahora = ahoraMs();
  const citasMes = citas.filter((c) => new Date(c.fecha) >= mes.desde! && new Date(c.fecha) < mes.hasta! && new Date(c.fecha).getTime() < ahora);
  const asistidas = citasMes.filter((c) => ["cerrada", "seguimiento", "perdida"].includes(c.estado)).length;
  const noShow = citasMes.filter((c) => c.estado === "no_show").length;
  const cerradas = citasMes.filter((c) => c.estado === "cerrada").length;
  const facturacion = (ventasMes ?? []).reduce((s, v) => s + Number(v.facturacion), 0);
  const cash = (ventasMes ?? []).reduce((s, v) => s + Number(v.cash_collected), 0);
  const deHoy = citas.filter((c) => new Date(c.fecha) >= hoy.desde! && new Date(c.fecha) < hoy.hasta! && c.estado !== "reagendada").length;

  const lista = citas
    .filter((c) => {
      const pasada = new Date(c.fecha).getTime() < ahora;
      if (pestana === "pre") return ABIERTAS.includes(c.estado) && !pasada;
      if (pestana === "post") return ABIERTAS.includes(c.estado) && pasada;
      if (pestana === "seguimiento") return c.estado === "seguimiento";
      return !ABIERTAS.includes(c.estado);
    })
    .sort((a, b) => (pestana === "historial" ? b.fecha.localeCompare(a.fecha) : a.fecha.localeCompare(b.fecha)));
  const conteo = (v: string) =>
    citas.filter((c) => {
      const pasada = new Date(c.fecha).getTime() < ahora;
      if (v === "pre") return ABIERTAS.includes(c.estado) && !pasada;
      if (v === "post") return ABIERTAS.includes(c.estado) && pasada;
      if (v === "seguimiento") return c.estado === "seguimiento";
      return !ABIERTAS.includes(c.estado);
    }).length;
  const nombre = (id: string | null) => gente.find((g) => g.id === id)?.nombre ?? "—";

  return (
    <>
      <Cabecera
        titulo={jefe ? "Agendas" : "Mis agendas"}
        subtitulo={`${proyecto.nombre} · ${filtro ? nombre(filtro) : "todos los closers"}`}
        acciones={
          <>
            {jefe && (
              <div className="flex flex-wrap gap-1 rounded-xl border border-borde bg-panel p-1">
                <Link href={`/closer?vista=${pestana}`} className={`rounded-lg px-2.5 py-1.5 text-sm ${!filtro ? "bg-primario text-white" : "text-texto-2 hover:bg-panel-2"}`}>Todos</Link>
                {closers.map((c) => (
                  <Link key={c.id} href={`/closer?closer=${c.id}&vista=${pestana}`} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${filtro === c.id ? "bg-primario text-white" : "text-texto-2 hover:bg-panel-2"}`}>
                    <Avatar nombre={c.nombre} tamano="h-6 w-6 text-[9px]" />{c.nombre.split(" ")[0]}
                  </Link>
                ))}
              </div>
            )}
            <Link href="/ranking" className="btn-secundario"><Trophy className="h-4 w-4 text-oro" /> Ranking</Link>
          </>
        }
      />
      <Contenido>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-6">
          <Kpi titulo="Citas hoy" valor={deHoy} icono={CalendarDays} />
          <Kpi titulo="Asistieron (mes)" valor={asistidas} icono={CheckCircle2} tono="ok" detalle={`${porcentaje(asistidas, asistidas + noShow)}% de asistencia`} />
          <Kpi titulo="No show (mes)" valor={noShow} icono={UserX} tono="mal" />
          <Kpi titulo="% cierre (mes)" valor={`${porcentaje(cerradas, asistidas)}%`} icono={Percent} tono="morado" detalle={`${cerradas} cerradas de ${asistidas}`} />
          <Kpi titulo="Facturación (mes)" valor={dinero(facturacion, proyecto)} icono={DollarSign} tono="oro" destacado />
          <Kpi titulo="Cash collected (mes)" valor={dinero(cash, proyecto)} icono={Wallet} tono="ok" />
        </div>

        <div className="tarjeta overflow-hidden">
          <div className="flex flex-wrap gap-1 border-b border-borde p-2">
            {PESTANAS.map((p, i) => (
              <Link key={p.v} href={`/closer?${new URLSearchParams({ ...(jefe && filtro ? { closer: filtro } : {}), vista: p.v })}`} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${pestana === p.v ? "bg-primario-suave font-medium text-primario" : "text-texto-2 hover:bg-panel-2"}`}>
                <span className="font-mono text-[10px] text-oro">0{i + 1}</span>
                {p.t}
                <span className="rounded-full bg-panel-2 px-1.5 text-[11px] tabular-nums">{conteo(p.v)}</span>
              </Link>
            ))}
          </div>
          <p className="border-b border-borde px-4 py-2 text-xs text-texto-3">{PESTANAS.find((p) => p.v === pestana)?.d}</p>
          {lista.length === 0 ? (
            <Vacio icono={Inbox} texto="No hay citas en esta pestaña." />
          ) : (
            <ul className="divide-y divide-borde">
              {lista.map((c) => {
                const invertir = c.leads?.respuestas?.find((r) => r.pregunta.toLowerCase().includes("invertir"))?.respuesta;
                return (
                  <li key={c.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                    <div className="w-36 shrink-0">
                      <div className="text-sm font-semibold">{fechaHora(c.fecha, proyecto)}</div>
                      <div className="text-xs text-texto-3">{c.origen === "ghl" ? "Calendario GHL" : `Agendó ${nombre(c.agendada_por)}`}</div>
                    </div>
                    <div className="min-w-48 flex-1">
                      <Link href={`/leads/${c.lead_id}`} className="font-medium hover:text-primario">{`${c.leads?.nombre ?? ""} ${c.leads?.apellido ?? ""}`.trim() || "Lead"}</Link>
                      <div className="text-xs text-texto-3">{c.leads?.telefono} · {c.leads?.email}</div>
                      {c.nota && <div className="mt-0.5 text-xs text-texto-2">📝 {c.nota}</div>}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {invertir && <Insignia tono={invertir.startsWith("Sí") ? "ok" : "neutro"}>💰 {invertir}</Insignia>}
                      {jefe && <Insignia>{nombre(c.closer_id)}</Insignia>}
                      <Insignia tono={c.estado === "cerrada" ? "ok" : c.estado === "confirmada" ? "primario" : ["no_show", "perdida", "cancelada", "no_califica"].includes(c.estado) ? "mal" : "aviso"}>
                        {ETIQUETA_ESTADO_CITA[c.estado]}
                      </Insignia>
                    </div>
                    <AccionesCita
                      cita={{ id: c.id, estado: c.estado, lead_id: c.lead_id }}
                      pasada={new Date(c.fecha).getTime() < ahora}
                      productos={(productos.data ?? []) as Producto[]}
                      moneda={proyecto.moneda}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <p className="text-xs text-texto-3">Las citas del calendario de GHL entrarán solas cuando se conecte el webhook (al publicar). Mientras tanto, se crean desde la ficha del lead con «Agendar».</p>
      </Contenido>
    </>
  );
}
