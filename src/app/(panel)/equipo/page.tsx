import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown, KeyRound } from "lucide-react";
import { getSesion } from "@/lib/auth";
import { db } from "@/lib/datos";
import { puedeSeccion } from "@/lib/permisos";
import { cargarEquipo } from "@/lib/equipo";
import { Cabecera, Contenido, Seccion, Insignia } from "@/components/ui";
import { AltaMiembro } from "./alta";
import { ComisionRolForm, EditarMiembro, EditorAreas } from "./cliente";
import type { Rol } from "@/lib/tipos";

const ROL_TXT: Record<string, string> = { ceo: "CEO", director: "Director", closer: "Closer", caller: "Caller" };

export default async function EquipoPage({ searchParams }: PageProps<"/equipo">) {
  const { perfil, proyecto } = await getSesion();
  if (!(await puedeSeccion(perfil, proyecto.id, "equipo"))) redirect("/");
  const sp = await searchParams;
  const verInactivos = sp.inactivos === "1";
  const [eq, { data: productos }] = await Promise.all([cargarEquipo(proyecto.id), db().from("productos").select("id, nombre, precio").eq("proyecto_id", proyecto.id).eq("activo", true).order("orden")]);
  const miembros = eq.miembros.filter((m) => m.activo !== verInactivos);
  const sinArea = miembros.filter((m) => !m.area_id || !eq.areas.some((a) => a.id === m.area_id));
  const puesto = (id: string | null) => eq.puestos.find((p) => p.id === id)?.nombre;
  const resumenComision = (m: (typeof miembros)[number]) => {
    if (!m.comision) return null;
    const partes = [m.comision.pct_venta ? `${m.comision.pct_venta}% venta` : "", m.comision.pct_agenda ? `${m.comision.pct_agenda}% agenda` : "", m.comision.por_producto && Object.keys(m.comision.por_producto).length ? "por producto" : ""].filter(Boolean);
    return partes.length ? `Propia: ${partes.join(" · ")}` : null;
  };
  const tarjeta = (m: (typeof miembros)[number]) => (
    <li key={m.id} className="flex items-center gap-3 rounded-lg border border-borde bg-panel px-3 py-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-panel-2 text-sm font-semibold">{m.nombre.charAt(0).toUpperCase()}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
          {m.nombre}
          {m.lider && <span title="Líder del área"><Crown className="h-3.5 w-3.5 text-oro" /></span>}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-texto-3">
          {puesto(m.puesto_id) && <span>{puesto(m.puesto_id)}</span>}
          {m.rol ? <Insignia tono="primario">{ROL_TXT[m.rol]}</Insignia> : <span className="inline-flex items-center gap-1"><KeyRound className="h-3 w-3" />Sin acceso</span>}
          {resumenComision(m) && <span className="text-oro">{resumenComision(m)}</span>}
        </div>
      </div>
      <EditarMiembro m={m} areas={eq.areas} puestos={eq.puestos} productos={(productos ?? []).map((p) => ({ id: p.id, nombre: p.nombre }))} soyCeo={perfil.rol === "ceo"} />
    </li>
  );

  return (
    <>
      <Cabecera
        titulo="Equipo"
        subtitulo={`${proyecto.nombre} · ${eq.miembros.filter((m) => m.activo).length} personas activas`}
        acciones={
          <>
            <Link href={verInactivos ? "/equipo" : "/equipo?inactivos=1"} className="btn-secundario">{verInactivos ? "Ver activos" : "Ver inactivos"}</Link>
            <AltaMiembro areas={eq.areas} puestos={eq.puestos} productos={(productos ?? []).map((p) => ({ id: p.id, nombre: p.nombre, precio: p.precio === null ? null : Number(p.precio) }))} comisionesRol={eq.comisionesRol} soyCeo={perfil.rol === "ceo"} codigoMoneda={proyecto.moneda} />
          </>
        }
      />
      <Contenido>
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <Seccion titulo={verInactivos ? "Personas inactivas" : "Organigrama"}>
            <div className="grid gap-4 md:grid-cols-2">
              {eq.areas.map((a) => {
                const de = miembros.filter((m) => m.area_id === a.id).sort((x, y) => Number(y.lider) - Number(x.lider) || x.nombre.localeCompare(y.nombre));
                return (
                  <div key={a.id} className="rounded-xl border border-borde bg-panel-2/60 p-3" style={{ borderTop: `3px solid ${a.color}` }}>
                    <div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-2 font-semibold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />{a.nombre}</span><span className="rounded-full bg-panel px-2 text-xs tabular-nums text-texto-2">{de.length}</span></div>
                    {de.length === 0 ? <p className="py-3 text-center text-xs text-texto-3">Nadie en esta área.</p> : <ul className="space-y-2">{de.map(tarjeta)}</ul>}
                  </div>
                );
              })}
              {sinArea.length > 0 && (
                <div className="rounded-xl border border-dashed border-borde p-3">
                  <div className="mb-2 font-semibold">Sin área</div>
                  <ul className="space-y-2">{sinArea.map(tarjeta)}</ul>
                </div>
              )}
            </div>
          </Seccion>
          <div className="space-y-5">
            <Seccion titulo="Comisión de cada rol">
              <p className="mb-3 text-xs text-texto-3">Es la que se usa si la persona o el producto no tienen una propia. «% por venta»: de lo que vende él. Caller: además, «% por agenda cerrada» cuando el closer cierra una agenda suya. Se paga sobre lo cobrado, cada mes.</p>
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_72px_72px_auto] gap-2 text-[11px] text-texto-3"><span>Rol</span><span className="text-right">% venta</span><span className="text-right">% agenda</span><span className="w-7" /></div>
                {(["closer", "caller", "director", "ceo"] as Rol[]).map((r) => <ComisionRolForm key={r} rol={r} pctVenta={eq.comisionesRol[r]?.pct_venta ?? 0} pctAgenda={eq.comisionesRol[r]?.pct_agenda ?? 0} />)}
              </div>
            </Seccion>
            <Seccion titulo="Áreas">
              <EditorAreas areas={eq.areas} />
            </Seccion>
          </div>
        </div>
      </Contenido>
    </>
  );
}
