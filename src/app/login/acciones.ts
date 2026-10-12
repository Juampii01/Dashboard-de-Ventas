"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { anotar, bloqueado, dentroDelLimite } from "@/lib/limite";
import { db } from "@/lib/datos";
import { mandarEnlace } from "@/lib/acceso";
import { createSessionClient } from "@/lib/supabase/server";

export async function iniciarSesion(_prev: { error: string; email?: string }, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Escribe tu email y tu contraseña.", email };

  // Frenar a quien prueba contraseñas: 8 fallos por email y 40 por conexión cada 15 minutos
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const quince = 15 * 60_000;
  const [porEmail, porIp] = await Promise.all([bloqueado(`login:email:${email}`, 8, quince), bloqueado(`login:ip:${ip}`, 40, quince)]);
  if (porEmail || porIp) {
    return { error: "Demasiados intentos fallidos. Espera 15 minutos y vuelve a probar.", email };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    await Promise.all([anotar(`login:email:${email}`), anotar(`login:ip:${ip}`)]);
    return { error: "Email o contraseña incorrectos.", email };
  }
  redirect("/");
}

export async function cerrarSesion() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Fase 1 (Cristian, 12 oct 2026): «¿No puedes entrar?». La persona pone su email y, si es de alguien activo del
// equipo, le llega un enlace para entrar (24 h, un solo uso) y crear o cambiar su contraseña. La respuesta es
// siempre la misma, exista o no el email, para no revelar quién está en el equipo. Límite: 3 por email y 10 por
// conexión cada hora.
export async function pedirEnlace(_prev: { mensaje: string; error: string }, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return { mensaje: "", error: "Escribe tu email." };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const hora = 60 * 60_000;
  const [okEmail, okIp] = await Promise.all([dentroDelLimite(`enlace:email:${email}`, 3, hora), dentroDelLimite(`enlace:ip:${ip}`, 10, hora)]);
  if (!okEmail || !okIp) return { mensaje: "", error: "Has pedido demasiados enlaces. Espera una hora o habla con tu director." };
  const { data: p } = await db().from("perfiles").select("nombre, email, activo").eq("email", email).maybeSingle();
  if (p?.activo) {
    const r = await mandarEnlace(p, "pedido");
    if (!r.enviado) console.error("[pedir enlace] no se pudo enviar:", r.motivo);
  }
  return { mensaje: "Si ese email es de alguien del equipo, te acabamos de mandar un enlace para entrar (dura 24 horas). Mira también en spam.", error: "" };
}
