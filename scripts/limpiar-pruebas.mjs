// Borra los DATOS DE PRUEBA y deja los leads reales como recién importados.
// Sin --confirmar solo enseña lo que borraría. Es para el FINAL (decisión de Cristian, 9 oct 2026).
//
//   Simular:  node --env-file=.env.local scripts/limpiar-pruebas.mjs
//   Hacerlo:  node --env-file=.env.local scripts/limpiar-pruebas.mjs --confirmar
//   Incluir los usuarios de prueba (@eternity.test):  añade --borrar-usuarios-prueba
//     (solo se borran si ya existe un CEO real, para no quedarte sin poder entrar)
//
// Qué hace:
//  1. Borra los proyectos de prueba («Proyecto Prueba» y los TEST-AUTO de los tests).
//  2. Borra ventas, cobros, citas, reportes, recursos (y sus PDF), eventos de webhook
//     y el historial de actividad (menos el registro de importación).
//  3. Borra los leads de prueba (email terminado en «.test»).
//  4. Deja el resto de leads como recién importados: sin caller ni closer, estado «Nuevo»,
//     sin «llamar luego» y en la primera columna de su pipeline.
//  5. Borra columnas que no están en scripts/proyecto-base.json (p. ej. «Llamada 2»);
//     sus leads pasan a la primera columna.
//  6. Reinicia el turno del reparto rotativo.
import { createClient } from "@supabase/supabase-js";
import { BASE } from "./base-comun.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY (usa --env-file).");
const confirmar = process.argv.includes("--confirmar");
const conUsuarios = process.argv.includes("--borrar-usuarios-prueba");
const db = createClient(url, key, { auth: { persistSession: false } });
const PROYECTOS_PRUEBA = ["Proyecto Prueba"];

console.log(`Base de datos: ${url}\nModo: ${confirmar ? "BORRAR DE VERDAD" : "SIMULACIÓN (no cambia nada)"}\n`);

async function contar(tabla, filtro = (q) => q) {
  const { count, error } = await filtro(db.from(tabla).select("*", { count: "exact", head: true }));
  if (error) throw new Error(`${tabla}: ${error.message}`);
  return count ?? 0;
}
async function hacer(descripcion, n, accion) {
  console.log(`${n > 0 ? "-" : "="} ${descripcion}: ${n}`);
  if (confirmar && n > 0) {
    const { error } = await accion();
    if (error) throw new Error(`${descripcion}: ${error.message}`);
  }
}

// 1. Proyectos de prueba
const { data: proyectos } = await db.from("proyectos").select("id, nombre");
const dePrueba = proyectos.filter((p) => PROYECTOS_PRUEBA.includes(p.nombre) || p.nombre.startsWith("TEST-AUTO"));
await hacer(`Proyectos de prueba (${dePrueba.map((p) => p.nombre).join(", ") || "ninguno"})`, dePrueba.length, () =>
  db.from("proyectos").delete().in("id", dePrueba.map((p) => p.id))
);
const reales = proyectos.filter((p) => !dePrueba.includes(p));

// 2. Datos de actividad
await hacer("Ventas (y sus cobros)", await contar("ventas"), () => db.from("ventas").delete().not("id", "is", null));
await hacer("Citas", await contar("citas"), () => db.from("citas").delete().not("id", "is", null));
await hacer("Reportes de fin de día", await contar("reportes"), () => db.from("reportes").delete().not("id", "is", null));
await hacer("Eventos de webhook", await contar("webhook_eventos"), () => db.from("webhook_eventos").delete().not("id", "is", null));
await hacer("Historial de actividad (menos importaciones)", await contar("actividades", (q) => q.neq("tipo", "importacion")), () =>
  db.from("actividades").delete().neq("tipo", "importacion")
);
const { data: recursos } = await db.from("recursos").select("id, archivo_path");
await hacer("Recursos (y sus PDF)", recursos.length, async () => {
  const pdfs = recursos.map((r) => r.archivo_path).filter(Boolean);
  if (pdfs.length) await db.storage.from("recursos").remove(pdfs);
  return db.from("recursos").delete().not("id", "is", null);
});

