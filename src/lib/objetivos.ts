import "server-only";
import { db, todas } from "@/lib/datos";
import { rangoDe, porcentaje, hoyEnZona, type Rango } from "@/lib/formato";
import { cashNeto, enRango, type Base } from "@/lib/metricas";
import { indices, kpiCaller, kpiCloser, type Indices } from "@/lib/kpis";
import type { Perfil } from "@/lib/tipos";

// Objetivos (Paso H3, decisiones de Cristian del 10 oct 2026):
// - por rol o por persona (manda la persona); el del director es del equipo entero
// - diario (por defecto L-V), semanal (lunes a domingo), mensual y de lanzamiento
// - cada cambio es una fila nueva: un periodo usa el último objetivo puesto antes de que acabe
//   (si se cambia el miércoles, vale para esa semana; las anteriores guardan el suyo)
// - lanzamiento con evento: solo cuentan los leads de ese evento; sin evento, todo lo de sus fechas

export { CIFRAS, PERIODOS, DIAS, type Cifra, type PeriodoObjetivo, type RolObjetivo } from "@/lib/objetivos-constantes";
import { CIFRAS, type Cifra, type PeriodoObjetivo, type RolObjetivo } from "@/lib/objetivos-constantes";

export type FilaObjetivo = {
  id: string;
  rol: RolObjetivo | null;
  perfil_id: string | null;
  periodo: PeriodoObjetivo;
  lanzamiento_id: string | null;
  cifra: Cifra;
  valor: number | null;
  dias: number[];
  creado_en: string;
};
export type Lanzamiento = { id: string; nombre: string; inicio: string; fin: string; evento: string | null };

export async function cargarObjetivos(proyectoId: string) {
  const [filas, lanzamientos] = await Promise.all([
    todas<FilaObjetivo>((a, b) =>
      db().from("objetivos").select("id, rol, perfil_id, periodo, lanzamiento_id, cifra, valor, dias, creado_en").eq("proyecto_id", proyectoId).order("id").range(a, b)
    ),
    todas<Lanzamiento>((a, b) => db().from("lanzamientos").select("id, nombre, inicio, fin, evento").eq("proyecto_id", proyectoId).order("id").range(a, b)),
  ]);
  // Leads de cada evento unido a un lanzamiento
  const eventos = [...new Set(lanzamientos.map((l) => l.evento).filter((e): e is string => !!e))];
  const leadsEvento = new Map<string, Set<string>>();
  for (const ev of eventos) {
    const ids = await todas<{ id: string }>((a, b) => db().from("leads").select("id").eq("proyecto_id", proyectoId).eq("evento", ev).order("id").range(a, b));
    leadsEvento.set(ev, new Set(ids.map((l) => l.id)));
  }
  return { filas: filas.map((f) => ({ ...f, valor: f.valor === null ? null : Number(f.valor) })), lanzamientos, leadsEvento };
}
export type DatosObjetivos = Awaited<ReturnType<typeof cargarObjetivos>>;

const clave = (f: FilaObjetivo) => [f.rol ?? "", f.perfil_id ?? "", f.periodo, f.lanzamiento_id ?? "", f.cifra].join("|");

// Último objetivo de cada clave puesto antes de `antesDe` (sin los quitados)
export function vigentes(filas: FilaObjetivo[], antesDe: Date | null) {
  const ultimo = new Map<string, FilaObjetivo>();
  for (const f of filas) {
    const t = new Date(f.creado_en).getTime();
    if (antesDe && t >= antesDe.getTime()) continue;
    const previo = ultimo.get(clave(f));
    if (!previo || t > new Date(previo.creado_en).getTime()) ultimo.set(clave(f), f);
  }
  return [...ultimo.values()].filter((f) => f.valor !== null);
}

// Solo las filas de unos leads (para los lanzamientos con evento)
function soloLeads(base: Base, leads: Set<string>): Base {
  const ventas = base.ventas.filter((v) => leads.has(v.lead_id));
  const idsVenta = new Set(ventas.map((v) => v.id));
  return {
    ...base,
    leads: base.leads.filter((l) => leads.has(l.id)),
    citas: base.citas.filter((c) => leads.has(c.lead_id)),
    actividades: base.actividades.filter((a) => leads.has(a.lead_id)),
    ventas,
    pagos: base.pagos.filter((p) => idsVenta.has(p.venta_id)),
  };
}

