import Link from "next/link";
import { PhoneCall } from "lucide-react";
import { getSesion, esJefe } from "@/lib/auth";
import { db, equipo, todas } from "@/lib/datos";
import { fechaHora } from "@/lib/formato";
import { leerPeriodo, rangoNav, enRango } from "@/lib/periodos";
import { hayClaveIa } from "@/lib/ia";
import { Cabecera, Contenido, Insignia, Vacio } from "@/components/ui";
import { BarraPeriodo, FiltroUrl } from "@/components/barra-periodo";
import { VerEstrellas } from "@/components/estrellas";
import { Reintentar, SincronizarLlamadas } from "./cliente";

type L = { id: string; perfil_id: string | null; lead_id: string | null; fecha: string | null; duracion: number | null; direccion: string | null; estado: string; error: string | null; puntuacion: number | null; analisis: { resumen?: string; interes?: number } | null; fuente: string | null; leads: { nombre: string; apellido: string } | null };
const ESTADO = { pendiente: ["En cola", "neutro"], procesando: ["Procesando…", "neutro"], hecho: ["Analizada", "ok"], error: ["Error", "mal"], sin_audio: ["Sin audio", "aviso"] } as const;

// Llamadas de GHL grabadas, transcritas y analizadas (V2-11). Jefes: todas; el resto, las suyas.
export default async function LlamadasGrabadas({ searchParams }: PageProps<"/caller/grabadas">) {
  const { perfil, proyecto } = await getSesion();
  const jefe = esJefe(perfil);
  const sp = await searchParams;
  const p = leerPeriodo(sp, "semana");
  const rango = rangoNav(p.periodo, p.n, proyecto.zona_horaria, p.desde, p.hasta);
  const quien = jefe && typeof sp.quien === "string" ? sp.quien : "";
  const [gente, filas, { data: pg }] = await Promise.all([
    equipo(proyecto.id),
    todas<L>((a, b) => {
      let q = db().from("llamadas_ghl").select("*, leads(nombre, apellido)").eq("proyecto_id", proyecto.id).order("fecha", { ascending: false });
      if (!jefe) q = q.eq("perfil_id", perfil.id);
      else if (quien === "sin") q = q.is("perfil_id", null);
      else if (quien) q = q.eq("perfil_id", quien);
      return q.range(a, b);
    }),
    db().from("proyectos").select("ghl_token, ghl_location_id, ghl_llamadas_sincronizado_en").eq("id", proyecto.id).single(),
  ]);
  const lista = filas.filter((f) => enRango(f.fecha, rango));
  const nombre = (id: string | null) => gente.find((g) => g.id === id)?.nombre ?? "Sin asignar";
  const hechas = lista.filter((f) => f.estado === "hecho");
  const media = hechas.length ? Math.round(hechas.reduce((s, f) => s + (f.puntuacion ?? 0), 0) / hechas.length) : null;
  return (
    <>
      <Cabecera titulo="Llamadas de GHL" subtitulo={`${proyecto.nombre} · contestadas de más de 1 minuto, transcritas y analizadas${pg?.ghl_llamadas_sincronizado_en ? ` · última vez: ${fechaHora(pg.ghl_llamadas_sincronizado_en, proyecto)}` : ""}`} acciones={<SincronizarLlamadas conectado={!!(pg?.ghl_token && pg?.ghl_location_id)} />} />
      <Contenido>
        {(!process.env.DEEPGRAM_API_KEY || !hayClaveIa()) && <p className="tarjeta border-aviso/40 p-4 text-sm text-aviso">{!process.env.DEEPGRAM_API_KEY && <>Falta la clave de Deepgram (<code>DEEPGRAM_API_KEY</code>): solo se podrán usar las llamadas que GHL ya haya transcrito. </>}{!hayClaveIa() && <>Falta la clave de Claude (<code>ANTHROPIC_API_KEY</code>): no se analiza nada.</>}</p>}
        <div className="tarjeta flex flex-wrap items-center gap-2 p-2.5">
          {jefe && <FiltroUrl nombre="quien" etiqueta="Quién llamó" todos="Todo el equipo" opciones={[...gente.map((g) => ({ v: g.id, t: g.nombre })), { v: "sin", t: "Sin asignar (falta su usuario de GHL)" }]} />}
          <span className="text-sm text-texto-2">{lista.length} llamadas · {hechas.length} analizadas{media !== null ? ` · media ${media}/100` : ""}</span>
          <div className="ml-auto"><BarraPeriodo etiqueta={rango.etiqueta} porDefecto="semana" conActualizar={false} /></div>
        </div>
        {lista.length === 0 ? (
          <div className="tarjeta"><Vacio icono={PhoneCall} texto="No hay llamadas en este periodo. Pulsa «Traer llamadas de GHL»." /></div>
        ) : (
          <div className="tarjeta overflow-x-auto">
            <table className="tabla">
              <thead><tr><th>Fecha</th>{jefe && <th>Quién</th>}<th>Lead</th><th className="text-right">Duración</th><th>Interés</th><th className="text-right">Nota</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {lista.map((f) => (
                  <tr key={f.id}>
                    <td className="whitespace-nowrap"><Link href={`/caller/grabadas/${f.id}`} className="hover:text-primario">{f.fecha ? fechaHora(f.fecha, proyecto) : "—"}</Link></td>
                    {jefe && <td className="text-texto-2">{nombre(f.perfil_id)}</td>}
                    <td>{f.lead_id && f.leads ? <Link href={`/leads/${f.lead_id}`} className="hover:text-primario">{`${f.leads.nombre} ${f.leads.apellido ?? ""}`.trim()}</Link> : <span className="text-xs text-texto-3">Contacto no está en la app</span>}</td>
                    <td className="text-right tabular-nums">{Math.round((f.duracion ?? 0) / 60)} min</td>
                    <td>{f.analisis?.interes ? <VerEstrellas n={f.analisis.interes} quien="caller" /> : "—"}</td>
                    <td className="text-right font-semibold tabular-nums text-oro">{f.puntuacion ?? "—"}</td>
                    <td><Insignia tono={ESTADO[f.estado as keyof typeof ESTADO][1]}>{ESTADO[f.estado as keyof typeof ESTADO][0]}</Insignia>{f.error && <div className="max-w-60 text-[11px] text-texto-3">{f.error}</div>}</td>
                    <td className="text-right">{(f.estado === "error" || f.estado === "sin_audio") && <Reintentar id={f.id} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-texto-3">La transcripción sale de GHL si la subcuenta ya transcribe llamadas; si no, se descarga la grabación y se pasa a texto con Deepgram. Después Claude la analiza. El usuario de GHL de cada persona se pone en Administración → Integraciones.</p>
      </Contenido>
    </>
  );
}
