"use client";

import { useState, useTransition } from "react";
import { PhoneOff, Clock, CalendarPlus, ThumbsDown, MessageCircle, ShoppingCart, StickyNote, PhoneCall, Check } from "lucide-react";
import { agendarCita, anadirNota, registrarLlamada, registrarVenta, registrarWhatsapp } from "@/app/(panel)/leads/acciones";
import { Modal } from "@/components/modal";
import { CoachIa } from "@/components/coach";
import { SelectorEstrellas } from "@/components/estrellas";
import { useToast } from "@/components/toasts";
import { exigirOk } from "@/lib/resultado-cliente";
import type { Producto } from "@/lib/tipos";

type Persona = { id: string; nombre: string };

// Ejecuta una acción del servidor: muestra «guardado» en un aviso flotante
// y, si falla, el error en el aviso y también junto al botón.
export function useAccion() {
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState("");
  const toast = useToast();
  function ejecutar(fn: () => Promise<unknown>, mensaje?: string) {
    setError("");
    iniciar(async () => {
      try {
        await exigirOk(fn());
        if (mensaje) toast(mensaje);
      } catch (e) {
        const texto = e instanceof Error ? e.message : "Algo falló.";
        setError(texto);
        toast(texto, "error");
      }
    });
  }
  return { pendiente, error, ok: "", ejecutar };
}

export function Mensajes({ error, ok }: { error: string; ok: string }) {
  return (
    <>
      {error && <p className="rounded-lg bg-mal-suave px-3 py-2 text-sm text-mal">{error}</p>}
      {ok && <p className="flex items-center gap-1.5 rounded-lg bg-ok-suave px-3 py-2 text-sm text-ok"><Check className="h-4 w-4" />{ok}</p>}
    </>
  );
}

