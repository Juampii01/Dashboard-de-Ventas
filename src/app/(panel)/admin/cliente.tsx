"use client";

import { sinVaciar } from "@/components/sin-vaciar";
import { useActionState, useState } from "react";
import { ArrowUp, ArrowDown, Copy, Check, KeyRound, RefreshCw } from "lucide-react";
import { actualizarMiembro, anadirAlProyecto, cambiarPassword, quitarDelProyecto, crearProyecto, crearUsuario, guardarProyecto, moverEnReparto, regenerarSecreto } from "./acciones";
import { useAccion, Mensajes } from "@/components/acciones-lead";
import type { Rol } from "@/lib/tipos";
import { useToast } from "@/components/toasts";
import { exigirOk } from "@/lib/resultado-cliente";

type Res = { ok?: string; error?: string } | null;
function Resultado({ estado }: { estado: Res }) {
  return <Mensajes error={estado?.error ?? ""} ok={estado?.ok ?? ""} />;
}

export function FormUsuario({ soyCeo }: { soyCeo: boolean }) {
  const [estado, accion, enviando] = useActionState(crearUsuario, null as Res);
  return (
    <form onSubmit={sinVaciar(accion)} className="space-y-3">
      <label className="block"><span className="etiqueta-campo">Nombre y apellido</span><input name="nombre" required className="campo" /></label>
      <label className="block"><span className="etiqueta-campo">Email</span><input name="email" type="email" required className="campo" /></label>
      <div>
        <label className="etiqueta-campo" htmlFor="cliente-rol">Rol</label>
        <select id="cliente-rol" name="rol" className="campo" defaultValue="caller">
          <option value="caller">Caller</option>
          <option value="closer">Closer</option>
          <option value="director">Director de ventas</option>
          {soyCeo && <option value="ceo">CEO</option>}
        </select>
      </div>
      <label className="block"><span className="etiqueta-campo">Contraseña temporal (mín. 8)</span><input name="password" type="text" minLength={8} required className="campo" autoComplete="off" /></label>
      <Resultado estado={estado} />
      <button className="btn-primario w-full" disabled={enviando}>{enviando ? "Creando…" : "Crear usuario"}</button>
    </form>
  );
}

export function FilaMiembro({ persona, soyCeo, soyYo }: { persona: { id: string; rol: Rol; activo: boolean; admin_activo: boolean }; soyCeo: boolean; soyYo: boolean }) {
  const { pendiente, error, ejecutar } = useAccion();
  const toast = useToast();
  if (soyYo) return <span className="text-xs text-texto-3">Tú</span>;
  // Arreglo 24: el rol y activar/desactivar solo los cambia el CEO (afectan a todos los proyectos)
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {!soyCeo ? <span className="text-xs text-texto-3" title="Solo el CEO cambia el rol o desactiva">{({ caller: "Caller", closer: "Closer", director: "Director", ceo: "CEO" } as Record<Rol, string>)[persona.rol]}{persona.activo ? "" : " · inactivo"}</span> : (
      <select
        value={persona.rol}
        disabled={pendiente || (!soyCeo && persona.rol === "ceo")}
        onChange={(e) => ejecutar(() => actualizarMiembro(persona.id, { rol: e.target.value as Rol }))}
        className="campo w-auto py-1 text-xs"
        aria-label="Rol"
      >
        <option value="caller">Caller</option>
        <option value="closer">Closer</option>
        <option value="director">Director</option>
        {(soyCeo || persona.rol === "ceo") && <option value="ceo">CEO</option>}
      </select>
      )}
      {soyCeo && persona.rol === "director" && (
        <label className="flex items-center gap-1 text-xs text-texto-2" title="Acceso al panel de administración">
          <input type="checkbox" checked={persona.admin_activo} disabled={pendiente} onChange={(e) => ejecutar(() => actualizarMiembro(persona.id, { admin_activo: e.target.checked }))} />
          Admin
        </label>
      )}
      {soyCeo && (
        <button className="btn-secundario px-2 py-1 text-xs" disabled={pendiente} onClick={() => ejecutar(() => actualizarMiembro(persona.id, { activo: !persona.activo }))}>
          {persona.activo ? "Desactivar" : "Activar"}
        </button>
      )}
      <button
        className="btn-secundario px-2 py-1 text-xs hover:text-mal"
        disabled={pendiente}
        title="Quitar de este proyecto (no borra su usuario)"
        onClick={() =>
          confirm("¿Quitar a esta persona de este proyecto? Su usuario y sus datos se mantienen; sus leads de este proyecto quedarán sin asignar.") &&
          ejecutar(async () => {
            const r = (await exigirOk(quitarDelProyecto(persona.id))) as { sinAsignar: number };
            toast(r.sinAsignar ? `Quitado del proyecto. ${r.sinAsignar} leads suyos han quedado sin asignar: repártelos desde el CRM.` : "Quitado del proyecto.");
          })
        }
      >
        Quitar
      </button>
      <button
        className="rounded-md p-1.5 text-texto-3 hover:bg-panel-2 hover:text-texto"
        title="Poner nueva contraseña"
        disabled={pendiente}
        onClick={() => {
          const p = prompt("Nueva contraseña (mínimo 8 caracteres)");
          if (p) ejecutar(() => cambiarPassword(persona.id, p));
        }}
      >
        <KeyRound className="h-4 w-4" />
      </button>
      {error && <span className="w-full text-right text-xs text-mal">{error}</span>}
    </div>
  );
}

