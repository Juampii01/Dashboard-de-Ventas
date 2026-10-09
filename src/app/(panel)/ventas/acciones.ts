"use server";

import { ErrorUsuario, seguro } from "@/lib/resultado";
import { revalidatePath } from "next/cache";
import { getSesion, esJefe } from "@/lib/auth";
import { db, registrarActividad } from "@/lib/datos";

async function ventaPermitida(ventaId: string) {
  const { perfil, proyecto } = await getSesion();
  const { data: venta } = await db().from("ventas").select("*").eq("id", ventaId).eq("proyecto_id", proyecto.id).maybeSingle();
  if (!venta) throw new ErrorUsuario("Venta no encontrada.");
  if (!esJefe(perfil) && venta.vendedor_id !== perfil.id) throw new ErrorUsuario("Esta venta no es tuya.");
  return { venta, perfil, proyecto };
}

// Cobro posterior: una cuota o el resto de una reserva.
export async function registrarCobro(ventaId: string, importeTxt: string, metodo: string) {
  return seguro(async () => {
    const { venta, perfil, proyecto } = await ventaPermitida(ventaId);
    const importe = Number(importeTxt.replace(",", "."));
    if (!(importe > 0)) throw new ErrorUsuario("El importe tiene que ser mayor que 0.");
    const { data: pagos } = await db().from("pagos").select("importe").eq("venta_id", ventaId);
    const cobrado = Number(venta.cash_collected) + (pagos ?? []).reduce((s, p) => s + Number(p.importe), 0);
    if (cobrado + importe > Number(venta.facturacion) + 0.001) throw new ErrorUsuario("Con ese importe se cobraría más que la facturación.");
    await db().from("pagos").insert({ venta_id: ventaId, importe, metodo, registrado_por: perfil.id });
    await registrarActividad({ proyecto_id: proyecto.id, lead_id: venta.lead_id, perfil_id: perfil.id, tipo: "venta", resultado: "cobro", nota: `Cobro registrado: ${importe}` });
    revalidatePath("/", "layout");
  });
}

export async function borrarVenta(ventaId: string) {
  return seguro(async () => {
    const { venta, perfil, proyecto } = await ventaPermitida(ventaId);
    if (!esJefe(perfil)) throw new ErrorUsuario("Solo el director o el CEO pueden borrar ventas.");
    await db().from("ventas").delete().eq("id", ventaId);
    await registrarActividad({ proyecto_id: proyecto.id, lead_id: venta.lead_id, perfil_id: perfil.id, tipo: "nota", nota: "Venta borrada" });
    revalidatePath("/", "layout");
  });
}
