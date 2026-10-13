"use client";

import { useState, useTransition } from "react";
import { PhoneOff, Clock, CalendarPlus, ThumbsDown, MessageCircle, ShoppingCart, StickyNote, ScrollText, Check, Link2 } from "lucide-react";
import { agendarCita, anadirNota, marcarLinkEnviado, registrarLlamada, registrarVenta, registrarWhatsapp } from "@/app/(panel)/leads/acciones";
import { Modal } from "@/components/modal";
import { SelectorEstrellas } from "@/components/estrellas";
import { useToast } from "@/components/toasts";
import { exigirOk } from "@/lib/resultado-cliente";
import type { Producto } from "@/lib/tipos";
import { CamposCita } from "@/components/campos-cita";
import { Desplegable, Pastillas } from "@/components/eleccion";
import { GuionLlamada, type ResultadoGuion } from "@/components/guion-llamada";
import type { Guion } from "@/lib/guiones";

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
  closerCita,
  miId,
  linkAgenda,
  moneda,
  compacto = false,
  guion,
  nombreLead = "",
  miNombre = "",
}: {
  leadId: string;
  telefono: string | null;
  closers: Persona[];
  productos: Producto[];
  rol: string;
  vendedores?: Persona[];
  closerCita?: Persona; // closer de la cita abierta del lead: por defecto la venta es suya (11 oct)
  miId?: string;
  linkAgenda?: string | null; // link del calendario de GHL del proyecto (4.4, 11 oct)
  moneda: string;
  compacto?: boolean;
  guion?: Guion; // Fase 6: «Llamar» abre el guion (sin él, no hay botón «Llamar»)
  nombreLead?: string;
  miNombre?: string;
}) {
  const { pendiente, error, ok, ejecutar } = useAccion();
  const aviso = useToast();
  async function copiarLinkAgenda() {
    try {
      await navigator.clipboard.writeText(linkAgenda!);
      aviso("Link de agenda copiado");
    } catch {
      aviso(`No se pudo copiar. El link es: ${linkAgenda}`, "error");
    }
  }
  const [modal, setModal] = useState<null | "guion" | "luego" | "agendar" | "link" | "venta" | "nota" | "no_interesa">(null);
  const [nota, setNota] = useState("");
  const telLimpio = (telefono ?? "").replace(/[^\d]/g, "");
  const productosVisibles = rol === "caller" ? [] : productos; // el caller no registra ventas (Cristian, 12 oct)

  const boton = "btn-secundario justify-start";
  return (
    <div className="space-y-3">
      <div className={`grid gap-2 ${compacto ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
        {/* Cristian (13 oct): sin botón «Llamar» (llamar desde la app será una función futura); en su lugar,
            «Guion» abre el guion de la llamada con sus botones de resultado */}
        {guion && (
          <button type="button" className="btn-primario justify-start" onClick={() => setModal("guion")}>
            <ScrollText className="h-4 w-4" /> Guion
          </button>
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
        {/* Cristian (13 oct): en lugar de «Coach IA», «Link agenda» copia el link de agenda del proyecto (Administración) */}
        {linkAgenda && (
          <button type="button" className={boton} onClick={() => void copiarLinkAgenda()}>
            <CalendarPlus className="h-4 w-4 text-primario" /> Link agenda
          </button>
        )}
        <button className={boton} disabled={pendiente} onClick={() => setModal("luego")}>
          <Clock className="h-4 w-4 text-aviso" /> Llamar luego
        </button>
        {/* 4.4 (Cristian, 11 oct): el caller manda el link de GHL (con sus estrellas); los closers agendan a mano */}
        {rol !== "closer" && (
          <button className={boton} disabled={pendiente} onClick={() => setModal("link")}>
            <Link2 className="h-4 w-4 text-primario" /> Link enviado
          </button>
        )}
        {rol !== "caller" && (
          <button className={boton} disabled={pendiente} onClick={() => setModal("agendar")}>
            <CalendarPlus className="h-4 w-4 text-primario" /> Agendar
          </button>
        )}
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

      {modal === "guion" && guion && (
        <GuionLlamada
          leadId={leadId}
          nombreLead={nombreLead || "este lead"}
          telefono={telefono}
          miNombre={miNombre}
          guion={guion}
          resultados={(
            [
              { clave: "no_contesta", texto: "No contesta", icono: <PhoneOff className="h-4 w-4 text-texto-3" /> },
              { clave: "luego", texto: "Llamar luego", icono: <Clock className="h-4 w-4 text-aviso" /> },
              rol !== "closer" ? { clave: "link", texto: "Link enviado", icono: <Link2 className="h-4 w-4 text-primario" /> } : null,
              rol !== "caller" ? { clave: "agendar", texto: "Agendar", icono: <CalendarPlus className="h-4 w-4 text-primario" /> } : null,
              { clave: "no_interesa", texto: "No interesa", icono: <ThumbsDown className="h-4 w-4 text-mal" /> },
              productosVisibles.length > 0 ? { clave: "venta", texto: "Venta", icono: <ShoppingCart className="h-4 w-4 text-oro" /> } : null,
            ] as (ResultadoGuion | null)[]
          ).filter((x): x is ResultadoGuion => !!x)}
          onResultado={(clave) => {
            if (clave === "no_contesta") {
              setModal(null);
              ejecutar(() => registrarLlamada(leadId, "no_contesta", ""), "Guardado: no contesta");
            } else setModal(clave as "luego" | "link" | "agendar" | "no_interesa" | "venta");
          }}
          onCerrar={() => setModal(null)}
        />
      )}

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
            <CamposCita closers={closers} id="acciones-lead-closer" />
            <label className="block"><span className="etiqueta-campo">Nota para el closer</span><textarea name="nota" rows={3} className="campo" placeholder="Situación, dolor, cifra…" /></label>
            <SelectorEstrellas quien="caller" opcional={rol !== "caller"} />
            <button className="btn-primario w-full">Agendar</button>
          </form>
        </Modal>
      )}
      {modal === "link" && (
        <Modal titulo="Link de agenda enviado" onCerrar={() => setModal(null)}>
          <form
            className="space-y-3"
            action={(fd) => {
              const n = Number(fd.get("estrellas"));
              // Con link y teléfono, WhatsApp se abre con el link ya escrito
              if (linkAgenda && telLimpio) window.open(`https://wa.me/${telLimpio}?text=${encodeURIComponent(`¡Hola! Aquí tienes el link para agendar tu llamada: ${linkAgenda}`)}`, "_blank", "noopener");
              ejecutar(() => marcarLinkEnviado(leadId, n), "Link enviado: si no reserva, vuelve a tu cola en 2 días");
              setModal(null);
            }}
          >
            <p className="text-sm text-texto-2">
              {linkAgenda && telLimpio
                ? "Se abre WhatsApp con el link para que el lead elija su hora. La cita llega sola desde GHL."
                : linkAgenda
                  ? "Este lead no tiene teléfono: mándale el link por otro medio. La cita llega sola desde GHL."
                  : "Falta el link de agenda en Administración → Proyecto y reparto: mándalo por tu cuenta."}
            </p>
            <SelectorEstrellas quien="caller" />
            <button className="btn-primario w-full">{linkAgenda && telLimpio ? "Abrir WhatsApp y marcar" : "Marcar como enviado"}</button>
          </form>
        </Modal>
      )}
      {modal === "venta" && (
        <Modal titulo="Registrar venta" onCerrar={() => setModal(null)} ancho="max-w-lg">
          <FormVenta
            productos={productosVisibles}
            vendedores={vendedores}
            closerCita={closerCita}
            miId={miId}
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
  closerCita,
  miId,
  moneda,
  onEnviar,
  desdeCita = false,
  tipoInicial,
}: {
  productos: Producto[];
  vendedores?: Persona[];
  closerCita?: Persona;
  miId?: string;
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
        <Desplegable id="acciones-lead-producto"
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
        </Desplegable>
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
          <Pastillas id="acciones-lead-tipo-de-pago"
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
          </Pastillas>
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
            <Pastillas id="acciones-lead-metodo" name="metodo" className="campo">
              <option value="stripe">Stripe</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </Pastillas>
          </div>
        )}
        {tipo === "cuotas" && (
          <div>
            <label className="etiqueta-campo" htmlFor="acciones-lead-metodo-2">Método</label>
            <Pastillas id="acciones-lead-metodo-2" name="metodo" className="campo">
              <option value="stripe">Stripe</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </Pastillas>
          </div>
        )}
        <label className="block"><span className="etiqueta-campo">Fecha de la venta</span><input name="fecha" type="date" className="campo" /></label>
      </div>
      {vendedores && vendedores.length > 0 && (
        <div>
          <label className="etiqueta-campo" htmlFor="acciones-lead-vendedor-si-no-eres-tu">Vendedor</label>
          {/* Con cita, por defecto el closer de la cita (lo decide también el servidor si no se elige nada) */}
          <Desplegable id="acciones-lead-vendedor-si-no-eres-tu" name="vendedor" defaultValue="" className="campo">
            <option value="">{closerCita ? `${closerCita.nombre} (closer de la cita)` : "Yo"}</option>
            {closerCita && miId && <option value={miId}>Yo</option>}
            {vendedores.filter((v) => v.id !== closerCita?.id).map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
          </Desplegable>
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
