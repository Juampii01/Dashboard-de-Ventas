"use client";

import { useState, useTransition } from "react";
import { exigirOk } from "@/lib/resultado-cliente";
import { enviarAccesos } from "./acciones";

type Persona = { id: string; nombre: string; email: string; rol: string; prueba: boolean };

// Fase 1 (Cristian, 12 oct 2026): mandar el acceso por email. Se marca a quién, se pulsa «Enviar acceso» y se
// confirma en el mismo botón (sin ventanas del navegador). Al final dice a quién llegó y a quién no.
export function EnviarAccesos({ personas }: { personas: Persona[] }) {
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [confirmar, setConfirmar] = useState(false);
  const [resultado, setResultado] = useState<{ enviados: string[]; fallos: { nombre: string; motivo: string }[] } | null>(null);
  const [error, setError] = useState("");
  const [pendiente, iniciar] = useTransition();
  const reales = personas.filter((p) => !p.prueba);
  const todos = reales.length > 0 && reales.every((p) => marcados.has(p.id));

  function cambiar(id: string) {
    setConfirmar(false);
    setResultado(null);
    setMarcados((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function enviar() {
    if (!confirmar) return setConfirmar(true);
    setError("");
    iniciar(async () => {
      try {
        const r = await exigirOk(enviarAccesos([...marcados]));
        setResultado(r);
        setMarcados(new Set());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Algo falló.");
      } finally {
        setConfirmar(false);
      }
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-texto-2">Cada persona recibe un email con un enlace para entrar (dura 24 horas, un solo uso) y crea su contraseña al entrar.</p>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={todos}
          onChange={() => {
            setConfirmar(false);
            setResultado(null);
            setMarcados(todos ? new Set() : new Set(reales.map((p) => p.id)));
          }}
          className="accent-[var(--primario)]"
        />
        Todos los activos (sin perfiles de prueba)
      </label>
      <ul className="max-h-72 space-y-1 overflow-y-auto">
        {personas.map((p) => (
          <li key={p.id}>
            <label className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-panel-2">
              <input type="checkbox" checked={marcados.has(p.id)} onChange={() => cambiar(p.id)} className="accent-[var(--primario)]" />
              <span className="font-medium">{p.nombre}</span>
              <span className="truncate text-xs text-texto-3">{p.rol}{p.prueba ? " · prueba" : ""} · {p.email}</span>
            </label>
          </li>
        ))}
      </ul>
      <button type="button" className={confirmar ? "btn-primario w-full" : "btn-secundario w-full"} disabled={!marcados.size || pendiente} onClick={enviar}>
        {pendiente ? "Enviando…" : confirmar ? `Confirmar: enviar a ${marcados.size} ${marcados.size === 1 ? "persona" : "personas"}` : `Enviar acceso${marcados.size ? ` (${marcados.size})` : ""}`}
      </button>
      {confirmar && !pendiente && (
        <button type="button" className="w-full text-xs text-texto-3 hover:text-texto" onClick={() => setConfirmar(false)}>
          Cancelar
        </button>
      )}
      {error && <p className="text-sm text-mal">{error}</p>}
      {resultado && (
        <div className="space-y-1 text-sm">
          {resultado.enviados.length > 0 && <p className="rounded-lg bg-ok-suave px-3 py-2 text-ok">Enviado a {resultado.enviados.join(", ")}.</p>}
          {resultado.fallos.map((f) => (
            <p key={f.nombre} className="rounded-lg bg-aviso-suave px-3 py-2 text-aviso">No se envió a {f.nombre}: {f.motivo}.</p>
          ))}
        </div>
      )}
    </div>
  );
}
