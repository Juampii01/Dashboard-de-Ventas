"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PASOS_PRIMERA = ["Preparando tu cuenta…", "Cargando tu equipo…", "Ya casi está…"];
const PASOS = ["Comprobando tu acceso…", "Cargando tu panel…", "Ya casi está…"];

export function PantallaEntrada({ nombre, destino, primeraVez }: { nombre: string; destino: string; primeraVez: boolean }) {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const pasos = primeraVez ? PASOS_PRIMERA : PASOS;
  useEffect(() => {
    router.prefetch(destino);
    const t1 = setTimeout(() => setPaso(1), 900);
    const t2 = setTimeout(() => setPaso(2), 1900);
    const fin = setTimeout(() => router.replace(destino), 3000);
    return () => [t1, t2, fin].forEach(clearTimeout);
  }, [destino, router]);
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
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
