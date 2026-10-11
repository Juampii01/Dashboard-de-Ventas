"use client";

import { useEffect, useState } from "react";
import { consultarAgenda } from "@/app/(panel)/leads/agenda";

type Persona = { id: string; nombre: string };
type Consulta = { modo: "elige" | "propone" | "decide"; propuesto: Persona | null; ningunoLibre: boolean; aviso: string | null };

// Closer y fecha de una ventana de agendar (bloque 3 de 1.0). Al elegir la hora pregunta al servidor:
// - «lo propone la rotación»: pone el closer que toca (se puede cambiar);
// - «lo decide la rotación»: enseña el closer que toca (el servidor lo pone aunque se intente otro);
// - si el closer no está libre a esa hora, avisa (con «lo elige quien agenda» se puede agendar igual).
export function CamposCita({ closers, inicial, id }: { closers: Persona[]; inicial?: string; id: string }) {
  const [closer, setCloser] = useState(inicial || closers[0]?.id || "");
  const [fecha, setFecha] = useState("");
  const [c, setC] = useState<Consulta | null>(null);
  const [tocado, setTocado] = useState(false); // si quien agenda cambió el closer a mano, no se le pisa

  useEffect(() => {
    if (!fecha) return;
    let vivo = true;
    const t = setTimeout(async () => {
      const r = await consultarAgenda(fecha, closer || null);
      if (!vivo || "error" in r) return;
      setC(r);
      if (r.modo === "propone" && r.propuesto && !tocado && r.propuesto.id !== closer) setCloser(r.propuesto.id);
    }, 250);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [fecha, closer, tocado]);

  const decide = c?.modo === "decide";
  return (
    <>
      <label className="block">
        <span className="etiqueta-campo">Fecha y hora (hora del proyecto)</span>
        <input type="datetime-local" name="fecha" required className="campo" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </label>
      {decide ? (
        <div className="rounded-lg bg-panel-2 px-3 py-2 text-sm">
          <input type="hidden" name="closer" value={c?.propuesto?.id ?? ""} />
          {c?.propuesto ? <>Closer: <b>{c.propuesto.nombre}</b> <span className="text-texto-3">(lo decide la rotación)</span></> : <span className="text-mal">Ningún closer de la rotación está libre a esa hora: elige otra hora.</span>}
        </div>
      ) : (
        <div>
          <label className="etiqueta-campo" htmlFor={id}>Closer</label>
          <select id={id} name="closer" required className="campo" value={closer} onChange={(e) => { setCloser(e.target.value); setTocado(true); }}>
            {closers.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
          </select>
          {c?.modo === "propone" && c.propuesto && <p className="mt-1 text-xs text-texto-3">La rotación propone a <b>{c.propuesto.nombre}</b>{closer !== c.propuesto.id && " (lo has cambiado)"}.</p>}
          {c?.modo === "propone" && c.ningunoLibre && <p className="mt-1 text-xs text-aviso">Ningún closer de la rotación está libre a esa hora.</p>}
        </div>
      )}
      {!fecha && <p className="text-xs text-texto-3">Elige la hora para ver si el closer está libre.</p>}
      {c?.aviso && fecha && <p className="rounded-lg bg-aviso-suave px-3 py-2 text-xs text-aviso">⚠ {c.aviso}{decide ? "" : " Puedes agendar igual."}</p>}
    </>
  );
}
