"use client";

import { useEffect, useState } from "react";

// Velocidad (18 oct 2026, medido: con la precarga de las ~32 peticiones del menú a la vez, la tabla de la Biblioteca
// tardaba 1,2 s en el servidor; sola, 0,6 s). Primero los datos de la pantalla en la que se entra; después la precarga
// del resto. Un componente que carga datos tras pintar (p. ej. la tabla de la Biblioteca) avisa con cargandoDatos();
// la precarga del menú (usePantallaLista) espera a que no quede ninguno, como mucho ESPERA_MAX_MS.
let pendientes = 0;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());

// Llamar al empezar a cargar; devuelve la función para avisar de que ya está (se puede llamar varias veces)
export function cargandoDatos() {
  pendientes++;
  avisar();
  let hecho = false;
  return () => {
    if (hecho) return;
    hecho = true;
    pendientes--;
    avisar();
  };
}

export function hayDatosPendientes() {
  return pendientes > 0;
}

export function alCambiarPendientes(f: () => void) {
  oyentes.add(f);
  return () => {
    oyentes.delete(f);
  };
}

const ESPERA_MAX_MS = 1500;
// Tras montar, se espera un momento a que los componentes de la pantalla registren lo que cargan (sus efectos van
// después del menú) y luego a que terminen. Una vez lista, se queda lista (al navegar dentro de la app no vuelve atrás).
export function usePantallaLista() {
  const [lista, setLista] = useState(false);
  useEffect(() => {
    let fuera = false;
    let quitar = () => {};
    const ponerLista = () => {
      if (!fuera) setLista(true);
    };
    const tope = setTimeout(ponerLista, ESPERA_MAX_MS);
    const arranque = setTimeout(() => {
      if (!hayDatosPendientes()) return ponerLista();
      quitar = alCambiarPendientes(() => {
        if (!hayDatosPendientes()) ponerLista();
      });
    }, 100);
    return () => {
      fuera = true;
      clearTimeout(tope);
      clearTimeout(arranque);
      quitar();
    };
  }, []);
  return lista;
}
