import { redirect } from "next/navigation";
import { getSesion, esJefe, puedeAdmin } from "@/lib/auth";
import { BarraLateral, type ItemMenu } from "@/components/barra-lateral";
import { ProveedorToasts } from "@/components/toasts";
import { db } from "@/lib/datos";
import { proyectoParaMenu } from "@/lib/formato";
import { seccionesPermitidas, SECCIONES } from "@/lib/permisos";

export default async function PanelLayout({ children }: LayoutProps<"/">) {
  const { perfil, proyectos, proyecto } = await getSesion();

  // Onboarding obligatorio la primera vez (la página /onboarding está fuera de este layout)
  if (!perfil.onboarding_completo) redirect("/onboarding");

  const jefe = esJefe(perfil);

  // Aviso al caller: «llamar luego» cuya hora ya ha llegado
  let vencidos = 0;
  if (perfil.rol === "caller") {
    const { count } = await db()
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("proyecto_id", proyecto.id)
      .eq("caller_id", perfil.id)
      .eq("estado_caller", "llamar_luego")
      .lte("llamar_en", new Date().toISOString());
    vencidos = count ?? 0;
  }
  const secciones = await seccionesPermitidas(perfil, proyecto.id);
  const empresa: ItemMenu[] = SECCIONES.filter((s) => secciones.has(s.v)).map((s) => ({ href: `/${s.v}`, texto: s.t, icono: s.v }));
  const menu: { grupo: string; items: ItemMenu[] }[] = [
    {
      grupo: "Ventas",
      items: [
        ...(jefe ? [{ href: "/funnel", texto: "Funnel", icono: "funnel" as const }] : []),
        ...(jefe ? [{ href: "/kpis", texto: "KPIs", icono: "kpis" as const }] : []),
        ...(jefe ? [{ href: "/crm", texto: "CRM", icono: "crm" as const }] : []),
        ...(perfil.rol === "caller" || jefe ? [{ href: "/caller", texto: jefe ? "Callers" : "Mis leads", icono: "caller" as const, exacto: true, insignia: vencidos }] : []),
        ...(perfil.rol === "caller" || jefe ? [{ href: "/caller/crm", texto: jefe ? "CRM de callers" : "Mi CRM", icono: "crm" as const }] : []),
        ...(perfil.rol === "closer" || jefe ? [{ href: "/closer", texto: jefe ? "Agendas" : "Mis agendas", icono: "closer" as const }] : []),
        { href: "/caller/grabadas", texto: jefe ? "Llamadas de GHL" : "Mis llamadas grabadas", icono: "grabadas" as const },
        ...(perfil.rol !== "caller" ? [{ href: "/ventas", texto: "Ventas", icono: "ventas" as const }] : []),
        { href: "/ranking", texto: "Ranking del equipo", icono: "ranking" as const },
      ],
    },
    {
      grupo: "Día a día",
      items: [
        { href: "/recursos", texto: "Links y recursos", icono: "recursos" as const },
        { href: "/reportes", texto: "Reportes", icono: "reportes" as const },
      ],
    },
    ...(empresa.length ? [{ grupo: "Empresa", items: empresa }] : []),
    ...(puedeAdmin(perfil)
      ? [{ grupo: "Gestión", items: [{ href: "/admin", texto: "Administración", icono: "admin" as const }] }]
      : []),
  ];

  return (
    <ProveedorToasts>
      <div className="flex min-h-screen">
        <BarraLateral perfil={perfil} proyectos={proyectos.map(proyectoParaMenu)} proyecto={proyectoParaMenu(proyecto)} menu={menu} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </ProveedorToasts>
  );
}
