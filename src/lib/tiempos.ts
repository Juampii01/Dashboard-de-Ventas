import "server-only";

// Medición TEMPORAL de la velocidad (Cristian, 13 oct 2026: «el CRM va super lento, mide los ms»).
// Escribe en los registros de Vercel los ms de cada paso: «[tiempos] crm · sesion 120 · equipo 45 · … · total 900».
// Se quita cuando el CRM vaya rápido.
export function cronometro(que: string) {
  const t0 = performance.now();
  let antes = t0;
  const pasos: string[] = [];
  return {
    // Mide una consulta suelta dentro de un Promise.all: «nombre=ms» en el registro
    medir<T>(nombre: string, p: Promise<T> | PromiseLike<T>): Promise<T> {
      const t = performance.now();
      return Promise.resolve(p).then((v) => {
        pasos.push(`${nombre}=${Math.round(performance.now() - t)}`);
        return v;
      });
    },
    paso(nombre: string) {
      const ahora = performance.now();
      pasos.push(`${nombre} ${Math.round(ahora - antes)}`);
      antes = ahora;
    },
    fin() {
      console.log(`[tiempos] ${que} · ${pasos.join(" · ")} · total ${Math.round(performance.now() - t0)}`);
    },
  };
}
