import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Perfil, Proyecto } from "@/lib/tipos";

// Sesión del usuario: separada de los permisos para poder simularla en los tests.
export const COOKIE_PROYECTO = "eternity_proyecto";

export type Sesion = {
  perfil: Perfil;
  proyectos: Proyecto[];
  proyecto: Proyecto;
};

// Lee el usuario, su perfil y sus proyectos. Una sola vez por petición.
export const getSesion = cache(async (): Promise<Sesion> => {
  const t0 = performance.now(); // MEDICIÓN TEMPORAL (17 oct 2026): se quita al acabar
  const supabase = await createSessionClient();
  // Velocidad (17 oct 2026): verificación local de la sesión (ver src/proxy.ts), sin preguntar a Supabase
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  const t1 = performance.now();
  const s = await sesionDe(userId);
  console.log(`[tiempos] sesion · claims ${Math.round(t1 - t0)} · perfil+proyectos ${Math.round(performance.now() - t1)}`);
  return s;
});

// MEDICIÓN TEMPORAL (17 oct 2026): cronómetro para el layout del panel (fuera del componente por la regla de pureza)
export function cronometroTemporal() {
  const t0 = performance.now();
  return () => Math.round(performance.now() - t0);
}

// El perfil y los proyectos de una persona (también lo usa el login, para ir directo a su sección; 17 oct 2026)
export async function sesionDe(userId: string): Promise<Sesion> {
  const db = createAdminClient();
  // Velocidad (17 oct 2026): las 3 consultas a la vez (antes, perfil y después sus proyectos; medido 41–100 ms en
  // todas las páginas). Se piden los dos tipos de proyectos y se usa el que toca según el rol: mismo resultado y orden.
  const [{ data: perfil }, { data: todos }, { data: suyos }] = await Promise.all([
    db.from("perfiles").select("*").eq("id", userId).single<Perfil>(),
    db.from("proyectos").select("*").order("creado_en"),
    db.from("miembros_proyecto").select("proyectos(*)").eq("perfil_id", userId),
  ]);
  if (!perfil || !perfil.activo) redirect("/login?error=sin-acceso");

  const proyectos: Proyecto[] =
    perfil.rol === "ceo"
      ? ((todos ?? []) as Proyecto[])
      : ((suyos ?? []) as unknown as { proyectos: Proyecto }[]).map((m) => m.proyectos);
  if (proyectos.length === 0) redirect("/login?error=sin-proyecto");

  const elegido = (await cookies()).get(COOKIE_PROYECTO)?.value;
  const proyecto = proyectos.find((p) => p.id === elegido) ?? proyectos[0];
  return { perfil, proyectos, proyecto };
}