// Botonera de resultado de llamada (caller) + WhatsApp + agendar + venta
export function AccionesLead({
  leadId,
  telefono,
  closers,
  productos,
  rol,
  vendedores,
  moneda,
  compacto = false,
}: {
  leadId: string;
  telefono: string | null;
  closers: Persona[];
  productos: Producto[];
  rol: string;
  vendedores?: Persona[];
  moneda: string;
  compacto?: boolean;
}) {
  const { pendiente, error, ok, ejecutar } = useAccion();
  const [modal, setModal] = useState<null | "luego" | "agendar" | "venta" | "nota" | "no_interesa">(null);
  const [nota, setNota] = useState("");
  const telLimpio = (telefono ?? "").replace(/[^\d]/g, "");
  const productosVisibles = rol === "caller" ? productos.filter((p) => p.vende_caller) : productos;

  const boton = "btn-secundario justify-start";
  return (
    <div className="space-y-3">
      <div className={`grid gap-2 ${compacto ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
        {telefono && (
          <a href={`tel:${telefono}`} className="btn-primario justify-start">
            <PhoneCall className="h-4 w-4" /> Llamar
          </a>
        )}
        {telLimpio && (
          <a
            href={`https://wa.me/${telLimpio}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => ejecutar(() => registrarWhatsapp(leadId, ""), "WhatsApp registrado")}
            className={`${boton} text-ok`}
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        )}
        <button className={boton} disabled={pendiente} onClick={() => ejecutar(() => registrarLlamada(leadId, "no_contesta", ""), "Guardado: no contesta")}>
          <PhoneOff className="h-4 w-4 text-texto-3" /> No contesta
        </button>
        <CoachIa leadId={leadId} className={boton} />
        <button className={boton} disabled={pendiente} onClick={() => setModal("luego")}>
          <Clock className="h-4 w-4 text-aviso" /> Llamar luego
        </button>
        <button className={boton} disabled={pendiente} onClick={() => setModal("agendar")}>
          <CalendarPlus className="h-4 w-4 text-primario" /> Agendar
        </button>
        <button className={boton} disabled={pendiente} onClick={() => setModal("no_interesa")}>
          <ThumbsDown className="h-4 w-4 text-mal" /> No interesa
        </button>
        {productosVisibles.length > 0 && (
          <button className={boton} disabled={pendiente} onClick={() => setModal("venta")}>
            <ShoppingCart className="h-4 w-4 text-oro" /> Registrar venta
          </button>
        )}
        <button className={boton} disabled={pendiente} onClick={() => setModal("nota")}>
          <StickyNote className="h-4 w-4 text-texto-3" /> Nota
        </button>
      </div>
      <Mensajes error={error} ok={ok} />

      {modal === "luego" && (
        <Modal titulo="Llamar luego" onCerrar={() => setModal(null)}>
          <form
            className="space-y-3"
            action={(fd) => {
              ejecutar(() => registrarLlamada(leadId, "llamar_luego", String(fd.get("nota") ?? ""), String(fd.get("cuando") ?? ""), Number(fd.get("estrellas"))), "Guardado: llamar luego");
              setModal(null);
            }}
          >
            <label className="block"><span className="etiqueta-campo">¿Cuándo?</span><input type="datetime-local" name="cuando" required className="campo" /></label>
            <label className="block"><span className="etiqueta-campo">Nota</span><textarea name="nota" rows={3} className="campo" placeholder="Lo que te dijo, tal cual" /></label>
            <SelectorEstrellas quien="caller" />
            <button className="btn-primario w-full">Guardar</button>
          </form>
        </Modal>
      )}
      {modal === "no_interesa" && (
        <Modal titulo="No interesa" onCerrar={() => setModal(null)}>
          <form
            className="space-y-3"
            action={(fd) => {
              ejecutar(() => registrarLlamada(leadId, "no_interesa", String(fd.get("nota") ?? ""), undefined, Number(fd.get("estrellas"))), "Guardado: no interesa");
              setModal(null);
            }}
          >
            <SelectorEstrellas quien="caller" />
            <label className="block"><span className="etiqueta-campo">Nota (opcional)</span><textarea name="nota" rows={2} className="campo" placeholder="Por qué no le interesa" /></label>
            <button className="btn-primario w-full">Guardar</button>
          </form>
        </Modal>
      )}
      {modal === "agendar" && (
        <Modal titulo="Agendar cita con closer" onCerrar={() => setModal(null)}>
          <form
            className="space-y-3"
            action={(fd) => {
              ejecutar(() => agendarCita(leadId, String(fd.get("closer")), String(fd.get("fecha")), String(fd.get("nota") ?? ""), fd.get("estrellas") ? Number(fd.get("estrellas")) : undefined), "Cita agendada");
              setModal(null);
            }}
          >
            <div>
              <label className="etiqueta-campo" htmlFor="acciones-lead-closer">Closer</label>
              <select id="acciones-lead-closer" name="closer" required className="campo">
                {closers.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <label className="block"><span className="etiqueta-campo">Fecha y hora (hora del proyecto)</span><input type="datetime-local" name="fecha" required className="campo" /></label>
            <label className="block"><span className="etiqueta-campo">Nota para el closer</span><textarea name="nota" rows={3} className="campo" placeholder="Situación, dolor, cifra…" /></label>
            <SelectorEstrellas quien="caller" opcional={rol !== "caller"} />
            <button className="btn-primario w-full">Agendar</button>
          </form>
        </Modal>
      )}
      {modal === "venta" && (
        <Modal titulo="Registrar venta" onCerrar={() => setModal(null)} ancho="max-w-lg">
          <FormVenta
            productos={productosVisibles}
            vendedores={vendedores}
            moneda={moneda}
            onEnviar={(fd) => {
              ejecutar(() => registrarVenta(leadId, fd), "Venta registrada");
              setModal(null);
            }}
          />
        </Modal>
      )}
      {modal === "nota" && (
        <Modal titulo="Añadir nota" onCerrar={() => setModal(null)}>
          <div className="space-y-3">
            <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={4} className="campo" placeholder="Escribe la nota…" />
            <button
              className="btn-primario w-full"
              onClick={() => {
                ejecutar(() => anadirNota(leadId, nota), "Nota guardada");
                setNota("");
                setModal(null);
              }}
            >
              Guardar nota
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function FormVenta({
  productos,
  vendedores,
  moneda,
  onEnviar,
  desdeCita = false,
  tipoInicial,
}: {
  productos: Producto[];
  vendedores?: Persona[];
  moneda: string;
  onEnviar: (fd: FormData) => void;
  desdeCita?: boolean; // el closer cierra su cita: pide las estrellas del prospecto
  tipoInicial?: "completo" | "reserva" | "cuotas"; // al soltar en «Cerradas», «Reserva» o «Cuotas» del Post-call (Paso H6)
}) {
  const [productoId, setProductoId] = useState(productos[0]?.id ?? "");
  const producto = productos.find((p) => p.id === productoId);
  const [facturacion, setFacturacion] = useState(String(producto?.precio ?? ""));
  const tipoDe = (p?: Producto) => (p?.modo_pago === "cuotas" ? "cuotas" : p?.modo_pago === "mensual" ? "mensual" : "completo");
  const [tipo, setTipo] = useState<string>(tipoInicial ?? tipoDe(producto));
  const [cash, setCash] = useState(tipoInicial && tipoInicial !== "completo" ? "" : tipoDe(producto) === "cuotas" ? "" : String(producto?.precio ?? ""));
  const simbolo = moneda === "EUR" ? "€" : "$";
  return (
    <form action={onEnviar} className="space-y-3">
      <div>
        <label className="etiqueta-campo" htmlFor="acciones-lead-producto">Producto</label>
        <select id="acciones-lead-producto"
          name="producto"
          value={productoId}
          onChange={(e) => {
            setProductoId(e.target.value);
            const p = productos.find((x) => x.id === e.target.value);
            setFacturacion(String(p?.precio ?? ""));
            const t = tipoInicial ?? tipoDe(p);
            setTipo(t);
            setCash(t === "completo" || t === "mensual" ? String(p?.precio ?? "") : "");
          }}
          className="campo"
        >
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} {p.precio ? `· ${simbolo}${p.precio}` : "· precio personalizado"}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="etiqueta-campo" htmlFor="acciones-lead-facturacion-valor-del-contrato">Facturación (valor del contrato)</label>
          <input id="acciones-lead-facturacion-valor-del-contrato"
            name="facturacion"
            inputMode="decimal"
            required
            value={facturacion}
            onChange={(e) => {
              setFacturacion(e.target.value);
              if (tipo === "completo") setCash(e.target.value);
            }}
            className="campo"
          />
        </div>
        <div>
          <label className="etiqueta-campo" htmlFor="acciones-lead-tipo-de-pago">Tipo de pago</label>
          <select id="acciones-lead-tipo-de-pago"
            name="tipo_pago"
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value);
              if (e.target.value === "completo" || e.target.value === "mensual") setCash(facturacion);
            }}
            className="campo"
          >
            <option value="completo">Pago completo</option>
            <option value="reserva">Reserva (seña)</option>
            <option value="cuotas">Cuotas</option>
            <option value="mensual">Cada mes (membresía)</option>
          </select>
        </div>
        <div>
          <label className="etiqueta-campo" htmlFor="acciones-lead-cash-collected-hoy">Cash collected hoy</label>
          <input id="acciones-lead-cash-collected-hoy" name="cash" inputMode="decimal" required value={cash} onChange={(e) => setCash(e.target.value)} className="campo" />
        </div>
        {tipo === "cuotas" ? (
          <label className="block"><span className="etiqueta-campo">Número de cuotas</span><input name="num_cuotas" type="number" min={2} key={productoId} defaultValue={producto?.num_cuotas ?? 3} className="campo" /></label>
        ) : (
          <div>
            <label className="etiqueta-campo" htmlFor="acciones-lead-metodo">Método</label>
            <select id="acciones-lead-metodo" name="metodo" className="campo">
              <option value="stripe">Stripe</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        )}
        {tipo === "cuotas" && (
          <div>
            <label className="etiqueta-campo" htmlFor="acciones-lead-metodo-2">Método</label>
            <select id="acciones-lead-metodo-2" name="metodo" className="campo">
              <option value="stripe">Stripe</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        )}
        <label className="block"><span className="etiqueta-campo">Fecha de la venta</span><input name="fecha" type="date" className="campo" /></label>
      </div>
      {vendedores && vendedores.length > 0 && (
        <div>
          <label className="etiqueta-campo" htmlFor="acciones-lead-vendedor-si-no-eres-tu">Vendedor (si no eres tú)</label>
          <select id="acciones-lead-vendedor-si-no-eres-tu" name="vendedor" defaultValue="" className="campo">
            <option value="">Yo</option>
            {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
          </select>
        </div>
      )}
      <label className="block"><span className="etiqueta-campo">Nota</span><textarea name="nota" rows={2} className="campo" /></label>
      {desdeCita && (
        <>
          <input type="hidden" name="desde_cita" value="1" />
          <SelectorEstrellas quien="closer" />
        </>
      )}
      <button className="btn-primario w-full">Guardar venta</button>
    </form>
  );
}
