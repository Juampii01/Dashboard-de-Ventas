"use server";

import { ErrorUsuario, notaValida, seguro } from "@/lib/resultado";
import { revalidatePath } from "next/cache";
import { getSesion, esJefe } from "@/lib/auth";
import { db, registrarActividad, escribir } from "@/lib/datos";
import { hoyEnZona, localAIso } from "@/lib/formato";
import { diaEnZona } from "@/lib/llamadas";
import { leerNumero } from "@/lib/numero";

async function ventaPermitida(ventaId: string) {
  const { perfil, proyecto } = await getSesion();
  const { data: venta } = await db().from("ventas").select("*").eq("id", ventaId).eq("proyecto_id", proyecto.id).maybeSingle();
  if (!venta) throw new ErrorUsuario("Venta no encontrada.");
  if (!esJefe(perfil) && venta.vendedor_id !== perfil.id) throw new ErrorUsuario("Esta venta no es tuya.");
  return { venta, perfil, proyecto };
}

const METODOS = ["stripe", "transferencia", "otro"];

// Cobro posterior: una cuota o el resto de una reserva.
// Arreglo 13: se puede poner la fecha real del cobro (por defecto, hoy); ni futura ni anterior a la venta.
export async function registrarCobro(ventaId: string, importeTxt: string, metodo: string, fechaTxt = "") {
  return seguro(async () => {
    const { venta, perfil, proyecto } = await ventaPermitida(ventaId);
    const importe = leerNumero(importeTxt);
    if (!(importe > 0)) throw new ErrorUsuario("El importe tiene que ser mayor que 0.");
    if (!METODOS.includes(metodo)) throw new ErrorUsuario("Elige el método de pago.");
    let fecha = new Date().toISOString();
    if (fechaTxt) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaTxt)) throw new ErrorUsuario("Fecha del cobro no válida.");
      if (fechaTxt > hoyEnZona(proyecto.zona_horaria)) throw new ErrorUsuario("La fecha del cobro no puede ser futura.");
      if (fechaTxt < diaEnZona(venta.fecha, proyecto.zona_horaria)) throw new ErrorUsuario("La fecha del cobro no puede ser anterior a la venta.");
      if (fechaTxt !== hoyEnZona(proyecto.zona_horaria)) fecha = localAIso(`${fechaTxt}T12:00`, proyecto.zona_horaria);
    }
    const { data: pagos } = await db().from("pagos").select("importe").eq("venta_id", ventaId);
    const cobrado = Number(venta.cash_collected) + (pagos ?? []).reduce((s, p) => s + Number(p.importe), 0);
    if (cobrado + importe > Number(venta.facturacion) + 0.001) throw new ErrorUsuario("Con ese importe se cobraría más que la facturación.");
    await escribir(db().from("pagos").insert({ venta_id: ventaId, importe, metodo, registrado_por: perfil.id, fecha }), "pagos");
    await registrarActividad({ proyecto_id: proyecto.id, lead_id: venta.lead_id, perfil_id: perfil.id, tipo: "venta", resultado: "cobro", nota: `Cobro registrado: ${importe}` });
    revalidatePath("/", "layout");
  });
}

// Devolución (decisión de Cristian, 9 oct 2026): importe y fecha; la comisión ya pagada
// no se descuenta, la asume la empresa. Solo una devolución por venta.
export async function registrarDevolucion(ventaId: string, importeTxt: string, fechaTxt: string, nota: string) {
  return seguro(async () => {
    nota = notaValida(nota);
    const { venta, perfil, proyecto } = await ventaPermitida(ventaId);
    if (!esJefe(perfil)) throw new ErrorUsuario("Solo el director o el CEO registran devoluciones.");
    if (venta.devuelto) throw new ErrorUsuario("Esta venta ya tiene una devolución registrada.");
    const importe = leerNumero(importeTxt);
    if (!(importe > 0)) throw new ErrorUsuario("El importe tiene que ser mayor que 0.");
    const { data: pagos } = await db().from("pagos").select("importe").eq("venta_id", ventaId);
    const cobrado = Number(venta.cash_collected) + (pagos ?? []).reduce((s, p) => s + Number(p.importe), 0);
    if (importe > cobrado + 0.001) throw new ErrorUsuario(`No se puede devolver más de lo cobrado (${cobrado}).`);
    const fecha = fechaTxt ? localAIso(`${fechaTxt}T12:00`, proyecto.zona_horaria) : new Date().toISOString();
    await escribir(db().from("ventas").update({ devuelto: importe, devuelto_en: fecha, devolucion_nota: nota.trim() || null }).eq("id", ventaId), "ventas");
    await registrarActividad({ proyecto_id: proyecto.id, lead_id: venta.lead_id, perfil_id: perfil.id, tipo: "venta", resultado: "devolucion", nota: `Devolución: ${importe}${nota.trim() ? ` · ${nota.trim()}` : ""}` });
    revalidatePath("/", "layout");
  });
}

export async function borrarVenta(ventaId: string) {
  return seguro(async () => {
    const { venta, perfil, proyecto } = await ventaPermitida(ventaId);
    if (!esJefe(perfil)) throw new ErrorUsuario("Solo el director o el CEO pueden borrar ventas.");
    await escribir(db().from("ventas").delete().eq("id", ventaId), "ventas"); // sus cobros y plazos se borran con ella
    // Arreglo 26 (decisión de Cristian): si al lead no le queda otra venta, la cita que se cerró vuelve a
    // «seguimiento» y el lead deja de estar «vendido» (vuelve a «agendado» si tiene cita; si no, a «nuevo»).
    const { count: otras } = await db().from("ventas").select("id", { count: "exact", head: true }).eq("lead_id", venta.lead_id);
    if (!otras) {
      const { data: cerrada } = await db().from("citas").select("id").eq("lead_id", venta.lead_id).eq("estado", "cerrada").order("fecha", { ascending: false }).limit(1).maybeSingle();
      if (cerrada) await escribir(db().from("citas").update({ estado: "seguimiento" }).eq("id", cerrada.id), "citas");
      const { count: citas } = await db().from("citas").select("id", { count: "exact", head: true }).eq("lead_id", venta.lead_id);
      await escribir(db().from("leads").update({ estado_caller: citas ? "agendado" : "nuevo" }).eq("id", venta.lead_id), "leads");
    }
    await registrarActividad({ proyecto_id: proyecto.id, lead_id: venta.lead_id, perfil_id: perfil.id, tipo: "nota", nota: "Venta borrada" });
    // Si ese mes ya se calcularon comisiones, hay que recalcularlas (las pagadas no se tocan solas)
    const mes = diaEnZona(venta.fecha, proyecto.zona_horaria).slice(0, 7);
    const { count: liqs } = await db().from("liquidaciones").select("id", { count: "exact", head: true }).eq("proyecto_id", proyecto.id).eq("mes", mes);
    revalidatePath("/", "layout");
    return { aviso: liqs ? `Las comisiones de ${mes} ya estaban calculadas: recalcúlalas en Finanzas → Liquidaciones.` : null };
  });
}
