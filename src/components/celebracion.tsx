"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/toasts";
import { Portal } from "@/components/portal";

const PIEZAS = ["🎉", "⭐", "🔥", "🏆", "✨"];

// Celebración al cumplir todos los objetivos de hoy (H4). Una vez al día por persona: se recuerda en el
// navegador; si el navegador no deja guardar, puede repetirse (no pasa nada).
export function Celebracion({ clave }: { clave: string }) {
  const toast = useToast();
  const [piezas, setPiezas] = useState<{ x: number; d: number; e: string }[]>([]);
  useEffect(() => {
    const k = `celebracion:${clave}`;
    try {
      if (localStorage.getItem(k)) return;
    } catch {
      // sin almacenamiento: se celebra igual
    }
    // Se apunta al arrancar (no antes): en desarrollo React ejecuta el efecto dos veces y cancela la primera
    const inicio = setTimeout(() => {
      try {
        localStorage.setItem(k, "1");
      } catch {
        // idem
      }
      toast("¡Has cumplido tus objetivos de hoy! 🎉");
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      setPiezas(Array.from({ length: 28 }, (_, i) => ({ x: Math.random() * 100, d: Math.random() * 0.6, e: PIEZAS[i % PIEZAS.length] })));
    }, 0);
    const fin = setTimeout(() => setPiezas([]), 3400);
    return () => {
      clearTimeout(inicio);
      clearTimeout(fin);
    };
  }, [clave, toast]);
  if (piezas.length === 0) return null;
  // Dentro de una tarjeta de vidrio lo «fixed» queda encerrado: va en <body> (ver Riesgos del plan)
  return (
    <Portal>
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {piezas.map((p, i) => (
        <span key={i} className="celebracion-pieza absolute -top-8 text-2xl" style={{ left: `${p.x}%`, animationDelay: `${p.d}s` }}>
          {p.e}
        </span>
      ))}
    </div>
    </Portal>
  );
}
