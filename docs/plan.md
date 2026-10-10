# Plan · Dashboard de ventas (app Eternity)

> Creado: 9 oct 2026 · Compactado: 10 oct 2026, noche (a petición de Cristian). **El plan completo de antes, con todo el detalle (pruebas, fórmulas, respuestas de cada ronda, bloques V2), está en `plan-historial-10oct.md`.** Auditoría del código: `Arreglar-dashboard.md`.

---

## 0. En qué nos hemos quedado (léelo primero al retomar)

**Resumen:** la v1 y la v2 están **terminadas en local y probadas**, sin publicar. Los 36 arreglos de la auditoría están hechos. El 10 oct se hicieron las peticiones de Cristian del Paso H (H1-H8), todo con commit (el último, `adb7080`).

**Siguiente paso:** Cristian prueba el Paso 0 y los pendientes 2-9 (hechos en local el 10 oct, noche) → **commit** cuando él lo diga → su revisión completa (Paso A; también los arrastres con su ratón).

**Pendiente de que decida Cristian:**
| # | Qué |
|---|---|
| **0** | ✅ Pipelines «Callers» y «Closers» (Paso 0): hecho en local, sin commit |
| 2 | ✅ Limpieza hecha (10 oct, noche; lo que aprobó Cristian, sección 5) |
| 3 | ✅ `seed.mjs` con la contraseña nueva |
| 4 | ✅ Rama `diseno-glass` borrada (no tenía nada fuera de `main`) |
| 5 | ✅ Plan y guías en `app/docs/` |
| 6 | ✅ Paso G hecho (ver su paso): cargas del Funnel ~2,8 s → ~1,0 s con 30.000 leads |
| 7 | ✅ Cash unificado: Ventas cuenta como Finanzas (lo que entró dentro del periodo) |
| 8 | Los criterios que puso Claude sin preguntar (sección 3): cambiar los que no le gusten |
| 9 | ✅ Objetivos: KPIs → Objetivos enseña periodos pasados (Ahora / Semana pasada / Mes pasado / un día) · «Mis objetivos» solo lee los leads de los lanzamientos en curso |

**Estado comprobado (10 oct 2026, noche):**
| Qué | Estado |
|---|---|
| Código | **24 commits** en `main` de `app/` (último `adb7080`, H5-H8) + **sin commit:** Paso 0 y pendientes 2-9 (10 oct, noche). Rama `diseno-glass` borrada. `next build` correcto. **No está subido a ningún sitio** |
| Tests | **343 de 343** pasan (`npm test` en `app/`, 44 archivos) · tsc y eslint limpios · `npm audit` de producción: 0. Medición de velocidad aparte: `MEDIR=1` |
| Base de datos local | **22 migraciones** · **42 tablas, todas con RLS** |
| Datos locales | **Maestria** (datos reales, solo mirar): 893 leads, 1 venta, 2 citas (del 9 oct), sin objetivos · **Proyecto Prueba** (donde Claude prueba): 3 leads, 1 venta, miembros Ana Closer y CEO Prueba |
| Nube y GHL | Nada creado (sin GitHub, Supabase ni Vercel). GHL sin conectar |

**Cómo entrar en local:** abrir Docker Desktop → servidor `eternity-dashboard` → http://localhost:3100 (a veces lo tiene arrancado otro chat; entonces Claude prueba con Playwright contra el 3100). Versión compilada: `npm run build` en `app/` + servidor `eternity-produccion` → http://localhost:3200 (ambos en `PROYECTOS/GENERAL/.claude/launch.json`).
**Usuarios de prueba** (todos `@eternity.test`, contraseña común la que puso Cristian el 10 oct): ceo@, director@ (tiene Administración), closer1@, closer2@, caller1@, caller2@, caller3@, caller4@.

