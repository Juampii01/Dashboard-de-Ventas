// Bloque A (Cristian, 11 oct 2026): las cifras de la «Biblioteca» (pestaña de KPIs), como la vista de ventas de
// Cristian (vista-ventas.html). Sin base de datos.
import { OFERTAS, ofertaDe, respuestasBiblioteca, type Oferta, type RespuestasBiblioteca } from "@/lib/oferta";
import type { Respuesta } from "@/lib/tipos";

// Opciones de cada pregunta, en el orden de la vista (lo que no está aquí cuenta como «Otro»)
export const OPCIONES: Record<keyof RespuestasBiblioteca, { v: string; t: string }[]> = {
  situacion: [
    { v: "Empleado", t: "Empleado" },
    { v: "Freelance / Self-employed", t: "Freelance" },
    { v: "Estudiante", t: "Estudiante" },
    { v: "Tengo un negocio", t: "Tiene un negocio" },
    { v: "Tengo una agencia", t: "Tiene una agencia" },
  ],
  experiencia: [
    { v: "Uso ChatGPT o Claude", t: "Usa ChatGPT o Claude" },
    { v: "Ninguna, empiezo de cero", t: "Empieza de cero" },
    { v: "Ya automatizo cosas", t: "Ya automatiza" },
    { v: "Ya vendí servicios de AI", t: "Ya vendió servicios de AI" },
  ],
  objetivo: [
    { v: "Llegar a $5,000 al mes", t: "Llegar a 5.000 $/mes" },
    { v: "Aprender cómo funciona", t: "Aprender cómo funciona" },
    { v: "Automatizar mi negocio", t: "Automatizar su negocio" },
    { v: "Cerrar mi primer cliente en USA", t: "Cerrar su primer cliente en USA" },
  ],
  inicio: [
    { v: "Ya mismo", t: "Ya mismo" },
    { v: "Este mes", t: "Este mes" },
    { v: "Más adelante", t: "Más adelante" },
  ],
  inversion: [
    { v: "Sí, ahora", t: "Sí, ahora" },
    { v: "En los próximos meses", t: "En los próximos meses" },
    { v: "No por ahora", t: "No por ahora" },
  ],
  tiempo: [
    { v: "Menos de 5 h", t: "Menos de 5 h / semana" },
    { v: "5 a 10 h", t: "5 a 10 h" },
    { v: "10 a 20 h", t: "10 a 20 h" },
    { v: "Más de 20 h", t: "Más de 20 h" },
  ],
};
// Para ordenar la tabla de más a menos listo (no por orden alfabético), como la vista
export const RANGO: Partial<Record<keyof RespuestasBiblioteca, Record<string, number>>> = {
  inversion: { "Sí, ahora": 1, "En los próximos meses": 2, "No por ahora": 3 },
  tiempo: { "Más de 20 h": 1, "10 a 20 h": 2, "5 a 10 h": 3, "Menos de 5 h": 4 },
  inicio: { "Ya mismo": 1, "Este mes": 2, "Más adelante": 3 },
};

// País por el prefijo del teléfono (los de la vista; el resto, «Otro»). Primero los prefijos más largos.
const PREFIJOS: [string, string][] = [
  ["593", "Ecuador"], ["591", "Bolivia"], ["595", "Paraguay"], ["598", "Uruguay"], ["502", "Guatemala"], ["503", "El Salvador"],
  ["504", "Honduras"], ["505", "Nicaragua"], ["506", "Costa Rica"], ["507", "Panamá"],
  ["34", "España"], ["54", "Argentina"], ["57", "Colombia"], ["58", "Venezuela"], ["52", "México"], ["56", "Chile"], ["51", "Perú"], ["53", "Cuba"],
  ["1", "EE. UU./Canadá"],
];
export function paisDeTelefono(tel: string | null | undefined) {
  const d = (tel ?? "").trim();
  if (!d.startsWith("+")) return "Otro";
  const n = d.replace(/\D/g, "");
  return PREFIJOS.find(([p]) => n.startsWith(p))?.[1] ?? "Otro";
}

export type LeadBiblioteca = { id: string; respuestas: Respuesta[]; telefono: string | null; oferta?: Oferta | null };
export const BUSCA_INGRESOS = ["Llegar a $5,000 al mes", "Cerrar mi primer cliente en USA"];

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);

// Todas las cifras del resumen y de la escalera de ofertas
export function resumenBiblioteca(leads: LeadBiblioteca[]) {
  const total = leads.length;
  const filas = leads.map((l) => ({ r: respuestasBiblioteca(l.respuestas), pais: paisDeTelefono(l.telefono), oferta: l.oferta ?? ofertaDe(respuestasBiblioteca(l.respuestas)) }));
  const reparto = (clave: keyof RespuestasBiblioteca) =>
    OPCIONES[clave].map((o) => {
      const n = filas.filter((f) => f.r[clave] === o.v).length;
      return { ...o, n, pct: pct(n, total) };
    });
  const cuenta = (f: (x: (typeof filas)[number]) => boolean) => filas.filter(f).length;
  const invierteYa = cuenta((f) => f.r.inversion === "Sí, ahora");
  const caliente = cuenta((f) => BUSCA_INGRESOS.includes(f.r.objetivo) && f.r.inversion === "Sí, ahora" && (f.r.inicio === "Ya mismo" || f.r.inicio === "Este mes"));
  const sinInversion = cuenta((f) => !f.r.inversion);
  const paises = [...new Map(filas.map((f) => [f.pais, 0])).keys()]
    .map((p) => ({ pais: p, n: cuenta((f) => f.pais === p) }))
    .filter((x) => x.pais !== "Otro")
    .sort((a, b) => b.n - a.n)
    .map((x) => ({ ...x, pct: pct(x.n, total) }));
  const porOferta = Object.fromEntries(OFERTAS.map((o) => [o.v, cuenta((f) => f.oferta === o.v)])) as Record<Oferta, number>;
  return {
    total,
    invierteYa: { n: invierteYa, pct: pct(invierteYa, total) },
    caliente: { n: caliente, pct: pct(caliente, total) },
    situacion: reparto("situacion"),
    experiencia: reparto("experiencia"),
    objetivo: reparto("objetivo"),
    buscaIngresos: pct(cuenta((f) => BUSCA_INGRESOS.includes(f.r.objetivo)), total),
    inicio: reparto("inicio"),
    inversion: reparto("inversion"),
    sinInversion: pct(sinInversion, total),
    tiempo: reparto("tiempo"),
    masDe10h: pct(cuenta((f) => f.r.tiempo === "10 a 20 h" || f.r.tiempo === "Más de 20 h"), total),
    paises,
    porOferta,
    // Escalera: Membresía = el resto · Grupal · VIP (con VIP + Empresas) · DFY (Empresas con VIP + Empresas)
    escalera: {
      membresia: { n: porOferta.membresia, pct: pct(porOferta.membresia, total) },
      grupal: { n: porOferta.grupal, pct: pct(porOferta.grupal, total) },
      vip: { n: porOferta.vip + porOferta.vip_empresas, pct: pct(porOferta.vip + porOferta.vip_empresas, total) },
      dfy: { n: porOferta.empresas + porOferta.vip_empresas, pct: pct(porOferta.empresas + porOferta.vip_empresas, total), inviertenYa: cuenta((f) => (f.oferta === "empresas" || f.oferta === "vip_empresas") && f.r.inversion === "Sí, ahora") },
    },
  };
}
