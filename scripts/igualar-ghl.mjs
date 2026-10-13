// Deja los pipelines de origen de la app iguales que los de GHL (Cristian, 13 oct 2026): mismos nombres, mismo
// orden, mismas columnas («Cerrados» se queda en todos para cerrar soltando; Biblioteca no cambia de columnas)
// y cada lead en la columna que tiene en GHL. Si en GHL está en otro pipeline más, gana su tarjeta 🔗 allí.
// Sin --confirmar solo enseña lo que haría. Se puede ejecutar varias veces.
//
//   Simular:  CLAVE_CIFRADO=… node --env-file=.env.produccion scripts/igualar-ghl.mjs
//   Hacerlo:  CLAVE_CIFRADO=… node --env-file=.env.produccion scripts/igualar-ghl.mjs --confirmar
//
// Necesita el permiso «View Opportunities» en la Private Integration de GHL (puesto el 13 oct).
import { createClient } from "@supabase/supabase-js";
import { createDecipheriv } from "node:crypto";
import { BASE } from "./base-comun.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key || !process.env.CLAVE_CIFRADO) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY y CLAVE_CIFRADO.");
const confirmar = process.argv.includes("--confirmar");
const db = createClient(url, key, { auth: { persistSession: false } });
console.log(`Base de datos: ${url}\nModo: ${confirmar ? "CAMBIAR DE VERDAD" : "SIMULACIÓN (no cambia nada)"}\n`);

async function must(promise, que) {
  const { data, error } = await promise;
  if (error) throw new Error(`${que}: ${error.message}`);
  return data;
}
async function hacer(descripcion, accion) {
  console.log(`- ${descripcion}`);
  if (confirmar) await must(accion(), descripcion);
}
const norm = (s) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/^\d+\.\s*/, "").trim().toLowerCase();

// Nombre antiguo de cada pipeline y, por columna nueva, la columna de la app que se renombra (si la hay)
const ANTES = { "0. Agendas orgánico": "Orgánico", "1. Biblioteca Recursos": "Biblioteca Recursos", "2. Webinar 1": "Webinar 1", "3. DFY AI Services": "DFY AI Services" };
const RENOMBRAR = {
  "0. Agendas orgánico": { Form: "Nuevos", Agendan: "Agendados", Seguimiento: "En seguimiento", "No cualifican": "Descartados" },
  "2. Webinar 1": { Optin: "Nuevos" },
  "3. DFY AI Services": { Agendado: "Agendados" },
};
// En GHL la Biblioteca tiene «Registrados»; en la app se queda con sus columnas (Cristian) y esos leads van a «Nuevos»
const COLUMNA_APP = { "1. Biblioteca Recursos": { registrados: "Nuevos" } };

const [proyecto] = await must(db.from("proyectos").select("*").eq("nombre", BASE.proyecto.nombre), "proyecto");
const pipes = await must(db.from("pipelines").select("*").eq("proyecto_id", proyecto.id), "pipelines");

// 1 · Nombres y orden: los de GHL primero, luego Closers y Callers (como estaban entre ellos)
console.log("1 · Pipelines");
const destino = {};
for (const [i, p] of BASE.pipelines.entries()) {
  const pipe = pipes.find((x) => x.tipo === "normal" && (x.nombre === p.nombre || x.nombre === ANTES[p.nombre]));
  if (!pipe) throw new Error(`No encuentro el pipeline «${ANTES[p.nombre]}»`);
  destino[p.nombre] = pipe;
  if (pipe.nombre !== p.nombre || pipe.orden !== i) await hacer(`«${pipe.nombre}» → «${p.nombre}» (posición ${i + 1})`, () => db.from("pipelines").update({ nombre: p.nombre, orden: i }).eq("id", pipe.id));
}
const resto = pipes.filter((x) => x.tipo !== "normal").sort((a, b) => a.orden - b.orden);
for (const [j, pipe] of resto.entries()) {
  const orden = BASE.pipelines.length + j;
  if (pipe.orden !== orden) await hacer(`«${pipe.nombre}» a la posición ${orden + 1}`, () => db.from("pipelines").update({ orden }).eq("id", pipe.id));
}

