"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { anotar, bloqueado } from "@/lib/limite";
import { createSessionClient } from "@/lib/supabase/server";

export async function iniciarSesion(_prev: { error: string; email?: string }, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Escribe tu email y tu contraseña.", email };

  // Frenar a quien prueba contraseñas: 8 fallos por email y 40 por conexión cada 15 minutos
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const quince = 15 * 60_000;
  if (bloqueado(`login:email:${email}`, 8, quince) || bloqueado(`login:ip:${ip}`, 40, quince)) {
    return { error: "Demasiados intentos fallidos. Espera 15 minutos y vuelve a probar.", email };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    anotar(`login:email:${email}`);
    anotar(`login:ip:${ip}`);
    return { error: "Email o contraseña incorrectos.", email };
  }
  redirect("/");
}

export async function cerrarSesion() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/login");
}
