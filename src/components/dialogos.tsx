"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { Modal } from "@/components/modal";

// Fase 3 (Cristian, 12 oct 2026): ventanas propias de la app en vez de las del navegador («… says» con
// Cancel/OK). `confirmar` sustituye a window.confirm y `pedirTexto` a window.prompt; las dos devuelven una
// promesa. Se pintan con <Dialogos />, que va una sola vez en el panel.
type Pedido =
  | { tipo: "confirmar"; texto: string; boton?: string; resolver: (ok: boolean) => void }
  | { tipo: "texto"; titulo: string; valor: string; boton?: string; resolver: (v: string | null) => void };

let abrir: ((p: Pedido) => void) | null = null;

export function confirmar(texto: string, o: { boton?: string } = {}): Promise<boolean> {
  if (!abrir) return Promise.resolve(window.confirm(texto)); // sin el panel montado (no debería pasar)
  return new Promise((resolver) => abrir?.({ tipo: "confirmar", texto, boton: o.boton, resolver }));
}

export function pedirTexto(titulo: string, valor = "", o: { boton?: string } = {}): Promise<string | null> {
  if (!abrir) return Promise.resolve(window.prompt(titulo, valor));
  return new Promise((resolver) => abrir?.({ tipo: "texto", titulo, valor, boton: o.boton, resolver }));
}

// «¿Borrar esta venta? No se puede deshacer.» → título «¿Borrar esta venta?» y el resto debajo
function partir(texto: string) {
  const i = texto.indexOf("?");
  if (i === -1 || i === texto.length - 1) return { titulo: texto, detalle: "" };
  return { titulo: texto.slice(0, i + 1), detalle: texto.slice(i + 1).trim() };
}
const peligroso = (t: string) => /borrar|quitar|eliminar|dar de baja|no paga/i.test(t);

export function Dialogos() {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [valor, setValor] = useState("");
  const campo = useRef<HTMLInputElement>(null);
  useEffect(() => {
    abrir = (p) => {
      setValor(p.tipo === "texto" ? p.valor : "");
      setPedido(p);
    };
    return () => {
      abrir = null;
    };
  }, []);
  useEffect(() => {
    if (pedido?.tipo === "texto") setTimeout(() => campo.current?.select(), 30);
  }, [pedido]);
  if (!pedido) return null;

  const cerrar = (respuesta: boolean) => {
    if (pedido.tipo === "confirmar") pedido.resolver(respuesta);
    else pedido.resolver(respuesta ? valor : null);
    setPedido(null);
  };

  if (pedido.tipo === "texto")
    return (
      <Modal titulo={pedido.titulo} onCerrar={() => cerrar(false)}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            cerrar(true);
          }}
        >
          <input ref={campo} className="campo" value={valor} onChange={(e) => setValor(e.target.value)} aria-label={pedido.titulo} autoFocus />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secundario" onClick={() => cerrar(false)}>Cancelar</button>
            <button className="btn-primario">{pedido.boton ?? "Guardar"}</button>
          </div>
        </form>
      </Modal>
    );

  const { titulo, detalle } = partir(pedido.texto);
  const peligro = peligroso(titulo);
  return (
    <Modal titulo={peligro ? "Confirma antes de seguir" : "¿Seguimos?"} onCerrar={() => cerrar(false)}>
      <div className="flex gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${peligro ? "bg-mal-suave text-mal" : "bg-primario-suave text-primario"}`}>
          {peligro ? <AlertTriangle className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <p className="font-medium">{titulo}</p>
          {detalle && <p className="mt-1 text-sm text-texto-2">{detalle}</p>}
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="btn-secundario" onClick={() => cerrar(false)} autoFocus>Cancelar</button>
        <button type="button" className={peligro ? "btn-peligro" : "btn-primario"} onClick={() => cerrar(true)}>{pedido.boton ?? (peligro ? "Sí, seguir" : "Sí")}</button>
      </div>
    </Modal>
  );
}