// 2 · Columnas
console.log("\n2 · Columnas");
const etapasDe = {};
for (const [i, p] of BASE.pipelines.entries()) {
  const pipe = destino[p.nombre];
  const actuales = await must(db.from("etapas").select("*").eq("pipeline_id", pipe.id), "etapas");
  const usadas = new Set();
  const finales = [];
  for (const [orden, nombre] of p.columnas.entries()) {
    const previa = actuales.find((e) => e.nombre === nombre) ?? actuales.find((e) => e.nombre === RENOMBRAR[p.nombre]?.[nombre]);
    const color = BASE.colores[nombre === "Cerrados" ? 6 : orden % BASE.colores.length];
    if (previa) {
      usadas.add(previa.id);
      finales.push({ ...previa, nombre });
      if (previa.nombre !== nombre || previa.orden !== orden)
        await hacer(`${p.nombre}: «${previa.nombre}» → «${nombre}» (posición ${orden + 1})`, () => db.from("etapas").update({ nombre, orden }).eq("id", previa.id));
    } else {
      console.log(`+ ${p.nombre}: columna nueva «${nombre}» (posición ${orden + 1})`);
      if (confirmar) finales.push((await must(db.from("etapas").insert({ pipeline_id: pipe.id, nombre, orden, color }).select(), `crear ${nombre}`))[0]);
      else finales.push({ id: `nueva-${nombre}`, nombre });
    }
  }
  for (const e of actuales.filter((x) => !usadas.has(x.id))) {
    const { count: enLeads } = await db.from("leads").select("id", { count: "exact", head: true }).eq("etapa_id", e.id);
    const { count: enTarjetas } = await db.from("tarjetas_extra").select("id", { count: "exact", head: true }).eq("etapa_id", e.id);
    if (enLeads || enTarjetas) throw new Error(`«${p.nombre} → ${e.nombre}» tiene ${enLeads} leads y ${enTarjetas} tarjetas: no la quito (revisar a mano)`);
    await hacer(`${p.nombre}: quitar «${e.nombre}» (vacía)`, () => db.from("etapas").delete().eq("id", e.id));
  }
  etapasDe[pipe.id] = finales;
  void i;
}

// 3 · Cada lead en su columna de GHL
console.log("\n3 · Leads");
const clave = Buffer.from(process.env.CLAVE_CIFRADO, "base64");
const cifrado = Buffer.from(proyecto.ghl_token.slice(3), "base64");
const d = createDecipheriv("aes-256-gcm", clave, cifrado.subarray(0, 12));
d.setAuthTag(cifrado.subarray(12, 28));
const token = Buffer.concat([d.update(cifrado.subarray(28)), d.final()]).toString("utf8");
const ghl = async (ruta) => {
  const r = await fetch(`https://services.leadconnectorhq.com${ruta}`, { headers: { Authorization: `Bearer ${token}`, Version: "2021-07-28" } });
  if (!r.ok) throw new Error(`GHL ${r.status} en ${ruta.split("?")[0]}`);
  return r.json();
};
const { pipelines: pipesGhl } = await ghl(`/opportunities/pipelines?locationId=${proyecto.ghl_location_id}`);

const leads = [];
for (let a = 0; ; a += 1000) {
  const pag = await must(db.from("leads").select("id, nombre, email, telefono, ghl_contact_id, pipeline_id, etapa_id").eq("proyecto_id", proyecto.id).order("id").range(a, a + 999), "leads");
  leads.push(...pag);
  if (pag.length < 1000) break;
}
const tel9 = (t) => (t ?? "").replace(/\D/g, "").slice(-9);
const porContacto = new Map(), porEmail = new Map(), porTel = new Map();
for (const l of leads) {
  if (l.ghl_contact_id) porContacto.set(l.ghl_contact_id, l);
  if (l.email) porEmail.set(l.email.toLowerCase(), l);
  if (tel9(l.telefono).length === 9) porTel.set(tel9(l.telefono), l);
}
const tarjetas = await must(db.from("tarjetas_extra").select("lead_id, pipeline_id, etapa_id").eq("proyecto_id", proyecto.id), "tarjetas");
const tarjeta = new Map(tarjetas.map((t) => [`${t.lead_id}|${t.pipeline_id}`, t]));

