"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { refrescarTodo } from "@/app/(panel)/acciones-globales";

// Velocidad (17 oct 2026), tiempo real: escucha el canal privado del proyecto (avisos de la base, sin datos;
// migración 20261017150000_avisos_en_vivo) y, cuando alguien cambia leads, citas, tarjetas o ventas, vuelve a
// pedir la página que se está viendo. Varios avisos seguidos = un solo refresco. Con la pestaña oculta, espera a
// que vuelva a estar a la vista. Si el canal no conecta, la app sigue igual que antes (sin tiempo real).
const ESPERA_MS = 1500;

export function AvisosEnVivo({ proyectoId }: { proyectoId: string }) {
  useEffect(() => {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
    let temporizador: ReturnType<typeof setTimeout> | null = null;
    let pendiente = false;
    let vivo = true;

    const refrescar = () => {
      if (document.visibilityState === "visible") {
        pendiente = false;
        // Todo lo guardado (las secciones se guardan 5 min): así ninguna enseña datos de antes del cambio
        void refrescarTodo().catch((e) => console.warn("[avisos en vivo] refrescar", e));
      } else {
        pendiente = true;
      }
    };
    const alAviso = () => {
      if (temporizador) clearTimeout(temporizador);
      temporizador = setTimeout(refrescar, ESPERA_MS);
    };
    const alVolver = () => {
      if (pendiente && document.visibilityState === "visible") refrescar();
    };
    document.addEventListener("visibilitychange", alVolver);

    const canal = supabase.channel(`proyecto:${proyectoId}`, { config: { private: true } });
    void supabase.realtime.setAuth().then(() => {
      if (!vivo) return;
      canal.on("broadcast", { event: "cambio" }, alAviso).subscribe((estado, error) => {
        if (estado === "CHANNEL_ERROR" || estado === "TIMED_OUT") console.warn("[avisos en vivo]", estado, error?.message ?? "");
      });
    });

    return () => {
      vivo = false;
      if (temporizador) clearTimeout(temporizador);
      document.removeEventListener("visibilitychange", alVolver);
      void supabase.removeChannel(canal);
    };
  }, [proyectoId]);
  return null;
}
