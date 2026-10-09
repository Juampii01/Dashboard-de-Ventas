// Reparto por horarios (V2-11): ¿está este caller en su turno ahora, en la hora del proyecto?
export type Horario = { dias: number[]; desde: string; hasta: string } | null; // dias: 1 = lunes … 7 = domingo
export const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export function horarioValido(h: unknown): Horario {
  if (!h || typeof h !== "object") return null;
  const x = h as { dias?: unknown; desde?: unknown; hasta?: unknown };
  const dias = Array.isArray(x.dias) ? [...new Set(x.dias.map(Number).filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))].sort() : [];
  if (!dias.length || typeof x.desde !== "string" || typeof x.hasta !== "string" || !HORA.test(x.desde) || !HORA.test(x.hasta) || x.desde === x.hasta) return null;
  return { dias, desde: x.desde, hasta: x.hasta };
}

// Un turno que pasa de medianoche (22:00-02:00) cuenta para el día en que empieza
export function enHorario(h: Horario, ahora: Date, zona: string) {
  if (!h) return false;
  const partes = new Intl.DateTimeFormat("en-GB", { timeZone: zona, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(ahora);
  const p = (t: string) => partes.find((x) => x.type === t)?.value ?? "";
  const dia = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(p("weekday")) + 1;
  const hm = `${p("hour")}:${p("minute")}`;
  if (h.desde < h.hasta) return h.dias.includes(dia) && hm >= h.desde && hm < h.hasta;
  const ayer = dia === 1 ? 7 : dia - 1;
  return (h.dias.includes(dia) && hm >= h.desde) || (h.dias.includes(ayer) && hm < h.hasta);
}
