"use server";

import { ErrorUsuario, seguro } from "@/lib/resultado";
import { revalidatePath } from "next/cache";
import { exigir, puedeAdmin, puedeCrearProyectos } from "@/lib/auth";
import { db } from "@/lib/datos";
import { cifrar, descifrar } from "@/lib/cifrado";
import { reglasValidas } from "@/lib/entrada";
import { SECCIONES } from "@/lib/permisos";
import { horarioValido } from "@/lib/horarios";
import type { Rol } from "@/lib/tipos";

const ROLES: Rol[] = ["ceo", "director", "closer", "caller"];
type Res = { ok?: string; error?: string } | null;
const refrescar = () => revalidatePath("/", "layout");
const texto = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

// ---------- Equipo ----------
export async function crearUsuario(_prev: Res, fd: FormData): Promise<Res> {
  try {
    const { perfil, proyecto } = await exigir(puedeAdmin);
    const email = texto(fd, "email").toLowerCase();
    const nombre = texto(fd, "nombre");
    const rol = texto(fd, "rol") as Rol;
    const password = String(fd.get("password") ?? "");
    if (!nombre || !email) return { error: "Nombre y email son obligatorios." };
    if (!ROLES.includes(rol)) return { error: "Rol no válido." };
    if (rol === "ceo" && perfil.rol !== "ceo") return { error: "Solo el CEO puede crear otro CEO." };
    if (password.length < 8) return { error: "La contraseña temporal necesita al menos 8 caracteres." };

    const { data, error } = await db().auth.admin.createUser({ email, password, email_confirm: true });
    if (error) return { error: error.message.includes("already") ? "Ya existe un usuario con ese email." : error.message };
    const { error: e2 } = await db().from("perfiles").insert({ id: data.user.id, nombre, email, rol });
    if (e2) {
      await db().auth.admin.deleteUser(data.user.id);
      return { error: e2.message };
    }
    const { count } = await db().from("miembros_proyecto").select("perfil_id", { count: "exact", head: true }).eq("proyecto_id", proyecto.id);
    await db().from("miembros_proyecto").insert({ proyecto_id: proyecto.id, perfil_id: data.user.id, orden: count ?? 0 });
    refrescar();
    return { ok: `Usuario creado. Pásale su email y la contraseña temporal; la primera vez verá el onboarding.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error." };
  }
}

export async function actualizarMiembro(perfilId: string, cambios: { rol?: Rol; activo?: boolean; admin_activo?: boolean }) {
  return seguro(async () => {
    const { perfil, proyecto } = await exigir(puedeAdmin);
    const { data: miembro } = await db().from("miembros_proyecto").select("perfil_id").eq("proyecto_id", proyecto.id).eq("perfil_id", perfilId).maybeSingle();
    if (!miembro) throw new ErrorUsuario("Esa persona no está en este proyecto.");
    const { data: objetivo } = await db().from("perfiles").select("rol").eq("id", perfilId).single();
    if (perfilId === perfil.id) throw new ErrorUsuario("No puedes cambiar tu propio rol o acceso.");
    if (perfil.rol !== "ceo" && (objetivo?.rol === "ceo" || cambios.rol === "ceo")) throw new ErrorUsuario("Solo el CEO puede tocar a otro CEO.");
    if (cambios.admin_activo !== undefined && perfil.rol !== "ceo") throw new ErrorUsuario("Solo el CEO da acceso de administración a los directores.");
    if (cambios.rol && !ROLES.includes(cambios.rol)) throw new ErrorUsuario("Rol no válido.");
    await db().from("perfiles").update(cambios).eq("id", perfilId);
    refrescar();
  });
}

export async function cambiarPassword(perfilId: string, password: string) {
  return seguro(async () => {
    const { perfil, proyecto } = await exigir(puedeAdmin);
    if (password.length < 8) throw new ErrorUsuario("Mínimo 8 caracteres.");
    const { data: miembro } = await db().from("miembros_proyecto").select("perfil_id").eq("proyecto_id", proyecto.id).eq("perfil_id", perfilId).maybeSingle();
    if (!miembro) throw new ErrorUsuario("Esa persona no está en este proyecto.");
    const { data: objetivo } = await db().from("perfiles").select("rol").eq("id", perfilId).single();
    if (perfil.rol !== "ceo" && objetivo?.rol === "ceo") throw new ErrorUsuario("Solo el CEO puede tocar a otro CEO.");
    const { error } = await db().auth.admin.updateUserById(perfilId, { password });
    if (error) throw new ErrorUsuario(error.message);
  });
}

export async function moverEnReparto(perfilId: string, direccion: -1 | 1) {
  return seguro(async () => {
    const { proyecto } = await exigir(puedeAdmin);
    const { data } = await db().from("miembros_proyecto").select("perfil_id, orden, perfiles!inner(rol)").eq("proyecto_id", proyecto.id).eq("perfiles.rol", "caller").order("orden");
    const lista = (data ?? []).map((m) => m.perfil_id);
    const i = lista.indexOf(perfilId);
    const j = i + direccion;
    if (i < 0 || j < 0 || j >= lista.length) return;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    await Promise.all(lista.map((id, k) => db().from("miembros_proyecto").update({ orden: k }).eq("proyecto_id", proyecto.id).eq("perfil_id", id)));
    refrescar();
  });
}

// ---------- Proyecto ----------
export async function guardarProyecto(_prev: Res, fd: FormData): Promise<Res> {
  try {
    const { proyecto } = await exigir(puedeAdmin);
    const modo = texto(fd, "modo_reparto");
    const aviso = texto(fd, "aviso_webhook_url");
    if (!["manual", "rotativo", "horarios"].includes(modo)) return { error: "Modo de reparto no válido." };
    if (aviso) {
      try {
        if (new URL(aviso).protocol !== "https:") return { error: "El webhook de avisos tiene que empezar por https://" };
      } catch {
        return { error: "El webhook de avisos no es un enlace válido." };
      }
    }
    await db().from("proyectos").update({ modo_reparto: modo, aviso_webhook_url: aviso || null }).eq("id", proyecto.id);
    refrescar();
    return { ok: "Guardado." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error." };
  }
}

export async function crearProyecto(_prev: Res, fd: FormData): Promise<Res> {
  try {
    const { perfil } = await exigir(puedeCrearProyectos);
    const nombre = texto(fd, "nombre");
    const region = texto(fd, "region");
    if (!nombre) return { error: "Pon un nombre." };
    const config = region === "es" ? { moneda: "EUR", zona_horaria: "Europe/Madrid" } : { moneda: "USD", zona_horaria: "America/New_York" };
    const color = /^#[0-9a-f]{6}$/i.test(texto(fd, "color")) ? texto(fd, "color") : "#2f55d4";
    const { data, error } = await db().from("proyectos").insert({ nombre, color, ...config }).select().single();
    if (error) return { error: error.code === "23505" ? "Ya existe un proyecto con ese nombre." : error.message };
    await db().from("miembros_proyecto").insert({ proyecto_id: data.id, perfil_id: perfil.id });
    const { data: pipe } = await db().from("pipelines").insert({ proyecto_id: data.id, nombre: "Principal", orden: 0 }).select().single();
    if (pipe)
      await db().from("etapas").insert(
        ["Nuevos", "Agendados", "En seguimiento", "Cerrados", "Descartados"].map((n, i) => ({ pipeline_id: pipe.id, nombre: n, orden: i, color: ["#64748b", "#2f55d4", "#d97706", "#16a34a", "#dc2626"][i] }))
      );
    refrescar();
    return { ok: `Proyecto «${nombre}» creado (${config.moneda}, ${config.zona_horaria}). Cámbiate a él desde el selector de proyecto.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error." };
  }
}

export async function regenerarSecreto() {
  return seguro(async () => {
    const { proyecto } = await exigir(puedeAdmin);
    const nuevo = Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => b.toString(16).padStart(2, "0")).join("");
    await db().from("proyectos").update({ webhook_secreto: nuevo }).eq("id", proyecto.id);
    refrescar();
  });
}