export function FormProyecto({ modo, aviso }: { modo: string; aviso: string }) {
  const [estado, accion, enviando] = useActionState(guardarProyecto, null as Res);
  return (
    <form onSubmit={sinVaciar(accion)} className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="etiqueta-campo">¿Cómo se reparten los leads nuevos?</legend>
        <label className="flex gap-2 rounded-lg border border-borde bg-panel-2 p-3 text-sm">
          <input type="radio" name="modo_reparto" value="manual" defaultChecked={modo === "manual"} />
          <span><b>A mano</b><br /><span className="text-texto-3">El director o el CEO asigna cada lead desde el CRM.</span></span>
        </label>
        <label className="flex gap-2 rounded-lg border border-borde bg-panel-2 p-3 text-sm">
          <input type="radio" name="modo_reparto" value="rotativo" defaultChecked={modo === "rotativo"} />
          <span><b>Rotativo equitativo</b><br /><span className="text-texto-3">Cada lead nuevo va al siguiente caller de la lista, por turnos.</span></span>
        </label>
        <label className="flex gap-2 rounded-lg border border-borde bg-panel-2 p-3 text-sm">
          <input type="radio" name="modo_reparto" value="horarios" defaultChecked={modo === "horarios"} />
          <span><b>Por horarios</b><br /><span className="text-texto-3">Rotativo, pero solo entre los callers que están en su turno en ese momento (pon el horario de cada uno abajo). Si no hay nadie en turno, entre todos.</span></span>
        </label>
      </fieldset>
      <div>
        <label className="etiqueta-campo" htmlFor="cliente-webhook-de-avisos-ghl-inbound-">Webhook de avisos (GHL «Inbound Webhook»)</label>
        <input id="cliente-webhook-de-avisos-ghl-inbound-" name="aviso_webhook_url" defaultValue={aviso} placeholder="https://services.leadconnectorhq.com/hooks/…" className="campo" />
        <p className="mt-1 text-xs text-texto-3">Cuando alguien envía su reporte, la app manda los datos aquí y el workflow de GHL envía el email y el WhatsApp al director y al CEO.</p>
      </div>
      <Resultado estado={estado} />
      <button className="btn-primario" disabled={enviando}>Guardar</button>
    </form>
  );
}

export function OrdenReparto({ callers }: { callers: { id: string; nombre: string }[] }) {
  const { pendiente, error, ejecutar } = useAccion();
  if (!callers.length) return <p className="text-sm text-texto-3">No hay callers activos.</p>;
  return (
    <ol className="space-y-1.5">
      {callers.map((c, i) => (
        <li key={c.id} className="flex items-center gap-2 rounded-lg border border-borde bg-panel-2 px-3 py-2 text-sm">
          <span className="w-5 text-texto-3">{i + 1}</span>
          <span className="flex-1">{c.nombre}</span>
          <button className="rounded p-1 hover:bg-panel disabled:opacity-30" disabled={pendiente || i === 0} onClick={() => ejecutar(() => moverEnReparto(c.id, -1))} aria-label="Subir"><ArrowUp className="h-4 w-4" /></button>
          <button className="rounded p-1 hover:bg-panel disabled:opacity-30" disabled={pendiente || i === callers.length - 1} onClick={() => ejecutar(() => moverEnReparto(c.id, 1))} aria-label="Bajar"><ArrowDown className="h-4 w-4" /></button>
        </li>
      ))}
      {error && <li className="text-xs text-mal">{error}</li>}
    </ol>
  );
}

