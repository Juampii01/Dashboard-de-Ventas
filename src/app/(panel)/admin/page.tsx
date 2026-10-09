import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSesion, puedeAdmin, puedeCrearProyectos, puedeProductos } from "@/lib/auth";
import { db } from "@/lib/datos";
import { dinero, fechaHora, ETIQUETA_ROL } from "@/lib/formato";
import { Cabecera, Contenido, Seccion, Insignia, Avatar } from "@/components/ui";
import { Plantilla, AnadirExistente, FormUsuario, FilaMiembro, FormProyecto, FormNuevoProyecto, FormProducto, OrdenReparto, Secreto } from "./cliente";
import type { Perfil, Producto } from "@/lib/tipos";
import { PLANTILLAS_GHL, CABECERA_SECRETO } from "@/lib/plantillas-ghl";

const PESTANAS = [
  { v: "equipo", t: "Equipo" },
  { v: "proyecto", t: "Proyecto y reparto" },
  { v: "productos", t: "Productos" },
  { v: "integraciones", t: "Integraciones GHL" },
];

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const { perfil, proyecto, proyectos } = await getSesion();
  if (!puedeAdmin(perfil)) redirect("/");
  const sp = await searchParams;
  const tab = typeof sp.tab === "string" ? sp.tab : "equipo";

  const [{ data: miembros }, { data: productos }, { data: eventos }] = await Promise.all([
    db().from("miembros_proyecto").select("orden, perfiles(*)").eq("proyecto_id", proyecto.id).order("orden"),
    db().from("productos").select("*").eq("proyecto_id", proyecto.id).order("orden"),
    db().from("webhook_eventos").select("id, tipo, procesado, error, recibido_en").eq("proyecto_id", proyecto.id).order("recibido_en", { ascending: false }).limit(15),
  ]);
  const gente = ((miembros ?? []) as unknown as { orden: number; perfiles: Perfil }[]).map((m) => m.perfiles);
  // Personas de otros proyectos que se pueden añadir a este (solo el CEO)
  let deFuera: { id: string; nombre: string; rol: string }[] = [];
  if (perfil.rol === "ceo") {
    const { data: todos } = await db().from("perfiles").select("id, nombre, rol").eq("activo", true).order("nombre");
    deFuera = (todos ?? []).filter((p) => !gente.some((g) => g.id === p.id));
  }
  const h = await headers();
  const origen = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const urlWebhook = `${origen}/api/webhooks/ghl/${proyecto.id}`;

  return (
    <>
      <Cabecera titulo="Administración" subtitulo={`${proyecto.nombre} · ${perfil.rol === "ceo" ? "acceso total" : "acceso de director"}`} />
      <Contenido>
        <div className="flex flex-wrap gap-1 rounded-xl border border-borde bg-panel p-1">
          {PESTANAS.map((p) => (
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

        {tab === "productos" && (
          <Seccion titulo="Productos y precios">
            {!puedeProductos(perfil) && <p className="mb-3 rounded-lg bg-aviso-suave px-3 py-2 text-sm text-aviso">Solo el CEO puede crear o editar productos y precios.</p>}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {((productos ?? []) as Producto[]).map((p) =>
                puedeProductos(perfil) ? (
                  <FormProducto key={p.id} producto={p} />
                ) : (
                  <div key={p.id} className="rounded-lg border border-borde bg-panel-2 p-3">
                    <div className="font-medium">{p.nombre}</div>
                    <div className="text-sm text-oro">{p.precio !== null ? dinero(Number(p.precio), proyecto) : "Personalizado"}</div>
                  </div>
                )
              )}
              {puedeProductos(perfil) && <FormProducto />}
            </div>
          </Seccion>
        )}

        {tab === "integraciones" && (
          <div className="grid gap-5 xl:grid-cols-2">
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