// Cuánto lleva un grupo de personas en una cifra. `memo` guarda los KPIs ya calculados de ese grupo.
export function hecho(ix: Indices, ids: Set<string>, cifra: Cifra, memo = new Map<string, unknown>()) {
  const { base, rango } = ix;
  const k = [...ids].sort().join(",");
  const caller = () => (memo.get(`ca|${k}`) ?? memo.set(`ca|${k}`, kpiCaller(ix, ids)).get(`ca|${k}`)) as ReturnType<typeof kpiCaller>;
  const closer = () => (memo.get(`cl|${k}`) ?? memo.set(`cl|${k}`, kpiCloser(ix, ids)).get(`cl|${k}`)) as ReturnType<typeof kpiCloser>;
  switch (cifra) {
    case "llamadas":
      return caller().llamadas;
    case "contactados":
      return caller().contactados;
    case "agendas":
      return caller().agendados;
    case "citas_atendidas":
      return closer().atendidas;
    case "asistencias":
      return closer().asistidas;
  }
  const suyas = base.ventas.filter((v) => v.vendedor_id && ids.has(v.vendedor_id));
  const delPeriodo = suyas.filter((v) => enRango(v.fecha, rango));
  if (cifra === "ventas") return delPeriodo.length;
  if (cifra === "facturacion") return delPeriodo.reduce((s, v) => s + v.facturacion, 0);
  return cashNeto(base, suyas, rango);
}

export type Avance = {
  objetivoId: string;
  cifra: Cifra;
  periodo: PeriodoObjetivo;
  etiqueta: string; // «Hoy», «Esta semana», «Este mes» o el nombre del lanzamiento
  meta: number;
  hecho: number;
  pct: number;
  dePersona: boolean; // objetivo propio (no el de su rol)
};

function diaSemana(fecha: string) {
  return ((new Date(`${fecha}T12:00:00Z`).getUTCDay() + 6) % 7) + 1; // 1 = lunes
}

// Avance de cada persona en sus objetivos de ahora (día, semana, mes y lanzamientos en curso)
export function calcularAvances(base: Base, datos: DatosObjetivos, personas: Perfil[], zona: string) {
  const hoy = hoyEnZona(zona);
  const equipoIds = new Set(base.gente.filter((g) => g.rol === "caller" || g.rol === "closer").map((g) => g.id));
  const tramos: { periodo: PeriodoObjetivo; rango: Rango; etiqueta: string; lanzamiento?: Lanzamiento }[] = [
    { periodo: "dia", rango: rangoDe("hoy", zona), etiqueta: "Hoy" },
    { periodo: "semana", rango: rangoDe("semana", zona), etiqueta: "Esta semana" },
    { periodo: "mes", rango: rangoDe("mes", zona), etiqueta: "Este mes" },
    ...datos.lanzamientos
      .filter((l) => l.inicio <= hoy && hoy <= l.fin)
      .map((l) => ({ periodo: "lanzamiento" as const, rango: rangoDe("rango", zona, l.inicio, l.fin), etiqueta: l.nombre, lanzamiento: l })),
  ];

  // Índices de cada tramo (una vez por periodo, no por persona)
  const ixTramo = tramos.map((tr) => indices(tr.lanzamiento?.evento ? soloLeads(base, datos.leadsEvento.get(tr.lanzamiento.evento) ?? new Set()) : base, tr.rango, zona));
  const memos = tramos.map(() => new Map<string, unknown>());
  const resultado = new Map<string, Avance[]>();
  for (const p of personas) {
    if (p.rol !== "caller" && p.rol !== "closer" && p.rol !== "director") continue;
    const lista: Avance[] = [];
    for (const [i, tr] of tramos.entries()) {
      const vig = vigentes(datos.filas, tr.rango.hasta).filter((f) => f.periodo === tr.periodo && f.lanzamiento_id === (tr.lanzamiento?.id ?? null));
      for (const c of CIFRAS) {
        if (!c.roles.includes(p.rol)) continue;
        const propio = vig.find((f) => f.perfil_id === p.id && f.cifra === c.v);
        const obj = propio ?? vig.find((f) => f.rol === p.rol && f.cifra === c.v);
        if (!obj || obj.valor === null) continue;
        // El diario solo cuenta los días marcados (por defecto de lunes a viernes)
        if (tr.periodo === "dia" && !obj.dias.includes(diaSemana(hoy))) continue;
        const ids = p.rol === "director" ? equipoIds : new Set([p.id]);
        const h = hecho(ixTramo[i], ids, c.v, memos[i]);
        lista.push({ objetivoId: obj.id, cifra: c.v, periodo: tr.periodo, etiqueta: tr.etiqueta, meta: obj.valor, hecho: h, pct: porcentaje(h, obj.valor), dePersona: !!propio });
      }
    }
    resultado.set(p.id, lista);
  }
  return resultado;
}

