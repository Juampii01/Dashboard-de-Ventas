"use client";

import { useState, useTransition } from "react";
import { PhoneOff, Clock, CalendarPlus, ThumbsDown, MessageCircle, ShoppingCart, StickyNote, PhoneCall, Check } from "lucide-react";
import { agendarCita, anadirNota, registrarLlamada, registrarVenta, registrarWhatsapp } from "@/app/(panel)/leads/acciones";
import { Modal } from "@/components/modal";
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
            <div><label className="etiqueta-campo">¿Cuándo?</label><input type="datetime-local" name="cuando" required className="campo" /></div>
            <div><label className="etiqueta-campo">Nota</label><textarea name="nota" rows={3} className="campo" placeholder="Lo que te dijo, tal cual" /></div>
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
            <div><label className="etiqueta-campo">Nota (opcional)</label><textarea name="nota" rows={2} className="campo" placeholder="Por qué no le interesa" /></div>
            <button className="btn-primario w-full">Guardar</button>
          </form>
        </Modal>
      )}
      {modal === "agendar" && (
        <Modal titulo="Agendar cita con closer" onCerrar={() => setModal(null)}>
          <form
            className="space-y-3"
            action={(fd) => {
              ejecutar(() => agendarCita(leadId, String(fd.get("closer")), String(fd.get("fecha")), String(fd.get("nota") ?? ""), Number(fd.get("estrellas"))), "Cita agendada");
              setModal(null);
            }}
          >
            <div>
              <label className="etiqueta-campo">Closer</label>
              <select name="closer" required className="campo">
                {closers.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div><label className="etiqueta-campo">Fecha y hora (hora del proyecto)</label><input type="datetime-local" name="fecha" required className="campo" /></div>
            <div><label className="etiqueta-campo">Nota para el closer</label><textarea name="nota" rows={3} className="campo" placeholder="Situación, dolor, cifra…" /></div>
            <SelectorEstrellas quien="caller" />
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
}: {
  productos: Producto[];
  vendedores?: Persona[];
  moneda: string;
  onEnviar: (fd: FormData) => void;
  desdeCita?: boolean; // el closer cierra su cita: pide las estrellas del prospecto
}) {
  const [productoId, setProductoId] = useState(productos[0]?.id ?? "");
  const producto = productos.find((p) => p.id === productoId);
  const [facturacion, setFacturacion] = useState(String(producto?.precio ?? ""));
  const [tipo, setTipo] = useState("completo");
  const [cash, setCash] = useState(String(producto?.precio ?? ""));
  const simbolo = moneda === "EUR" ? "€" : "$";
  return (
    <form action={onEnviar} className="space-y-3">
      <div>
        <label className="etiqueta-campo">Producto</label>
        <select
          name="producto"
          value={productoId}
          onChange={(e) => {
            setProductoId(e.target.value);
            const p = productos.find((x) => x.id === e.target.value);
            setFacturacion(String(p?.precio ?? ""));
            if (tipo === "completo") setCash(String(p?.precio ?? ""));
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
          <label className="etiqueta-campo">Facturación (valor del contrato)</label>
          <input
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
          <label className="etiqueta-campo">Tipo de pago</label>
          <select
            name="tipo_pago"
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value);
              if (e.target.value === "completo") setCash(facturacion);
            }}
            className="campo"
          >
            <option value="completo">Pago completo</option>
            <option value="reserva">Reserva (seña)</option>
            <option value="cuotas">Cuotas</option>
          </select>
        </div>
        <div>
          <label className="etiqueta-campo">Cash collected hoy</label>
          <input name="cash" inputMode="decimal" required value={cash} onChange={(e) => setCash(e.target.value)} className="campo" />
        </div>
        {tipo === "cuotas" ? (
          <div><label className="etiqueta-campo">Número de cuotas</label><input name="num_cuotas" type="number" min={2} defaultValue={3} className="campo" /></div>
        ) : (
          <div>
            <label className="etiqueta-campo">Método</label>
            <select name="metodo" className="campo">
              <option value="stripe">Stripe</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        )}
        {tipo === "cuotas" && (
          <div>
            <label className="etiqueta-campo">Método</label>
            <select name="metodo" className="campo">
              <option value="stripe">Stripe</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        )}
        <div><label className="etiqueta-campo">Fecha de la venta</label><input name="fecha" type="date" className="campo" /></div>
      </div>
      {vendedores && vendedores.length > 0 && (
        <div>
          <label className="etiqueta-campo">Vendedor (si no eres tú)</label>
          <select name="vendedor" defaultValue="" className="campo">
            <option value="">Yo</option>
            {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
          </select>
        </div>
      )}
      <div><label className="etiqueta-campo">Nota</label><textarea name="nota" rows={2} className="campo" /></div>
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
