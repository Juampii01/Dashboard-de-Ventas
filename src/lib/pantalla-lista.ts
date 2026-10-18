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

const ESPERA_MAX_MS = 2500;
// Se espera a que la página esté cargada del todo (evento «load»: han llegado todos sus trozos y los componentes ya
// han avisado de lo que cargan; medido el 18 oct: esperar 100 ms tras montar no bastaba, la tabla de la Biblioteca
// llega después) y luego a que terminen. Tope: ESPERA_MAX_MS desde que se monta el menú. Una vez lista, se queda lista.
export function usePantallaLista() {
  const [lista, setLista] = useState(false);
  useEffect(() => {
    let fuera = false;
    let quitar = () => {};
    let arranque: ReturnType<typeof setTimeout> | undefined;
    const ponerLista = () => {
      if (!fuera) setLista(true);
    };
    const tope = setTimeout(ponerLista, ESPERA_MAX_MS);
    const empezar = () => {
      arranque = setTimeout(() => {
        if (!hayDatosPendientes()) return ponerLista();
        quitar = alCambiarPendientes(() => {
          if (!hayDatosPendientes()) ponerLista();
        });
      }, 50);
    };
    if (document.readyState === "complete") empezar();
    else window.addEventListener("load", empezar, { once: true });
    return () => {
      fuera = true;
      clearTimeout(tope);
      clearTimeout(arranque);
      window.removeEventListener("load", empezar);
      quitar();
    };
  }, []);
  return lista;
}
