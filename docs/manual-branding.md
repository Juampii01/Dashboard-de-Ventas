# Manual de branding del dashboard de Eternity

> **Para Claude (en otro proyecto):** este documento describe la identidad visual del panel de ventas de Eternity
> (`dashboard.eternity.llc`). Úsalo para replicar el mismo aspecto en otra app. Todos los valores y el código están
> copiados tal cual del proyecto original (Next.js 16 + Tailwind 4); no los cambies ni los «mejores» salvo que el
> usuario lo pida. Si el proyecto de destino no usa Next.js o Tailwind 4, dilo antes de adaptar nada.
>
> Sacado de: `src/app/globals.css`, `src/app/layout.tsx`, `public/marca/`, `src/components/ui.tsx`,
> `src/components/modal.tsx`, `src/components/portal.tsx`, `src/components/eleccion.tsx`, `src/components/toasts.tsx`,
> `src/components/barra-lateral.tsx`, `src/components/bienvenida.tsx` y `src/app/login/page.tsx`. Fecha: 18 oct 2026.

## 1. La idea en una frase

Vidrio translúcido estilo iOS sobre un fondo con manchas de luz azul Maestria y granate Eternity, con modo claro y
oscuro (oscuro por defecto), textos en español de España y la letra del sistema de Apple (o Geist fuera de Apple).

## 2. Reglas para replicarlo

1. **Todo color sale de un token.** Nunca un hex suelto en un componente: `bg-primario`, `text-texto-2`,
   `border-borde`… (las clases nacen del bloque `@theme inline`).
2. **Cada token existe dos veces:** en `:root` (claro) y en `.dark` (oscuro). Si añades uno, añádelo en los dos.
3. **El tema se cambia con la clase `dark` en `<html>`** y se recuerda en una cookie (`eternity_tema`, valores
   `claro` / `oscuro`). Sin cookie, la app sale en **oscuro**.
4. **Superficies = vidrio.** Tarjetas, barra lateral, menús y botones secundarios usan `vidrio` (fondo translúcido +
   desenfoque 30px + saturación 180 % + filo de luz arriba + sombra). El fondo de la página tiene que tener color
   (los degradados de marca) para que el vidrio se note.
5. **Las ventanas van en `<Portal>`** (directas en `<body>`). Una tarjeta de vidrio (`backdrop-filter`) atrapa a los
   elementos `fixed` que tiene dentro; sin portal, la ventana queda encerrada en la tarjeta.
6. **Ventanas casi opacas:** a la tarjeta de una ventana se le añade `ventana` (panel al 88 % en claro, 85 % en oscuro).
7. **Verde = elegido.** Casillas, interruptores, pastillas y la opción elegida de un desplegable se marcan con `ok`
   (verde). El azul `primario` es para acciones y para la sección activa del menú.
8. **Accesibilidad incluida:** con «reducir transparencia» del sistema, el vidrio pasa a sólido; con «reducir
   movimiento», se quitan las animaciones. Según los comentarios del código, `--texto-3` se ajustó para llegar a 4,5:1
   de contraste sobre el vidrio (no lo he medido yo).
9. **Iconos:** `lucide-react` (tamaños usados: `h-4 w-4`, `h-[18px] w-[18px]` en el menú, `h-5 w-5`).
10. **Idioma:** español de España en textos, nombres de clases y de componentes (`tarjeta`, `campo`, `btn-primario`…).

## 3. Logos (`public/marca/`)

| Archivo | Tamaño | Qué es | Dónde se usa |
|---|---|---|---|
| `eternity.png` | 1254 × 1254 | Cuadrado granate con «E» y jinete en blanco. Fondo medido: `#7a1920` | Favicon, barra lateral (36 px, `rounded-lg`), login (64 px, `rounded-2xl`), bienvenida (72 px, `rounded-2xl`), onboarding (48 px, `rounded-xl`), emails (40 px, radio 11px) |
| `maestria.png` | 576 × 576 | «M» azul marino y azul sobre blanco con «MAESTRIA». Azul del centro medido: `#1354b0` | No se usa en el código (solo está guardado) |
| `maestria-blanco.png` | 255 × 240 | La «M» en blanco con fondo transparente | Selector de proyecto de la barra lateral (16 px), sobre un cuadradito del color del proyecto |

