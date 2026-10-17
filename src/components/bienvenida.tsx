"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Velocidad (17 oct 2026, Cristian: «todos deberían tener esa pantalla de carga; cargará en segundo plano la app»).
// Al abrir la app en una pestaña (o tras iniciar sesión), una capa con la marca tapa la app mientras se precargan
// TODAS las secciones del menú (copia invisible en barra-lateral.tsx). La barra avanza con cada petición que llega y
// se llena entera antes de entrar; se quita cuando están todas, como mínimo a los 0,8 s y como máximo a los 3 s
// (más ~0,3 s para que se vea la barra llena: Cristian, 17 oct, «la barrita debería cargar entera antes de iniciar»). Sale en cada carga completa (pestaña nueva o recarga:
// Cristian, 17 oct), porque al recargar se pierde todo lo precargado; al moverse dentro de la app no vuelve a salir.
const MINIMO_MS = 800;
const MAXIMO_MS = 3000;
const LLENAR_MS = 300; // lo que tarda la barra en llenarse (su transición) antes de quitar la capa

export function Bienvenida({ nombre, rutas }: { nombre: string; rutas: string[] }) {
  const ruta = usePathname();
  // La sección en la que se entra ya está cargada: no hace falta esperarla
  const [pendientes] = useState(() => [...new Set(rutas)].filter((r) => r !== ruta));
  // Peticiones llegadas: cada sección son 2 (su esquema y sus datos)
  const [llegadas, setLlegadas] = useState(0);
  const [llena, setLlena] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t0 = performance.now();
    const faltan = new Set(pendientes);
    let acabada = false;
    const acabar = () => {
      if (acabada) return;
      acabada = true;
      // Primero la barra llena (y se ve), después entra a la app
      setTimeout(() => {
        setLlena(true);
        setTimeout(() => setVisible(false), LLENAR_MS);
      }, Math.max(0, MINIMO_MS - LLENAR_MS - (performance.now() - t0)));
    };
    // Cada sección precarga 2 peticiones «?_rsc=»: primero su esquema y después sus datos (medido el 17 oct; contar
    // solo la primera quitaba la bienvenida antes de tener los datos). Está lista cuando han llegado las dos.
    const vistas = new Map<string, number>();
    const mirar = (entradas: PerformanceEntryList) => {
      for (const e of entradas) {
        if (!e.name.includes("_rsc=")) continue;
        const r = new URL(e.name).pathname;
        if (!faltan.has(r)) continue;
        const n = (vistas.get(r) ?? 0) + 1;
        vistas.set(r, n);
        setLlegadas((x) => x + 1);
        if (n >= 2) faltan.delete(r);
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
  const avance = llena || !pendientes.length ? 100 : Math.min(95, Math.round((llegadas / (pendientes.length * 2)) * 100));
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
