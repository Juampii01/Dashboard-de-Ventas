import Link from "next/link";
import { CalendarRange, Target } from "lucide-react";
import { exigirPagina, soloLoSuyo } from "@/lib/permisos";
import { cargarBase, enRango } from "@/lib/metricas";
import { calcularKpis } from "@/lib/kpis";
import { cargarObjetivos, calcularAvances, avancesDelEquipo, vigentes, CIFRAS, PERIODOS, DIAS, type RolObjetivo } from "@/lib/objetivos";
import { db, todas } from "@/lib/datos";
import { dinero, pct, rangoDe, hoyEnZona, sumarDias, ETIQUETA_ROL, type Periodo } from "@/lib/formato";
import { Cabecera, Contenido, Seccion, Vacio } from "@/components/ui";
import { Filtros } from "@/components/filtros";
import { TablasKpis, ExplicacionKpis } from "@/components/tablas-kpis";
import { BarrasObjetivos } from "@/components/barras-objetivos";
import { FormObjetivo, BotonQuitarObjetivo, FormLanzamiento, BotonBorrarLanzamiento } from "./objetivos-cliente";
import { Biblioteca } from "./biblioteca";
import { Embudo } from "@/components/embudo";
import { TarjetasKpis, type PersonaKpi } from "@/components/tarjetas-kpis";
import { TarjetaObjetivos } from "@/components/tarjeta-objetivos";
import { esJefe } from "@/lib/auth";

