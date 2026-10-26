// Leads de los grupos de WhatsApp (Cristian, 26 oct 2026): los mete en Maestria, en un pipeline nuevo «Leads WhatsApp».
// Sin --confirmar solo enseña lo que haría. Se puede volver a lanzar: no duplica leads ni tarjetas.
//
//   Simular:  node --env-file=.env.produccion scripts/importar-leads-whatsapp.mjs ../leads_whatsapp.csv
//   Hacerlo:  node --env-file=.env.produccion scripts/importar-leads-whatsapp.mjs ../leads_whatsapp.csv --confirmar
//
// Decisiones de Cristian (26 oct):
//  - Pipeline «Leads WhatsApp» con: Grupo 1 · Grupo 2 · Grupo 3 · Grupo 4 · Agendados · En seguimiento · Descartados · Cerrados.
//  - Cada persona, en la columna de su grupo; si está en varios, en la del número más alto. Etiqueta «leads whatsapp» y
//    una por cada grupo («grupo 2», «grupo 3»…).
//  - Nombre solo si tiene letras (el resto vacío: «.» o «..» no sirven).
//  - Los que ya están en el CRM (mismas últimas 9 cifras del teléfono, como reconoce la app a un lead sin email): se
//    quedan en su pipeline, con su nombre, teléfono y caller; ganan las etiquetas y una tarjeta 🔗 en «Leads WhatsApp».
//    Si un teléfono coincide con dos leads (duplicados en el CRM), los dos.
// Para no cargar la base: va directo a Supabase (nada por Vercel); los nuevos, de 500 en 500; las etiquetas de los que ya
// estaban, de una en una con 0,2 s de pausa (~5 por segundo).
import { readFileSync } from "node:fs";
import Papa from "papaparse";
import { createClient } from "@supabase/supabase-js";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY (usa --env-file).");
const archivo = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!archivo) throw new Error("Falta el CSV: node … scripts/importar-leads-whatsapp.mjs ../leads_whatsapp.csv");
const confirmar = process.argv.includes("--confirmar");
const db = createClient(url, key, { auth: { persistSession: false } });
console.log(`Base de datos: ${url}\nModo: ${confirmar ? "GUARDAR DE VERDAD" : "SIMULACIÓN (no cambia nada)"}\n`);

const PROYECTO = "Maestria";
const PIPELINE = "Leads WhatsApp";
const ETIQUETA = "leads whatsapp";
const COLUMNAS = [
  { nombre: "Grupo 1", color: "#64748b" },
  { nombre: "Grupo 2", color: "#0891b2" },
  { nombre: "Grupo 3", color: "#7c3aed" },
  { nombre: "Grupo 4", color: "#db2777" },
  { nombre: "Agendados", color: "#2f55d4" },
  { nombre: "En seguimiento", color: "#d97706" },
  { nombre: "Descartados", color: "#dc2626" },
  // Unida a «Vendido»: soltar ahí abre «Registrar venta» (como en los demás pipelines de origen)
  { nombre: "Cerrados", color: "#16a34a", estado_caller: "vendido" },
];

// Las mismas reglas que la app: telefonoClave() de src/lib/leads.ts y paisDe() de src/lib/pais.ts
const SIN_PAIS = "Sin país";
const clave = (t) => {
  const d = String(t ?? "").replace(/\D/g, "");
  return d.length >= 9 ? d.slice(-9) : d;
};
const paisDe = (t) => {
  const s = String(t ?? "").trim();
  return s.startsWith("+") ? parsePhoneNumberFromString(s)?.country ?? SIN_PAIS : SIN_PAIS;
};
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
async function must(promesa, que) {
  const { data, error } = await promesa;
  if (error) throw new Error(`${que}: ${error.message}`);
  return data;
}

// 1. El CSV
const filas = Papa.parse(readFileSync(archivo, "utf8").replace(/^﻿/, ""), { header: true, skipEmptyLines: true }).data;
const personas = filas.map((f, i) => {
  const telefono = String(f.telefono_con_mas ?? "").trim();
  const grupos = [...new Set([...String(f.grupos ?? "").matchAll(/Grupo\s*(\d)/gi)].map((m) => Number(m[1])))].sort();
  const nombreTxt = String(f.nombre ?? "").trim();
  const [nombre = "", ...resto] = /\p{L}{2,}/u.test(nombreTxt) ? nombreTxt.split(/\s+/) : [];
  if (!telefono || !grupos.length) throw new Error(`Fila ${i + 2}: falta el teléfono o el grupo`);
  return { telefono, grupos, columna: `Grupo ${Math.max(...grupos)}`, etiquetas: [ETIQUETA, ...grupos.map((g) => `grupo ${g}`)], nombre, apellido: resto.join(" ") };
});
console.log(`CSV: ${personas.length} personas · con nombre: ${personas.filter((p) => p.nombre).length}`);

// 2. Proyecto y pipeline (con sus columnas)
const proyecto = (await must(db.from("proyectos").select("id, nombre").eq("nombre", PROYECTO), "proyecto"))[0];
if (!proyecto) throw new Error(`No existe el proyecto «${PROYECTO}»`);
let pipeline = (await must(db.from("pipelines").select("id").eq("proyecto_id", proyecto.id).eq("nombre", PIPELINE), "pipeline"))[0] ?? null;
let etapas = pipeline ? await must(db.from("etapas").select("id, nombre").eq("pipeline_id", pipeline.id), "columnas") : [];
console.log(`Pipeline «${PIPELINE}»: ${pipeline ? "ya existe" : "se crea"} (${COLUMNAS.map((c) => c.nombre).join(" · ")})`);
if (!pipeline && confirmar) {
  const pipes = await must(db.from("pipelines").select("orden").eq("proyecto_id", proyecto.id), "pipelines");
  pipeline = await must(db.from("pipelines").insert({ proyecto_id: proyecto.id, nombre: PIPELINE, orden: Math.max(0, ...pipes.map((p) => p.orden ?? 0)) + 1 }).select("id").single(), "crear pipeline");
}
if (pipeline && confirmar) {
  const faltan = COLUMNAS.map((c, orden) => ({ ...c, orden })).filter((c) => !etapas.some((e) => e.nombre === c.nombre));
  if (faltan.length) await must(db.from("etapas").insert(faltan.map((c) => ({ pipeline_id: pipeline.id, ...c }))), "crear columnas");
  etapas = await must(db.from("etapas").select("id, nombre").eq("pipeline_id", pipeline.id), "columnas");
}
const etapaDe = (nombre) => etapas.find((e) => e.nombre === nombre)?.id ?? null;

