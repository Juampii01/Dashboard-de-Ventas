"use client";

import { useEffect, useLayoutEffect, useRef, useState, type SelectHTMLAttributes } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Portal } from "@/components/portal";

// Fase 3 (Cristian, 12 oct 2026): un solo estilo para elegir. «Desplegable» (listas de datos) y «Pastillas»
// (pocas opciones fijas) se usan igual que un <select>: mismas props y mismas <option> dentro. Por dentro
// hay un <select> de verdad, escondido, que sigue mandando el valor en los formularios, lanza el onChange
// de siempre y valida `required`; lo de encima solo es lo que se ve.
type Opcion = { valor: string; texto: string; grupo: string; desactivada: boolean };
type PropsSelect = SelectHTMLAttributes<HTMLSelectElement>;

const BUSCADOR_DESDE = 9; // Cristian: buscador solo con más de 8 opciones

function leer(el: HTMLSelectElement) {
  const opciones: Opcion[] = Array.from(el.options).map((o) => ({
    valor: o.value,
    texto: o.text,
    grupo: o.parentElement instanceof HTMLOptGroupElement ? o.parentElement.label : "",
    desactivada: o.disabled,
  }));
  return { opciones, valor: el.value, texto: el.selectedOptions[0]?.text ?? "" };
}

// Pone el valor en el <select> escondido y avisa como si lo hubiera cambiado la persona
function elegir(el: HTMLSelectElement, valor: string) {
  if (el.value === valor) return;
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set?.call(el, valor);
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

// Copia lo que tiene el <select> escondido: tras cada pintado, al cambiar y al vaciar el formulario
function useEspejo() {
  const ref = useRef<HTMLSelectElement>(null);
  const [estado, setEstado] = useState<ReturnType<typeof leer>>({ opciones: [], valor: "", texto: "" });
  const sincronizar = () => {
    const el = ref.current;
    if (!el) return;
    const nuevo = leer(el);
    setEstado((v) => (JSON.stringify(v) === JSON.stringify(nuevo) ? v : nuevo));
  };
  useLayoutEffect(sincronizar);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const alResetear = () => setTimeout(sincronizar, 0);
    el.addEventListener("change", sincronizar);
    el.form?.addEventListener("reset", alResetear);
    return () => {
      el.removeEventListener("change", sincronizar);
      el.form?.removeEventListener("reset", alResetear);
    };
  });
  return { ref, ...estado };
}

function Escondido({ props, refSelect }: { props: PropsSelect; refSelect: React.RefObject<HTMLSelectElement | null> }) {
  // El aspecto y el id van en lo que se ve; aquí solo el valor, el nombre y los eventos
  const resto = { ...props, className: undefined, style: undefined, id: undefined };
  return <select {...resto} ref={refSelect} tabIndex={-1} aria-hidden className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px opacity-0" />;
}

