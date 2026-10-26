"use client";

import { useEffect, useState } from "react";

// Velocidad (18 oct 2026, medido: con la precarga de las ~32 peticiones del menú a la vez, la tabla de la Biblioteca
// tardaba 1,2 s en el servidor; sola, 0,6 s). Primero los datos de la pantalla en la que se entra; después la precarga
// del resto. Un componente que carga datos tras pintar (p. ej. KPIs → «Leads») avisa con cargandoDatos();
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

// También cuenta lo que se ve en pantalla con la marca data-datos-pendientes (p. ej. «Cargando los 1.629 leads…»):
// llega en el HTML antes de que el componente pida sus datos (medido el 18 oct: medio segundo después de cargar)
export function hayDatosPendientes() {
  return pendientes > 0 || !!document.querySelector("[data-datos-pendientes]");
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
    // Tras cargar, se mira cada 100 ms si quedan datos de la pantalla por llegar (y se avisa al terminar uno)
    const empezar = () => {
      const mirar = () => {
        if (!hayDatosPendientes()) return ponerLista();
        arranque = setTimeout(mirar, 100);
      };
      quitar = alCambiarPendientes(() => {
        if (!hayDatosPendientes()) ponerLista();
      });
      arranque = setTimeout(mirar, 50);
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