const resumen = { moverPrincipal: 0, tarjetaNueva: 0, moverTarjeta: 0, iguales: 0, sinLead: [], sinColumna: [] };
const vistos = new Set();
for (const pg of pipesGhl) {
  // Por el nombre nuevo (sin número ni tildes: GHL tenía «órganico»)
  const nombreBase = BASE.pipelines.find((p) => norm(p.nombre) === norm(pg.name))?.nombre;
  const pipe = nombreBase && destino[nombreBase];
  if (!pipe) { console.log(`! El pipeline de GHL «${pg.name}» no está en la app: se salta`); continue; }
  for (let page = 1; ; page++) {
    const r = await ghl(`/opportunities/search?location_id=${proyecto.ghl_location_id}&pipeline_id=${pg.id}&limit=100&page=${page}`);
    for (const o of r.opportunities ?? []) {
      const lead = porContacto.get(o.contactId) ?? porEmail.get((o.contact?.email ?? "").toLowerCase()) ?? porTel.get(tel9(o.contact?.phone));
      if (!lead) { resumen.sinLead.push(`${pg.name}: ${o.contact?.name ?? o.name}`); continue; }
      if (vistos.has(`${lead.id}|${pipe.id}`)) continue; // dos oportunidades de la misma persona en el mismo pipeline: cuenta una
      vistos.add(`${lead.id}|${pipe.id}`);
      const etapaGhl = pg.stages.find((s) => s.id === o.pipelineStageId)?.name ?? "";
      const nombreApp = COLUMNA_APP[nombreBase]?.[norm(etapaGhl)] ?? etapaGhl;
      const etapa = etapasDe[pipe.id].find((e) => norm(e.nombre) === norm(nombreApp));
      if (!etapa) { resumen.sinColumna.push(`${pg.name} → «${etapaGhl}»: ${lead.nombre}`); continue; }
      if (lead.pipeline_id === pipe.id) {
        if (lead.etapa_id === etapa.id) { resumen.iguales++; continue; }
        resumen.moverPrincipal++;
        if (confirmar) await must(db.from("leads").update({ etapa_id: etapa.id }).eq("id", lead.id), "mover lead");
      } else {
        const t = tarjeta.get(`${lead.id}|${pipe.id}`);
        if (t?.etapa_id === etapa.id) { resumen.iguales++; continue; }
        if (t) resumen.moverTarjeta++; else resumen.tarjetaNueva++;
        if (confirmar) await must(db.from("tarjetas_extra").upsert({ proyecto_id: proyecto.id, lead_id: lead.id, pipeline_id: pipe.id, etapa_id: etapa.id }, { onConflict: "lead_id,pipeline_id" }), "tarjeta");
      }
    }
    if ((r.opportunities ?? []).length < 100) break;
  }
}
console.log(`- Leads que cambian de columna en su pipeline: ${resumen.moverPrincipal}`);
console.log(`- Tarjetas 🔗 nuevas en otro pipeline: ${resumen.tarjetaNueva}`);
console.log(`- Tarjetas 🔗 que cambian de columna: ${resumen.moverTarjeta}`);
console.log(`= Ya estaban bien: ${resumen.iguales}`);
if (resumen.sinLead.length) console.log(`! En GHL pero no en la app (${resumen.sinLead.length}):\n   ${resumen.sinLead.join("\n   ")}`);
if (resumen.sinColumna.length) console.log(`! Columna de GHL que no existe en la app (${resumen.sinColumna.length}):\n   ${resumen.sinColumna.join("\n   ")}`);

// 4 · Leads con cita de GHL → «Agendan» (es la misma columna que «Agendados», renombrada: se comprueba)
const agendan = etapasDe[destino["0. Agendas orgánico"].id].find((e) => e.nombre === "Agendan");
console.log(`\n4 · Columna de citas de GHL: ${proyecto.etapa_citas_ghl === agendan?.id ? "ya es «0. Agendas orgánico → Agendan»" : "se pone en «0. Agendas orgánico → Agendan»"}`);
if (proyecto.etapa_citas_ghl !== agendan?.id && confirmar) await must(db.from("proyectos").update({ etapa_citas_ghl: agendan.id }).eq("id", proyecto.id), "columna de citas");
console.log(confirmar ? "\nHecho." : "\nSimulación: no se ha cambiado nada. Añade --confirmar para hacerlo.");