// 3. Los que ya están en el CRM (por las últimas 9 cifras del teléfono)
const existentes = new Map();
for (let i = 0; ; i += 1000) {
  const data = await must(db.from("leads").select("id, telefono_clave, pipeline_id, etiquetas").eq("proyecto_id", proyecto.id).neq("telefono_clave", "").order("id").range(i, i + 999), "leads");
  for (const l of data) existentes.set(l.telefono_clave, [...(existentes.get(l.telefono_clave) ?? []), l]);
  if (data.length < 1000) break;
}
const yaEstan = personas.filter((p) => existentes.has(clave(p.telefono)));
const nuevos = personas.filter((p) => !existentes.has(clave(p.telefono)));
const leadsYa = yaEstan.flatMap((p) => existentes.get(clave(p.telefono)).map((l) => ({ p, l })));
const conTarjeta = leadsYa.filter(({ l }) => !pipeline || l.pipeline_id !== pipeline.id);
const cambianEtiquetas = leadsYa.filter(({ p, l }) => p.etiquetas.some((e) => !(l.etiquetas ?? []).includes(e)));
const porColumna = (lista) => Object.fromEntries(COLUMNAS.slice(0, 4).map((c) => [c.nombre, lista.filter((p) => p.columna === c.nombre).length]));

console.log(`\nYa están en el CRM: ${yaEstan.length} personas (${leadsYa.length} leads; ${leadsYa.length - yaEstan.length} de más por duplicados del CRM)`);
console.log(`  · ganan las etiquetas: ${cambianEtiquetas.length} · tarjeta 🔗 en «${PIPELINE}»: ${conTarjeta.length}`);
console.log(`  · por columna: ${JSON.stringify(porColumna(yaEstan))}`);
console.log(`Nuevos: ${nuevos.length} · por columna: ${JSON.stringify(porColumna(nuevos))}`);
const paises = {};
for (const p of nuevos) paises[paisDe(p.telefono)] = (paises[paisDe(p.telefono)] ?? 0) + 1;
console.log(`  · países: ${Object.entries(paises).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${v}`).join(" · ")}…`);

if (!confirmar) {
  console.log(`\nEscrituras: ~${2 + Math.ceil(nuevos.length / 500) * 2 + cambianEtiquetas.length + Math.ceil(conTarjeta.length / 500) * 2} (tardará ~${Math.ceil(cambianEtiquetas.length * 0.2 / 60)} min). Para guardarlo, vuelve a lanzarlo con --confirmar.`);
  process.exit(0);
}

// 4. Los nuevos
let insertados = 0;
for (let i = 0; i < nuevos.length; i += 500) {
  const lote = nuevos.slice(i, i + 500).map((p) => ({
    proyecto_id: proyecto.id,
    nombre: p.nombre,
    apellido: p.apellido,
    telefono: p.telefono,
    pais: paisDe(p.telefono),
    pais_de: p.telefono,
    etiquetas: p.etiquetas,
    origen: "csv",
    pipeline_id: pipeline.id,
    etapa_id: etapaDe(p.columna),
  }));
  const data = await must(db.from("leads").insert(lote).select("id"), "guardar nuevos");
  await must(db.from("actividades").insert(data.map((d) => ({ proyecto_id: proyecto.id, lead_id: d.id, tipo: "importacion", nota: "Importado desde CSV (grupos de WhatsApp)" }))), "historial de nuevos");
  insertados += data.length;
  await pausa(250);
}

// 5. Los que ya estaban: etiquetas (sin quitar ninguna) y tarjeta 🔗 en la columna de su grupo
let etiquetados = 0;
for (const { p, l } of cambianEtiquetas) {
  await must(db.from("leads").update({ etiquetas: [...new Set([...(l.etiquetas ?? []), ...p.etiquetas])] }).eq("id", l.id), "etiquetas");
  etiquetados++;
  await pausa(200);
}
let tarjetas = 0;
for (let i = 0; i < conTarjeta.length; i += 500) {
  const trozo = conTarjeta.slice(i, i + 500);
  const data = await must(db.from("tarjetas_extra").upsert(trozo.map(({ p, l }) => ({ proyecto_id: proyecto.id, lead_id: l.id, pipeline_id: pipeline.id, etapa_id: etapaDe(p.columna) })), { onConflict: "lead_id,pipeline_id", ignoreDuplicates: true }).select("lead_id"), "tarjetas");
  await must(db.from("actividades").insert(data.map((d) => ({ proyecto_id: proyecto.id, lead_id: d.lead_id, tipo: "nota", nota: `Añadido a «${PIPELINE}» (grupos de WhatsApp)` }))), "historial de tarjetas");
  tarjetas += data.length;
  await pausa(250);
}

console.log(`\nHecho: ${insertados} nuevos · ${etiquetados} ya existentes con sus etiquetas · ${tarjetas} tarjetas 🔗 nuevas.`);
