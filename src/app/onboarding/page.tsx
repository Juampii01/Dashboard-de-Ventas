import Image from "next/image";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ETIQUETA_ROL } from "@/lib/formato";
import { horarioValido } from "@/lib/horarios";
import { EditorHorario } from "@/components/editor-horario";

const QUE_VERAS: Record<string, string[]> = {
  caller: ["Tus leads asignados con las respuestas de su formulario", "Botones para marcar el resultado de cada llamada", "Tus números y el ranking del equipo", "Links de pago, guiones y recursos", "Tu reporte de fin de día"],
  closer: ["Tus agendas: pre-call y post-call", "Registrar cada venta (cash, reserva o cuotas)", "Tus números y el ranking del equipo", "Links de pago, guiones y recursos", "Tu reporte de fin de día"],
  director: ["El funnel completo del proyecto", "El CRM con todos los pipelines", "Las agendas, ventas y reportes del equipo", "Subir recursos y links", "Administración (si el CEO te la activa)"],
  ceo: ["Todo el panel de todos los proyectos", "Crear proyectos y productos", "Administración completa"],
};

// Callers y closers ponen su horario al entrar (obligatorio; bloque 1 de 1.0, Cristian 11 oct 2026)
const conHorario = (rol: string) => rol === "caller" || rol === "closer";

async function completar(formData: FormData) {
  "use server";
  const { perfil, proyecto } = await getSesion();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  if (!nombre) redirect("/onboarding?error=nombre");
  if (conHorario(perfil.rol)) {
    let h = null;
    try {
      h = horarioValido(JSON.parse(String(formData.get("horario") ?? "")));
    } catch {
      h = null;
    }
    if (!h) redirect("/onboarding?error=horario");
    const { error } = await createAdminClient().from("miembros_proyecto").update({ horario: h }).eq("proyecto_id", proyecto.id).eq("perfil_id", perfil.id);
    if (error) throw new Error(`No se pudo guardar el horario: ${error.message}`);
  }
  await createAdminClient()
    .from("perfiles")
    .update({ nombre, telefono: telefono || null, whatsapp: whatsapp || null, onboarding_completo: true })
    .eq("id", perfil.id);
  revalidatePath("/", "layout");
  redirect("/"); // H5: «/» elige la primera sección permitida
}

const ERRORES: Record<string, string> = {
  nombre: "El nombre es obligatorio.",
  horario: "Pon tu horario: al menos un tramo en algún día, con la hora de inicio antes que la de fin.",
};

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { perfil, proyecto } = await getSesion();
  if (perfil.onboarding_completo) redirect("/");
  const { error } = await searchParams;
  const { data: miembro } = conHorario(perfil.rol) ? await createAdminClient().from("miembros_proyecto").select("horario").eq("proyecto_id", proyecto.id).eq("perfil_id", perfil.id).maybeSingle() : { data: null };
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form action={completar} className="grid w-full max-w-3xl gap-6 md:grid-cols-2">
        <div className="tarjeta p-6">
          <Image src="/marca/eternity.png" alt="Eternity" width={48} height={48} className="mb-4 rounded-xl" />
          <h1 className="text-2xl font-semibold">Bienvenido a Eternity</h1>
          <p className="mt-1 text-sm text-texto-2">
            Entras como <b className="text-texto">{ETIQUETA_ROL[perfil.rol]}</b> en <b className="text-texto">{proyecto.nombre}</b>. Esto es lo que vas a tener:
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {QUE_VERAS[perfil.rol].map((t) => (
              <li key={t} className="flex gap-2"><span className="text-primario">✓</span>{t}</li>
            ))}
          </ul>
        </div>
        <div className="tarjeta space-y-4 p-6">
          <h2 className="text-lg font-semibold">Conecta tus datos</h2>
          <p className="text-sm text-texto-2">Los usamos para avisarte por email y WhatsApp (por ejemplo, de los reportes).</p>
          <div>
            <label className="etiqueta-campo" htmlFor="onboarding-nombre-y-apellido">Nombre y apellido</label>
            <input id="onboarding-nombre-y-apellido" name="nombre" defaultValue={perfil.nombre} required className="campo" />
          </div>
          <div>
            <label className="etiqueta-campo" htmlFor="onboarding-email">Email</label>
            <input id="onboarding-email" value={perfil.email} disabled className="campo opacity-70" />
          </div>
          <div>
            <label className="etiqueta-campo" htmlFor="onboarding-telefono">Teléfono</label>
            <input id="onboarding-telefono" name="telefono" defaultValue={perfil.telefono ?? ""} placeholder="+1 555 000 0000" className="campo" />
          </div>
          <div>
            <label className="etiqueta-campo" htmlFor="onboarding-whatsapp">WhatsApp</label>
            <input id="onboarding-whatsapp" name="whatsapp" defaultValue={perfil.whatsapp ?? ""} placeholder="+34 600 000 000" className="campo" />
          </div>
          {!conHorario(perfil.rol) && <button className="btn-primario w-full">Empezar</button>}
          {error && ERRORES[error] && !conHorario(perfil.rol) && <p className="text-sm text-mal">{ERRORES[error]}</p>}
        </div>
        {conHorario(perfil.rol) && (
          <div className="tarjeta space-y-4 p-6 md:col-span-2">
            <div>
              <h2 className="text-lg font-semibold">{perfil.rol === "closer" ? "Tu horario para recibir llamadas" : "Tu horario de trabajo"}</h2>
              <p className="text-sm text-texto-2">
                {perfil.rol === "closer"
                  ? "Las horas en que se te pueden agendar llamadas, tus descansos y tus días libres. Puedes cambiarlo cuando quieras en «Mi perfil»."
                  : "Cuándo vas a trabajar: por la mañana, por la tarde, todo el día o las horas que quieras. Puedes cambiarlo cuando quieras en «Mi perfil»."}
              </p>
            </div>
            <EditorHorario inicial={horarioValido(miembro?.horario)} zona={proyecto.zona_horaria} campo="horario" plantillas />
            {error && ERRORES[error] && <p className="text-sm text-mal">{ERRORES[error]}</p>}
            <button className="btn-primario w-full">Empezar</button>
          </div>
        )}
      </form>
    </main>
  );
}
