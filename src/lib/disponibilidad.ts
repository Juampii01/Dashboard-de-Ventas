// «¿Está libre este closer a esta hora?» (bloque 1 de 1.0), como los calendarios de GHL. Sin base de datos.
// Libre = la llamada entera cae dentro de un tramo de su horario ese día + no se pisa con otra cita (contando
// la duración y el descanso tras cada llamada) + respeta el aviso mínimo + no pasa del máximo de llamadas del día.
import { enZona, tramosDelDia, type Horario } from "@/lib/horarios";

export type AjustesCalendario = { duracion: number; descanso: number; aviso: number; max_dia: number | null }; // minutos; max_dia null = sin máximo
export const AJUSTES_DEFECTO: AjustesCalendario = { duracion: 30, descanso: 0, aviso: 0, max_dia: null };

const entero = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) && Number.isInteger(n) && n >= min && n <= max ? n : null;
};
// Lee unos ajustes guardados; lo que falte o esté mal se queda con el valor de `base`
export function ajustesValidos(a: unknown, base: AjustesCalendario = AJUSTES_DEFECTO): AjustesCalendario {
  const x = (a && typeof a === "object" ? a : {}) as Record<string, unknown>;
  return {
    duracion: entero(x.duracion, 5, 480) ?? base.duracion,
    descanso: entero(x.descanso, 0, 240) ?? base.descanso,
    aviso: entero(x.aviso, 0, 60 * 24 * 30) ?? base.aviso,
    max_dia: x.max_dia === null ? null : (entero(x.max_dia, 1, 100) ?? base.max_dia),
  };
}

// Los ajustes que valen para un closer: los suyos (si el administrador le puso unos) o los del proyecto
export function ajustesDe(proyecto: unknown, propios: unknown): AjustesCalendario {
  const general = ajustesValidos(proyecto);
  return propios ? ajustesValidos(propios, general) : general;
}

export type Motivo = "aviso" | "fuera_horario" | "ocupado" | "maximo";
export const TEXTO_MOTIVO: Record<Motivo, string> = {
  aviso: "Es demasiado pronto: no respeta el aviso mínimo para agendar",
  fuera_horario: "Está fuera de su horario (o es su día libre)",
  ocupado: "Ya tiene otra llamada a esa hora (contando la duración y el descanso)",
  maximo: "Ya tiene el máximo de llamadas de ese día",
};

const minutos = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));

export function libreA(o: {
  horario: Horario;
  ajustes: AjustesCalendario;
  citas: string[]; // fechas (ISO) de sus otras citas vivas (sin canceladas ni reagendadas)
  inicio: Date;
  ahora: Date;
  zona: string;
}): { libre: true } | { libre: false; motivo: Motivo } {
  const { ajustes: a, inicio, zona } = o;
  const ini = inicio.getTime();
  if (ini < o.ahora.getTime() + a.aviso * 60_000) return { libre: false, motivo: "aviso" };

  // La llamada entera dentro de un tramo del día en que empieza
  const z = enZona(inicio, zona);
  const desde = minutos(z.hm);
  const hasta = desde + a.duracion;
  const dentro = tramosDelDia(o.horario, z.ymd, z.dia).some((t) => desde >= minutos(t.desde) && hasta <= minutos(t.hasta));
  if (!dentro) return { libre: false, motivo: "fuera_horario" };

  // Cada llamada ocupa su duración + el descanso de después
  const ocupa = (a.duracion + a.descanso) * 60_000;
  const otras = o.citas.map((c) => new Date(c).getTime()).filter((t) => Number.isFinite(t));
  if (otras.some((t) => ini < t + ocupa && t < ini + ocupa)) return { libre: false, motivo: "ocupado" };

  if (a.max_dia !== null && otras.filter((t) => enZona(new Date(t), zona).ymd === z.ymd).length >= a.max_dia) return { libre: false, motivo: "maximo" };
  return { libre: true };
}

// Estados de cita que ya no ocupan hueco
export const CITA_NO_OCUPA = ["cancelada", "reagendada"];