// ---------- «Mis objetivos» del caller o del closer ----------
// Su pantalla se recarga sola cada minuto: en vez de cargar todo el proyecto, solo sus datos
// desde el principio del periodo más largo que esté en curso.
const TROZO = 200;
async function porTrozos<T>(ids: string[], pedir: (trozo: string[]) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const filas: T[] = [];
  for (let i = 0; i < ids.length; i += TROZO) {
    const { data, error } = await pedir(ids.slice(i, i + TROZO));
    if (error) throw new Error(error.message);
    filas.push(...(data ?? []));
  }
  return filas;
}

type VentaFila = Base["ventas"][number];
const COLS_VENTA = "id, lead_id, vendedor_id, facturacion, cash_collected, fecha, producto_id, devuelto, devuelto_en";
const COLS_CITA = "id, lead_id, closer_id, agendada_por, fecha, estado, creado_en";

async function baseDePersona(proyectoId: string, p: Perfil, desde: Date): Promise<Base> {
  const d = desde.toISOString();
  let actividades: Base["actividades"] = [];
  let citas: Base["citas"] = [];
  let ventas: VentaFila[] = [];
  if (p.rol === "caller") {
    actividades = await todas((a, b) => db().from("actividades").select("lead_id, perfil_id, tipo, resultado, creado_en").eq("proyecto_id", proyectoId).eq("perfil_id", p.id).in("tipo", ["llamada", "whatsapp"]).gte("creado_en", d).order("id").range(a, b));
    const suyas = await todas<Base["citas"][number]>((a, b) => db().from("citas").select(COLS_CITA).eq("proyecto_id", proyectoId).eq("agendada_por", p.id).gte("creado_en", d).order("id").range(a, b));
    const leads = [...new Set(suyas.map((c) => c.lead_id))];
    // Todas las citas y ventas de sus agendados (asistencia y cierre) + su low ticket
    citas = await porTrozos(leads, (t) => db().from("citas").select(COLS_CITA).in("lead_id", t));
    const deSusLeads = await porTrozos<VentaFila>(leads, (t) => db().from("ventas").select(COLS_VENTA).in("lead_id", t));
    const propias = await todas<VentaFila>((a, b) => db().from("ventas").select(COLS_VENTA).eq("proyecto_id", proyectoId).eq("vendedor_id", p.id).order("id").range(a, b));
    ventas = [...new Map([...deSusLeads, ...propias].map((v) => [v.id, v])).values()];
  } else {
    citas = await todas((a, b) => db().from("citas").select(COLS_CITA).eq("proyecto_id", proyectoId).eq("closer_id", p.id).gte("fecha", d).order("id").range(a, b));
    ventas = await todas<VentaFila>((a, b) => db().from("ventas").select(COLS_VENTA).eq("proyecto_id", proyectoId).eq("vendedor_id", p.id).order("id").range(a, b));
  }
  const pagos = await porTrozos<{ importe: number; fecha: string; venta_id: string }>(ventas.map((v) => v.id), (t) => db().from("pagos").select("importe, fecha, venta_id").in("venta_id", t));
  return {
    leads: [],
    citas,
    actividades,
    ventas: ventas.map((v) => ({ ...v, facturacion: Number(v.facturacion), cash_collected: Number(v.cash_collected) })),
    pagos: pagos.map((x) => ({ ...x, importe: Number(x.importe) })),
    gente: [p],
  };
}

export async function misAvances(proyecto: { id: string; zona_horaria: string }, p: Perfil) {
  if (p.rol !== "caller" && p.rol !== "closer") return [];
  const datos = await cargarObjetivos(proyecto.id);
  const zona = proyecto.zona_horaria;
  const hoy = hoyEnZona(zona);
  const inicios = [rangoDe("semana", zona).desde!, rangoDe("mes", zona).desde!, ...datos.lanzamientos.filter((l) => l.inicio <= hoy && hoy <= l.fin).map((l) => rangoDe("rango", zona, l.inicio, l.fin).desde!)];
  const desde = new Date(Math.min(...inicios.map((x) => x.getTime())));
  const base = await baseDePersona(proyecto.id, p, desde);
  return calcularAvances(base, datos, [p], zona).get(p.id) ?? [];
}
