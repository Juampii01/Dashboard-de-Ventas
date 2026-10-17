"use client";

import { sinVaciar } from "@/components/sin-vaciar";
import { useActionState, useEffect, useState } from "react";
import { CLAVE_ENTRADA } from "@/components/bienvenida";
import { iniciarSesion, pedirEnlace } from "./acciones";

export function FormularioLogin() {
  const [estado, accion, enviando] = useActionState(iniciarSesion, { error: "", email: "" });
  // Velocidad (17 oct 2026): quien llega al login (también si caducó su sesión) vuelve a tener su bienvenida al entrar
  useEffect(() => {
    try {
      sessionStorage.removeItem(CLAVE_ENTRADA);
    } catch {
      // sin sessionStorage no hay nada que reiniciar
    }
  }, []);
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

// Fase 1 (Cristian, 12 oct 2026): pedir un enlace para entrar si el de bienvenida caducó o se olvidó la contraseña
export function PedirEnlace() {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, enviando] = useActionState(pedirEnlace, { mensaje: "", error: "" });
  if (!abierto)
    return (
      <button type="button" onClick={() => setAbierto(true)} className="w-full text-center text-sm text-texto-3 hover:text-texto">
        ¿No puedes entrar? Te mandamos un enlace
      </button>
    );
  if (estado.mensaje) return <p className="rounded-lg bg-ok-suave px-3 py-2 text-sm text-ok">{estado.mensaje}</p>;
  return (
    <form action={accion} className="space-y-3">
      <p className="text-sm text-texto-2">Escribe tu email y te mandamos un enlace para entrar. Dentro podrás crear o cambiar tu contraseña.</p>
      <input name="email" type="email" required autoComplete="email" placeholder="tu@email.com" aria-label="Email para el enlace" className="campo" />
      {estado.error && <p className="text-sm text-mal">{estado.error}</p>}
      <button className="btn-secundario w-full" disabled={enviando}>{enviando ? "Enviando…" : "Mandarme el enlace"}</button>
    </form>
  );
}
