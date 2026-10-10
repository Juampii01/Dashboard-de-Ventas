"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const sinSuscripcion = () => () => {};

// Dibuja su contenido directamente en <body>, fuera de cualquier tarjeta.
// Hace falta para las ventanas: una tarjeta de vidrio (backdrop-filter) se convierte en el marco de las
// piezas «fixed» que tiene dentro y la ventana quedaba encerrada en la tarjeta (detectado por Cristian).
export function Portal({ children }: { children: ReactNode }) {
  // En el servidor no hay <body> al que llevarlo: solo se dibuja en el navegador
  const enNavegador = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  return enNavegador ? createPortal(children, document.body) : null;
}