En todas sus apariciones, el logo de Eternity lleva esquinas redondeadas (nunca en cuadrado recto).

## 4. Colores

### 4.1 Marca

| Nombre | Valor | Para qué |
|---|---|---|
| Azul Maestria (`--primario`, claro) | `#2b59d1` | Botón principal, menú activo, barras de carga, anillos y gráficos |
| Azul Maestria (`--primario`, oscuro) | `#4f7cf0` | Lo mismo en modo oscuro |
| Granate Eternity (`--marca-eternity`) | `#7b1a22` | Token definido (clase `text-eternity`/`bg-eternity`), pero hoy ninguna pantalla lo usa; el granate se ve en el logo y en la mancha de luz del fondo |
| Oro (`--oro`) | `#c98a12` / `#e5ac35` | KPI destacado y una luz suave del fondo claro |

### 4.2 Todos los tokens (claro / oscuro)

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--fondo` | `#eef2f9` | `#060a18` | Fondo de la página |
| `--fondo-2` | `#e4eaf5` | `#0b1328` | Fondo secundario |
| `--panel` | `rgb(255 255 255 / 0.55)` | `rgb(22 32 64 / 0.48)` | Vidrio de tarjetas |
| `--panel-2` | `rgb(255 255 255 / 0.45)` | `rgb(40 54 100 / 0.4)` | Campos, hover, pastillas |
| `--borde` | `rgb(15 26 51 / 0.09)` | `rgb(255 255 255 / 0.09)` | Bordes |
| `--borde-fuerte` | `rgb(15 26 51 / 0.16)` | `rgb(255 255 255 / 0.16)` | Bordes marcados, scroll |
| `--brillo` | `rgb(255 255 255 / 0.75)` | `rgb(255 255 255 / 0.08)` | Filo de luz arriba del vidrio |
| `--apagado` | `rgb(110 120 145 / 0.38)` | `rgb(255 255 255 / 0.18)` | Interruptor apagado |
| `--texto` | `#0f1a33` | `#eef2fd` | Texto principal |
| `--texto-2` | `#46546f` | `#b3c0de` | Texto secundario |
| `--texto-3` | `#66738f` | `#8392b8` | Texto terciario, placeholders |
| `--primario` | `#2b59d1` | `#4f7cf0` | Acción principal |
| `--primario-2` | `#3f6ee6` | `#6a92f7` | Hover del principal |
| `--primario-suave` | `#e6edfd` | `#15275a` | Fondo de iconos y avatares |
| `--oro` / `--oro-suave` | `#c98a12` / `#fdf3dc` | `#e5ac35` / `#2a2210` | Destacado |
| `--ok` / `--ok-suave` | `#15924a` / `#e3f6ea` | `#3ccf7a` / `#0f2a1d` | Bien, elegido, sube |
| `--mal` / `--mal-suave` | `#d0303f` / `#fde8ea` | `#f2606c` / `#2d1218` | Error, peligro, baja |
| `--aviso` / `--aviso-suave` | `#c46a08` / `#fdf0e1` | `#f0a24a` / `#2c1d0d` | Avisos, insignias del menú |
| `--morado` | `#7c4ddb` | `#a07cf5` | Tono extra |
| `--sombra` | `0 1px 2px rgb(15 26 51 / 0.04), 0 8px 32px rgb(15 26 51 / 0.08)` | `0 10px 40px rgb(0 0 0 / 0.35)` | Sombra de paneles |
| `--desenfoque` | `30px` | (el mismo) | Desenfoque del vidrio |

### 4.3 Fondo con luz de marca

