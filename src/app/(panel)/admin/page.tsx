import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSesion, puedeAdmin, puedeCrearProyectos } from "@/lib/auth";
import { db } from "@/lib/datos";
import { dinero, fechaHora, ETIQUETA_ROL } from "@/lib/formato";
import { Cabecera, Contenido, Seccion, Insignia, Avatar } from "@/components/ui";
import { Plantilla, AnadirExistente, FormUsuario, FilaMiembro, FormProyecto, FormNuevoProyecto, OrdenReparto, Secreto } from "./cliente";
import type { Perfil, Producto } from "@/lib/tipos";
import { PLANTILLAS_GHL, CABECERA_SECRETO } from "@/lib/plantillas-ghl";
import { NuevaEntrada, EditorEntrada } from "./entradas";
import { ConexionGhl, CalendarioCloser, UsuarioGhl } from "./ghl";
import { reglasValidas } from "@/lib/entrada";
import { SECCIONES } from "@/lib/permisos";
import { TablaPermisos } from "./permisos";
import { EditorHorario } from "./horarios";
import { horarioValido } from "@/lib/horarios";

const PESTANAS = [
  { v: "equipo", t: "Equipo" },
  { v: "proyecto", t: "Proyecto y reparto" },
  { v: "productos", t: "Productos" },
  { v: "entradas", t: "Entradas (landings)" },
  { v: "integraciones", t: "Integraciones GHL" },
  { v: "permisos", t: "Permisos", soloCeo: true },
];

type EventoEntrada = { id: string; entrada_id: string; lead_id: string | null; procesado: boolean; error: string | null; recibido_en: string; payload: Record<string, unknown> };

