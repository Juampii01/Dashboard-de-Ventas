import "server-only";
import { db, todas } from "@/lib/datos";
import type { CatF, CuentaF, MovF, PagoF, VentaF, VencF } from "@/lib/finanzas";

const CATEGORIAS = [
  { tipo: "egreso", nombre: "Publicidad" },
  { tipo: "egreso", nombre: "Comisiones" },
  { tipo: "egreso", nombre: "Herramientas" },
  { tipo: "egreso", nombre: "Equipo" },
  { tipo: "egreso", nombre: "Otros gastos" },
  { tipo: "ingreso", nombre: "Otros ingresos" },
];

// La primera vez: una cuenta «Todo» (recibe todo lo que no esté en otra cuenta) y las categorías básicas.
// Si dos páginas lo hacen a la vez, la base no deja repetir (índice único): el segundo intento falla sin más.
export async function asegurarFinanzas(proyectoId: string) {
  const [{ count: nCuentas }, { count: nCats }] = await Promise.all([
    db().from("cuentas").select("id", { count: "exact", head: true }).eq("proyecto_id", proyectoId),
    db().from("categorias_finanzas").select("id", { count: "exact", head: true }).eq("proyecto_id", proyectoId),
  ]);
  if (!nCuentas) await db().from("cuentas").insert({ proyecto_id: proyectoId, nombre: "Todo", por_defecto: true, metodos: [] });
  if (!nCats) await db().from("categorias_finanzas").insert(CATEGORIAS.map((c) => ({ ...c, proyecto_id: proyectoId })));
}

export async function cargarFinanzas(proyectoId: string) {
  await asegurarFinanzas(proyectoId);
  const [ventas, pagos, movimientos, categorias, cuentas, vencimientos, productos] = await Promise.all([
    todas<VentaF & { tipo_pago: string; num_cuotas: number | null }>((a, b) => db().from("ventas").select("id, lead_id, producto_id, vendedor_id, facturacion, cash_collected, fecha, metodo, tipo_pago, num_cuotas, devuelto, devuelto_en").eq("proyecto_id", proyectoId).range(a, b)),
    todas<PagoF>((a, b) => db().from("pagos").select("id, venta_id, importe, fecha, metodo, ventas!inner(proyecto_id)").eq("ventas.proyecto_id", proyectoId).range(a, b)),
    todas<MovF & { descripcion: string | null; origen: string }>((a, b) => db().from("movimientos").select("*").eq("proyecto_id", proyectoId).order("fecha", { ascending: false }).range(a, b)),
    db().from("categorias_finanzas").select("id, tipo, nombre, en_profit").eq("proyecto_id", proyectoId).order("nombre"),
    db().from("cuentas").select("id, nombre, metodos, por_defecto").eq("proyecto_id", proyectoId).order("creado_en"),
    todas<VencF & { lead_id: string | null; nombre: string | null; numero: number; pagado_en: string | null }>((a, b) => db().from("vencimientos").select("*").eq("proyecto_id", proyectoId).order("vence_el").range(a, b)),
    db().from("productos").select("id, nombre, backend_offer, comisiones").eq("proyecto_id", proyectoId),
  ]);
  const num = <T extends { importe?: number }>(x: T) => ({ ...x, importe: Number(x.importe) });
  return {
    ventas: ventas.map((v) => ({ ...v, facturacion: Number(v.facturacion), cash_collected: Number(v.cash_collected), devuelto: v.devuelto === null ? null : Number(v.devuelto) })),
    pagos: pagos.map(num),
    movimientos: movimientos.map(num),
    categorias: (categorias.data ?? []) as CatF[],
    cuentas: (cuentas.data ?? []) as CuentaF[],
    vencimientos: vencimientos.map(num),
    productos: productos.data ?? [],
    backend: new Set((productos.data ?? []).filter((p) => p.backend_offer).map((p) => p.id)),
  };
}