Cuatro manchas radiales en claro (azul arriba a la izquierda, granate arriba a la derecha, azul abajo, oro tenue en
el centro) y tres en oscuro (sin la de oro), con `background-attachment: fixed`. La clase `.fondo-app` pone el mismo
fondo a una capa (se usa en la pantalla de bienvenida). Código exacto en el apartado 8.

## 5. Letra

- En Apple: la del sistema (SF Pro). Fuera de Apple: **Geist** (`next/font/google`), y **Geist Mono** para monoespaciada.
- Pila: `-apple-system, BlinkMacSystemFont, "SF Pro Text", var(--font-geist-sans), system-ui, sans-serif`, con
  `-webkit-font-smoothing: antialiased`.
- Tamaños que se repiten:
  - Título de página: `text-3xl font-semibold tracking-tight`.
  - Título de sección (`.titulo-seccion`): `text-[11px] font-semibold uppercase tracking-[0.12em] text-texto-2`.
  - Título de ventana: `text-lg font-semibold`.
  - Cifra de KPI: `text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums`.
  - Texto normal: `text-sm`; detalles: `text-xs` o `text-[11px]` en `text-texto-3`.

## 6. Formas, espacios y movimiento

| Cosa | Valor |
|---|---|
| Radio de tarjeta | `22px` (`rounded-[22px]`) |
| Radio de la barra lateral (escritorio) | `26px`, separada 12 px del borde (`lg:m-3`) |
| Radio de botones y campos | `rounded-xl` |
| Radio de desplegables abiertos | `rounded-2xl` |
| Chips | `rounded-full`, `text-[11px]` |
| Relleno de tarjeta | `p-4` (KPI) / `p-4 sm:p-5` (sección) / `p-5` (ventana) |
| Márgenes de página | `px-4 sm:px-8`; cabecera `pt-16` en móvil (deja sitio al botón de menú) y `lg:pt-8` |
| Separación entre bloques | `space-y-5` |
| Pulsar un botón | `active:scale-[0.97]`, `transition-all duration-200` |
| Fondo detrás de ventanas | `bg-black/35 backdrop-blur-md` |
| Barra lateral | 256 px (`w-64`); en móvil se esconde y sale con un botón de vidrio arriba a la izquierda |

Animaciones (en `globals.css`): `.entrada-logo` (latido del logo, 1,6 s en bucle, con un halo azul),
`.entrada-texto` (aparece subiendo 8 px en 0,6 s), `.barra-carga` (barra fina azul arriba que avanza en 1,1 s) y
`.celebracion-pieza` (confeti que cae en 2,6 s).

## 7. Piezas (clases) y cuándo usarlas

| Clase | Qué es |
|---|---|
| `vidrio` | Utilidad de vidrio (se puede usar con `@apply`) |
| `tarjeta` | Vidrio + `rounded-[22px]` + borde. La caja base de todo |
| `ventana` | Se añade a una `tarjeta` para hacerla casi opaca (ventanas y desplegables) |
| `titulo-seccion` | Rótulo pequeño en mayúsculas |
| `btn-primario` | Azul con sombra azul; acción principal (uno por zona) |
| `btn-secundario` | Vidrio con borde; «Cancelar» y acciones de apoyo |
| `btn-peligro` | Rojo suave con borde rojo; borrar |
| `campo` / `etiqueta-campo` | Inputs y su etiqueta; al enfocar, borde azul y aro azul al 15 % |
| `chip` | Etiqueta redonda pequeña (con tonos: `bg-ok-suave text-ok`, etc.) |
| `tabla` | Tabla con cabecera en mayúsculas `text-texto-3` y filas separadas por `border-borde` |
| `interruptor` | `<input type="checkbox" class="interruptor">`: sí/no estilo iOS, verde encendido |
| `pastilla` / `grupo-pastillas` | Radios que se ven como pastillas; la elegida en verde |
| `fondo-app` | El fondo de marca en una capa |