**Dónde está cada cosa:**
| Archivo | Qué es |
|---|---|
| `app/docs/` | **Desde el 10 oct (noche) aquí están el plan, las guías y la auditoría** (se suben a GitHub con el código) |
| `plan.md` / `plan-historial-10oct.md` | Este plan / el plan completo de antes de compactar |
| `GUIA-PUBLICAR.md` | Los 10 pasos para publicar (al día: 42 tablas, 22 migraciones, 340+ tests) |
| `GUIA-GHL.md` | Conectar GHL: workflows de entrada, avisos, landings directas, token para calendarios y llamadas |
| `Arreglar-dashboard.md` | Auditoría: los 36 puntos, cómo quedó cada uno y su commit |
| `app/` | El código · `app/tests/` los tests · `app/.env.example` las variables (3 de Supabase + `CLAVE_CIFRADO`; opcionales `ANTHROPIC_API_KEY`, `DEEPGRAM_API_KEY`) |
| `app/scripts/` | `preparar-proyecto` (crea Maestria desde `proyecto-base.json`), `crear-usuarios`, `limpiar-pruebas` (todos simulan sin `--confirmar`) y `seed` (solo local) |

## 1. Qué es

App web para el equipo de ventas. La app se llama **Eternity** y tiene **proyectos** (el primero, **Maestria**), cada uno con sus datos, su cuenta de GoHighLevel (GHL), su moneda y su zona horaria. Cada persona ve lo que le toca según su rol y sus permisos. **Publicada, será el único CRM del equipo.**

Equipo: 6 callers, 2 closers, 2 directores y el CEO. Productos de Maestria: Low ticket $47 (lo vende el caller) · Mentoría grupal $1997 · VIP $4997 · Servicios para empresas (precio personalizado).

## 2. Lo que está hecho

| Qué | Estado | Commit |
|---|---|---|
| v1: entorno, roles, callers, closers, Funnel, webhooks GHL, CRM, ficha del lead, reportes, CSV | ✅ | — |
| Bloques 1-5: pruebas, tests, seguridad, mejoras de uso, publicación preparada (guías y scripts) | ✅ | — |
| v2 (V2-0 a V2-12): entradas de landings, estrellas, devoluciones, Agendas (Métricas, Llamadas, Análisis), calendario GHL por closer, Equipo y comisiones, Programas, Finanzas, Clientes, Permisos por sección, Fathom, IA (Claude Sonnet 5.5), llamadas de GHL + Deepgram, coach IA, reparto por horarios | ✅ | `0334e4c` |
| Auditoría: los 36 arreglos | ✅ | `c490247` … `4ae7fba` |
| Velocidad medida (Paso 0.3) y formateador arreglado | ✅ | `9fe7653` |
| H1 · Diseño glassmorphism estilo iOS con los colores de marca | ✅ aprobado | `0ad6a55` |
| H2 · KPIs por persona (sección «KPIs» y en el Funnel) | ✅ | `1a5e340` |
| H3 · Objetivos (diario, semanal, mensual, lanzamiento) en KPIs → Objetivos | ✅ | `62fb93f` |
| H4 · Objetivos que motivan (anillo de hoy, racha, objetivo del equipo, celebración), un 30 % más pequeño | ✅ visto por Cristian | `5d2367c` |
| H6 · Arrastre en Pre-call, citas sin duplicar, Post-call como tablero | ✅ | `715af62`, `c4ee7ef` |
| H6 final · Post-call: mover todo, columna «Cerradas», el closer borra sus ventas, sin arreglo 32 | ✅ (falta el ratón de Cristian) | `adb7080` |
| H8 · «Mi Funnel» (objetivos + mis KPIs + Funnel filtrado) para caller y closer | ✅ | `adb7080` |
| H7 · Un solo CRM para todos (columnas unidas a estados, «No contesta» y «Llamar luego», Pre-call configurable) | ✅ (cambia en el Paso 0) | `adb7080` |
| H5 · Permisos de las 15 secciones, por rol y por persona | ✅ | `adb7080` |

## 3. Decisiones de Cristian que siguen vigentes

