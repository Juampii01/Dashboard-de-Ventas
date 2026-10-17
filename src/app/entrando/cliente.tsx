"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PASOS_PRIMERA = ["Preparando tu cuenta…", "Cargando tu equipo…"];
const PASOS = ["Comprobando tu acceso…", "Cargando tu panel…"];

// Velocidad (17 oct 2026, Cristian: «que dure lo que tarde en cargar»): antes eran 3 s fijos. Ahora la sección de
// destino se precarga entera nada más aparecer esta pantalla (el enlace invisible de abajo) y se entra a los 0,8 s,
// lo justo para ver la marca; si el servidor tarda más, sigue el «cargando» de la sección.
const MINIMO_MS = 800;

export function PantallaEntrada({ nombre, destino, primeraVez }: { nombre: string; destino: string; primeraVez: boolean }) {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const pasos = primeraVez ? PASOS_PRIMERA : PASOS;
  useEffect(() => {
    const t1 = setTimeout(() => setPaso(1), MINIMO_MS / 2);
    const fin = setTimeout(() => router.replace(destino), MINIMO_MS);
    return () => [t1, fin].forEach(clearTimeout);
  }, [destino, router]);
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      {/* Precarga completa del destino (con sus datos), en un píxel invisible «a la vista» */}
      <Link href={destino} prefetch={true} tabIndex={-1} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 h-px w-px overflow-hidden opacity-0">
        {destino}
      </Link>
      <div className="tarjeta w-full max-w-sm p-8 text-center">
        <div className="entrada-logo mx-auto mb-6 w-fit rounded-2xl">
          <Image src="/marca/eternity.png" alt="Eternity" width={72} height={72} className="rounded-2xl" priority />
        </div>
        <h1 className="entrada-texto text-2xl font-semibold tracking-tight">{primeraVez ? `Bienvenido, ${nombre}` : `Hola, ${nombre}`}</h1>
        <p key={paso} className="entrada-texto mt-2 text-sm text-texto-2" aria-live="polite">{pasos[paso]}</p>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-panel-2">
          <div className="entrada-barra h-full rounded-full bg-primario" />
        </div>
      </div>
    </main>
  );
}