Patrón de tonos (de `ui.tsx`): cada tono es la pareja `bg-<tono>-suave text-<tono>` (primario, oro, ok, mal, aviso;
el morado usa `bg-primario-suave text-morado`). El neutro es `bg-panel-2 text-texto-2 ring-1 ring-borde`.

## 8. Código para copiar

### 8.1 `src/app/globals.css` (entero, tal cual)

Requiere Tailwind 4 (`@import "tailwindcss"`, `@custom-variant`, `@theme inline`, `@utility`).

```css
@import "tailwindcss";

/* Tema por clase: <html class="dark"> */
@custom-variant dark (&:where(.dark, .dark *));

/* ---------- Tokens: tema claro (glass estilo iOS, colores de marca) ---------- */
:root {
  --fondo: #eef2f9;
  --fondo-2: #e4eaf5;
  /* Superficies de vidrio: translúcidas; el desenfoque lo pone .tarjeta / .vidrio */
  --panel: rgb(255 255 255 / 0.55);
  --panel-2: rgb(255 255 255 / 0.45);
  --borde: rgb(15 26 51 / 0.09);
  --borde-fuerte: rgb(15 26 51 / 0.16);
  --brillo: rgb(255 255 255 / 0.75); /* filo de luz arriba del vidrio */
  --apagado: rgb(110 120 145 / 0.38); /* interruptor apagado (como en iOS: gris visible) */
  --texto: #0f1a33;
  --texto-2: #46546f;
  --texto-3: #66738f; /* antes #7d8aa6: más oscuro para llegar a 4,5:1 sobre el vidrio */
  --primario: #2b59d1;
  --primario-2: #3f6ee6;
  --primario-suave: #e6edfd;
  --oro: #c98a12;
  --oro-suave: #fdf3dc;
  --ok: #15924a;
  --ok-suave: #e3f6ea;
  --mal: #d0303f;
  --mal-suave: #fde8ea;
  --aviso: #c46a08;
  --aviso-suave: #fdf0e1;
  --morado: #7c4ddb;
  --sombra: 0 1px 2px rgb(15 26 51 / 0.04), 0 8px 32px rgb(15 26 51 / 0.08);
  --marca-eternity: #7b1a22;
  --desenfoque: 30px;
}

/* ---------- Tokens: tema oscuro (glass sobre azul profundo) ---------- */
.dark {
  --fondo: #060a18;
  --fondo-2: #0b1328;
  --panel: rgb(22 32 64 / 0.48);
  --panel-2: rgb(40 54 100 / 0.4);
  --borde: rgb(255 255 255 / 0.09);
  --borde-fuerte: rgb(255 255 255 / 0.16);
  --brillo: rgb(255 255 255 / 0.08);
  --apagado: rgb(255 255 255 / 0.18);
  --texto: #eef2fd;
  --texto-2: #b3c0de;
  --texto-3: #8392b8; /* antes #6f80a8: más claro para llegar a 4,5:1 */
  --primario: #4f7cf0;
  --primario-2: #6a92f7;
  --primario-suave: #15275a;
  --oro: #e5ac35;
  --oro-suave: #2a2210;
  --ok: #3ccf7a;
  --ok-suave: #0f2a1d;
  --mal: #f2606c;
  --mal-suave: #2d1218;
  --aviso: #f0a24a;
  --aviso-suave: #2c1d0d;
  --morado: #a07cf5;
  --sombra: 0 10px 40px rgb(0 0 0 / 0.35);
}

@theme inline {
  --color-fondo: var(--fondo);
  --color-fondo-2: var(--fondo-2);
  --color-panel: var(--panel);
  --color-panel-2: var(--panel-2);
  --color-borde: var(--borde);
  --color-borde-fuerte: var(--borde-fuerte);
  --color-texto: var(--texto);
  --color-texto-2: var(--texto-2);
  --color-texto-3: var(--texto-3);
  --color-primario: var(--primario);
  --color-primario-2: var(--primario-2);
  --color-primario-suave: var(--primario-suave);
  --color-oro: var(--oro);
  --color-oro-suave: var(--oro-suave);
  --color-ok: var(--ok);
  --color-ok-suave: var(--ok-suave);
  --color-mal: var(--mal);
  --color-mal-suave: var(--mal-suave);
  --color-aviso: var(--aviso);
  --color-aviso-suave: var(--aviso-suave);
  --color-morado: var(--morado);
  --color-eternity: var(--marca-eternity);
  --color-apagado: var(--apagado);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --shadow-panel: var(--sombra);
}

html,
body {
  background: var(--fondo);
  color: var(--texto);
}

/* En Apple se usa la letra del sistema (SF Pro), como en iOS; en el resto, Geist */
body {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", var(--font-geist-sans), system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Fondo con luz de color de marca (azul Maestria y granate Eternity) para que el vidrio se note.
   .fondo-app: el mismo fondo para la capa de bienvenida (17 oct 2026) */
body,
.fondo-app {
  background:
    radial-gradient(800px 640px at 10% 0%, rgb(43 89 209 / 0.3), transparent 62%),
    radial-gradient(760px 600px at 100% 15%, rgb(123 26 34 / 0.22), transparent 62%),
    radial-gradient(900px 700px at 55% 105%, rgb(99 132 230 / 0.26), transparent 60%),
    radial-gradient(500px 400px at 40% 45%, rgb(201 138 18 / 0.08), transparent 70%),
    var(--fondo);
  background-attachment: fixed;
}
.dark body,
.dark .fondo-app {
  background:
    radial-gradient(800px 640px at 10% 0%, rgb(63 110 230 / 0.34), transparent 62%),
    radial-gradient(760px 600px at 100% 15%, rgb(170 40 55 / 0.32), transparent 62%),
    radial-gradient(900px 700px at 55% 105%, rgb(63 110 230 / 0.24), transparent 60%),
    var(--fondo);
  background-attachment: fixed;
}

/* Vidrio: translúcido + desenfoque + filo de luz arriba (estilo iOS). @utility para poder usarlo con @apply */
@utility vidrio {
  background: var(--panel);
  -webkit-backdrop-filter: blur(var(--desenfoque)) saturate(180%);
  backdrop-filter: blur(var(--desenfoque)) saturate(180%);
  box-shadow: inset 0 1px 0 var(--brillo), var(--sombra);
}

/* Ventanas (encima del fondo oscurecido): vidrio casi opaco, como las hojas de iOS */
.ventana {
  --panel: rgb(255 255 255 / 0.88);
}
.dark .ventana {
  --panel: rgb(20 30 60 / 0.85);
}

/* ---------- Piezas reutilizables ---------- */
@layer components {
  .tarjeta {
    @apply vidrio rounded-[22px] border border-borde;
  }
  .titulo-seccion {
    @apply text-[11px] font-semibold uppercase tracking-[0.12em] text-texto-2;
  }
  .btn {
    @apply inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50;
  }
  .btn-primario {
    @apply inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 bg-primario text-white shadow-[0_6px_20px_-6px_rgb(43_89_209/0.6)] hover:bg-primario-2;
  }
  .btn-secundario {
    @apply inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 vidrio border border-borde text-texto hover:bg-panel-2;
  }
  .btn-peligro {
    @apply inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 border border-mal/30 bg-mal-suave text-mal hover:bg-mal/15;
  }
  .campo {
    @apply w-full rounded-xl border border-borde bg-panel-2 px-3 py-2 text-sm text-texto outline-none backdrop-blur-md transition-colors placeholder:text-texto-3 focus:border-primario focus:ring-4 focus:ring-primario/15;
  }
  .etiqueta-campo {
    @apply mb-1 block text-xs font-medium text-texto-2;
  }
  .chip {
    @apply inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium;
  }
  .tabla {
    @apply w-full text-left text-sm;
  }
  .tabla th {
    @apply border-b border-borde px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-texto-3;
  }
  .tabla td {
    @apply border-b border-borde px-3 py-2.5 text-texto;
  }
  .tabla tr:last-child td {
    @apply border-b-0;
  }
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
::-webkit-scrollbar-thumb {
  background: var(--borde-fuerte);
  border-radius: 999px;
  border: 2px solid var(--fondo);
}

/* Accesibilidad: quien pide menos transparencia (ajuste del sistema) ve superficies sólidas */
@media (prefers-reduced-transparency: reduce) {
  :root { --panel: #ffffff; --panel-2: #f7f9fd; }
  .dark { --panel: #101a38; --panel-2: #16224a; }
  .vidrio, .tarjeta { -webkit-backdrop-filter: none; backdrop-filter: none; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}

/* Celebración al cumplir los objetivos de hoy (H4) */
@keyframes caer-celebracion {
  to {
    transform: translateY(110vh) rotate(540deg);
    opacity: 0.2;
  }
}
.celebracion-pieza {
  animation: caer-celebracion 2.6s cubic-bezier(0.2, 0.6, 0.4, 1) forwards;
}

/* Pantalla de entrada (Fase 1, Cristian 12 oct 2026; desde el 17 oct, una capa al abrir la app: bienvenida.tsx) */
@keyframes entrada-latido {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 color-mix(in srgb, var(--primario) 35%, transparent); }
  50% { transform: scale(1.06); box-shadow: 0 0 0 18px color-mix(in srgb, var(--primario) 0%, transparent); }
}
@keyframes entrada-aparece {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
.entrada-logo { animation: entrada-latido 1.6s ease-in-out infinite; }
.entrada-texto { animation: entrada-aparece 0.6s ease-out both; }

/* Barra de carga arriba mientras un filtro trae datos nuevos (Fase 2, 12 oct 2026) */
@keyframes carga-avanza {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
}
.barra-carga { animation: carga-avanza 1.1s ease-in-out infinite; }

/* ---------- Un solo estilo para elegir (Fase 3, 12 oct 2026) ----------
   Casilla: para marcar filas de una lista (CRM, enviar accesos, repartir, pasos). Redondeada, verde al marcar.
   .interruptor: para un sí/no suelto; el mismo aspecto que los de Permisos (verde encendido, gris apagado).
   .pastilla: un <label> con un radio dentro; se ve como las pastillas del desplegable de pocas opciones. */
input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  flex-shrink: 0;
  width: 1.125rem;
  height: 1.125rem;
  margin: 0;
  border-radius: 0.375rem;
  border: 1.5px solid var(--borde-fuerte);
  background: var(--panel-2) center / 0.8rem no-repeat;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, box-shadow 0.15s;
}
input[type="checkbox"]:checked {
  border-color: var(--ok);
  background-color: var(--ok);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='white' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3.5 8.5l3 3 6-7'/%3E%3C/svg%3E");
}
input[type="checkbox"].interruptor {
  position: relative;
  width: 2.75rem;
  height: 1.5rem;
  border: 0;
  border-radius: 9999px;
  background: var(--apagado);
}
input[type="checkbox"].interruptor::before {
  content: "";
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  background: #fff;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.25);
  transition: transform 0.15s;
}
input[type="checkbox"].interruptor:checked {
  background: var(--ok);
}
input[type="checkbox"].interruptor:checked::before {
  transform: translateX(1.25rem);
}
input[type="checkbox"]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--ok) 25%, transparent);
}
input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}
.pastilla {
  display: inline-flex;
  cursor: pointer;
  align-items: center;
  border-radius: 0.5rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--texto-2);
  transition: background-color 0.15s, color 0.15s;
}
.pastilla:hover {
  color: var(--texto);
}
.pastilla:has(input:checked) {
  background: var(--ok);
  color: #fff;
}
.pastilla:has(input:focus-visible) {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--ok) 25%, transparent);
}
.pastilla input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}
.grupo-pastillas {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  border-radius: 0.75rem;
  border: 1px solid var(--borde);
  background: var(--panel-2);
  padding: 0.25rem;
}
```

