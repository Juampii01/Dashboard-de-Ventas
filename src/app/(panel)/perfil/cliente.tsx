"use client";

import { useState } from "react";
import { useAccion } from "@/components/acciones-lead";
import { cambiarMiPassword, guardarMiPerfil } from "./acciones";

export function FormMisDatos({ nombre, telefono, whatsapp, email }: { nombre: string; telefono: string; whatsapp: string; email: string }) {
  const [d, setD] = useState({ nombre, telefono, whatsapp });
  const { pendiente, error, ejecutar } = useAccion();
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); ejecutar(() => guardarMiPerfil(d), "Datos guardados"); }}>
      <label className="block"><span className="etiqueta-campo">Nombre y apellido</span><input className="campo" required value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} /></label>
      <label className="block"><span className="etiqueta-campo">Email</span><input className="campo opacity-70" value={email} disabled /></label>
      <p className="-mt-2 text-xs text-texto-3">El email lo cambia un administrador.</p>
      <label className="block"><span className="etiqueta-campo">Teléfono</span><input className="campo" value={d.telefono} placeholder="+1 555 000 0000" onChange={(e) => setD({ ...d, telefono: e.target.value })} /></label>
      <label className="block"><span className="etiqueta-campo">WhatsApp</span><input className="campo" value={d.whatsapp} placeholder="+34 600 000 000" onChange={(e) => setD({ ...d, whatsapp: e.target.value })} /></label>
      {error && <p className="text-xs text-mal">{error}</p>}
      <button className="btn-primario" disabled={pendiente}>Guardar</button>
    </form>
  );
}

export function FormMiPassword() {
  const [nueva, setNueva] = useState("");
  const [repetida, setRepetida] = useState("");
  const { pendiente, error, ejecutar } = useAccion();
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        ejecutar(async () => {
          const r = await cambiarMiPassword(nueva, repetida);
          if (!r) { setNueva(""); setRepetida(""); }
          return r;
        }, "Contraseña cambiada");
      }}
    >
      <label className="block"><span className="etiqueta-campo">Nueva contraseña</span><input className="campo" type="password" autoComplete="new-password" minLength={8} required value={nueva} onChange={(e) => setNueva(e.target.value)} /></label>
      <label className="block"><span className="etiqueta-campo">Repítela</span><input className="campo" type="password" autoComplete="new-password" minLength={8} required value={repetida} onChange={(e) => setRepetida(e.target.value)} /></label>
      <p className="text-xs text-texto-3">Mínimo 8 caracteres.</p>
      {error && <p className="text-xs text-mal">{error}</p>}
      <button className="btn-primario" disabled={pendiente}>Cambiar contraseña</button>
    </form>
  );
}
