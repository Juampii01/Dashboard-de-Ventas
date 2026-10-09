import { FileText, Link2, ScrollText, Video, FolderOpen, CreditCard } from "lucide-react";
import { getSesion, puedeRecursos } from "@/lib/auth";
import { db } from "@/lib/datos";
import { recursosVisibles } from "@/lib/recursos";
import { dinero, fecha } from "@/lib/formato";
import { Cabecera, Contenido, Seccion, Insignia, Vacio } from "@/components/ui";
import { NuevoRecurso, BorrarRecurso, EditarLink, CopiarLink, VerGuion } from "./cliente";
import type { Producto, Recurso } from "@/lib/tipos";

const ICONO = { pdf: FileText, enlace: Link2, guion: ScrollText, video: Video };
const TIPO = { pdf: "PDF", enlace: "Enlace", guion: "Guion", video: "Vídeo" };

export default async function RecursosPage({ searchParams }: PageProps<"/recursos">) {
  const { perfil, proyecto } = await getSesion();
  const editor = puedeRecursos(perfil);
  const sp = await searchParams;
  const tipo = typeof sp.tipo === "string" ? sp.tipo : "";

  const [{ data: productos }, { data: recursosData }] = await Promise.all([
    db().from("productos").select("*").eq("proyecto_id", proyecto.id).eq("activo", true).order("orden"),
    db().from("recursos").select("*").eq("proyecto_id", proyecto.id).order("creado_en", { ascending: false }),
  ]);
  const recursos = recursosVisibles((recursosData ?? []) as Recurso[], perfil, tipo);

  // Enlaces firmados (1 hora) para los PDF privados
  const firmados = new Map<string, string>();
  const pdfs = recursos.filter((r) => r.archivo_path).map((r) => r.archivo_path!);
  if (pdfs.length) {
    const { data } = await db().storage.from("recursos").createSignedUrls(pdfs, 3600);
    data?.forEach((d) => d.signedUrl && d.path && firmados.set(d.path, d.signedUrl));
  }

  return (
    <>
      <Cabecera titulo="Links y recursos" subtitulo="Todo lo que necesitas a mano durante las llamadas" acciones={editor ? <NuevoRecurso /> : undefined} />
      <Contenido>
        <Seccion titulo="Links de pago">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {((productos ?? []) as Producto[]).filter((p) => editor || perfil.rol !== "caller" || p.vende_caller).map((p) => (
              <div key={p.id} className="rounded-lg border border-borde bg-panel-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{p.nombre}</div>
                    <div className="text-sm text-oro">{p.precio ? dinero(Number(p.precio), proyecto) : "Precio personalizado"}</div>
                  </div>
                  <CreditCard className="h-5 w-5 text-texto-3" />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {p.link_pago ? <CopiarLink url={p.link_pago} /> : <span className="text-xs text-texto-3">Sin link todavía</span>}
                  {editor && <EditarLink productoId={p.id} actual={p.link_pago ?? ""} />}
                </div>
              </div>
            ))}
          </div>
        </Seccion>

        <Seccion
          titulo="Recursos"
          acciones={
            <div className="flex gap-1 text-sm">
              {[["", "Todos"], ["pdf", "PDF"], ["enlace", "Enlaces"], ["guion", "Guiones"], ["video", "Vídeos"]].map(([v, t]) => (
                <a key={v} href={v ? `/recursos?tipo=${v}` : "/recursos"} className={`rounded-md px-2.5 py-1 ${tipo === v ? "bg-primario-suave text-primario" : "text-texto-2 hover:bg-panel-2"}`}>{t}</a>
              ))}
            </div>
          }
        >
          {recursos.length === 0 ? (
            <Vacio icono={FolderOpen} texto={editor ? "Todavía no hay recursos. Añade el primero con «Nuevo recurso»." : "Tu director todavía no ha subido recursos."} />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {recursos.map((r) => {
                const Icono = ICONO[r.tipo];
                const href = r.archivo_path ? firmados.get(r.archivo_path) : r.url;
                return (
                  <div key={r.id} className="flex gap-3 rounded-lg border border-borde bg-panel-2 p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primario-suave text-primario"><Icono className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium">{r.titulo}</div>
                        {editor && <BorrarRecurso id={r.id} />}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-texto-3">
                        <Insignia>{TIPO[r.tipo]}</Insignia>
                        {r.para_rol !== "todos" && <Insignia tono="primario">Solo {r.para_rol}s</Insignia>}
                        {fecha(r.creado_en, proyecto)}
                      </div>
                      <div className="mt-2">
                        {r.tipo === "guion" ? <VerGuion titulo={r.titulo} contenido={r.contenido ?? ""} /> : href ? (
                          <a href={href} target="_blank" rel="noreferrer" className="text-sm text-primario hover:underline">Abrir {TIPO[r.tipo].toLowerCase()} →</a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Seccion>
      </Contenido>
    </>
  );
}
