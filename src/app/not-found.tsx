import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NoEncontrado() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="tarjeta max-w-md p-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primario-suave text-primario">
          <SearchX className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-lg font-semibold">No encontramos esta página</h1>
        <p className="mt-1 text-sm text-texto-2">Puede que el lead o la página no exista, o que no esté asignado a ti.</p>
        <Link href="/" className="btn-primario mt-5">Ir al inicio</Link>
      </div>
    </main>
  );
}