### 8.2 `src/app/layout.tsx` (fuentes y tema por cookie)

Lee la cookie en el servidor y pone `dark` en `<html>` antes de pintar (así no hay parpadeo). Cambia `title`,
`description` e icono por los del proyecto nuevo.

```tsx
import type { Metadata } from "next";
import { cookies } from "next/headers";
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
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} ${tema} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
```

### 8.3 Botón de tema (de `src/components/barra-lateral.tsx`)

Cambia la clase al momento en el navegador (sin llamar al servidor) y guarda la cookie un año.

```tsx
function cambiarTemaAlInstante() {
  const html = document.documentElement;
  const oscuro = !html.classList.contains("dark");
  html.classList.toggle("dark", oscuro);
  document.cookie = `eternity_tema=${oscuro ? "oscuro" : "claro"}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
}
```

```tsx
<button
  onClick={cambiarTemaAlInstante}
  className="rounded-md p-1.5 text-texto-3 hover:bg-panel-2 hover:text-texto"
  title="Cambiar tema claro / oscuro"
  aria-label="Cambiar tema"
>
  <Sun className="hidden h-4 w-4 dark:block" />
  <Moon className="h-4 w-4 dark:hidden" />
</button>
```

### 8.4 `src/components/portal.tsx`

```tsx
"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const sinSuscripcion = () => () => {};

