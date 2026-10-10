"use server";

import { revalidatePath } from "next/cache";
import { ErrorUsuario, seguro } from "@/lib/resultado";
import { db, escribir } from "@/lib/datos";
import { exigirSeccion, soloLoSuyo } from "@/lib/permisos";
import { leerNumero } from "@/lib/numero";
import { exigirCambiarComisionRol } from "@/lib/auth";
import type { Rol } from "@/lib/tipos";

export type DatosPrograma = {
  id: string | null;
  nombre: string;
  descripcion: string;
  categoria: string;
  color: string;
  activo: boolean;
  backend_offer: boolean;
  vende_caller: boolean;
  modo_pago: "unico" | "cuotas";
  num_cuotas: number | null;
  precio: string; // vacío = precio personalizado
  precios_divisa: Record<string, string>;
  comisiones: Record<string, string>; // closer, caller, director, ceo, caller_agenda
  link_pago: string;
};

const num = (v: string, campo: string, max = 1e9) => {
  if (v.trim() === "") return null;
  const n = leerNumero(v);
  if (!Number.isFinite(n) || n < 0 || n > max) throw new ErrorUsuario(`${campo} no válido.`);
  return Math.round(n * 100) / 100;
};

export async function guardarPrograma(d: DatosPrograma) {
  return seguro(async () => {
    const { perfil, proyecto } = await exigirSeccion("programas");
    if (soloLoSuyo(perfil, "programas")) throw new ErrorUsuario("Programas es solo para mirar."); // H5
    if (!d.nombre.trim()) throw new ErrorUsuario("Falta el nombre del programa.");
    const precio = num(d.precio, "Precio");
    if (precio === 0) throw new ErrorUsuario("El precio del programa está en cero (déjalo vacío si es personalizado).");
    if (d.modo_pago === "cuotas" && !(d.num_cuotas && d.num_cuotas >= 2 && d.num_cuotas <= 60)) throw new ErrorUsuario("Pon de 2 a 60 cuotas.");
    const divisas: Record<string, number> = {};
    for (const [mon, v] of Object.entries(d.precios_divisa ?? {})) {
      if (!["USD", "EUR"].includes(mon) || mon === proyecto.moneda) continue;
      const n = num(v, `Precio en ${mon}`);
      if (n) divisas[mon] = n;
    }
    const comisiones: Record<string, number> = {};
    for (const k of ["closer", "caller", "director", "ceo", "caller_agenda"]) {
      const n = num(d.comisiones?.[k] ?? "", "Comisión", 100);
      if (n) comisiones[k] = n;
    }
    const link = d.link_pago.trim();
    if (link && !/^https:\/\//i.test(link)) throw new ErrorUsuario("El link de pago tiene que empezar por https://"); // arreglo 35: solo https
    const fila = {
      nombre: d.nombre.trim(),
      descripcion: d.descripcion.trim() || null,
      categoria: d.categoria.trim() || null,
      color: /^#[0-9a-f]{6}$/i.test(d.color) ? d.color : "#2f55d4",
      activo: d.activo,
      backend_offer: d.backend_offer,
      vende_caller: d.vende_caller,
      modo_pago: d.modo_pago,
      num_cuotas: d.modo_pago === "cuotas" ? d.num_cuotas : null,
      precio,
      precios_divisa: Object.keys(divisas).length ? divisas : null,
      comisiones: Object.keys(comisiones).length ? comisiones : null,
      link_pago: link || null,
    };
    // Comisiones: solo el CEO o el director, y el director no la de su propio rol (arreglo 2)
    const antes = d.id ? (await db().from("productos").select("comisiones").eq("id", d.id).eq("proyecto_id", proyecto.id).maybeSingle()).data : null;
    if (d.id && !antes) throw new ErrorUsuario("Programa no encontrado.");
    const previas = (antes?.comisiones ?? {}) as Record<string, number>;
    for (const k of new Set([...Object.keys(previas), ...Object.keys(comisiones)])) {
      if ((previas[k] ?? 0) !== (comisiones[k] ?? 0)) exigirCambiarComisionRol(perfil, (k === "caller_agenda" ? "caller" : k) as Rol);
    }
    if (d.id) {
      await escribir(db().from("productos").update(fila).eq("id", d.id), "productos");
    } else {
      const { count } = await db().from("productos").select("id", { count: "exact", head: true }).eq("proyecto_id", proyecto.id);
      await escribir(db().from("productos").insert({ ...fila, proyecto_id: proyecto.id, orden: count ?? 0 }), "productos");
    }
    revalidatePath("/", "layout");
  });
}

export async function activarPrograma(id: string, activo: boolean) {
  return seguro(async () => {
    const { perfil, proyecto } = await exigirSeccion("programas");
    if (soloLoSuyo(perfil, "programas")) throw new ErrorUsuario("Programas es solo para mirar."); // H5
    await escribir(db().from("productos").update({ activo }).eq("id", id).eq("proyecto_id", proyecto.id), "productos");
    revalidatePath("/", "layout");
  });
}
