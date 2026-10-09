import { pct as formatoPct } from "@/lib/formato";
// Preguntas del reporte de fin de día según el rol.
export type Pregunta = { clave: string; texto: string; tipo: "numero" | "texto"; ayuda?: string; destacada?: boolean };

export const PREGUNTAS: Record<"caller" | "closer", Pregunta[]> = {
  caller: [
    { clave: "llamadas", texto: "¿Cuántas llamadas?", tipo: "numero" },
    { clave: "no_responden", texto: "¿Cuántas no responden?", tipo: "numero" },
    { clave: "agendas", texto: "¿Cuántas agendas?", tipo: "numero", destacada: true },
    { clave: "whatsapps", texto: "¿Cuántos mensajes de WhatsApp?", tipo: "numero" },
    { clave: "seguimientos", texto: "¿Cuántos seguimientos?", tipo: "numero" },
    { clave: "inconvenientes", texto: "¿Inconvenientes?", tipo: "texto", ayuda: "Herramientas, leads, información… Si no hubo nada, escribe «Ninguno»." },
    { clave: "mejoras", texto: "¿Mejoras?", tipo: "texto", ayuda: "Qué puedes hacer distinto mañana." },
    { clave: "otros", texto: "¿Otros detalles?", tipo: "texto" },
  ],
  // Mismas preguntas que el formulario actual (Forms team/reporteventas.html)
  closer: [
    { clave: "llamadas_realizadas", texto: "Llamadas realizadas", tipo: "numero" },
    { clave: "llamadas_agendadas", texto: "Llamadas agendadas", tipo: "numero" },
    { clave: "no_responden", texto: "No responden", tipo: "numero" },
    { clave: "no_show", texto: "No show", tipo: "numero" },
    { clave: "ventas", texto: "Ventas cerradas", tipo: "numero", destacada: true, ayuda: "El número que cuenta. Si hoy fue cero, escribe 0." },
    { clave: "puntos_mejora", texto: "¿Puntos de mejora?", tipo: "texto", ayuda: "Ej: «Cerrar mejor la objeción de precio»." },
    { clave: "inconvenientes", texto: "¿Inconvenientes?", tipo: "texto", ayuda: "Si no hubo nada, escribe «Ninguno»." },
  ],
};

export function rolDeReporte(rol: string): "caller" | "closer" | null {
  return rol === "caller" || rol === "closer" ? rol : null;
}

// Igual que el formulario antiguo (reporteventas.html):
// agendamiento = agendadas / realizadas · cierre = ventas / agendadas
export function tasasCloser(r: Record<string, string | number | undefined>) {
  const pct = (a: unknown, b: unknown) => {
    const x = Number(a);
    const y = Number(b);
    return Number.isFinite(x) && Number.isFinite(y) && y > 0 ? formatoPct(Math.round((x / y) * 100)) : "—";
  };
  return {
    agendamiento: pct(r.llamadas_agendadas, r.llamadas_realizadas),
    cierre: pct(r.ventas, r.llamadas_agendadas),
  };
}
