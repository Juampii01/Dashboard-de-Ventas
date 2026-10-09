// Datos iniciales para trabajar en LOCAL.
// Uso: node --env-file=.env.local scripts/seed.mjs
// Crea el proyecto Maestria (pipelines y productos) y los usuarios de PRUEBA.
// Se puede ejecutar varias veces: no duplica nada.
import { createClient } from "@supabase/supabase-js";
import { asegurarProyectoBase } from "./base-comun.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Faltan variables en .env.local");
if (!url.includes("127.0.0.1") && !url.includes("localhost")) {
  throw new Error("Este seed solo se ejecuta contra Supabase LOCAL.");
}
const db = createClient(url, key, { auth: { persistSession: false } });

// Usuarios de PRUEBA (solo local). Contraseña común para todos.
export const PASSWORD_PRUEBA = "Eternity-prueba-2026";
const USUARIOS = [
  { email: "ceo@eternity.test", nombre: "CEO Prueba", rol: "ceo" },
  { email: "director@eternity.test", nombre: "Director Prueba", rol: "director", admin_activo: true },
  { email: "closer1@eternity.test", nombre: "Ana Closer", rol: "closer" },
  { email: "closer2@eternity.test", nombre: "Bruno Closer", rol: "closer" },
  { email: "caller1@eternity.test", nombre: "Carla Caller", rol: "caller" },
  { email: "caller2@eternity.test", nombre: "Diego Caller", rol: "caller" },
  { email: "caller3@eternity.test", nombre: "Elena Caller", rol: "caller" },
];

async function must(promise, que) {
  const { data, error } = await promise;
  if (error) throw new Error(`${que}: ${error.message}`);
  return data;
}

// 1. Proyecto, pipelines y productos (mismo código que en producción)
const proyecto = await asegurarProyectoBase(db);

// 2. Usuarios
const { data: lista } = await db.auth.admin.listUsers({ perPage: 200 });
for (const [i, u] of USUARIOS.entries()) {
  let authUser = lista.users.find((x) => x.email === u.email);
  if (!authUser) {
    const { data, error } = await db.auth.admin.createUser({
      email: u.email,
      password: PASSWORD_PRUEBA,
      email_confirm: true,
    });
    if (error) throw new Error(`crear ${u.email}: ${error.message}`);
    authUser = data.user;
  }
  await must(
    db.from("perfiles").upsert({
      id: authUser.id,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      admin_activo: u.admin_activo ?? false,
      onboarding_completo: true,
    }),
    `perfil ${u.email}`
  );
  await must(
    db.from("miembros_proyecto").upsert({ proyecto_id: proyecto.id, perfil_id: authUser.id, orden: i }),
    `miembro ${u.email}`
  );
  console.log("Usuario:", u.email, `(${u.rol})`);
}

console.log("\nListo. Contraseña de todos los usuarios de prueba:", PASSWORD_PRUEBA);
