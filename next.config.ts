import type { NextConfig } from "next";

const desarrollo = process.env.NODE_ENV === "development";

// La política de seguridad del navegador (CSP) la pone src/proxy.ts en cada petición, con un nonce
// nuevo (arreglo 36; ver src/lib/csp.ts). Aquí quedan las demás cabeceras de seguridad.
const cabeceras = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(desarrollo ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

// cacheComponents desactivado: es un panel privado por usuario,
// todas las páginas dependen de la sesión y se renderizan en cada petición.
const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    // Los archivos ya no pasan por las acciones (van directos a Supabase); por debajo de los 4,5 MB de Vercel
    serverActions: { bodySizeLimit: "4mb" },
    // Velocidad (13 oct 2026): lo visitado o precargado (p. ej. una pestaña del CRM) vale 30 s (antes, nada o 5 min):
    // para no enseñar datos viejos de otros; los cambios propios lo refrescan al momento
    staleTimes: { static: 30, dynamic: 30 },
  },
  async headers() {
    return [{ source: "/(.*)", headers: cabeceras }];
  },
};

export default nextConfig;