**Generales**
- Al final del todo: limpiar datos de prueba, GHL real y publicar. Primero todo en local; sin túnel.
- **Sin Stripe ni pasarelas de pago**: cada venta la apunta a mano quien la hace (facturación, cash, reserva, cuotas; método Stripe, transferencia u otro).
- La app es el CRM; GHL solo envía datos (webhooks + landings directas + API para calendarios y llamadas). Sí se sincroniza el calendario de GHL de cada closer.
- Diseño: glassmorphism estilo iOS con granate Eternity y azul Maestria, claro y oscuro. Textos en español de España. USD y Nueva York por defecto.
- Clientes = solo quien ha comprado. Nada de aula, cursos ni certificados.
- Comisiones: cada rol tiene la suya y se cambia por persona y producto; se paga **sobre lo cobrado**, cada mes; el caller cobra ~3 % cuando cierra el closer; las devoluciones no descuentan comisión ya pagada.
- Solo el CEO cambia el rol o desactiva a alguien. Solo CEO y director cambian comisiones (el director ni la suya ni la de su rol).
- Estrellas del caller: 1 no responde · 2 responde sin saber nada · 3 interesado · 4 quiere saber más · 5 quiere comprar. Del closer: 5 encaja y paga ya · 4 paga con plazo · 3 sin dinero ahora · 2 poco encaje · 1 no califica.
- IA: Claude Sonnet 5.5, clave en el servidor, cada llamada se analiza al conciliar. Llamadas de GHL: todas las contestadas de más de 1 minuto; si GHL no transcribe, Deepgram.

**KPIs (H2)** — fijos para director y CEO; se cuentan **personas**, no llamadas.
- Caller: *contactado* = llamada **o WhatsApp**; *contesta* = respondió la llamada; **agendar cuenta como contestada**; *cerrados* = de sus agendados, los que compraron al closer desde el día de la agenda; su low ticket va aparte.
- Closer: % cierre sobre agenda y sobre asistencia; **su parte del total de los closers** en facturación y en cash; **% cobrado** de lo que vendió. Cada closer por separado y una fila de total.

**Objetivos (H3-H4)** — de actividad y de resultados, no de porcentajes. Los ponen CEO o director por rol o por persona (**manda la persona**); el del director = el equipo entero. Semana de lunes a domingo; el diario de lunes a viernes por defecto, personalizable; un cambio vale desde esa semana. Lanzamiento = nombre + fechas (+ evento opcional: solo cuentan sus leads). Cada uno ve los suyos; todos ven el del equipo, también el dinero. Racha = días que cumplió **todos** sus diarios.

**Tableros (H6)** — Pre-call y Post-call con arrastre y «Mover a…» (para el móvil). En Post-call **todo se mueve a cualquier columna**: sacar una venta de Reserva/Cuotas/Cerradas **la borra** (con confirmación) · Reserva ↔ Cuotas cambia la forma de pago · el closer puede borrar sus ventas · cualquier cita se reagenda (arreglo 32 quitado) · «Cerradas» = pagadas del todo y vendidas este mes. Sin «Métricas de la semana» en Pre-call.

**Un solo CRM (H7)** — mismas columnas para todos. CEO y director ven todos los leads con filtro por persona; caller y closer ven «Mi CRM» con los suyos y los mueven. Solo **CEO y director con Administración** tocan columnas, pipelines, la unión columna ↔ estado y las columnas de Pre-call. Soltar en una columna unida = su botón (con su ventana: Agendar, Llamar luego, No interesa, Venta). Post-call no cambia.

**Mi Funnel (H8)** — para caller y closer, primero del menú: sus objetivos, sus KPIs en tarjetas y el Funnel filtrado a él. Los objetivos se siguen viendo también en «Mis leads» / «Mis agendas».

