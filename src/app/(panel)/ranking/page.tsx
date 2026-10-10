import { Trophy, Medal, Phone, TrendingUp } from "lucide-react";
import { exigirPagina } from "@/lib/permisos";
import { cargarBase, calcularVendedores } from "@/lib/metricas";
import { dinero, rangoDe, type Periodo, pct } from "@/lib/formato";
import { Cabecera, Contenido, Seccion, Avatar, Vacio } from "@/components/ui";
import { Filtros } from "@/components/filtros";

const MEDALLA = ["text-oro", "text-texto-2", "text-aviso"];

export default async function RankingPage({ searchParams }: PageProps<"/ranking">) {
  const { perfil, proyecto } = await exigirPagina("ranking"); // H5
  const sp = await searchParams;
  const periodo = (typeof sp.periodo === "string" ? sp.periodo : "semana") as Periodo;
  const rango = rangoDe(periodo, proyecto.zona_horaria, sp.desde as string, sp.hasta as string);
  const base = await cargarBase(proyecto);
  const { callers, closers } = calcularVendedores(base, rango);
  const rCallers = [...callers].sort((a, b) => b.agendas - a.agendas || b.ventas - a.ventas || b.llamadas - a.llamadas);
  const rClosers = [...closers].sort((a, b) => b.facturacion - a.facturacion || b.tasaCierre - a.tasaCierre);
  const maxAg = Math.max(1, ...rCallers.map((c) => c.agendas));
  const maxFac = Math.max(1, ...rClosers.map((c) => c.facturacion));

  const Puesto = ({ i }: { i: number }) =>
    i < 3 ? <Medal className={`h-5 w-5 ${MEDALLA[i]}`} /> : <span className="w-5 text-center text-sm text-texto-3">{i + 1}</span>;

  return (
    <>
      <Cabecera titulo="Ranking del equipo" subtitulo={`${proyecto.nombre} · ${rango.etiqueta}`} />
      <Contenido>
        <Filtros periodoPorDefecto="semana" />
        <div className="grid gap-5 xl:grid-cols-2">
          <Seccion titulo="Callers · por agendas">
            {rCallers.length === 0 ? <Vacio icono={Phone} texto="Sin callers." /> : (
              <ol className="space-y-2">
                {rCallers.map((c, i) => (
                  <li key={c.perfil.id} className={`flex items-center gap-3 rounded-lg border p-3 ${c.perfil.id === perfil.id ? "border-primario bg-primario-suave/40" : "border-borde bg-panel-2"}`}>
                    <Puesto i={i} />
                    <Avatar nombre={c.perfil.nombre} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{c.perfil.nombre}{c.perfil.id === perfil.id && <span className="text-primario"> (tú)</span>}</span>
                        <span className="font-semibold tabular-nums">{c.agendas} agendas</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-fondo-2"><div className="h-full rounded-full bg-primario" style={{ width: `${pct((c.agendas / maxAg) * 100)}` }} /></div>
                      <div className="mt-1 text-xs text-texto-3">{c.llamadas} llamadas · {c.contactos} contactos · {c.ventas} ventas low ticket</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Seccion>
          <Seccion titulo="Closers · por facturación">
            {rClosers.length === 0 ? <Vacio icono={TrendingUp} texto="Sin closers." /> : (
              <ol className="space-y-2">
                {rClosers.map((c, i) => (
                  <li key={c.perfil.id} className={`flex items-center gap-3 rounded-lg border p-3 ${c.perfil.id === perfil.id ? "border-primario bg-primario-suave/40" : "border-borde bg-panel-2"}`}>
                    <Puesto i={i} />
                    <Avatar nombre={c.perfil.nombre} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{c.perfil.nombre}{c.perfil.id === perfil.id && <span className="text-primario"> (tú)</span>}</span>
                        <span className="font-semibold tabular-nums text-oro">{dinero(c.facturacion, proyecto)}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-fondo-2"><div className="h-full rounded-full bg-oro" style={{ width: `${pct((c.facturacion / maxFac) * 100)}` }} /></div>
                      <div className="mt-1 text-xs text-texto-3">{c.ventas} ventas · {pct(c.tasaCierre)} cierre · {c.asistidas} citas asistidas · {c.noShow} no show</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Seccion>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-texto-3"><Trophy className="h-3.5 w-3.5 text-oro" /> Callers ordenados por agendas; closers por facturación.</p>
      </Contenido>
    </>
  );
}