export function Desplegable(props: PropsSelect) {
  const { ref, opciones, valor, texto } = useEspejo();
  const boton = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLDivElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [busca, setBusca] = useState("");
  const [activa, setActiva] = useState(-1);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, arriba: false });
  const conBuscador = opciones.length >= BUSCADOR_DESDE;
  const q = busca.trim().toLowerCase();
  const visibles = q ? opciones.filter((o) => `${o.texto} ${o.grupo}`.toLowerCase().includes(q)) : opciones;

  const abrir = () => {
    const r = boton.current?.getBoundingClientRect();
    if (!r) return;
    const arriba = window.innerHeight - r.bottom < 300 && r.top > window.innerHeight - r.bottom;
    setPos({ top: arriba ? r.top - 6 : r.bottom + 6, left: r.left, width: r.width, arriba });
    setBusca("");
    setActiva(Math.max(0, opciones.findIndex((o) => o.valor === valor)));
    setAbierto(true);
  };
  const cerrar = (devolverFoco = true) => {
    setAbierto(false);
    if (devolverFoco) boton.current?.focus();
  };
  const tomar = (o: Opcion | undefined) => {
    if (!o || o.desactivada || !ref.current) return;
    elegir(ref.current, o.valor);
    cerrar();
  };

  // Se cierra al pulsar fuera, al girar la rueda fuera de la lista o al cambiar el tamaño de la ventana
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: Event) => {
      const t = e.target as Node;
      if (!lista.current?.contains(t) && !boton.current?.contains(t)) cerrar(false);
    };
    const alMover = (e: Event) => {
      if (!lista.current?.contains(e.target as Node)) cerrar(false);
    };
    const alRedimensionar = () => cerrar(false);
    document.addEventListener("pointerdown", fuera, true);
    window.addEventListener("scroll", alMover, true);
    window.addEventListener("resize", alRedimensionar);
    return () => {
      document.removeEventListener("pointerdown", fuera, true);
      window.removeEventListener("scroll", alMover, true);
      window.removeEventListener("resize", alRedimensionar);
    };
  }, [abierto]);

  useEffect(() => {
    if (abierto) lista.current?.querySelector<HTMLElement>(`[data-i="${activa}"]`)?.scrollIntoView({ block: "nearest" });
  }, [abierto, activa]);

  const teclas = (e: React.KeyboardEvent) => {
    if (!abierto) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        abrir();
      }
      return;
    }
    const mover = (paso: number) => {
      e.preventDefault();
      let i = activa;
      for (let n = 0; n < visibles.length; n++) {
        i = (i + paso + visibles.length) % visibles.length;
        if (!visibles[i].desactivada) break;
      }
      setActiva(i);
    };
    if (e.key === "ArrowDown") mover(1);
    else if (e.key === "ArrowUp") mover(-1);
    else if (e.key === "Enter") {
      e.preventDefault();
      tomar(visibles[activa]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cerrar();
    } else if (e.key === "Tab") cerrar(false);
  };

  return (
    // «contents»: el botón ocupa el sitio del <select> de antes, con su misma clase (campo, w-auto, min-w…)
    <span className="contents">
      <Escondido props={props} refSelect={ref} />
      <button
        ref={boton}
        id={props.id}
        type="button"
        disabled={props.disabled}
        aria-label={props["aria-label"] ?? (texto || undefined)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        title={props.title}
        style={props.style}
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={teclas}
        className={`${props.className ?? "campo"} flex cursor-pointer items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span className={`truncate ${valor === "" ? "text-texto-2" : ""}`}>{texto || " "}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-texto-3 transition-transform ${abierto ? "rotate-180" : ""}`} />
      </button>
      {abierto && (
        <Portal>
          <div
            ref={lista}
            role="listbox"
            className="ventana vidrio fixed z-[60] flex max-h-72 flex-col overflow-hidden rounded-2xl border border-borde p-1 text-sm"
            style={{ left: pos.left, minWidth: Math.max(pos.width, 200), maxWidth: Math.min(420, window.innerWidth - pos.left - 12), ...(pos.arriba ? { bottom: window.innerHeight - pos.top } : { top: pos.top }) }}
          >
            {conBuscador && (
              <label className="mb-1 flex items-center gap-2 border-b border-borde px-2.5 py-2">
                <Search className="h-4 w-4 shrink-0 text-texto-3" />
                <input
                  autoFocus
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setActiva(0);
                  }}
                  onKeyDown={teclas}
                  placeholder="Buscar…"
                  aria-label="Buscar en la lista"
                  className="w-full bg-transparent outline-none placeholder:text-texto-3"
                />
              </label>
            )}
            <div className="overflow-y-auto" tabIndex={-1} onKeyDown={teclas} ref={(el) => { if (el && !conBuscador) el.focus(); }}>
              {visibles.length === 0 && <div className="px-3 py-2 text-texto-3">Nada coincide</div>}
              {visibles.map((o, i) => {
                const cabecera = o.grupo && o.grupo !== visibles[i - 1]?.grupo ? o.grupo : "";
                const elegida = o.valor === valor;
                return (
                  <div key={`${o.grupo}|${o.valor}|${i}`}>
                    {cabecera && <div className="titulo-seccion px-3 pb-1 pt-2">{cabecera}</div>}
                    <div
                      data-i={i}
                      role="option"
                      aria-selected={elegida}
                      aria-disabled={o.desactivada}
                      onPointerEnter={() => setActiva(i)}
                      onClick={() => tomar(o)}
                      className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 ${o.desactivada ? "cursor-not-allowed opacity-40" : "cursor-pointer"} ${i === activa ? "bg-panel-2" : ""} ${elegida ? "font-medium text-ok" : ""}`}
                    >
                      <span className="truncate">{o.texto || " "}</span>
                      {elegida && <Check className="h-4 w-4 shrink-0" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Portal>
      )}
    </span>
  );
}

export function Pastillas(props: PropsSelect) {
  const { ref, opciones, valor } = useEspejo();
  const pequena = /\btext-xs\b/.test(props.className ?? ""); // en tablas (Permisos) van más pequeñas
  return (
    <span
      id={props.id}
      role="radiogroup"
      aria-label={props["aria-label"]}
      className={`relative inline-flex flex-wrap gap-1 rounded-xl border border-borde bg-panel-2 p-1 ${props.disabled ? "opacity-50" : ""}`}
      style={props.style}
    >
      <Escondido props={props} refSelect={ref} />
      {opciones.map((o) => {
        const elegida = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={elegida}
            disabled={props.disabled || o.desactivada}
            onClick={() => ref.current && elegir(ref.current, o.valor)}
            className={`cursor-pointer rounded-lg font-medium ${pequena ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"} transition-colors disabled:cursor-not-allowed ${elegida ? "bg-ok text-white shadow-sm" : "text-texto-2 hover:bg-panel hover:text-texto"}`}
          >
            {o.texto}
          </button>
        );
      })}
    </span>
  );
}
