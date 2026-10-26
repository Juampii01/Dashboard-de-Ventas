// 1b · P3 (Cristian, 26 oct 2026): pone el país (sacado del teléfono) a los leads que ya había antes de guardarlo.
// Solo toca los leads con teléfono y sin país; se puede volver a lanzar cuando haga falta (p. ej. si un lead salió
// sin país). Sin --confirmar solo enseña lo que haría.
//
//   Simular:  node --env-file=.env.produccion scripts/rellenar-pais.mjs
//   Hacerlo:  node --env-file=.env.produccion scripts/rellenar-pais.mjs --confirmar
//
// Para no cargar la base: va de tu Mac directo a Supabase (nada pasa por Vercel), lee de 1.000 en 1.000 y escribe
// una vez por país en tandas de 500 (función rellenar_pais de la migración 20261026120000_pais_leads.sql), con una
// pausa de 0,25 s entre escrituras. Con los 3.345 leads del 26 oct: ~4 lecturas y ~45 escrituras.
import { createClient } from "@supabase/supabase-js";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY (usa --env-file).");
const confirmar = process.argv.includes("--confirmar");
const db = createClient(url, key, { auth: { persistSession: false } });
console.log(`Base de datos: ${url}\nModo: ${confirmar ? "GUARDAR DE VERDAD" : "SIMULACIÓN (no cambia nada)"}\n`);

// La misma regla que paisDe() en src/lib/pais.ts (allí es solo del servidor y en TypeScript; si cambia una, cambiar la otra)
const SIN_PAIS = "Sin país";
function paisDe(telefono) {
  const t = (telefono ?? "").trim();
  if (!t.startsWith("+")) return SIN_PAIS;
  return parsePhoneNumberFromString(t)?.country ?? SIN_PAIS;
}
const nombre = new Intl.DisplayNames(["es"], { type: "region" });
const nombrePais = (p) => (p === SIN_PAIS ? SIN_PAIS : nombre.of(p) ?? p);
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

async function leerPendientes() {
  const filas = [];
  for (let i = 0; ; i += 1000) {
    const { data, error } = await db.from("leads").select("id, proyecto_id, telefono").not("telefono", "is", null).is("pais", null).order("id").range(i, i + 999);
    if (error) throw new Error(`Leyendo leads: ${error.message}`);
    filas.push(...data);
    if (data.length < 1000) return filas;
  }
}

const { data: proyectos, error: errP } = await db.from("proyectos").select("id, nombre");
if (errP) throw new Error(`Leyendo proyectos: ${errP.message}`);
const nombreProyecto = new Map(proyectos.map((p) => [p.id, p.nombre]));

const pendientes = await leerPendientes();
const porPais = new Map();
for (const l of pendientes) {
  const p = paisDe(l.telefono);
  if (!porPais.has(p)) porPais.set(p, []);
  porPais.get(p).push(l);
}

console.log(`Leads con teléfono y sin país: ${pendientes.length}`);
const porProyecto = new Map();
for (const l of pendientes) porProyecto.set(l.proyecto_id, (porProyecto.get(l.proyecto_id) ?? 0) + 1);
for (const [id, n] of porProyecto) console.log(`  · ${nombreProyecto.get(id) ?? id}: ${n}`);
console.log("\nPor país:");
for (const [p, ls] of [...porPais].sort((a, b) => b[1].length - a[1].length)) console.log(`  ${String(ls.length).padStart(5)}  ${nombrePais(p)}${p === SIN_PAIS ? "" : ` (${p})`}`);

if (!confirmar) {
  const tandas = [...porPais.values()].reduce((s, ls) => s + Math.ceil(ls.length / 500), 0);
  console.log(`\nHaría ${tandas} escrituras. Para guardarlo, vuelve a lanzarlo con --confirmar.`);
  process.exit(0);
}

let cambiados = 0;
let escrituras = 0;
for (const [p, ls] of porPais) {
  for (let i = 0; i < ls.length; i += 500) {
    const tanda = ls.slice(i, i + 500);
    const { data, error } = await db.rpc("rellenar_pais", { p_ids: tanda.map((l) => l.id), p_telefonos: tanda.map((l) => l.telefono), p_pais: p });
    if (error) throw new Error(`Guardando «${nombrePais(p)}»: ${error.message} (guardados hasta aquí: ${cambiados}; se puede volver a lanzar)`);
    cambiados += data;
    escrituras++;
    await pausa(250);
  }
}
const quedan = await leerPendientes();
console.log(`\nHecho: ${cambiados} leads con su país, en ${escrituras} escrituras.`);
console.log(`Quedan con teléfono y sin país: ${quedan.length}${quedan.length ? " (cambiaron de teléfono mientras corría: vuelve a lanzarlo)" : ""}.`);
