"use client";

import { useEffect, useState } from "react";
import { ALFA2_DE_NUMERICO } from "@/lib/mapa-codigos";
import { SIN_PAIS, nombrePais } from "@/lib/formato";

type Forma = { alfa: string | null; d: string };
const ANCHO = 800;
const ALTO = 400;

// 1c · L5 (Cristian, 26 oct 2026): mapa del mundo coloreado por cuántos leads hay de cada país (más intenso = más).
// El dibujo (world-atlas 110m, 108 KB) y las librerías (d3-geo, topojson-client) se cargan solo al abrir esta pestaña.
// Los países que no salen en un mapa de este detalle (islas pequeñas: Sint Maarten, Anguila…) y «Sin país» van en
// la lista de debajo, para que no se pierda ninguno.
export function MapaPaises({ paises }: { paises: { pais: string; n: number }[] }) {
  const [formas, setFormas] = useState<Forma[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let vivo = true;
    Promise.all([import("d3-geo"), import("topojson-client"), import("world-atlas/countries-110m.json")])
      .then(([geo, topo, mundo]) => {
        const datos = (mundo as { default?: unknown }).default ?? mundo;
        const t = datos as unknown as Parameters<typeof topo.feature>[0] & { objects: { countries: Parameters<typeof topo.feature>[1] } };
        const todas = topo.feature(t, t.objects.countries) as unknown as { features: { id?: string; geometry: unknown }[] };
        // Sin la Antártida (010): ocupa media altura y no tiene leads
        const features = todas.features.filter((f) => f.id !== "010");
        const proyeccion = geo.geoNaturalEarth1().fitSize([ANCHO, ALTO], { type: "FeatureCollection", features } as never);
        const camino = geo.geoPath(proyeccion);
        if (vivo) setFormas(features.map((f) => ({ alfa: f.id ? ALFA2_DE_NUMERICO[f.id] ?? null : null, d: camino(f as never) ?? "" })));
      })
      .catch(() => vivo && setError(true));
    return () => {
      vivo = false;
    };
  }, []);

  const n = new Map(paises.map((p) => [p.pais, p.n]));
  const max = Math.max(1, ...paises.filter((p) => p.pais !== SIN_PAIS).map((p) => p.n));
  // Más intenso cuantos más leads (escala logarítmica: si no, España taparía a todos los demás)
  const intensidad = (x: number) => 0.18 + 0.82 * (Math.log(x + 1) / Math.log(max + 1));
  const enMapa = new Set((formas ?? []).map((f) => f.alfa));
  const fuera = formas ? paises.filter((p) => !enMapa.has(p.pais)).sort((a, b) => b.n - a.n) : [];

  if (error) return <p className="text-sm text-mal">No se pudo cargar el mapa.</p>;
  if (!formas) return <div className="h-64 animate-pulse rounded-xl bg-panel-2" aria-busy="true" />;
  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="w-full" role="img" aria-label="Leads por país">
        {formas.map((f, i) => {
          const leads = f.alfa ? n.get(f.alfa) ?? 0 : 0;
          return (
            <path key={i} d={f.d} fill={leads ? "var(--primario)" : "var(--panel-2)"} fillOpacity={leads ? intensidad(leads) : 1} stroke="var(--borde-fuerte)" strokeWidth={0.5}>
              <title>{`${f.alfa ? nombrePais(f.alfa) : "—"}: ${leads.toLocaleString("es-ES")} leads`}</title>
            </path>
          );
        })}
      </svg>
      {fuera.length > 0 && (
        <p className="text-xs text-texto-3">
          No se ven en el mapa: {fuera.map((p) => `${nombrePais(p.pais)} ${p.n.toLocaleString("es-ES")}`).join(" · ")}
        </p>
      )}
    </div>
  );
}
