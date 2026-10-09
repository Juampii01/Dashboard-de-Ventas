"use client";

import { startTransition, type FormEvent } from "react";

// React 19 vacía el formulario después de cada envío con action={...}.
// Con esto, si hay un error, lo que escribió la persona se queda donde estaba.
export function sinVaciar(accion: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => accion(fd));
  };
}