// ---------- Personas en varios proyectos ----------
// Solo el CEO ve a la gente de todos los proyectos, así que solo él añade a alguien que ya existe.
export async function anadirAlProyecto(perfilId: string) {
  return seguro(async () => {
    const { proyecto } = await exigir((p) => p.rol === "ceo");
    const { data: persona } = await db().from("perfiles").select("id").eq("id", perfilId).maybeSingle();
    if (!persona) throw new ErrorUsuario("Esa persona no existe.");
    const { count } = await db().from("miembros_proyecto").select("perfil_id", { count: "exact", head: true }).eq("proyecto_id", proyecto.id);
    const { error } = await db().from("miembros_proyecto").insert({ proyecto_id: proyecto.id, perfil_id: perfilId, orden: count ?? 0 });
    if (error) throw new ErrorUsuario(error.code === "23505" ? "Ya está en este proyecto." : error.message);
    refrescar();
  });
}

// Quita a la persona de este proyecto (no borra su usuario ni sus datos).
export async function quitarDelProyecto(perfilId: string) {
  return seguro(async () => {
    const { perfil, proyecto } = await exigir(puedeAdmin);
    if (perfilId === perfil.id) throw new ErrorUsuario("No puedes quitarte a ti mismo.");
    const { data: objetivo } = await db().from("perfiles").select("rol").eq("id", perfilId).maybeSingle();
    if (!objetivo) throw new ErrorUsuario("Esa persona no existe.");
    if (perfil.rol !== "ceo" && objetivo.rol === "ceo") throw new ErrorUsuario("Solo el CEO puede tocar a otro CEO.");
    await db().from("miembros_proyecto").delete().eq("proyecto_id", proyecto.id).eq("perfil_id", perfilId);
    refrescar();
  });
}

