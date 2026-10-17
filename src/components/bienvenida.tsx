"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Velocidad (17 oct 2026, Cristian: «todos deberían tener esa pantalla de carga; cargará en segundo plano la app»).
// Al abrir la app en una pestaña (o tras iniciar sesión), una capa con la marca tapa la app mientras se precargan
// TODAS las secciones del menú (PrecargaMenu, abajo). La barra avanza según las que ya están; se quita cuando están
// todas, como mínimo a los 0,8 s y como máximo a los 3 s. Una vez por pestaña (sessionStorage); el script de
// src/app/layout.tsx la esconde antes de pintar si esta pestaña ya la vio. Cerrar sesión o ir al login la reinicia.
export const CLAVE_ENTRADA = "eternity_entrada";
const MINIMO_MS = 800;
const MAXIMO_MS = 3000;

export function Bienvenida({ nombre, rutas }: { nombre: string; rutas: string[] }) {
  const ruta = usePathname();
  // La sección en la que se entra ya está cargada: no hace falta esperarla
  const [pendientes] = useState(() => [...new Set(rutas)].filter((r) => r !== ruta));
  const [hechas, setHechas] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let yaVista = false;
    try {
      yaVista = !!sessionStorage.getItem(CLAVE_ENTRADA);
      sessionStorage.setItem(CLAVE_ENTRADA, "1");
    } catch {
      yaVista = false; // sin sessionStorage (modo privado estricto): se enseña cada vez, no rompe nada
    }
    const t0 = performance.now();
    const faltan = new Set(pendientes);
    let acabada = false;
    const acabar = (inmediato = false) => {
      if (acabada) return;
      acabada = true;
      setTimeout(() => setVisible(false), inmediato ? 0 : Math.max(0, MINIMO_MS - (performance.now() - t0)));
    };
    if (yaVista) {
      acabar(true);
      return;
    }
    // Cada precarga terminada es una petición «?_rsc=» a la ruta de una sección
    const mirar = (entradas: PerformanceEntryList) => {
      for (const e of entradas) {
        if (!e.name.includes("_rsc=")) continue;
        if (faltan.delete(new URL(e.name).pathname)) setHechas(pendientes.length - faltan.size);
      }
      if (faltan.size === 0) acabar();
    };
    const observador = new PerformanceObserver((l) => mirar(l.getEntries()));
    observador.observe({ type: "resource", buffered: true });
    if (faltan.size === 0) acabar();
    const tope = setTimeout(() => acabar(), MAXIMO_MS);
    return () => {
      observador.disconnect();
      clearTimeout(tope);
    };
  }, [pendientes]);

  if (!visible) return null;
  const avance = pendientes.length ? Math.round((hechas / pendientes.length) * 100) : 100;
  return (
    <div id="entrada" className="fondo-app fixed inset-0 z-[100] flex items-center justify-center p-4" role="status" aria-live="polite">
      <div className="tarjeta w-full max-w-sm p-8 text-center">
        <div className="entrada-logo mx-auto mb-6 w-fit rounded-2xl">
          <Image src="/marca/eternity.png" alt="Eternity" width={72} height={72} className="rounded-2xl" priority />
        </div>
        <h1 className="entrada-texto text-2xl font-semibold tracking-tight">Hola, {nombre}</h1>
        <p key={avance < 50 ? 0 : 1} className="entrada-texto mt-2 text-sm text-texto-2">{avance < 50 ? "Comprobando tu acceso…" : "Cargando tu panel…"}</p>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-panel-2">
          <div className="h-full rounded-full bg-primario transition-[width] duration-300 ease-out" style={{ width: `${Math.max(avance, 8)}%` }} />
        </div>
      </div>
    </div>
  );
}

// Next solo precarga los enlaces que se ven. Esta copia invisible del menú, en un píxel de la pantalla (fuera del
// menú: en el móvil el menú está escondido a un lado y no se precargaba nada), precarga todas las secciones.
// Cada enlace en el mismo píxel (medido el 17 oct: en fila quedaban fuera del recorte y no se precargaban).
export function PrecargaMenu({ rutas }: { rutas: string[] }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 h-px w-px opacity-0">
      {[...new Set(rutas)].map((r) => (
        <Link key={r} href={r} prefetch={true} tabIndex={-1} className="absolute inset-0 block overflow-hidden">
          {r}
        </Link>
      ))}
    </div>
  );
}
