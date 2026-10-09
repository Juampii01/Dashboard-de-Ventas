// Prepara el proyecto Maestria (pipelines, columnas y productos) en la base de datos que digas.
// NO crea usuarios de prueba. Sin --confirmar solo enseña lo que haría.
//
//   Simular:  node --env-file=.env.produccion scripts/preparar-proyecto.mjs
//   Hacerlo:  node --env-file=.env.produccion scripts/preparar-proyecto.mjs --confirmar
import { createClient } from "@supabase/supabase-js";
import { asegurarProyectoBase } from "./base-comun.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY (usa --env-file).");
const confirmar = process.argv.includes("--confirmar");
console.log(`Base de datos: ${url}\nModo: ${confirmar ? "CREAR DE VERDAD" : "SIMULACIÓN (no cambia nada)"}\n`);
const db = createClient(url, key, { auth: { persistSession: false } });
await asegurarProyectoBase(db, { simular: !confirmar });
console.log(confirmar ? "\nHecho." : "\nSimulación terminada. Para hacerlo de verdad, añade --confirmar.");
