import Image from "next/image";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ETIQUETA_ROL } from "@/lib/formato";

const QUE_VERAS: Record<string, string[]> = {
  caller: ["Tus leads asignados con las respuestas de su formulario", "Botones para marcar el resultado de cada llamada", "Tus números y el ranking del equipo", "Links de pago, guiones y recursos", "Tu reporte de fin de día"],
  closer: ["Tus agendas: pre-call y post-call", "Registrar cada venta (cash, reserva o cuotas)", "Tus números y el ranking del equipo", "Links de pago, guiones y recursos", "Tu reporte de fin de día"],
  director: ["El funnel completo del proyecto", "El CRM con todos los pipelines", "Las agendas, ventas y reportes del equipo", "Subir recursos y links", "Administración (si el CEO te la activa)"],
  ceo: ["Todo el panel de todos los proyectos", "Crear proyectos y productos", "Administración completa"],
};

async function completar(formData: FormData) {
  "use server";
  const { perfil } = await getSesion();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  if (!nombre) throw new Error("El nombre es obligatorio.");
  await createAdminClient()
    .from("perfiles")
    .update({ nombre, telefono: telefono || null, whatsapp: whatsapp || null, onboarding_completo: true })
    .eq("id", perfil.id);
  revalidatePath("/", "layout");
  redirect("/"); // H5: «/» elige la primera sección permitida
}

export default async function OnboardingPage() {
  const { perfil, proyecto } = await getSesion();
  if (perfil.onboarding_completo) redirect("/");
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="grid w-full max-w-3xl gap-6 md:grid-cols-2">
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
        <form action={completar} className="tarjeta space-y-4 p-6">
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
          <button className="btn-primario w-full">Empezar</button>
        </form>
      </div>
    </main>
  );
}
