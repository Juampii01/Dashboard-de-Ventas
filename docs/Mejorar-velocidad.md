# Mejorar velocidad · que la app se sienta casi instantánea

> Creado el 13 oct 2026 a petición de Cristian («lo sigo sintiendo lento al cambiar entre secciones y al navegar»). Es para hacerlo **más adelante**: en el plan está como «Mejorar velocidad» (bloque B). Aquí está todo lo medido, lo hecho, la investigación y la propuesta.

## 1. Qué está hecho ya (13 oct, todo publicado y con los tests de GitHub en verde)

| Commit | Qué |
|---|---|
| `8145977` | CRM: las consultas van a la vez (3 tandas en vez de 9 pasos en fila); la card ya no recibe todas las respuestas del formulario (solo la de «invertir»; el popup pide el resto). |
| `75d1d12` · `0d032c6` | Pestañas del CRM: se marcan al pulsar (8–25 ms) y el tablero se atenúa con «Cargando…»; precarga completa (`prefetch={true}`) al pasar el ratón por encima. |
| `3917b27` | `next.config.ts` → `staleTimes: { static: 30, dynamic: 30 }`: lo visitado o precargado se guarda 30 s en la pestaña (volver a un pipeline no pide nada al servidor). |
| `f803237` | Mover una card: comprobaciones a la vez y el historial se apunta después de contestar (`after`). |
| `50654c6` | **Medición temporal** (`src/lib/tiempos.ts`, `[tiempos]` en los registros de Vercel) en la página del CRM y en `moverLead`. **Hay que quitarla** cuando se termine este trabajo. |

## 2. Lo medido (13 oct)

**Servidor de Vercel** (registros `[tiempos]`; fiables):

| | Antes | Después |
|---|---|---|
| Preparar el CRM (lo normal) | 0,57 – 0,92 s | 0,34 – 0,64 s |
| Biblioteca (1.356 leads) | 0,92 s | 0,44 – 0,64 s |
| Arranque «en frío» (tras un rato sin uso) | 1,57 s | 1,99 s |
| Datos de Biblioteca que viajan al navegador | 118 KB | 101 KB |
| Mover una card (guardar en el servidor) | 0,52 – 0,55 s | sin medir con la versión nueva |
| Sesión + permisos (en cada página) | 0,09 – 0,25 s | igual (no tocado) |

**En pantalla:** la card movida se ve en su sitio en 0,11–0,15 s (se pinta sin esperar). Volver a un pipeline visto en los últimos 30 s: 33 ms (medido con una versión anterior). **El cambio de pipeline en pantalla con la versión final no está medido**: las pestañas del Chrome de Cristian estaban ocultas y Chrome frena las páginas ocultas (los relojes van a 1 por segundo y la página ni termina de arrancar). Para medir en pantalla hace falta **su Chrome delante**.

**Descartado:** Vercel (iad1) y Supabase (Norte de Virginia) están en la misma zona; la distancia no es el problema.

## 3. Por qué se siente lento (comprobado en el código)

- Cada sección se prepara en el servidor **al pulsar**: sale al momento la pantalla de «cargando» (`src/app/(panel)/loading.tsx`) y después hay que esperar al servidor (0,3–0,6 s, hasta 2 s en frío).
- La precarga del menú lateral (`router.prefetch` al pasar el ratón, `src/components/barra-lateral.tsx:74`) en páginas dinámicas solo trae la pantalla de «cargando», no los datos.
- Cada página pregunta a Supabase quién es el usuario (`supabase.auth.getUser()` en `src/lib/sesion.ts`): 0,1–0,2 s antes de empezar con los datos.
- Las demás secciones (Funnel, KPIs, Agendas…) **no están medidas**.

## 4. Caché de Chrome (pregunta de Cristian)

Comprobado con las cabeceras: el código, los estilos y las fuentes ya se guardan un año en Chrome (`max-age=31536000, immutable`). Los **datos** no (`max-age=0`) y está bien: son de cada persona y cambian a cada momento. Lo que se propone es la caché de la propia app dentro de la pestaña (memoria de Next), que se pierde al recargar. Guardarla en el disco del navegador es posible, pero deja datos de leads (nombres, teléfonos, emails) en el ordenador de cada persona.

## 5. Cómo lo hacen los SaaS «pro» (investigación del 13 oct)

Aviso: casi todo son análisis de terceros; la única fuente de primera mano es una charla del CTO de Linear sin transcripción.

