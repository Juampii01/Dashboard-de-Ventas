"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import {
  BarChart3,
  KanbanSquare,
  AudioLines,
  PhoneCall,
  CalendarCheck,
  ShoppingCart,
  Trophy,
  FolderOpen,
  ClipboardList,
  Settings,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Network,
  Package,
  Landmark,
  UserCheck,
  Gauge,
} from "lucide-react";
import { cambiarProyecto, cambiarTema } from "@/app/(panel)/acciones-globales";
import { cerrarSesion } from "@/app/login/acciones";
import { iniciales, ETIQUETA_ROL, type ProyectoMenu } from "@/lib/formato";
import type { Perfil } from "@/lib/tipos";

const ICONOS = {
  funnel: BarChart3,
  kpis: Gauge,
  crm: KanbanSquare,
  grabadas: AudioLines,
  caller: PhoneCall,
  closer: CalendarCheck,
  ventas: ShoppingCart,
  ranking: Trophy,
  recursos: FolderOpen,
  reportes: ClipboardList,
  admin: Settings,
  equipo: Network,
  programas: Package,
  finanzas: Landmark,
  clientes: UserCheck,
};

export type ItemMenu = { href: string; texto: string; icono: keyof typeof ICONOS; exacto?: boolean; insignia?: number };

export function BarraLateral({
  perfil,
  proyectos,
  proyecto,
  menu,
}: {
  perfil: Perfil;
  proyectos: ProyectoMenu[];
  proyecto: ProyectoMenu;
  menu: { grupo: string; items: ItemMenu[] }[];
}) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();

  const contenido = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <Image src="/marca/eternity.png" alt="Eternity" width={36} height={36} className="rounded-lg" />
        <div className="leading-tight">
          <div className="font-semibold tracking-tight">Eternity</div>
          <div className="text-[11px] text-texto-3">Panel de ventas</div>
        </div>
      </div>

      <div className="px-4">
        <div className="titulo-seccion mb-2 px-1">Proyecto</div>
        <div className="relative">
          <span
            className="pointer-events-none absolute left-2.5 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md"
            style={{ background: proyecto.color }}
          >
            <Image src="/marca/maestria-blanco.png" alt="" width={16} height={15} style={{ height: "auto" }} />
          </span>
          <select
            aria-label="Proyecto"
            value={proyecto.id}
            disabled={pendiente || proyectos.length < 2}
            onChange={(e) => {
              const id = e.target.value;
              iniciar(async () => {
                await cambiarProyecto(id);
              });
            }}
            className="campo appearance-none py-2.5 pl-11 pr-8 font-medium disabled:opacity-100"
          >
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 z-10 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-3" />
        </div>
      </div>

      <nav className="mt-5 flex-1 space-y-5 overflow-y-auto px-3">
        {menu.map((g) => (
          <div key={g.grupo}>
            <div className="titulo-seccion mb-1.5 px-3">{g.grupo}</div>
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const Icono = ICONOS[it.icono];
                const activo = ruta === it.href || (!it.exacto && ruta.startsWith(it.href + "/"));
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      onClick={() => setAbierto(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200 ${
                        activo
                          ? "bg-primario font-medium text-white shadow-[0_6px_18px_-8px_rgb(43_89_209/0.7)]"
                          : "text-texto-2 hover:bg-panel-2 hover:text-texto"
                      }`}
                    >
                      <Icono className="h-[18px] w-[18px]" />
                      {it.texto}
                      {!!it.insignia && (
                        <span className="ml-auto rounded-full bg-aviso px-1.5 text-[11px] font-semibold text-white" title="Llamadas programadas que ya tocan">
                          {it.insignia}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-borde p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          {/* Bloque 1 de 1.0: tocar tu nombre abre «Mi perfil» */}
          <Link href="/perfil" onClick={() => setAbierto(false)} className={`-m-1 flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 hover:bg-panel-2 ${ruta === "/perfil" ? "bg-panel-2" : ""}`} title="Mi perfil" aria-label="Mi perfil">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primario-suave text-xs font-semibold text-primario">
              {iniciales(perfil.nombre)}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-medium">{perfil.nombre}</div>
              <div className="text-[11px] text-texto-3">{ETIQUETA_ROL[perfil.rol]} · Mi perfil</div>
            </div>
          </Link>
          <button
            onClick={() => iniciar(() => cambiarTema())}
            className="rounded-md p-1.5 text-texto-3 hover:bg-panel-2 hover:text-texto"
            title="Cambiar tema claro / oscuro"
            aria-label="Cambiar tema"
          >
            <Sun className="hidden h-4 w-4 dark:block" />
            <Moon className="h-4 w-4 dark:hidden" />
          </button>
          <form action={cerrarSesion}>
            <button className="rounded-md p-1.5 text-texto-3 hover:bg-panel-2 hover:text-mal" title="Cerrar sesión" aria-label="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="vidrio fixed left-3 top-3 z-30 rounded-xl border border-borde p-2 lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>
      {abierto && <div className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setAbierto(false)} />}
      <aside
        className={`vidrio fixed inset-y-0 left-0 z-40 w-64 border-r border-borde transition-transform lg:sticky lg:top-3 lg:m-3 lg:h-[calc(100vh-1.5rem)] lg:translate-x-0 lg:rounded-[26px] lg:border ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setAbierto(false)}
          className="absolute right-3 top-5 rounded-md p-1 text-texto-3 lg:hidden"
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </button>
        {contenido}
      </aside>
    </>
  );
}