**Permisos (H5)** — 15 secciones, solo «ve / no ve». **Manda la persona, luego el rol, luego lo de siempre**; el CEO, siempre todo. Cambian permisos el CEO y el director con Administración (nunca se da más a sí mismo ni da lo que no tiene). **Nunca** a callers y closers: Administración, Finanzas y Equipo. Si se da a alguien una sección de otro rol, **ve solo lo suyo**: Agendas a un caller = sus citas, solo mirar · Ventas = las suyas · «Mis leads» a un closer = sus leads como closer · Funnel/KPIs = solo sus números · Clientes = los que vendió o agendó · Programas = solo mirar.

**Criterios que puso Claude sin preguntar (Cristian puede cambiarlos):**
- Agendado → Venta (arreglo 6): personas, compras desde el día de la agenda, cuenta aunque cierre el closer.
- Si falla guardar el historial de un lead, se apunta en el registro y la acción sigue (22).
- Al borrar una venta sin cita, el lead vuelve a «nuevo»; con cita, a «agendado» (26).
- Un director puede cambiar la comisión del rol CEO (2).
- KPIs: «% del total» frente a los closers (no todo el proyecto); agendados del caller cuentan aunque se reagenden; % cierre sobre asistencia solo con los que asistieron.
- Racha: hoy solo suma si ya está cumplido; cada día usa su objetivo de ese día; hasta 60 días; celebración una vez al día.
- Post-call: la cita **cerrada** no se reagenda (se mueve arrastrando su venta); llevar Reserva/Cuotas a «Cerradas» registra el cobro de lo que falta.
- H7: la migración solo movió a «No contesta» / «Llamar luego» los leads que estaban en «Nuevos» (8 en Maestria).
- H5: «Nuevo cliente» y editar el onboarding siguen siendo de CEO y director · cobrar vale con «Ventas» **o** «Agendas» · un caller o closer con «Funnel» va a «Mi Funnel».
- V2: un lead que vuelve a entrar mantiene su primer origen y suma etiquetas y respuestas · sin email se le reconoce por teléfono (últimas 9 cifras) · en Agendas solo cuentan las ventas de closers · un gasto sin categoría cuenta en el profit · Fathom se sincroniza con el botón, no solo.

## 4. Qué nos queda para terminar

**«Terminado»** = el equipo real entra en la app publicada (ordenador o móvil), los leads de GHL llegan solos, los avisos de los reportes llegan y un caller y un closer trabajan un día real sin problemas.