// Dibuja su contenido directamente en <body>, fuera de cualquier tarjeta.
// Hace falta para las ventanas: una tarjeta de vidrio (backdrop-filter) se convierte en el marco de las
// piezas «fixed» que tiene dentro y la ventana quedaba encerrada en la tarjeta (detectado por Cristian).
export function Portal({ children }: { children: ReactNode }) {
  // En el servidor no hay <body> al que llevarlo: solo se dibuja en el navegador
  const enNavegador = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  return enNavegador ? createPortal(children, document.body) : null;
}
```

### 8.5 `src/components/modal.tsx` (ventana)

```tsx
"use client";

import { X } from "lucide-react";
import { Portal } from "@/components/portal";

export function Modal({ titulo, onCerrar, children, ancho = "max-w-md" }: { titulo: string; onCerrar: () => void; children: React.ReactNode; ancho?: string }) {
  return (
    <Portal>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-md" onClick={onCerrar}>
      <div className={`tarjeta ventana w-full ${ancho} p-5`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button onClick={onCerrar} className="rounded-md p-1 text-texto-3 hover:bg-panel-2" aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
    </Portal>
  );
}
```

### 8.6 Enlace del menú (de `src/components/barra-lateral.tsx`)

Activo: azul relleno con sombra azul. Inactivo: gris que se aclara al pasar el ratón. Lo de marca es el `className`; `prefetch`, `setYendo`
y la insignia son lógica propia de este dashboard.

```tsx
<Link
  href={it.href}
  prefetch={precargar}
  onClick={() => {
    setAbierto(false);
    if (it.href !== ruta) setYendo({ a: it.href, desde: ruta });
  }}
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
```

Contenedor de la barra lateral (botón de menú en móvil, fondo oscurecido y `<aside>`; dentro va el contenido y se
cierra con `</aside>`):

```tsx
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
```

### 8.7 Piezas de `src/components/ui.tsx` (cabecera, contenido, sección, insignia, avatar)

```tsx
export function Cabecera({ titulo, subtitulo, acciones }: { titulo: string; subtitulo?: ReactNode; acciones?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 px-4 pb-4 pt-16 sm:px-8 lg:pt-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-texto-2">{subtitulo}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </header>
  );
}

export function Contenido({ children }: { children: ReactNode }) {
  return <main className="space-y-5 px-4 pb-12 sm:px-8">{children}</main>;
}
```

```tsx
export function Seccion({ titulo, acciones, children, className = "" }: { titulo?: string; acciones?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`tarjeta p-4 sm:p-5 ${className}`}>
      {(titulo || acciones) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {titulo && <h2 className="titulo-seccion">{titulo}</h2>}
          {acciones}
        </div>
      )}
      {children}
    </section>
  );
}
```

```tsx
export function Insignia({ children, tono = "neutro" }: { children: ReactNode; tono?: "neutro" | Tono }) {
  const clases: Record<string, string> = {
    neutro: "bg-panel-2 text-texto-2 ring-1 ring-borde",
    primario: "bg-primario-suave text-primario",
    oro: "bg-oro-suave text-oro",
    ok: "bg-ok-suave text-ok",
    mal: "bg-mal-suave text-mal",
    aviso: "bg-aviso-suave text-aviso",
    morado: "bg-primario-suave text-morado",
  };
  return <span className={`chip ${clases[tono]}`}>{children}</span>;
}

