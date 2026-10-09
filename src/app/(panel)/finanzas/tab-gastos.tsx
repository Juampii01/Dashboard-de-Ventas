import { enRango } from "@/lib/periodos";
import { dinero, fecha, type Rango } from "@/lib/formato";
import { Insignia, Seccion } from "@/components/ui";
import type { Proyecto } from "@/lib/tipos";
import type { DatosFinanzas } from "./cargar";
import { AccionesProgramado, BorrarMovimiento, Categorias, NuevoMovimiento, NuevoProgramado } from "./cliente";
import { Chips } from "./tab-ventas";

type SP = Record<string, string | string[] | undefined>;
const ORIGEN: Record<string, string> = { manual: "", importado: "Del banco", liquidacion: "Comisiones", programado: "Programado" };
const CADA: Record<string, string> = { semana: "cada semana", mes: "cada mes", anio: "cada año" };

function ListaMovimientos({ d, tipo, rango, proyecto }: { d: DatosFinanzas; tipo: "ingreso" | "egreso"; rango: Rango; proyecto: Proyecto }) {
  const $ = (n: number) => dinero(n, proyecto, 2);
  const cat = new Map(d.categorias.map((c) => [c.id, c]));
  const cuenta = new Map(d.cuentas.map((c) => [c.id, c.nombre]));
  const movs = d.movimientos.filter((m) => m.tipo === tipo && enRango(m.fecha, rango));
  const total = movs.reduce((s, m) => s + m.importe, 0);
  const porCat = new Map<string, number>();
  for (const m of movs) porCat.set(m.categoria_id ?? "", (porCat.get(m.categoria_id ?? "") ?? 0) + m.importe);
  const cuentas = d.cuentas.map((c) => ({ id: c.id, nombre: c.nombre }));
  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Seccion
        titulo={`${movs.length} ${tipo === "ingreso" ? (movs.length === 1 ? "ingreso" : "ingresos") : movs.length === 1 ? "gasto" : "gastos"} · ${$(total)}`}
        acciones={<div className="flex flex-wrap gap-2"><Categorias tipo={tipo} categorias={d.categorias} /><NuevoMovimiento tipo={tipo} categorias={d.categorias} cuentas={cuentas} /></div>}
      >
        {movs.length === 0 ? (
          <p className="py-6 text-center text-sm text-texto-3">Nada registrado en este periodo.</p>
        ) : (
          <div className="-mx-4 overflow-x-auto sm:-mx-5">
            <table className="tabla">
              <thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Cuenta</th><th className="text-right">Importe</th><th></th></tr></thead>
              <tbody>
                {movs.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap text-texto-2">{fecha(m.fecha, proyecto)}</td>
                    <td>{m.descripcion ?? "—"} {ORIGEN[m.origen] && <Insignia>{ORIGEN[m.origen]}</Insignia>} {!m.conciliado && <Insignia tono="aviso">Sin conciliar</Insignia>}</td>
                    <td className="text-texto-2">{cat.get(m.categoria_id ?? "")?.nombre ?? "Sin categoría"}{tipo === "egreso" && cat.get(m.categoria_id ?? "")?.en_profit === false && <span className="text-xs text-texto-3"> · fuera del profit</span>}</td>
                    <td className="text-texto-2">{cuenta.get(m.cuenta_id ?? "") ?? d.cuentas.find((c) => c.por_defecto)?.nombre ?? "—"}</td>
                    <td className="text-right tabular-nums">{$(m.importe)}</td>
                    <td className="text-right"><BorrarMovimiento id={m.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Seccion>
      <Seccion titulo="Por categoría">
        {porCat.size === 0 ? (
          <p className="py-6 text-center text-sm text-texto-3">—</p>
        ) : (
          <div className="space-y-3">
            {[...porCat.entries()].sort((a, b) => b[1] - a[1]).map(([id, v]) => (
              <div key={id || "sin"}>
                <div className="flex justify-between text-sm"><span>{cat.get(id)?.nombre ?? "Sin categoría"}</span><span className="tabular-nums">{$(v)}</span></div>
                <div className="mt-1 h-2 rounded-full bg-panel-2"><div className="h-2 rounded-full bg-primario" style={{ width: `${(v / total) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        )}
      </Seccion>
    </div>
  );
}

export function TabIngresos({ d, rango, proyecto }: { d: DatosFinanzas; rango: Rango; proyecto: Proyecto }) {
  return (
    <>
      <p className="text-sm text-texto-2">Dinero que entra fuera de las ventas (afiliados, patrocinios…). Las ventas y sus cobros ya cuentan solos.</p>
      <ListaMovimientos d={d} tipo="ingreso" rango={rango} proyecto={proyecto} />
    </>
  );
}

export function TabEgresos({ d, rango, proyecto, sp }: { d: DatosFinanzas; rango: Rango; proyecto: Proyecto; sp: SP }) {
  const ver = typeof sp.ver === "string" ? sp.ver : "";
  const $ = (n: number) => dinero(n, proyecto, 2);
  const cat = new Map(d.categorias.map((c) => [c.id, c.nombre]));
  const cuentas = d.cuentas.map((c) => ({ id: c.id, nombre: c.nombre }));
  return (
    <>
      <Chips sp={sp} nombre="ver" opciones={[["", "Registrados"], ["programados", "Programados"]]} />
      {ver === "programados" ? (
        <Seccion titulo="Gastos que se repiten" acciones={<NuevoProgramado categorias={d.categorias} cuentas={cuentas} />}>
          {d.programados.length === 0 ? (
            <p className="py-6 text-center text-sm text-texto-3">No hay gastos programados. Añade los que pagas siempre (herramientas, sueldos fijos…).</p>
          ) : (
            <div className="-mx-4 overflow-x-auto sm:-mx-5">
              <table className="tabla">
                <thead><tr><th>Gasto</th><th>Categoría</th><th>Cada</th><th>Próximo pago</th><th className="text-right">Importe</th><th></th></tr></thead>
                <tbody>
                  {d.programados.map((p) => (
                    <tr key={p.id}>
                      <td>{p.descripcion}</td>
                      <td className="text-texto-2">{cat.get(p.categoria_id ?? "") ?? "Sin categoría"}</td>
                      <td className="text-texto-2">{CADA[p.cada]}</td>
                      <td className="whitespace-nowrap">{p.proxima.split("-").reverse().join("/")}</td>
                      <td className="text-right tabular-nums">{$(Number(p.importe))}</td>
                      <td className="text-right"><AccionesProgramado id={p.id} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-texto-3">No se cobran solos: cuando lo pagues, pulsa «Registrar pago» y se apunta como gasto con la fecha prevista; la próxima fecha avanza sola.</p>
        </Seccion>
      ) : (
        <ListaMovimientos d={d} tipo="egreso" rango={rango} proyecto={proyecto} />
      )}
    </>
  );
}
