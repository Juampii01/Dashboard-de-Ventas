// Esqueleto mientras carga una sección (se ve un instante al cambiar de página).
export default function Cargando() {
  return (
    <div className="animate-pulse px-4 pt-16 sm:px-8 lg:pt-8" aria-busy="true" aria-label="Cargando">
      <div className="h-8 w-48 rounded-lg bg-panel-2" />
      <div className="mt-2 h-4 w-72 rounded bg-panel-2" />
      <div className="mt-6 h-14 rounded-xl bg-panel-2" />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-panel-2" />)}
      </div>
      <div className="mt-5 h-64 rounded-xl bg-panel-2" />
    </div>
  );
}
