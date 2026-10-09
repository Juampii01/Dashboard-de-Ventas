import type { NextConfig } from "next";

const desarrollo = process.env.NODE_ENV === "development";

// Política de seguridad del navegador (guía «CSP without nonces» de Next 16).
// El navegador solo habla con Supabase para subir archivos (PDF y CSV) con un enlace firmado
// que crea el servidor; todo lo demás pasa por el servidor.
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${desarrollo ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  `connect-src 'self'${supabase ? ` ${supabase}` : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(desarrollo ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const cabeceras = [
  { key: "Content-Security-Policy", value: csp },
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
  },
  async headers() {
    return [{ source: "/(.*)", headers: cabeceras }];
  },
};

export default nextConfig;
