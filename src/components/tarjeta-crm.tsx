"use client";

import Link from "next/link";
import type { DragEvent, ReactNode } from "react";
import { Phone, Mail } from "lucide-react";
import { TelefonoCopiable } from "@/components/telefono-copiable";

// Tarjeta común del CRM (Fase 4, como GHL): la misma en los pipelines de origen, «Callers» y «Closers».
// Arriba el nombre (abre la ficha) y la casilla para las acciones masivas; debajo teléfono y email; después las
// etiquetas (chips) y, si hace falta, lo propio de cada tablero (botones de la cita, importes de la venta…).
// Se mueve solo arrastrando: sin «Mover a…» (Cristian, 12 oct 2026).
export function TarjetaCrm({
  href,
  nombre,
  telefono,
  email,
  arriba,
  chips,
  pie,
  arrastrable,
  onArrastrar,
  apagada,
  marcada,
  onMarcar,
}: {
  href: string;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  arriba?: ReactNode; // a la derecha del nombre (closer, importe…)
  chips?: ReactNode;
  pie?: ReactNode;
  arrastrable: boolean;
  onArrastrar?: (e: DragEvent<HTMLDivElement>) => void;
  apagada?: boolean; // mientras se arrastra
  marcada?: boolean;
  onMarcar?: () => void; // sin esto, no hay casilla
}) {
  return (
    <div
      draggable={arrastrable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onArrastrar?.(e);
      }}
      className={`space-y-1.5 rounded-lg border bg-panel p-3 text-sm shadow-sm transition hover:border-primario/60 ${
        marcada ? "border-primario ring-1 ring-primario" : "border-borde"
      } ${arrastrable ? "cursor-grab active:cursor-grabbing" : ""} ${apagada ? "opacity-40" : ""}`}
    >
      <div className="flex items-start gap-2">
        {onMarcar && (
          <input
            type="checkbox"
            checked={!!marcada}
            onChange={onMarcar}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 shrink-0"
            aria-label={`Seleccionar a ${nombre}`}
          />
        )}
        <Link href={href} draggable={false} className="min-w-0 flex-1 truncate font-medium hover:text-primario">
          {nombre || "Sin nombre"}
        </Link>
        {arriba}
      </div>
      {(telefono || email) && (
        <div className="space-y-0.5 text-xs text-texto-3">
          {telefono && <TelefonoCopiable telefono={telefono} className="flex items-center gap-1.5 hover:text-primario"><Phone className="h-3 w-3" />{telefono}</TelefonoCopiable>}
          {email && <div className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3" />{email}</div>}
        </div>
      )}
      {chips && <div className="flex flex-wrap items-center gap-1">{chips}</div>}
      {pie}
    </div>
  );
}

// «hace 3 d» desde que entró el lead (o la fecha que se pase)
export function haceDias(fecha: string, ahora = Date.now()) {
  const d = Math.floor((ahora - new Date(fecha).getTime()) / 86_400_000);
  return d <= 0 ? "hoy" : `hace ${d} d`;
}
