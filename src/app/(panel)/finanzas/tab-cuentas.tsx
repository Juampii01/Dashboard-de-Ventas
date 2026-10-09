import { saldosCuentas } from "@/lib/finanzas";
import { enRango } from "@/lib/periodos";
import { dinero, fecha, type Rango } from "@/lib/formato";
import { Insignia, Seccion } from "@/components/ui";
import type { Proyecto } from "@/lib/tipos";
import type { DatosFinanzas } from "./cargar";
import { BorrarMovimiento, Conciliar, EditarCuenta, ImportarBanco, Transferir } from "./cliente";
import { Chips } from "./tab-ventas";

type SP = Record<string, string | string[] | undefined>;
const METODO: Record<string, string> = { stripe: "Stripe", transferencia: "Transferencia", otro: "Otro" };

export function TabCuentas({ d, rango, proyecto }: { d: DatosFinanzas; rango: Rango; proyecto: Proyecto }) {
  const $ = (n: number) => dinero(n, proyecto, 2);
  const saldos = saldosCuentas(d.cuentas, d, rango);
  const cuentas = d.cuentas.map((c) => ({ id: c.id, nombre: c.nombre }));
  const total = [...saldos.values()].reduce((s, x) => s + x.saldo, 0);
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="tarjeta px-4 py-3"><span className="titulo-seccion">Saldo total</span> <span className="ml-2 text-xl font-semibold tabular-nums">{$(total)}</span></div>
        <div className="ml-auto flex gap-2"><Transferir cuentas={cuentas} desde={d.cuentas[0]?.id ?? ""} /><EditarCuenta cuenta={null} /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {d.cuentas.map((c) => {
          const s = saldos.get(c.id) ?? { saldo: 0, entro: 0, salio: 0 };
          return (
            <article key={c.id} className="tarjeta space-y-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{c.nombre} {c.por_defecto && <Insignia tono="primario">Por defecto</Insignia>}</span>
                <EditarCuenta cuenta={{ id: c.id, nombre: c.nombre, metodos: c.metodos }} />
              </div>
              <div className={`text-3xl font-semibold tabular-nums ${s.saldo < 0 ? "text-mal" : ""}`}>{$(s.saldo)}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><div className="text-xs text-texto-3">Entró ({rango.etiqueta.toLowerCase()})</div><div className="tabular-nums text-ok">{$(s.entro)}</div></div>
                <div><div className="text-xs text-texto-3">Salió</div><div className="tabular-nums text-mal">{$(s.salio)}</div></div>
              </div>
              <p className="text-xs text-texto-3">{c.metodos.length ? `Recibe: ${c.metodos.map((m) => METODO[m] ?? m).join(", ")}` : c.por_defecto ? "Recibe todo lo que no va a otra cuenta" : "Sin método de cobro asignado"}</p>
            </article>
          );
        })}
      </div>
      <p className="text-xs text-texto-3">El saldo suma desde el principio: cobros de ventas (en la cuenta de su método), ingresos extra, menos gastos y devoluciones, más o menos las transferencias. «Entró» y «Salió» son solo del periodo elegido.</p>
    </>
  );
}

export function TabMovimientos({ d, rango, proyecto, sp }: { d: DatosFinanzas; rango: Rango; proyecto: Proyecto; sp: SP }) {
  const $ = (n: number) => dinero(n, proyecto, 2);
  const filtro = typeof sp.conc === "string" ? sp.conc : "";
  const cat = new Map(d.categorias.map((c) => [c.id, c.nombre]));
  const cuenta = new Map(d.cuentas.map((c) => [c.id, c.nombre]));
  const enPeriodo = d.movimientos.filter((m) => enRango(m.fecha, rango));
  const sinConciliar = enPeriodo.filter((m) => !m.conciliado).length;
  const movs = enPeriodo.filter((m) => (filtro === "no" ? !m.conciliado : filtro === "si" ? m.conciliado : true));
  const cuentas = d.cuentas.map((c) => ({ id: c.id, nombre: c.nombre }));
  const TIPO = { ingreso: ["Ingreso", "ok"], egreso: ["Gasto", "mal"], transferencia: ["Transferencia", "neutro"] } as const;
  return (
    <Seccion
      titulo={`${movs.length} ${movs.length === 1 ? "movimiento" : "movimientos"}${sinConciliar ? ` · ${sinConciliar} sin conciliar` : ""}`}
      acciones={<div className="flex flex-wrap gap-2"><Chips sp={sp} nombre="conc" opciones={[["", "Todos"], ["no", "Sin conciliar"], ["si", "Conciliados"]]} /><ImportarBanco cuentas={cuentas} /></div>}
    >
      {movs.length === 0 ? (
        <p className="py-6 text-center text-sm text-texto-3">No hay movimientos en este periodo. Los cobros de las ventas están en «Ventas».</p>
      ) : (
        <div className="-mx-4 overflow-x-auto sm:-mx-5">
          <table className="tabla">
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th>Cuenta</th><th className="text-right">Importe</th><th>Conciliación</th><th></th></tr></thead>
            <tbody>
              {movs.map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap text-texto-2">{fecha(m.fecha, proyecto)}</td>
                  <td><Insignia tono={TIPO[m.tipo][1]}>{TIPO[m.tipo][0]}</Insignia></td>
                  <td>{m.descripcion ?? "—"}{m.categoria_id && <span className="text-xs text-texto-3"> · {cat.get(m.categoria_id)}</span>}</td>
                  <td className="text-texto-2">{m.tipo === "transferencia" ? `${cuenta.get(m.cuenta_id ?? "") ?? "?"} → ${cuenta.get(m.cuenta_destino_id ?? "") ?? "?"}` : cuenta.get(m.cuenta_id ?? "") ?? d.cuentas.find((c) => c.por_defecto)?.nombre ?? "—"}</td>
                  <td className={`text-right tabular-nums ${m.tipo === "egreso" ? "text-mal" : m.tipo === "ingreso" ? "text-ok" : ""}`}>{m.tipo === "egreso" ? "−" : ""}{$(m.importe)}</td>
                  <td>{m.conciliado ? <span className="text-xs text-ok">Conciliado</span> : m.tipo !== "transferencia" && <Conciliar id={m.id} categorias={d.categorias} tipo={m.tipo} />}</td>
                  <td className="text-right"><BorrarMovimiento id={m.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-texto-3">Conciliar = comprobar un movimiento del banco y darle su categoría. Lo que importas del CSV del banco empieza «sin conciliar»; lo que apuntas a mano ya está conciliado.</p>
    </Seccion>
  );
}