export function FormNuevoProyecto() {
  const [estado, accion, enviando] = useActionState(crearProyecto, null as Res);
  return (
    <form onSubmit={sinVaciar(accion)} className="space-y-3 border-t border-borde pt-4">
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <label className="block"><span className="etiqueta-campo">Nombre del nuevo proyecto</span><input name="nombre" required className="campo" /></label>
        <label className="block"><span className="etiqueta-campo">Color</span><input name="color" type="color" defaultValue="#2f55d4" className="h-[38px] w-14 cursor-pointer rounded-lg border border-borde bg-panel-2" /></label>
      </div>
      <div>
        <label className="etiqueta-campo" htmlFor="cliente-moneda-y-zona-horaria">Moneda y zona horaria</label>
        <select id="cliente-moneda-y-zona-horaria" name="region" className="campo">
          <option value="us">USD · Nueva York (EE. UU.)</option>
          <option value="es">EUR · Madrid (España)</option>
        </select>
      </div>
      <Resultado estado={estado} />
      <button className="btn-primario" disabled={enviando}>Crear proyecto</button>
    </form>
  );
}

export function Copiar({ texto, etiqueta }: { texto: string; etiqueta: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      className="btn-secundario text-xs"
      onClick={async () => {
        await navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 1500);
      }}
    >
      {copiado ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />} {copiado ? "Copiado" : etiqueta}
    </button>
  );
}

export function Secreto({ url, cabecera, secreto }: { url: string; cabecera: string; secreto: string }) {
  const [ver, setVer] = useState(false);
  const { pendiente, ejecutar } = useAccion();
  return (
    <div className="mt-3 space-y-3 text-sm">
      <div>
        <div className="etiqueta-campo">URL</div>
        <code className="block break-all rounded-lg border border-borde bg-panel-2 p-2.5 text-xs">{url}</code>
        <div className="mt-1.5"><Copiar texto={url} etiqueta="Copiar URL" /></div>
      </div>
      <div>
        <div className="etiqueta-campo">Cabecera (Headers → añadir; Authorization = No auth)</div>
        <code className="block break-all rounded-lg border border-borde bg-panel-2 p-2.5 text-xs">
          {cabecera}: {ver ? secreto : "••••••••••••••••"}
        </code>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <button type="button" className="btn-secundario text-xs" onClick={() => setVer((v) => !v)}>{ver ? "Ocultar clave" : "Mostrar clave"}</button>
          <Copiar texto={cabecera} etiqueta="Copiar nombre" />
          <Copiar texto={secreto} etiqueta="Copiar clave" />
          <button
            type="button"
            className="btn-secundario text-xs"
            disabled={pendiente}
            onClick={() => confirm("Si cambias la clave, tendrás que ponerla nueva en todos los workflows de GHL. ¿Seguir?") && ejecutar(() => regenerarSecreto(), "Clave nueva creada")}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Nueva clave
          </button>
        </div>
      </div>
    </div>
  );
}

export function Plantilla({ titulo, disparador, cuerpo }: { titulo: string; disparador: string; cuerpo: string }) {
  return (
    <details className="rounded-lg border border-borde bg-panel-2">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium">{titulo} <span className="font-normal text-texto-3">· disparador: {disparador}</span></summary>
      <div className="border-t border-borde p-3">
        <pre className="overflow-x-auto whitespace-pre rounded-md bg-panel p-3 text-[11px] leading-relaxed">{cuerpo}</pre>
        <div className="mt-2"><Copiar texto={cuerpo} etiqueta="Copiar JSON" /></div>
      </div>
    </details>
  );
}

export function AnadirExistente({ personas, proyecto }: { personas: { id: string; nombre: string }[]; proyecto: string }) {
  const { pendiente, error, ok, ejecutar } = useAccion();
  const [elegido, setElegido] = useState("");
  if (!personas.length) return <p className="text-sm text-texto-3">Todas las personas ya están en {proyecto}.</p>;
  return (
    <div className="space-y-3">
      <p className="text-xs text-texto-3">Para quien ya tiene usuario en otro proyecto: entra con el mismo email y contraseña y elige el proyecto en el selector.</p>
      <select className="campo" value={elegido} onChange={(e) => setElegido(e.target.value)}>
        <option value="">Elige una persona…</option>
        {personas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
      </select>
      <Mensajes error={error} ok={ok} />
      <button className="btn-primario w-full" disabled={!elegido || pendiente} onClick={() => ejecutar(async () => { await anadirAlProyecto(elegido); setElegido(""); }, `Añadida a ${proyecto}`)}>
        Añadir a {proyecto}
      </button>
    </div>
  );
}