// 3. Leads de prueba
await hacer("Leads de prueba (email *.test)", await contar("leads", (q) => q.like("email", "%.test")), () => db.from("leads").delete().like("email", "%.test"));

// 5. Columnas que no son de la configuración base
for (const proyecto of reales) {
  const { data: pipelines } = await db.from("pipelines").select("id, nombre, etapas(id, nombre, orden)").eq("proyecto_id", proyecto.id);
  for (const p of pipelines) {
    const base = BASE.pipelines.find((b) => b.nombre === p.nombre);
    if (!base) {
      console.log(`  (aviso) El pipeline «${p.nombre}» no está en proyecto-base.json: no lo toco`);
      continue;
    }
    const sobran = p.etapas.filter((e) => !base.columnas.includes(e.nombre));
    const primera = [...p.etapas].sort((a, b) => a.orden - b.orden).find((e) => base.columnas.includes(e.nombre));
    await hacer(`Columnas extra en «${p.nombre}» (${sobran.map((e) => e.nombre).join(", ") || "ninguna"})`, sobran.length, async () => {
      await db.from("leads").update({ etapa_id: primera?.id ?? null }).in("etapa_id", sobran.map((e) => e.id));
      return db.from("etapas").delete().in("id", sobran.map((e) => e.id));
    });
  }
}

// 4. Leads reales como recién importados
const tocados = await contar("leads", (q) => q.or("caller_id.not.is.null,closer_id.not.is.null,estado_caller.neq.nuevo,llamar_en.not.is.null"));
await hacer("Leads con asignaciones o estados de prueba (se dejan como nuevos)", tocados, () =>
  db.from("leads").update({ caller_id: null, closer_id: null, estado_caller: "nuevo", llamar_en: null }).or("caller_id.not.is.null,closer_id.not.is.null,estado_caller.neq.nuevo,llamar_en.not.is.null")
);
for (const proyecto of reales) {
  const { data: pipelines } = await db.from("pipelines").select("id, nombre, etapas(id, orden)").eq("proyecto_id", proyecto.id);
  for (const p of pipelines) {
    const primera = [...p.etapas].sort((a, b) => a.orden - b.orden)[0];
    if (!primera) continue;
    const fuera = await contar("leads", (q) => q.eq("pipeline_id", p.id).neq("etapa_id", primera.id));
    await hacer(`Leads de «${p.nombre}» que vuelven a la primera columna`, fuera, () =>
      db.from("leads").update({ etapa_id: primera.id }).eq("pipeline_id", p.id).neq("etapa_id", primera.id)
    );
  }
}

// 6. Turno del reparto
await hacer("Turno del reparto rotativo a cero", reales.length, () => db.from("proyectos").update({ rotacion_indice: 0 }).in("id", reales.map((p) => p.id)));

// Usuarios de prueba
const { data: perfiles } = await db.from("perfiles").select("id, email, rol");
const usuariosPrueba = perfiles.filter((p) => p.email.endsWith("@eternity.test"));
const ceoReal = perfiles.some((p) => p.rol === "ceo" && !p.email.endsWith("@eternity.test"));
if (!conUsuarios) {
  console.log(`= Usuarios de prueba (@eternity.test): ${usuariosPrueba.length} (no se tocan; añade --borrar-usuarios-prueba)`);
} else if (!ceoReal) {
  console.log(`! Usuarios de prueba: NO se borran porque todavía no hay un CEO real (te quedarías sin poder entrar). Crea antes el equipo con crear-usuarios.mjs.`);
} else {
  console.log(`- Usuarios de prueba (@eternity.test): ${usuariosPrueba.length}`);
  if (confirmar) for (const u of usuariosPrueba) await db.auth.admin.deleteUser(u.id);
}

const { count: quedan } = await db.from("leads").select("*", { count: "exact", head: true });
console.log(`\nLeads ${confirmar ? "que quedan" : "que quedarían"}: ${confirmar ? quedan : quedan - (await contar("leads", (q) => q.like("email", "%.test")))}`);
console.log(confirmar ? "Hecho." : "Simulación terminada. Para borrar de verdad, añade --confirmar.");
