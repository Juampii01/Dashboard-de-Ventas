"use client";

import { useState } from "react";

// 1c (Cristian, 26 oct 2026: «más pequeño, más minimalista», con su referencia): una silueta de embudo suave en el
// centro (capas translúcidas del azul de la app, como el vidrio), la cifra a la izquierda, el % del total en una
// pastilla y el nombre a la derecha. Al pasar el ratón (o tocar) un paso: su % sobre el paso anterior y cuántos se
// pierden. Lo usa la pestaña «Leads»; «Por persona» sigue con el suyo (components/embudo.tsx).
type Paso = { t: string; n: number; d?: string };
const FILA = 10; // alto de cada paso en el dibujo (unidades del viewBox; el ancho es 100)

export function EmbudoVidrio({ pasos }: { pasos: Paso[] }) {
  const [activo, setActivo] = useState<number | null>(null);
  const total = pasos[0]?.n ?? 0;
  const pct = (a: number, b: number) => (b ? `${(Math.round((a / b) * 1000) / 10).toLocaleString("es-ES")} %` : "—");
  // Ancho de cada paso: raíz cuadrada (si no, del 100 % al 2 % el embudo desaparece); siempre se ve un hilo
  const ancho = (n: number) => 6 + 90 * Math.sqrt(total ? n / total : 0);
  const alto = pasos.length * FILA;
  // Silueta: una sola curva suave que pasa por el ancho de cada paso a media altura de su fila y se estrecha al final.
  // Curva monótona (Fritsch-Carlson): solo se estrecha hacia abajo, nunca hace «barriga» entre dos pasos parecidos.
  const silueta = (escala: number) => {
    const u = pasos.length - 1;
    const medio = (n: number) => Math.min(48, (ancho(n) * escala) / 2);
    const ys = [0, ...pasos.map((_, i) => i * FILA + FILA / 2), alto]; // dónde (de arriba abajo)
    const ms = [medio(pasos[0].n), ...pasos.map((p) => medio(p.n)), medio(pasos[u].n) * 0.5]; // medio ancho
    const k = ys.length - 1;
    const sec = ys.slice(0, k).map((y, i) => (ms[i + 1] - ms[i]) / (ys[i + 1] - y));
    const tan = ms.map((_, i) => (i === 0 ? sec[0] : i === k ? sec[k - 1] : sec[i - 1] * sec[i] <= 0 ? 0 : (sec[i - 1] + sec[i]) / 2));
    for (let i = 0; i < k; i++) {
      if (sec[i] === 0) {
        tan[i] = 0;
        tan[i + 1] = 0;
        continue;
      }
      const a = tan[i] / sec[i];
      const b = tan[i + 1] / sec[i];
      if (a * a + b * b > 9) {
        const t = 3 / Math.sqrt(a * a + b * b);
        tan[i] = t * a * sec[i];
        tan[i + 1] = t * b * sec[i];
      }
    }
    // Un borde (derecho = 1, izquierdo = -1) de arriba abajo, en trozos de Bézier
    const borde = (lado: 1 | -1) =>
      ys.slice(0, k).map((y, i) => {
        const h = ys[i + 1] - y;
        const X = (m: number) => (50 + lado * m).toFixed(2);
        return { c1: `${X(ms[i] + (tan[i] * h) / 3)},${(y + h / 3).toFixed(2)}`, c2: `${X(ms[i + 1] - (tan[i + 1] * h) / 3)},${(ys[i + 1] - h / 3).toFixed(2)}`, a: `${X(ms[i])},${y.toFixed(2)}`, b: `${X(ms[i + 1])},${ys[i + 1].toFixed(2)}` };
      });
    const der = borde(1);
    const izq = borde(-1).reverse();
    return `M${der[0].a}${der.map((s) => ` C${s.c1} ${s.c2} ${s.b}`).join("")} L${izq[0].b}${izq.map((s) => ` C${s.c2} ${s.c1} ${s.a}`).join("")} Z`;
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="relative grid grid-cols-[4.5rem_minmax(0,1fr)_7.5rem] sm:grid-cols-[6rem_minmax(0,1fr)_9rem]" style={{ gridTemplateRows: `repeat(${pasos.length}, 3.25rem)` }} role="list" aria-label="Embudo">
        {/* El dibujo va detrás de la columna del centro, ocupando todas las filas */}
        <svg viewBox={`0 0 100 ${alto}`} preserveAspectRatio="none" className="pointer-events-none col-start-2 row-span-full row-start-1 h-full w-full" aria-hidden="true" style={{ gridRow: `1 / span ${pasos.length}` }}>
          <defs>
            <linearGradient id="embudo-relleno" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--primario-2)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--primario)" stopOpacity="0.85" />
            </linearGradient>
          </defs>
          <path d={silueta(1.14)} fill="var(--primario)" fillOpacity="0.1" />
          <path d={silueta(1.07)} fill="var(--primario)" fillOpacity="0.18" />
          <path d={silueta(1)} fill="url(#embudo-relleno)" />
        </svg>
        {pasos.map((p, i) => {
          const anterior = i > 0 ? pasos[i - 1].n : null;
          const abierto = activo === i;
          const fila = { gridRow: i + 1 };
          const eventos = {
            onMouseEnter: () => setActivo(i),
            onMouseLeave: () => setActivo(null),
            onFocus: () => setActivo(i),
            onBlur: () => setActivo(null),
            onClick: () => setActivo(abierto ? null : i),
          };
          return (
            <div key={p.t} role="listitem" className="contents">
              <div className={`col-start-1 flex items-center text-base font-semibold tabular-nums sm:text-lg ${p.n || i === 0 ? "" : "text-texto-3"}`} style={fila}>
                {p.n.toLocaleString("es-ES")}
              </div>
              <div className="col-start-2 flex items-center justify-center" style={fila}>
                <button type="button" {...eventos} title={p.d} className={`vidrio rounded-full border px-3 py-1 text-xs font-semibold tabular-nums transition ${abierto ? "border-primario/50" : "border-borde"}`}>
                  {abierto && anterior !== null ? `${pct(p.n, anterior)} del anterior` : pct(p.n, total)}
                </button>
              </div>
              <div className="col-start-3 flex flex-col justify-center pl-3 leading-tight" style={fila}>
                <span className={`text-sm ${p.n || i === 0 ? "text-texto" : "text-texto-3"}`}>{p.t}</span>
                {abierto && anterior !== null && <span className="text-[11px] text-texto-3">se pierden {(anterior - p.n).toLocaleString("es-ES")}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
