// 1c (Cristian, 26 oct 2026): filtros y cifras de la pestaña «Leads» de KPIs. Se calcula en el navegador con los
// leads ya cargados (lib/leads-vista.ts): cambiar un filtro no pide nada a la base.
import { MARCA, type LeadVista, type PipelineVista } from "@/lib/leads-vista";
import { SIN_PAIS, nombrePais } from "@/lib/formato";

export type FiltroLeads = {
  desde: number | null; // fecha de alta, en milisegundos (null = sin límite)
  hasta: number | null;
  pipelineId: string | null; // null = todos; si no, su pipeline principal o una tarjeta 🔗 allí
  pais: string; // "" = todos; un código («ES») o «Sin país» (también los aún sin calcular)
  sinCaller: boolean;
  q: string;
};

export const enPipeline = (l: LeadVista, pipelineId: string) => l.pipelineId === pipelineId || l.tarjetas.some((t) => t.pipelineId === pipelineId);
export const paisDe = (l: LeadVista) => l.pais ?? SIN_PAIS;

// Todo menos la fuente (la comparación por fuente y los números de los botones usan esto)
export function filtrarSinFuente(leads: LeadVista[], f: Omit<FiltroLeads, "pipelineId">) {
  const t = f.q.trim().toLowerCase();
  const tel = t.replace(/\s/g, "");
  return leads.filter(
    (l) =>
      (f.desde === null || l.alta >= f.desde) &&
      (f.hasta === null || l.alta < f.hasta) &&
      (!f.pais || paisDe(l) === f.pais) &&
      (!f.sinCaller || !l.callerId) &&
      (!t ||
        l.nombre.toLowerCase().includes(t) ||
        (l.email ?? "").toLowerCase().includes(t) ||
        (!!tel && (l.telefono ?? "").replace(/\s/g, "").includes(tel)) ||
        nombrePais(l.pais).toLowerCase().includes(t) ||
        l.etiquetas.some((e) => e.toLowerCase().includes(t)))
  );
}

export function filtrarLeads(leads: LeadVista[], f: FiltroLeads) {
  const sinFuente = filtrarSinFuente(leads, f);
  return f.pipelineId ? sinFuente.filter((l) => enPipeline(l, f.pipelineId!)) : sinFuente;
}

const pct = (parte: number, total: number) => (total ? Math.round((parte / total) * 1000) / 10 : null);

// Embudo de la misma tanda: de estos leads, cuántos llegaron a cada paso (hasta hoy)
export function embudo(leads: LeadVista[]) {
  const n = (m: number) => leads.filter((l) => (l.marcas & m) === m).length;
  const total = leads.length;
  const pasos = [
    { t: "Leads", n: total },
    { t: "Contactados", n: n(MARCA.contactado) },
    { t: "Contestan", n: n(MARCA.contesta) },
    { t: "Agendan", n: n(MARCA.agendado) },
    { t: "Asisten", n: n(MARCA.asistio) },
    { t: "Compran", n: n(MARCA.compro) },
  ];
  return pasos.map((p) => ({ ...p, pct: pct(p.n, total) }));
}

export function cifras(leads: LeadVista[]) {
  const total = leads.length;
  const sinCaller = leads.filter((l) => !l.callerId).length;
  const e = embudo(leads);
  const de = (t: string) => e.find((p) => p.t === t)!.n;
  return {
    total,
    sinCaller: { n: sinCaller, pct: pct(sinCaller, total) },
    contactados: { n: de("Contactados"), pct: pct(de("Contactados"), total) },
    agendados: { n: de("Agendan"), pct: pct(de("Agendan"), total) },
    compran: { n: de("Compran"), pct: pct(de("Compran"), total) },
  };
}

// Una fila por fuente (pipeline), con su embudo; «Todos» al principio (cada persona una vez)
export function compararFuentes(leads: LeadVista[], pipelines: PipelineVista[]) {
  const fila = (id: string | null, nombre: string, ls: LeadVista[]) => {
    const e = embudo(ls);
    return { id, nombre, sinCaller: ls.filter((l) => !l.callerId).length, pasos: e };
  };
  return [fila(null, "Todos", leads), ...pipelines.map((p) => fila(p.id, p.nombre, leads.filter((l) => enPipeline(l, p.id))))];
}

// L4: leads por día de alta, en la zona del proyecto. Sin «desde», desde el primero; sin «hasta», hasta hoy (máx. 400 días)
export function porDia(leads: LeadVista[], zona: string, desde: number | null, hasta: number | null, ahora = Date.now()) {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: zona });
  const dia = (ms: number) => fmt.format(new Date(ms));
  const cuenta = new Map<string, number>();
  for (const l of leads) cuenta.set(dia(l.alta), (cuenta.get(dia(l.alta)) ?? 0) + 1);
  const inicio = desde ?? (leads.length ? Math.min(...leads.map((l) => l.alta)) : ahora);
  const ultimo = dia(Math.min((hasta ?? ahora + 1) - 1, ahora));
  const d = new Date(`${dia(inicio)}T12:00:00Z`);
  const puntos: { dia: string; valor: number }[] = [];
  while (d.toISOString().slice(0, 10) <= ultimo && puntos.length < 400) {
    const k = d.toISOString().slice(0, 10);
    puntos.push({ dia: `${k.slice(8, 10)}/${k.slice(5, 7)}`, valor: cuenta.get(k) ?? 0 });
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return puntos;
}

// L4: las preguntas de los formularios de estos leads (con su nombre único), de la más respondida a la menos
export function preguntasDe(leads: LeadVista[], canonica: (p: string) => string) {
  const m = new Map<string, number>();
  for (const l of leads) for (const p of new Set(l.respuestas.filter((r) => r.respuesta).map((r) => canonica(r.pregunta)))) m.set(p, (m.get(p) ?? 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([pregunta, n]) => ({ pregunta, n }));
}

// L4: qué respondieron a una pregunta (solo quien la respondió); como mucho `max` respuestas y el resto en «Otras»
export function respuestasA(leads: LeadVista[], pregunta: string, canonica: (p: string) => string, max = 12) {
  const con = leads.flatMap((l) => {
    const r = l.respuestas.find((x) => x.respuesta && canonica(x.pregunta) === pregunta);
    return r ? [r.respuesta.trim()] : [];
  });
  const filas = repartir(con, (t) => t);
  if (filas.length <= max) return { total: con.length, filas };
  const resto = filas.slice(max - 1).reduce((s, f) => s + f.n, 0);
  return { total: con.length, filas: [...filas.slice(0, max - 1), { t: "Otras", n: resto, pct: Math.round((resto / con.length) * 1000) / 10 }] };
}

// Reparto por una clave (país, estado, caller…): de más a menos, con su %; «vacio» al final
export function repartir<T>(lista: T[], clave: (x: T) => string | null, vacio = "—") {
  const m = new Map<string, number>();
  for (const x of lista) {
    const k = clave(x) ?? vacio;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m]
    .sort((a, b) => (a[0] === vacio ? 1 : b[0] === vacio ? -1 : b[1] - a[1] || a[0].localeCompare(b[0])))
    .map(([t, n]) => ({ t, n, pct: pct(n, lista.length) ?? 0 }));
}
