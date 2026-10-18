import { Users, Wallet, Flame, BookOpen } from "lucide-react";
import { db, equipo } from "@/lib/datos";
import { cargarBiblioteca, cargarResumenBiblioteca } from "@/lib/biblioteca-datos";
import { paisDeTelefono, resumenBiblioteca } from "@/lib/biblioteca";
import { respuestasBiblioteca, type Oferta } from "@/lib/oferta";
import { dinero, pct as formatoPct } from "@/lib/formato";
import { Kpi, Seccion, Vacio } from "@/components/ui";
import { TablaBibliotecaDiferida } from "./biblioteca-tabla-diferida";
import type { FilaTabla } from "./biblioteca-tabla";
import { ActualizarCsv } from "./biblioteca-csv";
import type { Pipeline, Producto, Proyecto } from "@/lib/tipos";

// Bloque A (Cristian, 11 oct 2026): «Biblioteca», la primera pestaña de KPIs (director y CEO). Como su vista de
// ventas (vista-ventas.html), con los leads de la app: se pone al día con cada CSV y, con GHL, sola.
type Barra = { t: string; n: number; pct: number };

function Barras({ titulo, filas, marcadas = [] }: { titulo: string; filas: Barra[]; marcadas?: string[] }) {
  const max = Math.max(1, ...filas.map((f) => f.pct));
  return (
    <div>
      <div className="mb-2 text-sm font-medium">{titulo}</div>
      <ul className="space-y-1.5">
        {filas.map((f) => (
          <li key={f.t} className="grid grid-cols-[minmax(0,10rem)_1fr_3.5rem] items-center gap-2 text-sm">
            <span className="truncate text-texto-2" title={f.t}>{f.t}</span>
            <span className="h-2.5 overflow-hidden rounded-full bg-panel-2"><span className={`block h-full rounded-full ${marcadas.includes(f.t) ? "bg-oro" : "bg-primario"}`} style={{ width: `${(f.pct / max) * 100}%` }} /></span>
            <span className="text-right tabular-nums">{formatoPct(f.pct)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Qué encaja en cada escalón de la escalera (texto de la vista de Cristian)
const ESCALERA: { clave: "membresia" | "grupal" | "vip" | "dfy"; producto: string; quien: string }[] = [
  { clave: "membresia", producto: "Membresía", quien: "No puede invertir ahora o lo hará en unos meses" },
  { clave: "grupal", producto: "Grupal", quien: "Puede invertir ya, no encaja en VIP ni Empresas" },
  { clave: "vip", producto: "VIP", quien: "Invierte ya, quiere empezar ya y tiene negocio o experiencia en AI" },
  { clave: "dfy", producto: "DFY", quien: "Tiene negocio y quiere automatizarlo" },
];

// Fase 2 (Cristian, 12 oct 2026): las filas de la tabla ya no van dentro de la página (eran ~700 KB con 1.188
// personas); la tabla las pide justo después de pintar la página (`cargarTablaBiblioteca`).
export async function filasDeBiblioteca(proyecto: Proyecto): Promise<{ filas: FilaTabla[]; callers: { id: string; nombre: string }[] }> {
  const t0 = performance.now(); // MEDICIÓN TEMPORAL (18 oct 2026): se quita al acabar
  const [leads, gente] = await Promise.all([cargarBiblioteca(proyecto.id), equipo(proyecto.id)]);
  const t1 = performance.now();
  const callers = gente.filter((g) => g.rol === "caller").map((g) => ({ id: g.id, nombre: g.nombre }));
  const nombre = (id: string | null) => gente.find((g) => g.id === id)?.nombre ?? null;
  const filas: FilaTabla[] = leads.map((l) => {
    const x = respuestasBiblioteca(l.respuestas);
    return { id: l.id, nombre: `${l.nombre} ${l.apellido ?? ""}`.trim(), telefono: l.telefono, email: l.email, pais: paisDeTelefono(l.telefono), alta: l.creado_en, ...x, etiquetas: l.etiquetas ?? [], oferta: l.oferta as Oferta | null, caller: nombre(l.caller_id) };
  });
  console.log(`[tiempos] tabla-biblioteca · leads+ofertas+equipo ${Math.round(t1 - t0)} · filas ${Math.round(performance.now() - t1)} · ${filas.length} filas · ${Math.round(JSON.stringify(filas).length / 1024)} KB`);
  return { filas, callers };
}

export async function Biblioteca({ proyecto }: { proyecto: Proyecto }) {
  const [leads, { data: productos }, { data: pipes }] = await Promise.all([
    cargarResumenBiblioteca(proyecto.id),
    db().from("productos").select("*").eq("proyecto_id", proyecto.id).order("orden"),
    db().from("pipelines").select("*").eq("proyecto_id", proyecto.id).eq("tipo", "normal").order("orden"),
  ]);
  const pipelines = (pipes ?? []) as Pipeline[];
  const r = resumenBiblioteca(leads.map((l) => ({ id: l.id, respuestas: l.respuestas, telefono: l.telefono, oferta: l.oferta as Oferta | null })));
  const prod = (n: string) => ((productos ?? []) as Producto[]).find((p) => p.nombre.toLowerCase() === n.toLowerCase());
  const barras = (xs: { t: string; n: number; pct: number }[]) => xs.map((x) => ({ t: x.t, n: x.n, pct: x.pct }));
  const csv = <ActualizarCsv pipelines={pipelines} pipelineId={pipelines.find((p) => p.nombre.toLowerCase().includes("biblioteca"))?.id} />;

  if (!leads.length)
    return (
      <Seccion titulo="Biblioteca" acciones={csv}>
        <Vacio icono={BookOpen} texto="Todavía no hay leads del formulario de la biblioteca. Súbelos con «Actualizar con CSV»." />
      </Seccion>
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-texto-2">Datos del formulario de la biblioteca (<b>{r.total.toLocaleString("es-ES")}</b> personas) y las ofertas. Úsalo antes de cada reparto y de cada llamada.</p>
        {csv}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <Kpi titulo="Dejaron sus datos" valor={r.total.toLocaleString("es-ES")} icono={Users} detalle="En el formulario de la biblioteca" />
        <Kpi titulo="Pueden invertir ya" valor={formatoPct(r.invierteYa.pct)} icono={Wallet} tono="ok" detalle={`${r.invierteYa.n} personas dicen «Sí, ahora»`} />
        <Kpi titulo="Calientes" valor={formatoPct(r.caliente.pct)} icono={Flame} tono="oro" detalle={`${r.caliente.n}: buscan ingresos + invierten ya + empiezan ya o este mes`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Seccion titulo="¿Quiénes son?">
          <div className="space-y-5">
            <Barras titulo="Situación" filas={barras(r.situacion)} />
            <Barras titulo="Experiencia con AI" filas={barras(r.experiencia)} />
          </div>
        </Seccion>
        <Seccion titulo="¿Qué quieren?">
          <div className="space-y-5">
            <Barras titulo="Objetivo a 90 días" filas={barras(r.objetivo)} marcadas={["Llegar a 5.000 $/mes", "Cerrar su primer cliente en USA"]} />
            <p className="-mt-3 text-xs text-texto-3">{formatoPct(r.buscaIngresos)} busca ingresos (las dos barras marcadas).</p>
            <Barras titulo="¿Cuándo quieren empezar?" filas={barras(r.inicio)} />
          </div>
        </Seccion>
        <Seccion titulo="¿Pueden invertir?">
          <Barras titulo="Si encuentran el programa correcto" filas={barras(r.inversion)} marcadas={["Sí, ahora"]} />
          <p className="mt-2 text-xs text-texto-3">El {formatoPct(r.sinInversion)} restante no respondió.</p>
        </Seccion>
        <Seccion titulo="¿Cuánto tiempo tienen?">
          <Barras titulo="Por semana" filas={barras(r.tiempo)} />
          <p className="mt-2 text-xs text-texto-3">El programa pide mínimo 4 h al día. Solo el {formatoPct(r.masDe10h)} dice tener más de 10 h a la semana.</p>
        </Seccion>
        <Seccion titulo="¿De dónde son?" className="lg:col-span-2">
          <Barras titulo="Por el prefijo del teléfono" filas={r.paises.slice(0, 8).map((p) => ({ t: p.pais, n: p.n, pct: p.pct }))} />
          <p className="mt-2 text-xs text-texto-3">* El prefijo +1 también incluye República Dominicana y Puerto Rico.</p>
        </Seccion>
      </div>

      <Seccion titulo="Escalera de ofertas">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ESCALERA.map((e) => {
            const p = prod(e.producto);
            const dato = r.escalera[e.clave];
            const precio = p?.precio ? `${dinero(Number(p.precio), proyecto)}${p.modo_pago === "mensual" ? " / mes" : ""}` : "A medida";
            return (
              <div key={e.clave} className="rounded-xl border border-borde p-4">
                <div className="text-sm font-semibold">{p?.nombre ?? e.producto}</div>
                <div className="mt-1 text-lg font-semibold tabular-nums">{precio}</div>
                {p?.descripcion && <div className="mt-1 text-xs text-texto-3">{p.descripcion}</div>}
                <div className="mt-3 text-sm text-texto-2">{e.quien}{e.clave === "dfy" ? `. Primero los ${r.escalera.dfy.inviertenYa} que invierten ya` : ""}</div>
                <div className="mt-1 text-xs text-texto-3">{formatoPct(dato.pct)} · {dato.n} personas</div>
              </div>
            );
          })}
        </div>
      </Seccion>

      <Seccion titulo="Todos los leads por oferta">
        <TablaBibliotecaDiferida total={leads.length} />
      </Seccion>
    </div>
  );
}