export function Avatar({ nombre, tamano = "h-8 w-8 text-[11px]" }: { nombre: string; tamano?: string }) {
  const ini = nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-primario-suave font-semibold text-primario ${tamano}`}>
      {ini}
    </span>
  );
}
```

### 8.8 Pantalla de ejemplo: bienvenida (de `src/components/bienvenida.tsx`, solo lo visual)

```tsx
return (
  <div id="entrada" className="fondo-app fixed inset-0 z-[100] flex items-center justify-center p-4" role="status" aria-live="polite">
    <div className="tarjeta w-full max-w-sm p-8 text-center">
      <div className="entrada-logo mx-auto mb-6 w-fit rounded-2xl">
        <Image src="/marca/eternity.png" alt="Eternity" width={72} height={72} className="rounded-2xl" priority />
      </div>
      <h1 className="entrada-texto text-2xl font-semibold tracking-tight">Hola, {nombre}</h1>
      <p key={avance < 50 ? 0 : 1} className="entrada-texto mt-2 text-sm text-texto-2">{avance < 50 ? "Comprobando tu acceso…" : "Cargando tu panel…"}</p>
      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-panel-2">
        <div className="h-full rounded-full bg-primario transition-[width] duration-300 ease-out" style={{ width: `${Math.max(avance, 8)}%` }} />
      </div>
    </div>
  </div>
```

### 8.9 Aviso flotante (de `src/components/toasts.tsx`)

Abajo a la derecha; el de bien en vidrio con borde verde, el de error en rojo suave.

```tsx
<div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
  {toasts.map((t) => (
    <div
      key={t.id}
      role={t.tipo === "error" ? "alert" : "status"}
      className={`pointer-events-auto flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm shadow-panel ${
        t.tipo === "ok" ? "vidrio border-ok/30 text-texto" : "border-mal/40 bg-mal-suave text-mal"
      }`}
    >
      {t.tipo === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
      <span className="flex-1">{t.texto}</span>
      <button onClick={() => quitar(t.id)} className="rounded p-0.5 text-texto-3 hover:text-texto" aria-label="Cerrar aviso">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  ))}
</div>
```

## 9. Lista de comprobación al replicarlo

- [ ] `globals.css` copiado entero y Tailwind 4 funcionando (las clases `bg-primario`, `tarjeta`… existen).
- [ ] `layout.tsx` con Geist, `lang="es"` y la clase `dark` según la cookie.
- [ ] Botón de tema que cambia al instante y la recarga mantiene el tema.
- [ ] Logos en `public/marca/` y el de Eternity con esquinas redondeadas.
- [ ] Ninguna ventana ni desplegable dentro de una tarjeta sin `<Portal>`.
- [ ] Probado en claro **y** en oscuro, y en móvil (barra lateral escondida con botón).
- [ ] Ningún hex suelto en los componentes nuevos.