// ---------- Entradas (una dirección por landing) ----------
// Comprueba que el pipeline y la columna son de este proyecto (y que la columna es de ese pipeline).
async function destinoValido(proyectoId: string, pipelineId: string | null, etapaId: string | null) {
  if (!pipelineId) return { pipeline_id: null, etapa_id: null };
  const { data: p } = await db().from("pipelines").select("id").eq("id", pipelineId).eq("proyecto_id", proyectoId).maybeSingle();
  if (!p) throw new ErrorUsuario("Ese pipeline no es de este proyecto.");
  if (etapaId) {
    const { data: e } = await db().from("etapas").select("id").eq("id", etapaId).eq("pipeline_id", pipelineId).maybeSingle();
    if (!e) throw new ErrorUsuario("Esa columna no es de ese pipeline.");
  }
  return { pipeline_id: pipelineId, etapa_id: etapaId || null };
}

async function entradaDelProyecto(id: string, proyectoId: string) {
  const { data } = await db().from("entradas").select("id").eq("id", id).eq("proyecto_id", proyectoId).maybeSingle();
  if (!data) throw new ErrorUsuario("Entrada no encontrada.");
}

export async function crearEntrada(_prev: Res, fd: FormData): Promise<Res> {
  const r = await seguro(async () => {
    const { proyecto } = await exigir(puedeAdmin);
    const nombre = texto(fd, "nombre");
    if (!nombre) throw new ErrorUsuario("Pon un nombre (por ejemplo, el de la landing).");
    const destino = await destinoValido(proyecto.id, texto(fd, "pipeline_id") || null, texto(fd, "etapa_id") || null);
    const { error } = await db().from("entradas").insert({ proyecto_id: proyecto.id, nombre, ...destino });
    if (error) throw new ErrorUsuario(error.message);
    refrescar();
    return { ok: "Entrada creada. Copia su dirección y pégala en la landing." };
  });
  return r;
}

export async function guardarEntrada(id: string, cambios: { nombre: string; pipeline_id: string | null; etapa_id: string | null; reglas: unknown; activa: boolean }) {
  return seguro(async () => {
    const { proyecto } = await exigir(puedeAdmin);
    await entradaDelProyecto(id, proyecto.id);
    if (!cambios.nombre.trim()) throw new ErrorUsuario("Pon un nombre.");
    const destino = await destinoValido(proyecto.id, cambios.pipeline_id, cambios.etapa_id);
    const reglas = reglasValidas(cambios.reglas);
    for (const r of reglas) if (r.pipeline_id || r.etapa_id) await destinoValido(proyecto.id, r.pipeline_id ?? null, r.etapa_id ?? null);
    await db().from("entradas").update({ nombre: cambios.nombre.trim(), ...destino, reglas, activa: cambios.activa }).eq("id", id);
    refrescar();
  });
}

export async function nuevaDireccionEntrada(id: string) {
  return seguro(async () => {
    const { proyecto } = await exigir(puedeAdmin);
    await entradaDelProyecto(id, proyecto.id);
    const token = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
    await db().from("entradas").update({ token }).eq("id", id);
    refrescar();
  });
}

export async function borrarEntrada(id: string) {
  return seguro(async () => {
    const { proyecto } = await exigir(puedeAdmin);
    await entradaDelProyecto(id, proyecto.id);
    // Los envíos ya recibidos y sus leads se quedan; solo se borra la dirección
    await db().from("entradas").delete().eq("id", id);
    refrescar();
  });
}

// ---------- GHL por API: calendarios de los closers (V2-3) ----------
// El token solo se escribe; la pantalla nunca lo vuelve a enseñar entero.
export async function guardarConexionGhl(token: string, locationId: string) {
  return seguro(async () => {
    const { proyecto } = await exigir(puedeAdmin);
    const t = token.trim();
    const loc = locationId.trim();
    if (!loc) throw new ErrorUsuario("Pon el id de la subcuenta (Location ID) de GHL.");
    if (t && t.length < 20) throw new ErrorUsuario("Ese token parece incompleto.");
    await db().from("proyectos").update({ ghl_location_id: loc, ...(t ? { ghl_token: cifrar(t) } : {}) }).eq("id", proyecto.id);
    refrescar();
  });
}

