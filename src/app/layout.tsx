import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Eternity · Ventas",
  description: "Panel de ventas del equipo",
  icons: { icon: "/marca/eternity.png" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const tema = (await cookies()).get("eternity_tema")?.value === "claro" ? "" : "dark";
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    // suppressHydrationWarning: el script de abajo puede añadir «sin-entrada» al <html> antes de que cargue React
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} ${tema} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Velocidad (17 oct 2026): si esta pestaña ya vio la bienvenida (components/bienvenida.tsx), se esconde antes de pintar */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: `try{if(sessionStorage.getItem("eternity_entrada"))document.documentElement.classList.add("sin-entrada")}catch(e){}` }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