- **Linear**: guarda una copia de los datos del equipo en el navegador (IndexedDB) y lee de ahí; el servidor solo sincroniza cambios por detrás; los cambios se pintan al momento («optimista»); lo pesado (comentarios, historial) no se descarga al principio. Coste: un «motor de sincronización» propio, conflictos entre usuarios y datos guardados en cada ordenador. Fuentes: [performance.dev](https://performance.dev/what-makes-linear-feel-instant), [análisis 2026](https://braindetox.kr/en/posts/linear_local_first_speed_2026.html), [charla del CTO](https://linear.app/blog/scaling-the-linear-sync-engine).
- **La mayoría de SaaS con React**: «enseña lo guardado y actualiza por detrás» (*stale-while-revalidate*, modelo de TanStack Query: [caché](https://www.mintlify.com/TanStack/query/concepts/caching), [persistencia](https://www.mintlify.com/TanStack/query/guides/persistence)); precarga al pasar el ratón y [cambios optimistas](https://blog.openreplay.com/optimistic-updates-make-apps-faster/). Si se guarda en disco: borrarlo al cerrar sesión y separarlo por usuario (criterio de Claude, no de la fuente).
- **Superhuman, Notion, Figma**: no se encontraron artículos técnicos suyos; las referencias de terceros apuntan a lo mismo (datos locales, sincronización, cambios optimistas) ([Superhuman en SE Daily](https://softwareengineeringdaily.com/2021/03/05/superhuman-engineering-with-emuye-reynolds)).

**Idea común:** el usuario percibe velocidad cuando la pantalla responde sin esperar al servidor, no cuando el servidor es rápido.

## 6. Propuesta (pendiente de que Cristian elija)

| Nivel | Qué es | Cómo se siente | Trabajo |
|---|---|---|---|
| **A. Como la mayoría de SaaS** (recomendado por Claude) | Lo visto aparece al instante y se refresca por detrás; precarga completa al pasar el ratón por el menú y las pestañas; cambios optimistas (en el CRM ya están); **avisos en tiempo real de Supabase** para que la pantalla se refresque sola cuando otro cambia algo (sin esperar los 30 s) | Instantáneo al volver a lo visto; la primera vez, lo que tarde el servidor (0,3–0,6 s) | Unos días, por partes y midiendo |
| **B. A + guardado en disco** | Igual, pero sobrevive a recargas y pestañas nuevas | Instantáneo también al abrir la app | +1–2 días; datos de leads en cada ordenador (borrar al cerrar sesión) |
| **C. Como Linear** | Copia completa en el navegador y motor de sincronización propio | Todo instantáneo | Semanas; casi rehacer la app |

**Orden propuesto (si se elige A):**
0. Medir todas las secciones (servidor y pantalla, con el Chrome de Cristian delante) para saber cuáles son las lentas.
1. Lo visto aparece al instante y se refresca por detrás.
2. Precarga completa al pasar el ratón por el menú lateral (como ya hacen las pestañas del CRM).
3. Servidor más rápido: comprobar la sesión sin preguntar a Supabase cada vez (−0,1 a −0,2 s por página; toca el inicio de sesión, probar con cuidado) y consultas a la vez en las secciones más lentas.
4. Tiempo real de Supabase para refrescar cuando otro cambia algo.
5. Medir otra vez, enseñar el antes y el después y quitar la medición temporal.

Aparte: los arranques «en frío» de ~2 s se podrían reducir con Vercel Pro (ya está en el plan); sin verificar cuánto.

## 7. Decisiones pendientes de Cristian

- ¿Nivel A, B o C?
- ¿Vale ver durante menos de un segundo un dato de hace un rato a cambio de que todo aparezca al instante?
- Hoy lo visitado se guarda 30 s (`staleTimes`): si otro mueve un lead, se puede tardar hasta 30 s en verlo (salvo recargar). ¿Vale 30 s o más corto?
- ¿Se toca la comprobación de la sesión (punto 3)?

## 7 bis. Decidido y hecho el 17 oct 2026

**Decisiones de Cristian:** nivel **A** (B solo después y si hace falta) · vale ver <1 s un dato de hace un momento, lo visitado se guarda **30 s** · **sí** se toca la sesión, con cuidado · la sesión, **lo primero** (las medidas decían que era el mayor peaje).

| Commit | Qué | Medido (mediana, desde el Chrome de Cristian en España) |
|---|---|---|
| `9f9c423` | Sesión con `getClaims()` en `src/proxy.ts` y `src/lib/sesion.ts` (verificación local con la clave ES256 de Supabase; antes, `getUser()` dos veces por página) | Peaje fijo de cada petición 370 → 188 ms; las 17 secciones, −100 a −370 ms (p. ej. Equipo 803 → 429, Perfil 432 → 284) |
| `96764ef` | Menú lateral: `prefetch={true}` al pasar el ratón (la página con sus datos) y el botón se marca al pulsar | Con el ratón ~1,5 s antes: 83–175 ms hasta ver la página; vuelta en <30 s: 77–119 ms; clic de golpe sin precarga: 662–710 ms |
| `2413348` | Callers: guion, equipo y objetivos a la vez · medición temporal por consulta en el CRM (`t.medir`) | Callers sin mejora (997 → 977 ms): su espera estaba en los objetivos |
| `3e271b0` | CRM: los números de las pestañas en una consulta (función `crm_conteos`, migración `20261017140000`), con plan B si no existe | Conteos 222–1.023 → 107–228 ms; servidor 392–1.221 → 339–452 ms |
| `fb61232` | Objetivos de caller y closer: consultas a la vez (6 en fila → 3 tandas) y sin cálculo si no hay ningún objetivo puesto | Callers: servidor 526–543 → 301–451 ms; objetivos 382–396 → 173–238 ms |
| `71d96bb` | **Tiempo real**: la base avisa (sin datos, una vez por sentencia, solo si algo cambia) al canal privado `proyecto:<id>` al cambiar leads, citas, tarjetas o ventas; `src/components/avisos-en-vivo.tsx` refresca la página (espera 1,5 s para juntar avisos; oculta, al volver). Migración `20261017150000`; CSP con `wss://` | Probado en «Test» con 2 pestañas: visible, se ve solo a los **3,6 s**; oculta, al volver a la vista en 1,3 s |
| (este) | Fuera la medición temporal (`src/lib/tiempos.ts` y sus usos) | — |

**Migraciones:** las 2 lanzadas por Claude (`supabase db push`, a petición de Cristian) el 17 oct a las 12:1x; la de avisos creó el permiso de `realtime.messages`.

**Final (17 oct, mismo método que la línea base: mediana de 3, desde el Chrome de Cristian):**

| Sección | Antes | Después | | Sección | Antes | Después |
|---|---|---|---|---|---|---|
| Peaje fijo (proxy) | 370 | 196 | | Equipo | 803 | 340 |
| Callers | 1.072 | 436 | | Clientes | 707 | 502 |
| Funnel | 1.027 | 631 | | Ranking | 694 | 513 |
| Finanzas | 925 | 508 | | Ventas | 635 | 511 |
| CRM | 913 | 472 | | Guiones | 527 | 369 |
| Admin | 874 | 550 | | Onboarding closers | 457 | 307 |
| KPIs | 802 | 527 | | Reportes | 449 | 287 |
| Programas | 712 | 451 | | Perfil | 432 | 231 |
| Recursos | 406 | 363 | | Agendas | 399 | 327 |

**Mejoras para después:** bajar la espera del tiempo real de 1,5 a 0,5 s · la tabla de la Biblioteca (KPIs) se pide en cada visita (~0,9 s) · un clic de golpe sin pasar el ratón sigue esperando al servidor (~0,3–0,6 s) · nivel B (guardado en disco) solo si al recargar se sigue notando lento.

**Ojo con la sesión:** con `getClaims` una sesión cerrada en otro sitio vale hasta que caduca (~1 h). Desactivar a alguien sigue cortando al momento (`perfil.activo` en `getSesion`).

**CRM en el servidor (17 oct, 5 visitas):** sesión+permisos 79–299 · 1.ª tanda 97–219 · **conteos por pipeline 233–652 y `contarTarjetas` 224–647** (lo más lento) · total 430–966 ms; el navegador ve 722–1.934 ms.

**Encontrado (pendiente):** la tabla de la Biblioteca (KPIs) se vuelve a pedir en cada visita (~0,9 s, `biblioteca-tabla-diferida.tsx`) · en Finanzas, sus 8 pestañas se precargan solas al aparecer (comportamiento de antes, no de este cambio).

## 8. Avisos para quien lo retome

- Con **Playwright Bridge** (el Chrome real de Cristian): no cambiar el tamaño de la pestaña (`browser_resize` deja un tamaño falso que no se puede quitar: el 13 oct hizo que el popup «no bajara»); probar tamaños en una pestaña nueva y cerrarla. Esperar ~2,5 s tras cargar antes de pulsar con JavaScript. Un ratón simulado (`dispatchEvent("mouseover")`) **no** llega a los `onMouseEnter` de React: para probar la precarga, llamar al manejador directamente.
- Medir en pantalla solo con la pestaña **visible** (`document.visibilityState === "visible"`); si no, los números no valen.
- Los tiempos del servidor: la medición `[tiempos]` se quitó el 17 oct; para volver a medir, recuperar `src/lib/tiempos.ts` de git (`git show fb61232:src/lib/tiempos.ts`).
- Si una pestaña se recarga entera tras un aviso, suele ser que se publicó una versión nueva (Next recarga al cambiar de versión), no el tiempo real (comprobado el 17 oct).