// Nombres de campo que han llegado (también los de dentro de objetos, como «quiz.inversion»)
function camposDe(eventos: EventoEntrada[]) {
  const c = new Set<string>();
  for (const e of eventos)
    for (const [k, v] of Object.entries(e.payload ?? {})) {
      if (k === "headers") continue;
      if (v && typeof v === "object" && !Array.isArray(v)) for (const k2 of Object.keys(v)) c.add(`${k}.${k2}`);
      else c.add(k);
    }
  return [...c].sort();
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const { perfil, proyecto, proyectos } = await getSesion();
  if (!puedeAdmin(perfil)) redirect("/");
  const sp = await searchParams;
  const tab = typeof sp.tab === "string" ? sp.tab : "equipo";
  // Permisos por sección: solo el CEO (V2-8)
  let permitidos: string[] = [];
  if (tab === "permisos" && perfil.rol === "ceo") {
    const { data } = await db().from("permisos_seccion").select("rol, seccion").eq("proyecto_id", proyecto.id).eq("permitido", true);
    permitidos = (data ?? []).map((x) => `${x.rol}:${x.seccion}`);
  }

  const [{ data: miembros }, { data: productos }, { data: eventos }] = await Promise.all([
    db().from("miembros_proyecto").select("orden, horario, perfiles(*)").eq("proyecto_id", proyecto.id).order("orden"),
    db().from("productos").select("*").eq("proyecto_id", proyecto.id).order("orden"),
    db().from("webhook_eventos").select("id, tipo, procesado, error, recibido_en").eq("proyecto_id", proyecto.id).order("recibido_en", { ascending: false }).limit(15),
  ]);
  const gente = ((miembros ?? []) as unknown as { orden: number; perfiles: Perfil }[]).map((m) => m.perfiles);
  const horarioDe = new Map(((miembros ?? []) as unknown as { horario: unknown; perfiles: Perfil }[]).map((m) => [m.perfiles.id, horarioValido(m.horario)]));
  // Personas de otros proyectos que se pueden añadir a este (solo el CEO)
  let deFuera: { id: string; nombre: string; rol: string }[] = [];
  if (perfil.rol === "ceo") {
    const { data: todos } = await db().from("perfiles").select("id, nombre, rol").eq("activo", true).order("nombre");
    deFuera = (todos ?? []).filter((p) => !gente.some((g) => g.id === p.id));
  }
  const h = await headers();
  const origen = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const urlWebhook = `${origen}/api/webhooks/ghl/${proyecto.id}`;

  // GHL por API (calendarios): el token no sale del servidor, solo si existe o no
  let ghl: { location: string; tieneToken: boolean; sincronizado: string | null; resultado: string | null; closers: { id: string; nombre: string; cal: string; user: string }[]; otros: { id: string; nombre: string; rol: string; user: string }[] } | null = null;
  if (tab === "integraciones") {
    const [{ data: pg }, { data: mc }, { data: mo }] = await Promise.all([
      db().from("proyectos").select("ghl_location_id, ghl_token, ghl_sincronizado_en, ghl_ultimo_resultado").eq("id", proyecto.id).single(),
      db().from("miembros_proyecto").select("perfil_id, ghl_calendar_id, ghl_user_id, perfiles!inner(nombre, rol)").eq("proyecto_id", proyecto.id).eq("perfiles.rol", "closer"),
      db().from("miembros_proyecto").select("perfil_id, ghl_user_id, perfiles!inner(nombre, rol, activo)").eq("proyecto_id", proyecto.id).in("perfiles.rol", ["caller", "director"]),
    ]);
    ghl = {
      location: pg?.ghl_location_id ?? "",
      tieneToken: !!pg?.ghl_token,
      sincronizado: pg?.ghl_sincronizado_en ?? null,
      resultado: pg?.ghl_ultimo_resultado ?? null,
      otros: ((mo ?? []) as unknown as { perfil_id: string; ghl_user_id: string | null; perfiles: { nombre: string; rol: string; activo: boolean } }[]).filter((m) => m.perfiles.activo).map((m) => ({ id: m.perfil_id, nombre: m.perfiles.nombre, rol: m.perfiles.rol, user: m.ghl_user_id ?? "" })),
      closers: ((mc ?? []) as unknown as { perfil_id: string; ghl_calendar_id: string | null; ghl_user_id: string | null; perfiles: { nombre: string } }[]).map((m) => ({ id: m.perfil_id, nombre: m.perfiles.nombre, cal: m.ghl_calendar_id ?? "", user: m.ghl_user_id ?? "" })),
    };
  }

  // Entradas: solo se cargan en su pestaña
  let entradas: { id: string; nombre: string; token: string; activa: boolean; pipeline_id: string | null; etapa_id: string | null; reglas: unknown }[] = [];
  let eventosEntrada: EventoEntrada[] = [];
  let pipes: { id: string; nombre: string; etapas: { id: string; nombre: string }[] }[] = [];
  if (tab === "entradas") {
    const [{ data: en }, { data: pl }] = await Promise.all([
      db().from("entradas").select("*").eq("proyecto_id", proyecto.id).order("creado_en"),
      db().from("pipelines").select("id, nombre, etapas(id, nombre, orden)").eq("proyecto_id", proyecto.id).order("orden"),
    ]);
    entradas = en ?? [];
    pipes = ((pl ?? []) as { id: string; nombre: string; etapas: { id: string; nombre: string; orden: number }[] }[]).map((p) => ({ ...p, etapas: [...p.etapas].sort((a, b) => a.orden - b.orden) }));
    if (entradas.length) {
      const { data: ev } = await db().from("webhook_eventos").select("id, entrada_id, lead_id, procesado, error, recibido_en, payload").in("entrada_id", entradas.map((x) => x.id)).order("recibido_en", { ascending: false }).limit(200);
      eventosEntrada = (ev ?? []) as EventoEntrada[];
    }
  }

  return (
    <>
      <Cabecera titulo="Administración" subtitulo={`${proyecto.nombre} · ${perfil.rol === "ceo" ? "acceso total" : "acceso de director"}`} />
      <Contenido>
        <div className="flex flex-wrap gap-1 rounded-xl border border-borde bg-panel p-1">
          {PESTANAS.filter((p) => !("soloCeo" in p) || perfil.rol === "ceo").map((p) => (
            <Link key={p.v} href={`/admin?tab=${p.v}`} className={`rounded-lg px-3 py-1.5 text-sm ${tab === p.v ? "bg-primario text-white" : "text-texto-2 hover:bg-panel-2"}`}>{p.t}</Link>
          ))}
        </div>

        {tab === "equipo" && (
          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <Seccion titulo={`Equipo de ${proyecto.nombre} · ${gente.length} personas`}>
              <div className="-mx-4 overflow-x-auto sm:-mx-5">
                <table className="tabla">
                  <thead><tr><th>Persona</th><th>Rol</th><th>Contacto</th><th>Estado</th><th></th></tr></thead>
                  <tbody>
                    {gente.map((g) => (
                      <tr key={g.id} className={g.activo ? "" : "opacity-50"}>
                        <td><div className="flex items-center gap-2"><Avatar nombre={g.nombre} /><div><div className="font-medium">{g.nombre}</div><div className="text-xs text-texto-3">{g.email}</div></div></div></td>
                        <td><Insignia tono={g.rol === "ceo" ? "oro" : g.rol === "director" ? "morado" : "primario"}>{ETIQUETA_ROL[g.rol]}</Insignia>{g.rol === "director" && g.admin_activo && <Insignia tono="ok">Admin</Insignia>}</td>
                        <td className="text-xs text-texto-2">{g.whatsapp ?? g.telefono ?? "—"}{!g.onboarding_completo && <div className="text-aviso">Onboarding pendiente</div>}</td>
                        <td>{g.activo ? <Insignia tono="ok">Activo</Insignia> : <Insignia tono="mal">Desactivado</Insignia>}</td>
                        <td><FilaMiembro persona={{ id: g.id, rol: g.rol, activo: g.activo, admin_activo: g.admin_activo }} soyCeo={perfil.rol === "ceo"} soyYo={g.id === perfil.id} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Seccion>
            <div className="space-y-5">
              <Seccion titulo="Añadir persona nueva">
                <FormUsuario soyCeo={perfil.rol === "ceo"} />
              </Seccion>
              {perfil.rol === "ceo" && (
                <Seccion titulo="Añadir a alguien de otro proyecto">
                  <AnadirExistente personas={deFuera.map((p) => ({ id: p.id, nombre: `${p.nombre} · ${ETIQUETA_ROL[p.rol]}` }))} proyecto={proyecto.nombre} />
                </Seccion>
              )}
            </div>
          </div>
        )}

        {tab === "proyecto" && (
          <div className="grid gap-5 xl:grid-cols-2">
            <Seccion titulo="Reparto de leads y avisos">
              <FormProyecto modo={proyecto.modo_reparto} aviso={proyecto.aviso_webhook_url ?? ""} />
              <p className="mt-3 text-xs text-texto-3">Moneda: <b>{proyecto.moneda}</b> · Zona horaria: <b>{proyecto.zona_horaria}</b> (se eligen al crear el proyecto).</p>
            </Seccion>
            <Seccion titulo="Orden del reparto rotativo (callers)">
              <OrdenReparto callers={gente.filter((g) => g.rol === "caller" && g.activo).map((g) => ({ id: g.id, nombre: g.nombre }))} />
            </Seccion>
            <Seccion titulo={`Horarios de los callers (hora de ${proyecto.zona_horaria})`}>
              <p className="mb-3 text-xs text-texto-3">Solo se usan con el reparto «Por horarios». Un turno que pasa de medianoche (22:00 a 02:00) cuenta para el día en que empieza.</p>
              <div className="space-y-2">
                {gente.filter((g) => g.rol === "caller" && g.activo).map((g) => <EditorHorario key={g.id} perfilId={g.id} nombre={g.nombre} horario={horarioDe.get(g.id) ?? null} />)}
              </div>
            </Seccion>
            {puedeCrearProyectos(perfil) && (
              <Seccion titulo={`Proyectos (${proyectos.length})`}>
                <ul className="mb-4 space-y-1 text-sm">
                  {proyectos.map((p) => (
                    <li key={p.id} className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: p.color }} />{p.nombre}<span className="text-texto-3">· {p.moneda} · {p.zona_horaria}</span></li>
                  ))}
                </ul>
                <FormNuevoProyecto />
              </Seccion>
            )}
          </div>
        )}

        {tab === "permisos" && perfil.rol === "ceo" && (
          <Seccion titulo="Quién ve las secciones de «Empresa»">
            <p className="mb-4 text-sm text-texto-2">Por defecto solo las ves tú. Abre una sección a un rol y la ven <b>todas</b> las personas de ese rol en este proyecto (todos los directores iguales). Lo demás (Agendas, CRM, Ventas…) sigue igual que siempre, según el rol.</p>
            <TablaPermisos secciones={SECCIONES.map((x) => ({ v: x.v, t: x.t, d: x.d }))} permitidos={permitidos} />
            <p className="mt-3 text-xs text-texto-3">Ojo: quien tenga Finanzas ve todo el dinero del negocio, y quien tenga Equipo puede dar de alta personas y cambiar comisiones.</p>
          </Seccion>
        )}

        {tab === "productos" && (
          <Seccion titulo="Productos y precios">
            <p className="text-sm text-texto-2">Desde la v2, los productos se crean y se editan en <b>Empresa → Programas</b> (precio, forma de pago, back-end y comisiones).</p>
            <Link href="/programas" className="btn-primario mt-3 inline-flex">Ir a Programas</Link>
            <ul className="mt-4 space-y-1 text-sm">
              {((productos ?? []) as Producto[]).map((p) => (
                <li key={p.id} className="flex justify-between rounded-lg bg-panel-2 px-3 py-1.5"><span>{p.nombre}{!p.activo && <span className="text-texto-3"> · inactivo</span>}</span><span className="tabular-nums text-oro">{p.precio !== null ? dinero(Number(p.precio), proyecto) : "Personalizado"}</span></li>
              ))}
            </ul>
          </Seccion>
        )}

        {tab === "entradas" && (
          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              {entradas.length === 0 && (
                <Seccion titulo="Entradas">
                  <p className="text-sm text-texto-2">Cada landing tiene su propia dirección. La landing envía ahí el mismo JSON que manda a GHL; la app lo guarda <b>entero</b> y después lo interpreta (nombre, email, teléfono, respuestas, UTM…). Crea la primera a la derecha.</p>
                </Seccion>
              )}
              {entradas.map((en) => {
                const evs = eventosEntrada.filter((x) => x.entrada_id === en.id);
                return (
                  <Seccion key={en.id} titulo={`${en.nombre}${en.activa ? "" : " · desactivada"}`}>
                    <EditorEntrada
                      entrada={{ id: en.id, nombre: en.nombre, url: `${origen}/api/webhooks/entrada/${en.token}`, activa: en.activa, pipeline_id: en.pipeline_id, etapa_id: en.etapa_id, reglas: reglasValidas(en.reglas), campos: camposDe(evs) }}
                      pipelines={pipes}
                    />
                    <div className="mt-5 border-t border-borde pt-4">
                      <div className="titulo-seccion mb-2">Últimos envíos recibidos ({evs.length})</div>
                      {evs.length === 0 ? (
                        <p className="text-sm text-texto-3">Todavía no ha llegado nada a esta dirección.</p>
                      ) : (
                        <ul className="space-y-1.5 text-sm">
                          {evs.slice(0, 15).map((x) => (
                            <li key={x.id} className="rounded-lg bg-panel-2">
                              <details>
                                <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-3 py-1.5">
                                  <span className="text-xs text-texto-3">{fechaHora(x.recibido_en, proyecto)}</span>
                                  <span className="truncate">{String(x.payload?.email || x.payload?.phone || x.payload?.name || "—")}</span>
                                  {x.procesado ? <Insignia tono="ok">Guardado</Insignia> : <Insignia tono="mal">{x.error ?? "Error"}</Insignia>}
                                  {x.lead_id && <Link href={`/leads/${x.lead_id}`} className="ml-auto text-xs text-primario hover:underline">Ver lead</Link>}
                                </summary>
                                <pre className="max-h-72 overflow-auto border-t border-borde p-3 text-xs">{JSON.stringify(x.payload, null, 2)}</pre>
                              </details>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Seccion>
                );
              })}
            </div>
            <Seccion titulo="Nueva entrada">
              <NuevaEntrada pipelines={pipes} />
              <p className="mt-3 rounded-lg bg-aviso-suave px-3 py-2 text-xs text-aviso">En local (localhost) las landings no pueden llegar a esta dirección. Funcionará al publicar la app; entonces la dirección cambiará al dominio real.</p>
            </Seccion>
          </div>
        )}

        {tab === "integraciones" && (
          <div className="grid gap-5 xl:grid-cols-2">
            {ghl && (
              <Seccion titulo="Calendario de GHL de cada closer (por API)" className="xl:col-span-2">
                <p className="mb-3 text-sm text-texto-2">La app pregunta a GHL por las citas de cada closer (desde hace 30 días hasta dentro de 60) al pulsar «Sincronizar GHL» en Agendas y, sola, al abrir Agendas si han pasado más de 10 minutos. Funciona también en local.</p>
                <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
                  <ConexionGhl locationId={ghl.location} tieneToken={ghl.tieneToken} />
                  <div className="space-y-2">
                    {ghl.closers.length === 0 ? <p className="text-sm text-texto-3">No hay closers en este proyecto.</p> : ghl.closers.map((c) => <CalendarioCloser key={c.id} perfilId={c.id} nombre={c.nombre} calendarId={c.cal} userId={c.user} />)}
                    <p className="text-xs text-texto-3">Basta con uno de los dos: el id del calendario del closer o su id de usuario en GHL.</p>
                    {ghl.sincronizado && <p className="text-xs text-texto-2">Última sincronización: {fechaHora(ghl.sincronizado, proyecto)} · {ghl.resultado}</p>}
                  </div>
                </div>
              </Seccion>
            )}
            {ghl && (
              <Seccion titulo="Llamadas de GHL: quién es quién" className="xl:col-span-2">
                <p className="mb-3 text-sm text-texto-2">«Llamadas de GHL» trae todas las llamadas contestadas de más de 1 minuto. Para saber quién hizo cada una, pon aquí el <b>id de usuario de GHL</b> de cada caller (los closers ya lo tienen arriba si usan usuario). El token necesita además el permiso <code>conversations/message.readonly</code>.</p>
                <div className="space-y-2">{ghl.otros.length === 0 ? <p className="text-sm text-texto-3">No hay callers ni directores.</p> : ghl.otros.map((x) => <UsuarioGhl key={x.id} perfilId={x.id} nombre={x.nombre} rol={ETIQUETA_ROL[x.rol]} userId={x.user} />)}</div>
              </Seccion>
            )}
            <Seccion titulo="Webhook de entrada (GHL → Eternity)">
              <p className="text-sm text-texto-2">
                En cada workflow de GHL añade la acción <b>Custom Webhook</b>, con <b>Event = CUSTOM</b>, <b>Method = POST</b> y <b>Content-Type = application/json</b>. Paso a paso en <code className="rounded bg-panel-2 px-1">GUIA-GHL.md</code>.
              </p>
              <Secreto url={urlWebhook} cabecera={CABECERA_SECRETO} secreto={proyecto.webhook_secreto} />
              <p className="mt-3 rounded-lg bg-aviso-suave px-3 py-2 text-xs text-aviso">En local (localhost) GHL no puede llegar a esta URL. Funcionará al publicar la app; entonces la URL cambiará al dominio real.</p>
              <div className="mt-4 space-y-3">
                <div className="titulo-seccion">Cuerpo («Raw Body») de cada workflow</div>
                {PLANTILLAS_GHL.map((p) => (
                  <Plantilla key={p.clave} titulo={p.titulo} disparador={p.disparador} cuerpo={p.cuerpo} />
                ))}
                <p className="text-xs text-texto-3">Donde pone «ELIGE_EN_GHL», borra el texto y elige la variable con el icono de etiqueta de GHL.</p>
              </div>
            </Seccion>
            <Seccion titulo="Últimos eventos recibidos">
              {(eventos ?? []).length === 0 ? (
                <p className="text-sm text-texto-3">Todavía no ha llegado ningún evento de GHL.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {(eventos ?? []).map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg bg-panel-2 px-3 py-1.5">
                      <span>{e.tipo ?? "desconocido"}</span>
                      <span className="text-xs text-texto-3">{fechaHora(e.recibido_en, proyecto)}</span>
                      {e.procesado ? <Insignia tono="ok">OK</Insignia> : <Insignia tono="mal">{e.error ?? "Error"}</Insignia>}
                    </li>
                  ))}
                </ul>
              )}
            </Seccion>
          </div>
        )}
      </Contenido>
    </>
  );
}