// KPIs de cada caller y closer (Paso H2) y sus objetivos (Paso H3). Solo director y CEO (decisión de Cristian, 10 oct 2026).
export default async function KpisPage({ searchParams }: PageProps<"/kpis">) {
  const { perfil, proyecto } = await exigirPagina("kpis"); // H5 (a un caller o closer, solo lo suyo: parte 2)
  const sp = await searchParams;
  // H5: a un caller o closer con «KPIs», solo su fila y sin la pestaña Objetivos (no puede poner objetivos)
  const propio = soloLoSuyo(perfil, "kpis");
  // Bloque A (Cristian, 11 oct 2026): «Biblioteca» es lo primero, solo para director y CEO
  const jefe = esJefe(perfil);
  const vista = !propio && sp.vista === "objetivos" ? "objetivos" : !propio && sp.vista === "personas" ? "personas" : jefe && !propio ? "biblioteca" : "personas";
  const $ = (n: number) => dinero(n, proyecto);

  const pestanas = (
    <div className="tarjeta flex gap-1 p-1.5" role="tablist">
      {[
        ...(jefe ? [{ v: "biblioteca", t: "Biblioteca", href: "/kpis" }] : []),
        { v: "personas", t: "Por persona", href: "/kpis?vista=personas" },
        { v: "objetivos", t: "Objetivos", href: "/kpis?vista=objetivos" },
      ].map((p) => (
        <Link key={p.v} href={p.href} role="tab" aria-selected={vista === p.v} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${vista === p.v ? "bg-primario text-white" : "text-texto-2 hover:bg-panel-2"}`}>
          {p.t}
        </Link>
      ))}
    </div>
  );

  if (vista === "biblioteca") {
    return (
      <>
        <Cabecera titulo="KPIs" subtitulo={`${proyecto.nombre} · Biblioteca`} />
        <Contenido>
          {pestanas}
          <Biblioteca proyecto={proyecto} />
        </Contenido>
      </>
    );
  }
  const base = await cargarBase(proyecto);

  if (vista === "personas") {
    const periodo = (typeof sp.periodo === "string" ? sp.periodo : "mes") as Periodo;
    const rango = rangoDe(periodo, proyecto.zona_horaria, sp.desde as string, sp.hasta as string);
    const todos = calcularKpis(base, rango, proyecto.zona_horaria);
    const kpis = propio ? { ...todos, callers: todos.callers.filter((c) => c.perfil.id === perfil.id), closers: todos.closers.filter((c) => c.perfil.id === perfil.id) } : todos;
    // Fase 5: tarjetas por persona y embudo del equipo
    const n = (x: number) => x.toLocaleString("es-ES");
    const tarjetasCallers: PersonaKpi[] = kpis.callers.map((c) => ({
      id: c.perfil.id,
      nombre: c.perfil.nombre,
      rol: "Caller",
      grandes: [
        { t: "Llamadas", v: n(c.llamadas) },
        { t: "Contactados", v: n(c.contactados) },
        { t: "Agendados", v: n(c.agendados) },
        { t: "Cerrados", v: n(c.cerrados) },
      ],
      tasas: [
        { t: "Agendan / contactados", v: pct(c.agendaSobreContactado), tasa: c.agendaSobreContactado },
        { t: "Asistencia", v: pct(c.asistencia), tasa: c.asistencia },
        { t: "Cierre / agendados", v: pct(c.cierreSobreAgendado), tasa: c.cierreSobreAgendado },
      ],
      detalle: [
        { t: "Llamadas", v: n(c.llamadas) },
        { t: "Contactados", v: n(c.contactados) },
        { t: "Contestan", v: n(c.contestan) },
        { t: "Agendados", v: n(c.agendados) },
        { t: "% agendan / contactados", v: pct(c.agendaSobreContactado) },
        { t: "% agendan / contestan", v: pct(c.agendaSobreContesta) },
        { t: "Cerrados", v: n(c.cerrados) },
        { t: "% cierre / contactados", v: pct(c.cierreSobreContactado) },
        { t: "% cierre / agendados", v: pct(c.cierreSobreAgendado) },
        { t: "% asistencia", v: pct(c.asistencia) },
        { t: "% cierre / asistencia", v: pct(c.cierreSobreAsistencia) },
        { t: "Low ticket", v: c.lowTicketVentas ? `${c.lowTicketVentas} · ${$(c.lowTicketFacturacion)}` : "—" },
      ],
    }));
    const tarjetasClosers: PersonaKpi[] = kpis.closers.map((c) => ({
      id: c.perfil.id,
      nombre: c.perfil.nombre,
      rol: "Closer",
      grandes: [
        { t: "Citas", v: n(c.citas) },
        { t: "Asistidas", v: n(c.asistidas) },
        { t: "Cerradas", v: n(c.cerradas) },
        { t: "Facturación", v: $(c.facturacion) },
      ],
      tasas: [
        { t: "Cierre / agenda", v: pct(c.cierreSobreAgenda), tasa: c.cierreSobreAgenda },
        { t: "Cierre / asistencia", v: pct(c.cierreSobreAsistencia), tasa: c.cierreSobreAsistencia },
        { t: "Cobrado", v: pct(c.pctCobrado), tasa: c.pctCobrado },
      ],
      detalle: [
        { t: "Citas", v: n(c.citas) },
        { t: "Asistidas", v: n(c.asistidas) },
        { t: "Cerradas", v: n(c.cerradas) },
        { t: "% cierre / agenda", v: pct(c.cierreSobreAgenda) },
        { t: "% cierre / asistencia", v: pct(c.cierreSobreAsistencia) },
        { t: "Facturación", v: $(c.facturacion) },
        { t: "% facturación del total", v: pct(c.parteFacturacion) },
        { t: "Cash", v: $(c.cash) },
        { t: "% cash del total", v: pct(c.parteCash) },
        { t: "% cobrado", v: pct(c.pctCobrado) },
      ],
    }));
    const leadsPeriodo = base.leads.filter((l) => enRango(l.creado_en, rango)).length;
    return (
      <>
        <Cabecera titulo="KPIs" subtitulo={`${proyecto.nombre} · ${rango.etiqueta}`} />
        <Contenido>
          {!propio && pestanas}
          <Filtros />
          {!propio && (
            <Seccion titulo="Embudo del equipo">
              <Embudo
                titulo="Embudo del equipo"
                pasos={[
                  { t: "Leads", n: leadsPeriodo, d: "Leads que entraron en el periodo" },
                  { t: "Contactados", n: kpis.totalCallers.contactados, d: "Personas a las que un caller llamó o escribió en el periodo" },
                  { t: "Agendados", n: kpis.totalCallers.agendados, d: "Personas con una cita agendada por un caller en el periodo" },
                  { t: "Asistieron", n: kpis.totalClosers.asistidas, d: "Citas del periodo a las que vino el lead" },
                  { t: "Cerrados", n: kpis.totalClosers.cerradas, d: "Citas del periodo cerradas con venta" },
                ]}
              />
              <p className="mt-2 text-xs text-texto-3">Cada paso cuenta lo que pasó en el periodo: no es la misma tanda de personas de arriba abajo.</p>
            </Seccion>
          )}
          <Seccion titulo="Callers">
            <TarjetasKpis personas={tarjetasCallers} vacio={propio ? "Aquí solo ves lo tuyo." : "No hay callers en este proyecto."} conFicha={jefe && !propio} />
          </Seccion>
          <Seccion titulo="Closers">
            <TarjetasKpis personas={tarjetasClosers} vacio={propio ? "Aquí solo ves lo tuyo." : "No hay closers en este proyecto."} conFicha={jefe && !propio} />
          </Seccion>
          <details className="tarjeta p-4">
            <summary className="cursor-pointer text-sm font-medium text-texto-2">Ver como tabla (con los totales)</summary>
            <div className="mt-4">
              <TablasKpis kpis={kpis} dinero={$} sinTotales={propio} />
            </div>
          </details>
          <Seccion titulo="¿Cómo se calcula cada número?">
            <ExplicacionKpis />
          </Seccion>
        </Contenido>
      </>
    );
  }

  // ---------- Objetivos ----------
  const datos = await cargarObjetivos(proyecto.id);
  const personas = base.gente.filter((g) => !("baja" in g && g.baja) && (g.rol === "caller" || g.rol === "closer" || g.rol === "director"));
  // Pendiente 9 (10 oct 2026): ver el avance de un periodo pasado (?ver=AAAA-MM-DD; sin fecha, ahora)
  const hoy = hoyEnZona(proyecto.zona_horaria);
  const ver = typeof sp.ver === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.ver) && sp.ver <= hoy ? sp.ver : hoy;
  const avances = calcularAvances(base, datos, personas, proyecto.zona_horaria, ver);
  const finMesPasado = sumarDias(`${hoy.slice(0, 8)}01`, -1);
  const saltos = [
    { t: "Ahora", f: hoy },
    { t: "Semana pasada", f: sumarDias(hoy, -7) },
    { t: "Mes pasado", f: finMesPasado },
  ];
  const delEquipo = avancesDelEquipo(base, datos, proyecto.zona_horaria);
  const actuales = vigentes(datos.filas, null);
  const nombre = new Map(base.gente.map((g) => [g.id, g.nombre]));
  const lanz = new Map(datos.lanzamientos.map((l) => [l.id, l]));
  const eventos = [...new Set((await todas<{ evento: string }>((a, b) => db().from("leads").select("evento").eq("proyecto_id", proyecto.id).not("evento", "is", null).order("id").range(a, b))).map((l) => l.evento))].sort();
  const ORDEN_ROL: Record<string, number> = { director: 0, closer: 1, caller: 2 };

  return (
    <>
      <Cabecera titulo="KPIs" subtitulo={`${proyecto.nombre} · Objetivos`} />
      <Contenido>
        {pestanas}

        <Seccion titulo="Objetivo del equipo (lo ven todos en «Mis leads» y «Mis agendas»)">
          <BarrasObjetivos avances={delEquipo} dinero={$} sinNotaRol vacio="Pon un objetivo a «Directores (equipo entero)» y lo verá todo el equipo." />
        </Seccion>

        <Seccion titulo={ver === hoy ? "Avance de ahora (hoy, esta semana, este mes y lanzamientos en curso)" : `Avance del ${ver} (ese día, su semana, su mes y los lanzamientos de entonces)`}>
          <form className="mb-4 flex flex-wrap items-center gap-2 text-sm" action="/kpis">
            <input type="hidden" name="vista" value="objetivos" />
            {saltos.map((x) => (
              <Link key={x.t} href={x.f === hoy ? "/kpis?vista=objetivos" : `/kpis?vista=objetivos&ver=${x.f}`} className={`rounded-full px-3 py-1 ${ver === x.f ? "bg-primario text-white" : "bg-panel-2 text-texto-2 hover:text-texto"}`}>{x.t}</Link>
            ))}
            <label className="flex items-center gap-1.5 text-texto-2">o el día <input type="date" name="ver" max={hoy} defaultValue={ver} className="campo w-auto py-1" aria-label="Ver el avance de este día" /></label>
            <button className="btn-secundario px-2.5 py-1 text-xs">Ver</button>
          </form>
          {personas.length === 0 ? (
            <Vacio icono={Target} texto="No hay callers, closers ni directores en este proyecto." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[...personas]
                .sort((a, b) => ORDEN_ROL[a.rol] - ORDEN_ROL[b.rol] || a.nombre.localeCompare(b.nombre))
                .map((p) => {
                  const suyos = avances.get(p.id) ?? [];
                  const medio = suyos.length ? suyos.reduce((s, a) => s + Math.min(100, a.pct), 0) / suyos.length : null;
                  return (
                    <TarjetaObjetivos
                      key={p.id}
                      id={p.id}
                      nombre={p.nombre}
                      rol={`${ETIQUETA_ROL[p.rol]}${p.rol === "director" ? " (equipo entero)" : ""}`}
                      medio={medio}
                      cumplidos={suyos.filter((a) => a.hecho >= a.meta).length}
                      total={suyos.length}
                      conFicha
                    >
                      <BarrasObjetivos avances={suyos} dinero={$} vacio="Sin objetivos ahora." />
                    </TarjetaObjetivos>
                  );
                })}
            </div>
          )}
        </Seccion>

        <Seccion titulo="Nuevo objetivo">
          <FormObjetivo
            personas={personas.map((p) => ({ id: p.id, nombre: p.nombre, rol: p.rol as RolObjetivo }))}
            lanzamientos={datos.lanzamientos.map((l) => ({ id: l.id, nombre: l.nombre }))}
          />
        </Seccion>

        <Seccion titulo="Objetivos puestos">
          {actuales.length === 0 ? (
            <Vacio icono={Target} texto="Todavía no hay objetivos." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-borde">
              <table className="tabla">
                <thead><tr><th>Para</th><th>Periodo</th><th>Cifra</th><th>Objetivo</th><th>Días</th><th></th></tr></thead>
                <tbody>
                  {actuales
                    .sort((a, b) => (a.perfil_id ? 1 : 0) - (b.perfil_id ? 1 : 0) || a.periodo.localeCompare(b.periodo))
                    .map((o) => {
                      const c = CIFRAS.find((x) => x.v === o.cifra)!;
                      return (
                        <tr key={o.id}>
                          <td className="whitespace-nowrap">{o.perfil_id ? nombre.get(o.perfil_id) ?? "—" : `Todos los ${o.rol === "director" ? "directores" : `${o.rol}s`}`}</td>
                          <td className="whitespace-nowrap">{o.periodo === "lanzamiento" ? lanz.get(o.lanzamiento_id!)?.nombre : PERIODOS.find((p) => p.v === o.periodo)?.t}</td>
                          <td>{c.t}</td>
                          <td className="tabular-nums">{c.dinero ? $(o.valor!) : o.valor!.toLocaleString("es-ES")}</td>
                          <td className="whitespace-nowrap text-texto-2">{o.periodo === "dia" ? o.dias.map((d) => DIAS[d - 1]).join(" ") : "—"}</td>
                          <td><BotonQuitarObjetivo id={o.id} /></td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </Seccion>

        <Seccion titulo="Lanzamientos">
          <FormLanzamiento eventos={eventos} />
          {datos.lanzamientos.length > 0 && (
            <ul className="mt-4 divide-y divide-borde rounded-lg border border-borde">
              {[...datos.lanzamientos].sort((a, b) => b.inicio.localeCompare(a.inicio)).map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{l.nombre}</div>
                    <div className="flex items-center gap-1.5 text-xs text-texto-2">
                      <CalendarRange className="h-3.5 w-3.5" /> {l.inicio} → {l.fin} · {l.evento ? `solo leads de «${l.evento}»` : "cuenta todo lo de esas fechas"}
                    </div>
                  </div>
                  <BotonBorrarLanzamiento id={l.id} nombre={l.nombre} />
                </li>
              ))}
            </ul>
          )}
        </Seccion>
      </Contenido>
    </>
  );
}
