"use client";

import { sinVaciar } from "@/components/sin-vaciar";
import { useActionState } from "react";
import { iniciarSesion } from "./acciones";

export function FormularioLogin() {
  const [estado, accion, enviando] = useActionState(iniciarSesion, { error: "", email: "" });
  return (
    <form onSubmit={sinVaciar(accion)} className="space-y-4">
      <div>
        <label className="etiqueta-campo" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="campo" />
      </div>
      <div>
        <label className="etiqueta-campo" htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="campo" />
      </div>
      {estado.error && <p className="text-sm text-mal">{estado.error}</p>}
      <button className="btn-primario w-full" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
