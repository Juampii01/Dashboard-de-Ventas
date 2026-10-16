import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dentroDelLimite } from "@/lib/limite";
import { sincronizarCalendarios } from "@/lib/ghl-sync";

// Plan GHL, fase 3 (Cristian, 16 oct 2026): el programador de Supabase llama aquí cada 30 s para leer las citas
// de GHL (migración 20261017120000_leer_ghl_cada_30s.sql). Misma clave que el webhook (la del proyecto, en la
// cabecera x-eternity-secreto): así no hay otra clave que guardar en Vercel.

export const maxDuration = 60;

function igual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function POST(request: NextRequest, ctx: RouteContext<"/api/ghl/leer/[proyectoId]">) {
  const { proyectoId } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(proyectoId)) return NextResponse.json({ ok: false }, { status: 404 });
  const secreto = request.headers.get("x-eternity-secreto") ?? "";
  const { data: proyecto } = await createAdminClient().from("proyectos").select("id, webhook_secreto").eq("id", proyectoId).maybeSingle();
  if (!proyecto || !secreto || !igual(secreto, proyecto.webhook_secreto)) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!(await dentroDelLimite(`ghl-leer-fallo:${ip}`, 30, 15 * 60_000))) return NextResponse.json({ ok: false, error: "Demasiados intentos" }, { status: 429 });
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }
  // Como mucho una lectura cada 25 s por proyecto (si una tarda, la siguiente no se monta encima)
  if (!(await dentroDelLimite(`ghl-leer:${proyectoId}`, 1, 25_000))) return NextResponse.json({ ok: true, saltada: true });
  try {
    const r = await sincronizarCalendarios(proyectoId);
    if (r.errores.length) console.error("[ghl-leer]", proyectoId, r.errores.slice(0, 3).join(" | "));
    return NextResponse.json({ ok: true, nuevas: r.nuevas, actualizadas: r.actualizadas, canceladas: r.canceladas, errores: r.errores.length });
  } catch (e) {
    console.error("[ghl-leer]", proyectoId, e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "No se pudo leer GHL" }, { status: 500 });
  }
}