### Paso 0 · Pipelines «Callers» y «Closers» en el CRM, como GHL ✅ (hecho en local el 10 oct 2026, noche; sin commit)
Pedido tal cual: *«no debería ser "columna de callers", debería ser otro pipeline que diga "Callers"»*.
- **Cómo lo hace GHL** (comprobado en su ayuda oficial, [Pipeline Permissions](https://help.gohighlevel.com/support/solutions/articles/155000006523-pipeline-permissions) y [User Permissions, Assigned Data](https://help.gohighlevel.com/support/solutions/articles/48000982601), y en 2 blogs): una persona puede estar en **varios pipelines a la vez** (en cada uno es una «oportunidad» con su propia columna) · cada pipeline tiene **permisos**: compartir con todos / con algunos / todos menos algunos, y nivel **Solo ver** (mueve tarjetas, no toca columnas), **Editar** (también columnas y el pipeline) o **Sin acceso** (ni lo ve); el admin siempre todo · con «solo sus datos», cada usuario ve solo las oportunidades asignadas a él.
- **Decisiones de Cristian (10 oct 2026):**
  - Se **quita el botón «Columnas de Pre-call»** del CRM.
  - Nuevo pipeline **«Callers»** con las columnas que ya existen (Nuevos, No contesta, Llamar luego, Agendados…); **se pueden añadir y borrar columnas**.
  - **Un lead está en los dos sitios, como GHL:** sigue en su pipeline de origen (p. ej. «Webinar 1») y además en «Callers» en la columna de su llamada. Las columnas de llamada (No contesta, Llamar luego…) salen de los pipelines de origen y quedan solo en «Callers».
  - El tablero Pre-call pasa a ser **otro pipeline «Closers»** en el CRM, con columnas que se añaden y borran.
  - **Permisos por pipeline como GHL** (quién ve cada pipeline y con qué nivel); cada caller y closer, solo sus leads.
- ⚠ **Aviso de Claude:** es un cambio grande. Deshace parte del H7 (ya en el commit `adb7080`; se cambia con una migración nueva): columnas unidas a estados dentro de cada pipeline, la migración que añadió «No contesta» y «Llamar luego» a todos los pipelines, `precall_columnas`. Toca el CRM, la cola del caller, Pre-call, métricas y permisos.
- **Respuestas de Cristian a las dudas (10 oct 2026):**
  - Se hace **después del commit** de H5-H8.
  - Pipeline «Closers»: las 4 columnas de ahora siguen **unidas a su estado de cita** (Métricas, KPIs y objetivos no cambian); las columnas nuevas son libres.
  - Permisos por pipeline: **lo decide Claude** → propuesta: **van además** del permiso «CRM» del H5. «CRM» = si la persona ve el CRM; dentro, los permisos de cada pipeline dicen cuáles ve y con qué nivel (Solo ver / Editar / Sin acceso), como GHL. Por defecto: CEO y director con Administración, Editar en todos; «Callers», Solo ver para callers; «Closers», Solo ver para closers; cada caller y closer, solo sus leads.
  - Pipelines de origen: *«Crea un nuevo pipeline para callers»*.
- **Últimas respuestas (10 oct 2026):** *«Simplifica, flujo GoHighLevel, que ya lo estamos complicando demasiado»* · «Closers» = **Pre-call y Post-call juntos en un solo pipeline** (Pendiente, Confirmación pendiente, Confirmado, No califica, Reserva, Cuotas, Cerradas, En seguimiento, No-show…) · los pipelines de origen (Webinar 1, Biblioteca Recursos, Orgánico, DFY) **vuelven a sus columnas de antes del H7: se quitan «No contesta» y «Llamar luego»**, que quedan solo en «Callers» (Cristian corrigió su respuesta: era la A, no la B).
- **Regla para hacerlo: lo más simple posible, como GHL.**
- **Cristian (10 oct, al empezar):** las pestañas Pre-call y Post-call de Agendas → Llamadas **se quedan** y enseñan el mismo tablero que CRM → Closers (mismas columnas) · en «Callers» salen **solo los leads con caller**.
- **Cómo se hace (Claude, 10 oct):**
  1. Migración: `pipelines.tipo` (normal / callers / closers), un «Callers» y un «Closers» por proyecto (también al crear proyecto, con un disparador de la base) · `leads.etapa_callers_id` (su columna en «Callers») y `citas.etapa_closers_id` (su columna en «Closers» si se mueve a una libre) · `etapas.columna_cita` (une una columna de «Closers» a un estado de Pre-call o Post-call) · disparadores: si cambia el estado del lead o de la cita, la tarjeta va sola a su columna unida · los pipelines de origen pierden «No contesta», «Llamar luego» y las uniones (como antes del H7) · `precall_columnas` pasa a las columnas de «Closers» y se quita · tabla `permisos_pipeline`.
  2. CRM: pestañas «Callers» y «Closers»; sin botón «Columnas de Pre-call»; «Unir a un estado» solo en sus pipelines; «Callers» y «Closers» no se pueden borrar (sí renombrar).
  3. Tablero «Closers» común (CRM y Agendas): citas y ventas; columnas unidas = lo de siempre (Pre-call cambia el estado; Post-call como en el H6); columnas libres = la cita se queda ahí hasta que cambie su estado. En Agendas, Pre-call = las columnas hasta la primera de Post-call; Post-call = el resto.
  4. Permisos por pipeline como GHL: nivel **Editar** (también columnas), **Ver** (mueve sus tarjetas) o **Sin acceso**, por rol y por persona (manda la persona). CEO y director con Administración, siempre Editar. Por defecto: pipelines de origen, Ver para todos · «Callers», Ver para callers y directores · «Closers», Ver para closers y directores.
  5. Scripts (`proyecto-base.json`), tests, navegador (Proyecto Prueba) y plan.
- [x] **Hecho:** migración `20261013090000_pipelines_equipo.sql` (21 migraciones; 42 tablas con RLS) · `src/lib/pipelines.ts` (niveles), `src/lib/tablero-closers.ts` (datos), `closer/llamadas/tablero-closers.tsx` (tablero común; sustituye a `tablero-postcall.tsx` y a las tarjetas de Pre-call) · CRM con «Callers», «Closers», menú de uniones y botón de permisos (llave) · los leads solo entran en pipelines de origen (CSV, webhooks, entradas, ficha, GHL) · scripts al día.
- [x] **Tests:** `crm-unico.test.ts` rehecho (6: pipelines al crear proyecto, uniones, botones → columna, arrastrar en «Callers», permisos por pipeline, columnas libres de «Closers») + `tests/unit/closers.test.ts` (3) + 2 adaptados en `funciones.test.ts` + `permisos_pipeline` en el test de RLS. **340 pasan.** Rotas 3 reglas a propósito (nivel por defecto, unión, columna libre): sus tests fallan.
- [x] **Navegador:** Carla (Maestria, solo mirar): ve los 4 de origen + «Callers» (sin «Closers»), sus 100 leads repartidos 88/6/3/1/1/1 = igual que la base. CEO (Proyecto Prueba): «Closers» con 13 columnas y «⋯», permisos con los valores de siempre; columna libre de prueba → arrastrar una cita ahí (base: `etapa_closers_id`) → sale también en Agendas → Post-call → «Mover a…» la devuelve. Sin errores de consola. Columna y 2 líneas de historial de prueba borradas.
- ⚠ No probado en el navegador: soltar en «Callers» con su ventana (Agendar, Llamar luego…), cambiar un permiso desde la ventana (sí en tests), director sin Administración.

### Paso A · Revisión de Cristian 🟡
- [ ] Con su ratón: arrastrar en el CRM, en Pre-call y en Post-call (Claude solo lo pudo simular).
- [ ] Mirar el diseño en su móvil (misma wifi, IP del Mac en vez de `localhost`).
- [ ] Revisión completa de la app (v1 + v2 + arreglos + Paso H). Lo que encuentre se apunta y él decide si se arregla antes de publicar.

### Paso B · Datos que tiene que pasar Cristian ⬜
- [ ] CSV del equipo (`nombre,email,rol,proyecto`), qué director tiene Administración y los permisos de cada uno.
- [ ] Precios de los servicios para empresas (o confirmar «personalizado»).
- [ ] Qué `source` manda cada landing y a qué pipeline va.
- [ ] Prioridad por formulario y criterios A/B/C (el opt-in de la masterclass no pregunta inversión ni cuándo empezar: hoy saldrían todos «C»).
- [ ] Columnas reales de los pipelines (o las crea el admin desde la app) y links de pago de cada producto.
- [ ] Al final: token de GHL (permisos `calendars/events.readonly`, `contacts.readonly`, `conversations/message.readonly`) + id de la subcuenta, calendario/usuario de GHL de cada closer y caller, API key de Fathom de cada closer, claves de Claude y Deepgram.

### Paso C · Publicar (sigue `GUIA-PUBLICAR.md`) ⬜
- [ ] Antes: actualizar la Supabase CLI 2.90 → 2.120 (Homebrew pide `brew trust` de `supabase/tap`: lo hace Cristian).
- [ ] Cristian crea las cuentas de GitHub, Supabase y Vercel (Claude guía). En Supabase, desactivar «Allow new users to sign up».
- [ ] Claude sube el código (repositorio privado) y crea las tablas (`supabase db push`, 22 migraciones).
- [ ] Vercel: `NEXT_PUBLIC_SUPABASE_URL` **antes** del primer despliegue (si no, fallan las subidas de PDF y CSV); carpeta `app`; las 4 variables (`CLAVE_CIFRADO` con `openssl rand -base64 32`, guardada en el gestor de contraseñas) + las 2 de IA.
- [ ] `preparar-proyecto.mjs --confirmar` → `crear-usuarios.mjs equipo.csv --confirmar` (contraseñas por canal privado) → subir un CSV nuevo de contactos de GHL.
- [ ] Comprobar en Vercel lo que en local no se puede: subida directa de PDF y CSV, límite de intentos con varias copias del servidor, HTTPS, consola sin bloqueos. (Opcional) dominio propio.

### Paso D · Conectar GHL (sigue `GUIA-GHL.md`) ⬜
- [ ] Workflows «Lead nuevo», «Cita agendada», «Cambio de etapa» (si hace falta) y avisos de reportes; comprobar en Administración → Integraciones → «Últimos eventos».
- [ ] Comprobar con GHL real lo probado solo simulado: lead por teléfono, cita sin id sin duplicar, closer que no es del proyecto y **que una cita borrada en GHL pasa a «cancelada» sin cancelar ninguna buena**.
- [ ] Avisos: le llegan al CEO aunque no sea miembro; un segundo reporte del día no repite el aviso.
- [ ] Probar con las claves reales: calendario GHL, llamadas de GHL + Deepgram, Fathom, Claude (análisis, coach, scoring), landings directas.

### Paso E · Día real de prueba ⬜
- [ ] Antes: Cristian pone los objetivos y lanzamientos reales.
- [ ] Un caller y un closer trabajan un día; revisar Funnel, KPIs, objetivos, reportes y avisos; ajustes finales.

### Paso F · Opcional ⬜
- [ ] Limpiar la copia local (`limpiar-pruebas.mjs --confirmar`), solo con permiso. No hace falta para publicar (la nube empieza limpia). Añadirle antes una copia de seguridad.

### Paso G · Que las cifras vayan rápido con muchos leads ✅ (10 oct 2026, noche; sin commit)
Cristian: «Ahora, dentro del 0-9». **Lo que medí antes de tocar nada** (30.000 leads, `MEDIR=1`): calcular es rápido (Funnel 167 ms, KPIs 148 ms); **lo lento era cargar** (Funnel 2.774 ms, Agendas 787, Finanzas 759). Por eso no se pasó el cálculo a SQL (mucho trabajo y riesgo de que las cifras cambien) y se arregló la carga:
- [x] `todas()` (`src/lib/datos.ts`) pide las páginas de 1000 filas **de 8 en 8 a la vez** (antes, una detrás de otra). Mismas filas y mismo orden: comprobado con 60.000 actividades, idénticas, alternando 3 veces: ~1,9 s → ~0,55 s.
- [x] Migración `20261013100000_indices_carga.sql`: índices (proyecto, id) en leads, actividades, citas y ventas (antes la base reordenaba todo el proyecto en cada página). No cambia datos.
- [x] Resultado con 30.000 leads (2 mediciones, con el ordenador cargado): **Funnel cargar 1.036 / 1.017 ms** (antes 2.774) · Agendas 455 / 230 (antes 787) · Finanzas 122 / 81 (antes 759). El cálculo no se tocó: las cifras salen de las mismas filas; los 343 tests pasan.
- ⚠ Sin medir en la nube (cada página es un viaje por internet; pedir 8 a la vez debería ayudar más ahí, sin comprobar).

### Detalles menores (no bloquean)
- [ ] La pantalla «algo ha fallado» no se ha visto con un error real.
- [ ] No hay tests de pantallas completas (clics como una persona); los 343 prueban lógica y permisos (Cristian: quedan apuntados).
- [ ] Tras crear una entrada de landing, el formulario se queda con el nombre escrito.
- Sin probar en pantalla (sí en tests): director **sin** Administración · caller con Clientes / Ventas / KPIs · closer con «Mis leads» · Programas solo mirar · crear/borrar lanzamientos y quitar objetivos · la celebración · importar CSV del banco, transferir, gastos programados, pagar liquidaciones · `preparar-proyecto` con las columnas unidas sobre una base vacía.

## 5. Datos de prueba que quedan (no se borra nada sin permiso de Cristian)
- **Limpieza del 10 oct (noche), aprobada por Cristian:** borrados en Maestria los 3 leads «Prueba» (con su cita), las 3 citas del 10 oct de Carla y Ana y el objetivo «Agendas diario 3»; en Proyecto Prueba el gasto de 150,50 €, el cambio 0,92, «Cliente Prueba» (con su venta), la nota de seguimiento, la cuenta «Fathom prueba», la configuración de IA, la grabación + análisis «PRUEBA», los 3 objetivos y la línea «cita confirmada»; los 67 registros de Playwright (65 + 2 de ese día).
- **Quedan (no estaban en la lista):** en Maestria (leads reales), Lázaro sigue «agendado» con Ana y con 11 líneas de historial del 10 oct, y Ruben Torresdey con 2 líneas del 10 oct (su «vendido» es de la venta del 9 oct); en Proyecto Prueba, sus 3 leads (test, PRUEBA Subida CSV, ana), la venta de 1000 € de «ana» (a nombre del CEO, con 300 € devueltos), la cuenta «Todo», categorías y 3 pasos de onboarding de ejemplo.

## 6. Riesgos y avisos
- **Volumen:** con 30.000 leads el Funnel carga en ~1 s en local (Paso G). En la nube cada página es un viaje por internet: sin medir; si fuese lento, el siguiente paso es traer los datos con una sola llamada a la base.
- **GHL:** algunas variables y disparadores no están documentados; se prueban en el Paso D. La lista de citas de GHL no pagina: si llegara incompleta, la app cancelaría citas buenas. Puede que director y CEO tengan que existir como contactos en GHL para recibir avisos (sin verificar). La API de GHL no deja lanzar llamadas desde la app.
- **Llamadas de callers:** solo cuentan las hechas desde GHL (no WhatsApp ni el móvil propio).
- ~~Ventas frente a Finanzas~~ ✅ Unificado el 10 oct (noche): todas cuentan lo cobrado **dentro** del periodo. La columna «Cobrado» de cada venta en Ventas sigue siendo todo lo cobrado de esa venta.
- **Post-call «mover todo»:** reagendar una cita terminada crea otra viva; mover una «reagendada» puede contar la misma reunión dos veces en KPIs, Funnel y objetivos; sacar una venta de su columna la borra (con cobros, plazos y comisiones), también el closer con las suyas. Hay confirmación.
- **Citas:** la base solo impide repetir la misma hora con el mismo closer; un lead puede tener dos citas vivas a horas distintas.
- **`CLAVE_CIFRADO`:** si se pierde, hay que volver a pegar el token de GHL y las claves de Fathom.
- **Clave del webhook en la URL** (decisión de Cristian): puede quedar en registros intermedios; la guía recomienda la cabecera `x-eternity-secreto`.
- **Seguridad del navegador:** los estilos admiten código en línea (`unsafe-inline`). Riesgo bajo.
- **Supabase:** copias de seguridad y pausa por inactividad sin verificar en el plan que se contrate. Supabase local abierto a la red: Cristian decidió no preocuparse.
- **Dependencias:** producción 0 avisos; en desarrollo, avisos «altos» de `braces` dentro del eslint de Next (no van a la app).
- **Diseño glass:** en equipos viejos puede ir algo más lento (sin medir); en móvil solo se revisó a fondo el Funnel.
- **Para programar:** toda ventana o capa flotante nueva va dentro de `<Portal>` (el vidrio encierra lo «fixed») · si el 3100 sirve CSS viejo, borrar `app/.next/dev` (con permiso) y reiniciar · si el login falla, primero `open -a Docker` (Docker Desktop se ha cerrado solo dos veces).