export async function guardarCalendarioCloser(perfilId: string, calendarId: string, userId: string) {
  return seguro(async () => {
    const { proyecto } = await exigir(puedeAdmin);
    const { data } = await db().from("miembros_proyecto").select("perfil_id, perfiles!inner(rol)").eq("proyecto_id", proyecto.id).eq("perfil_id", perfilId).eq("perfiles.rol", "closer").maybeSingle();
    if (!data) throw new ErrorUsuario("Esa persona no es closer de este proyecto.");
    await db().from("miembros_proyecto").update({ ghl_calendar_id: calendarId.trim() || null, ghl_user_id: userId.trim() || null }).eq("proyecto_id", proyecto.id).eq("perfil_id", perfilId);
    refrescar();
  });
}

export async function probarConexionGhl() {
  return seguro(async () => {
    const { proyecto } = await exigir(puedeAdmin);
    const { data: p } = await db().from("proyectos").select("ghl_token, ghl_location_id").eq("id", proyecto.id).single();
    if (!p?.ghl_token || !p.ghl_location_id) throw new ErrorUsuario("Primero guarda el token y el id de la subcuenta.");
    const { data: m } = await db().from("miembros_proyecto").select("ghl_calendar_id, ghl_user_id").eq("proyecto_id", proyecto.id).or("ghl_calendar_id.not.is.null,ghl_user_id.not.is.null").limit(1).maybeSingle();
    if (!m) throw new ErrorUsuario("Pon el calendario de GHL de al menos un closer para poder probar.");
    const { eventosGhl } = await import("@/lib/ghl");
    try {
      const ev = await eventosGhl({ token: descifrar(p.ghl_token, "el token de GHL"), locationId: p.ghl_location_id, calendarId: m.ghl_calendar_id, userId: m.ghl_user_id, desde: new Date(Date.now() - 7 * 86_400_000), hasta: new Date(Date.now() + 30 * 86_400_000) });
      return { ok: `Conexión correcta: ${ev.length} citas encontradas en el calendario (últimos 7 días y próximos 30).` };
    } catch (e) {
      throw new ErrorUsuario(e instanceof Error ? e.message : "No se pudo conectar con GHL.");
    }
  });
}

// ---------- Permisos por sección (V2-8) ----------
// Solo el CEO abre o cierra una sección a un rol entero (todos los directores iguales, decisión de Cristian)
export async function guardarPermisoSeccion(rol: "director" | "closer" | "caller", seccion: string, permitido: boolean) {
  return seguro(async () => {
    const { perfil, proyecto } = await exigir(puedeAdmin);
    if (perfil.rol !== "ceo") throw new ErrorUsuario("Solo el CEO cambia los permisos.");
    if (!["director", "closer", "caller"].includes(rol)) throw new ErrorUsuario("Rol no válido.");
    if (!SECCIONES.some((s) => s.v === seccion)) throw new ErrorUsuario("Sección no válida.");
    const { error } = await db().from("permisos_seccion").upsert({ proyecto_id: proyecto.id, rol, seccion, permitido: !!permitido });
    if (error) throw new ErrorUsuario(error.message);
    refrescar();
  });
}

// ---------- Horario de cada caller (reparto por horarios, V2-11) ----------
export async function guardarHorario(perfilId: string, horario: { dias: number[]; desde: string; hasta: string } | null) {
  return seguro(async () => {
    const { proyecto } = await exigir(puedeAdmin);
    const h = horario ? horarioValido(horario) : null;
    if (horario && !h) throw new ErrorUsuario("Elige al menos un día y una hora de inicio y de fin distintas (HH:MM).");
    const { data, error } = await db().from("miembros_proyecto").update({ horario: h }).eq("proyecto_id", proyecto.id).eq("perfil_id", perfilId).select("perfil_id");
    if (error) throw new ErrorUsuario(error.message);
    if (!data?.length) throw new ErrorUsuario("Esa persona no está en este proyecto.");
    refrescar();
  });
}

// Usuario de GHL de cada persona (para saber quién hizo cada llamada de GHL, V2-11)
export async function guardarUsuarioGhl(perfilId: string, userId: string) {
  return seguro(async () => {
    const { proyecto } = await exigir(puedeAdmin);
    const u = userId.trim();
    if (u && !/^[A-Za-z0-9_-]{6,64}$/.test(u)) throw new ErrorUsuario("El id de usuario de GHL no parece válido.");
    const { data } = await db().from("miembros_proyecto").update({ ghl_user_id: u || null }).eq("proyecto_id", proyecto.id).eq("perfil_id", perfilId).select("perfil_id");
    if (!data?.length) throw new ErrorUsuario("Esa persona no está en este proyecto.");
    refrescar();
  });
}
