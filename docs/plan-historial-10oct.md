# Plan · Dashboard de ventas (app Eternity)

> Creado: 9 oct 2026 · Última revisión: 10 oct 2026, noche (al terminar H8, H7 y H5; comprobado con git, los tests, la base local y el navegador en Proyecto Prueba). Auditoría del código: `Arreglar-dashboard.md`.

---

## 0. En qué nos hemos quedado (léelo primero al retomar)

**Resumen en una frase:** la v1 y la **v2 están terminadas en local y probadas**, sin publicar; la auditoría (36 puntos) está arreglada; el 10 oct se hicieron las peticiones de Cristian del Paso H: **diseño glass (H1), KPIs (H2), objetivos (H3), objetivos visibles y que motiven (H4), tableros de Pre-call y Post-call con arrastre (H6), «Mi Funnel» (H8), un solo CRM (H7) y permisos por rol y por persona (H5)**; lo último (H6 final, H8, H7 y H5) está **sin commit**. Falta: que Cristian lo pruebe y el commit, su revisión (A), los datos y claves reales (B), publicar (C-F) y calcular las cifras en la base de datos (G).

**Último trabajo hecho (10 oct 2026):** H2 KPIs (`1a5e340`) · H3 objetivos (`62fb93f`) · H4 anillo de hoy, racha, objetivo del equipo y celebración (`5d2367c`) · H6 arrastre en Pre-call, citas sin duplicar, menú del CRM (`715af62`) y Post-call como tablero (`c4ee7ef`) · **sin commit todavía:** en Post-call se mueve todo (también ventas y citas terminadas), columna «Cerradas», el closer borra sus ventas y se quitó el arreglo 32 (ver H6) · contraseñas de los 8 usuarios de prueba cambiadas (Cristian) · plan repasado · **H8 «Mi Funnel», H7 un solo CRM y H5 permisos hechos en local** (ver sus pasos). Nada a medias salvo el commit.

**Siguiente paso:** **Cristian prueba H6 (lo último), H8, H7 y H5** (también los arrastres con su ratón) y después **commit de todo** (orden acordado). Luego, su revisión completa (Paso A).

**Orden acordado (Cristian, 10 oct 2026):** ~~H8 → H7 → H5~~ ✅ hechos · **ahora** Cristian prueba todo (también los arrastres del H6) · después **commit** (el del H6 incluido; hasta entonces todo queda en local sin guardar).

**Permisos que dio Cristian para H8, H7 y H5 (10 oct 2026):** entrar como CEO y director en el navegador de pruebas (solo Proyecto Prueba) · meter un rato a Carla y al director en Proyecto Prueba (y quitarlos al terminar) · aplicar migraciones en la base local · crear y borrar datos «PRUEBA» en Proyecto Prueba (nunca en Maestria). **No** borrar nada más (ni registros de Playwright ni los datos de prueba anteriores).

**Pendiente de que decida Cristian (todo junto, para no perder nada):**
| # | Qué | Dónde se explica |
|---|---|---|
| 1 | **Probar y hacer commit** de lo último del H6, H8, H7 y H5 (todo en local, 71 archivos sin guardar; probado por Claude) | Pasos H5-H8 |
| 2-4 | ~~Funnel personal, H7 y H5: sus dudas~~ ✅ resueltas y hechos el 10 oct | Pasos H5, H7, H8 |
| 5 | Limpieza de datos de prueba: en Proyecto Prueba, 3 objetivos (de H3/H4), una línea «cita confirmada» en el historial de un lead y lo de V2 (lista en 6.17); en Maestria, las 3 citas del 10 oct creadas con Carla y Ana y el objetivo «Agendas diario 3»; 42 registros de Playwright en `GENERAL/.playwright-mcp` | Paso H6, 6.17 y sección 0 |
| 6 | `app/scripts/seed.mjs` sigue con la contraseña de prueba antigua (los usuarios ya tienen la nueva): ¿se cambia? | Sección 0 |
| 7 | ¿Borrar la rama de git `diseno-glass`? (ya está unida a `main`) | Paso H1 |
| 8 | ¿Meter el plan y las guías dentro de `app/` para que se suban a GitHub? | Paso 0.5 |
| 9 | Cuándo hacer el Paso G (calcular en la base de datos): antes o después de publicar | Paso G |
| 10 | Ventas y Finanzas miden el cash de forma distinta (ver Riesgos): ¿se deja así o se unifica? | Sección 5 |
| 11 | Criterios que puso Claude sin preguntar (se pueden cambiar): lista de abajo | Abajo |
| 12 | ~~¿Puede Claude entrar como CEO?~~ ✅ Cristian dio permiso (H8-H5); visto el menú «⋯» del CRM. Siguen sin probar en pantalla lanzamientos y quitar objetivos | Pasos H3 y H6 |

**Criterios que puso Claude sin preguntar (Cristian puede cambiarlos):**
- **Arreglo 6, «Agendado → Venta»:** se cuentan **personas**, solo las compras **desde el día en que agendó** y, en la vista de un caller, **cuenta la venta aunque la cierre el closer**. Por días en la zona horaria del proyecto.
- **Arreglo 22:** si falla guardar el **historial** de un lead, se apunta en el registro del servidor y la acción sigue.
- **Arreglo 26:** al borrar una venta **sin cita**, el lead vuelve a «nuevo» (con cita, a «agendado»).
- **Arreglo 2 (aviso):** con «solo CEO y director cambian comisiones», **un director puede cambiar la comisión del rol CEO**.
- **H2 (KPIs):** el «% del total» del closer es frente a lo de **los closers** (no todo el proyecto); agendados del caller cuentan aunque luego se reagende; su low ticket va aparte; % cierre sobre asistencia solo con los que asistieron.
- **H4 (racha):** hoy solo suma si ya está cumplido; cada día usa el objetivo de ese día; hasta 60 días; la celebración, una vez al día.
- **H5 (permisos):** «Nuevo cliente» y editar los pasos del onboarding siguen siendo de CEO y director aunque se dé Clientes a un caller o closer · cobrar una venta vale con «Ventas» **o** «Agendas» (Post-call también cobra) · un caller o closer con «Funnel» va a su «Mi Funnel».
- **H6 (Post-call):** la cita **cerrada** no se reagenda (tiene su venta; se mueve arrastrando la venta) · «Cerradas» = pagadas del todo y **vendidas este mes** (por la fecha de la venta) · llevar una venta de Reserva/Cuotas a «Cerradas» **registra el cobro de lo que falta**.

**Estado comprobado el 10 oct 2026 (tarde):**
| Qué | Estado |
|---|---|
| Docker Desktop y Supabase local | En marcha |
| App local | http://localhost:3100 (servidor `eternity-dashboard`; a veces lo tiene arrancado otro chat: entonces Claude prueba con Playwright contra el 3100) |
| Código | **23 commits** en `main` de `app/` (el último, `c4ee7ef`); rama `diseno-glass` sin borrar. **71 archivos sin guardar** (lo último del H6, H8, H7 y H5; se guardan cuando Cristian lo pruebe). `next build` correcto. **No está subido a ningún sitio.** |
| Tests automáticos | **337 de 337** pasan (`npm test` en `app/`; 42 archivos + la medición de velocidad, que solo corre con `MEDIR=1`) · tsc y eslint limpios · `npm audit` de producción: 0 |
| Datos locales | **Maestria:** 896 leads (893 reales + 3 «Prueba»), 1 venta (Ruben, reserva, 9 oct, de Ana), 6 citas (3 del 9 oct y 3 creadas el 10 oct con los usuarios de prueba Carla y Ana: 2 de Lázaro y 1 de Ruben) y 1 objetivo («Agendas diario 3» para callers, creado el 10 oct con el usuario CEO Prueba) · **Proyecto Prueba:** 4 leads, 2 ventas, 2 citas, 3 objetivos de prueba (ver 6.17 y H3/H4) · **8 usuarios** de prueba con la contraseña que puso Cristian el 10 oct (no la de `seed.mjs`) |
| Base de datos | **20 migraciones** aplicadas en local (las 4 del 10 oct por la tarde: `…090000_objetivos`, `…100000_citas_sin_duplicar`, `…110000_crm_unico` y `…120000_permisos_persona`, aplicadas con psql + su fila en `schema_migrations`) · **41 tablas, todas con RLS** |
| Publicación | Nada creado en la nube (sin cuentas de GitHub, Supabase ni Vercel) |
| GHL | Sin conectar. Webhooks: solo con la app publicada. Calendarios por API: se puede en local (6.2) |

**Cómo entrar en local:** abrir Docker Desktop → arrancar el servidor `eternity-dashboard` → http://localhost:3100. La versión compilada (como en producción): `npm run build` en `app/` y el servidor `eternity-produccion` → http://localhost:3200 (ambos en `PROYECTOS/GENERAL/.claude/launch.json`). Usuarios de prueba (el director de prueba tiene Administración; contraseña común: la que puso Cristian el 10 oct; `app/scripts/seed.mjs` aún tiene la antigua, pendiente 6): ceo@, director@, closer1@, closer2@, caller1@, caller2@, caller3@ (del seed) y caller4@ (creado desde la app), todos `@eternity.test`.

**Dónde está cada cosa:**
| Archivo / carpeta | Qué es |
|---|---|
| `plan.md` | Este plan |
| `GUIA-PUBLICAR.md` | Los 10 pasos para publicar (al día el 10 oct 2026, noche: 41 tablas, 330+ tests) |
| `GUIA-GHL.md` | Cómo conectar GHL (3 workflows de entrada + avisos + landings directas + token por API para calendarios y llamadas; al día el 10 oct 2026) |
| `Arreglar-dashboard.md` | Auditoría del código (9 oct 2026): los 36 puntos, cada uno con cómo quedó, su prueba y su commit (todos arreglados el 10 oct) |
| `app/` | El código de la app |
| `app/scripts/proyecto-base.json` | Pipelines, columnas y productos de Maestria (aquí van los precios y columnas que pase Cristian) |
| `app/scripts/` | `preparar-proyecto`, `crear-usuarios`, `limpiar-pruebas` (todos simulan si no se añade `--confirmar`) y `seed` (solo local) |
| `app/tests/` | Los 337 tests (+ `tests/rendimiento/medir.test.ts`, la medición de velocidad, solo con `MEDIR=1`) |
| `app/.env.example` | Las 4 variables que necesita la app publicada (las 3 de Supabase + `CLAVE_CIFRADO`, nueva el 10 oct) + 2 opcionales de la v2 (`ANTHROPIC_API_KEY`, `DEEPGRAM_API_KEY`) |

**Decisiones de Cristian que siguen vigentes:** dejar para el final la limpieza de datos de prueba, GHL real y la publicación · la app es el único CRM · **sin sincronizar Stripe ni ninguna pasarela de pago** · sin túnel en local · **la IA y todo lo de la antigua v2 entran ya** (9 oct 2026, cambia «nada de IA en la v1») · **sí se sincroniza el calendario de GHL de cada closer** (9 oct 2026) · decisiones del 10 oct sobre la auditoría (accesos, comisiones, cifrado, Agendado → Venta, leads de quien se quita, borrar venta, reportes, avisos al CEO…): en la sección 4, «Lo primero» · **diseño glassmorphism estilo iOS con los colores de marca** y las decisiones sobre KPIs, objetivos, tableros y CRM (10 oct): en el Paso H (H1-H8).

## 1. Qué es

Una app web para el equipo de ventas. La app se llama **Eternity** y dentro tiene **proyectos** (el primero, **Maestria**). Cada proyecto tiene sus propios datos, su propia cuenta de GoHighLevel (GHL), su moneda y su zona horaria. Cada persona entra con su usuario y ve solo lo que le toca según su rol.

**Cuando la app esté publicada, será el único CRM del equipo.**

## 2. Decisiones tomadas por Cristian (9 oct 2026)

**Equipo y roles**
- Equipo: 6 callers, 2 closers, 2 directores de ventas y el CEO.
- **Caller:** llama a quien se registró en la opt-in (casi llamadas en frío), por WhatsApp y el marcador de GHL. Ve sus números y el ranking del equipo. Puede vender el low ticket.
- **Closer:** llamadas por Google Meet, grabadas con Fathom.
- **Director:** puede hacerlo todo menos crear proyectos y productos. El CEO le puede activar el panel de administración. *(Cambiado después: solo el CEO cambia el rol o desactiva a alguien —arreglo 24—; el director no cambia su comisión ni la de su rol —arreglo 2—; Equipo, Programas, Finanzas y Clientes solo los ve el CEO salvo que los abra en Permisos —V2-8—.)*
- **CEO:** todo, incluido crear proyectos y productos y editar precios.
- **Onboarding** la primera vez que entra cada persona.

**Productos (Maestria):** Low ticket $47 (lo vende el caller) · Mentoría grupal $1997 · Mentoría VIP $4997 · Servicios para empresas (precio personalizado; lista pendiente).

**CRM:** la app es el CRM principal; GHL solo envía datos. Pipelines: Webinar 1, Biblioteca Recursos, Orgánico, DFY AI Services. Todo personalizable (pipelines, columnas, arrastrar leads). El director añade las columnas que falten. *(En el H7, decidido el 10 oct: las columnas solo las tocan el CEO y el director con Administración; sin hacer todavía.)*

**CRM de callers:** tablero con columnas fijas por resultado de llamada; el caller puede mover sus propios leads.

**Ventas:** cada venta la registra a mano quien la hace (closer, o caller en el low ticket). **Sin sincronizar Stripe.** Se separa facturación, cash collected, reserva y cuotas; método Stripe, transferencia u otro. *(Desde el H6, 10 oct: el closer puede borrar sus propias ventas; antes solo director y CEO.)*

**Links y recursos:** los suben el CEO y los directores. Links de pago por producto; recursos PDF, enlaces, guiones y vídeos.

**GHL por webhook** (una cuenta por proyecto): lead nuevo, cita agendada, cambio de etapa y respuestas de formularios. Sin webhook de ventas. También se puede subir CSV. **v2:** además, las landings envían directamente a la app («Entradas»), y por la API de GHL se leen los calendarios de los closers y las llamadas grabadas (sección 6).

**Reparto de leads:** a mano, rotativo equitativo o **por horarios** (se elige por proyecto; por horarios hecho en V2-11).

**Reportes de fin de día:** preguntas distintas para caller y closer; los ven el director y el CEO; aviso por email y WhatsApp con un workflow de GHL.

**Diseño:** marca Eternity (granate, «E» con jinete) y Maestria (azul, logo «M» real). Tema claro y oscuro, menos chillón que los mockups. **Desde el 10 oct 2026: glassmorphism estilo iOS/Apple con esos colores de marca** (Paso H1). USD y hora de Nueva York por defecto; EUR y Madrid al crear proyecto.

**Técnico:** primero todo en local (Docker + Supabase local); se publica cuando esté perfecto (GitHub + Supabase + Vercel). Sin túnel: GHL real se prueba al publicar.

**Antigua «versión 2»:** coach de IA en directo, análisis de llamadas con IA, grabación y transcripción de llamadas de callers, priorización con IA y reparto por horarios. **Desde el 9 oct 2026 entra en la v2 actual (sección 6).**

## 3. Fases y estado

Leyenda: ✅ hecho y probado por Claude · 🟡 hecho pero falta una comprobación · ⬜ sin empezar

| Fase | Qué | Estado | Prueba hecha / lo que falta |
|---|---|---|---|
| 0 | Entorno local (Next.js 16 + Supabase local + Docker) | ✅ | La app abre y guarda datos |
| 1 | Pasada de punta a punta con datos reales | 🟡 | Flujo CSV → caller → agenda → venta → Funnel probado. **Falta que Cristian lo vea** |
| 2 | Roles, permisos, administración y onboarding | ✅ | 4 roles, crear usuario, onboarding, añadir/quitar persona de un proyecto |
| 3 | Sección callers (cola, botones, mis números, ranking, reparto) | 🟡 | Cola, botones y reparto rotativo probados (tests). **Falta un día real de un caller** |
| 3b | CRM de callers (tablero por resultado de llamada) | 🟡 | Mover y devolver probado (simulado). **Falta probarlo con ratón real** |
| 4 | Sección closers (pre-call, post-call, venta) | 🟡 | Confirmar, reagendar y cerrar con venta (reserva $500). Desde el H6 (10 oct): Pre-call y Post-call son tableros con arrastre; **arrastre probado solo simulado, falta el ratón real de Cristian** |
| 5 | Vista director/CEO (Funnel, filtros, vendedores) | ✅ | Cifras cuadran con SQL; filtro por producto probado. Desde el 10 oct, también «KPIs» y «Objetivos» (H2-H4) |
| 6 | Webhooks de GHL | 🟡 | Probado con datos simulados (lead, cita, etapa, clave mala → 401; desde el 10 oct también por teléfono, citas sin id y closer del proyecto). **Falta GHL real** |
| 7 | CRM, ficha del lead, productos, links y recursos | 🟡 | Crear columna, subir PDF, links. **Arrastrar: probado solo simulado** (el ratón de Claude no suelta; ver 6.9); falta el ratón real de Cristian. Menú «⋯» de columna arreglado el 10 oct sin verlo en pantalla |
| 8 | Reportes de fin de día y avisos | 🟡 | Reporte caller y tasas del closer probados. **Falta que el aviso llegue (no hay workflow GHL)** |
| 9 | Subida de CSV con mapeo de columnas | ✅ | 893 leads reales + CSV con columnas en español |
| 10 | Publicación | ⬜ | Preparada (guías y scripts listos y probados en local). Sin empezar en la nube |

## 3b. Bloques 1 y 2 (9 oct 2026) ✅

**Bloque 1 · pruebas pendientes:** hechas (reparto rotativo, cobros, borrados, columnas, links, contraseñas, reagendar, «llamar luego» vencido, recursos por rol, permisos por rol en páginas y en acciones).

**Bloque 2 · tests automáticos:** 82 tests en `app/tests/` (`npm test`). Unitarios (fechas, CSV, prioridad, métricas, cola, recursos) + integración contra Supabase local en un proyecto `TEST-AUTO` que se crea y se borra solo. Cobertura de la lógica: 88,6 % de líneas. Comprobado que detectan fallos (al romper un permiso a propósito fallan 7).

**Fallo real encontrado y arreglado:** en los días de cambio de hora (1 nov en Nueva York, 25 oct en Madrid) las citas y los «llamar luego» se guardaban **1 hora mal**. Corregido con `localAIso`.

## 3c. Bloques 3 y 4 (9 oct 2026) ✅

**Bloque 3 · seguridad**
- Base de datos cerrada: con la clave pública (la del navegador) no se lee ni se escribe ninguna tabla, ni con sesión de caller. Test permanente.
- Las 42 acciones del servidor (41 + la del onboarding) revisadas una a una: todas comprueban quién eres (salvo «cambiar tema», que es inofensiva).
- **Fallo encontrado y arreglado:** en producción Next oculta los mensajes de error de las acciones; el usuario habría visto un error genérico en vez de «No tienes permiso» o «La facturación tiene que ser mayor que 0». Ahora las acciones devuelven el error (patrón oficial de Next 16) y los fallos inesperados no enseñan detalles internos.
- Límite de intentos: login (8 fallos por email y 40 por conexión cada 15 min) y webhook (300/min por proyecto; 30 claves malas por conexión). ~~**Ojo:** el límite vive en la memoria del servidor~~ (resuelto el 10 oct: se cuenta en la base de datos).
- Webhook: corta cuerpos de más de 500 KB antes de leerlos.
- PDF: se comprueba que el archivo es un PDF de verdad, no solo que lo diga.
- Cabeceras de seguridad (CSP, no se puede meter la app en otra web, nosniff, etc.) y sin la cabecera que delataba la tecnología. (Desde el 10 oct la CSP la pone `src/proxy.ts` con un nonce por petición.)

**Bloque 4 · mejoras de uso**
- Avisos flotantes de «guardado» y de error que se quedan 5-8 s.
- Los formularios ya no se vacían cuando hay un error (login, reporte, usuarios, recursos, CSV, productos).
- Pantallas propias de error, de «cargando» y de «no encontrado».
- Aviso al caller cuando le toca un «llamar luego»: número en el menú y banner en «Mis leads»; la cola se actualiza sola cada minuto.
- Móvil: las 13 páginas revisadas a 375 px sin desbordes; indicadores en 2 columnas.

**Tests:** 91, todos pasan.

## 3d. Bloque 5 · publicación preparada (9 oct 2026) ✅

- **Fallo encontrado y arreglado:** Supabase dejaba que cualquiera se creara una cuenta por su cuenta (dentro no veía nada, pero no debía poder). Desactivado en local; en la nube es el paso 2 de la guía. Test permanente.
- **Webhook GHL más seguro y sin adivinar el formato:** la documentación oficial de GHL permite escribir el JSON nosotros (Event = CUSTOM, Raw Body) y poner la clave en una cabecera (`x-eternity-secreto`). Administración → Integraciones enseña la URL, la clave y las 3 plantillas con botón «Copiar».
- **Scripts** (todos simulan si no se añade `--confirmar`), en `app/scripts/`:
  - `preparar-proyecto.mjs`: crea Maestria con pipelines, columnas y productos (desde `proyecto-base.json`).
  - `crear-usuarios.mjs`: crea el equipo real desde un CSV y guarda las contraseñas temporales en `scripts/salida/` (excluido de git). Probado: valida el CSV, no duplica, las contraseñas funcionan.
  - `limpiar-pruebas.mjs`: **escrito y probado solo en simulación; NO ejecutado.** Dejaría los 893 leads reales limpios. No borra los usuarios de prueba si aún no hay un CEO real.
- **Guías:** `GUIA-PUBLICAR.md` (10 pasos) y `GUIA-GHL.md` (3 workflows de entrada + avisos). Lo no verificable está marcado «⚠ comprobar».
- `app/.env.example` con las 3 variables (hoy son 4: se añadió `CLAVE_CIFRADO` el 10 oct).
- **Git:** 4 commits en local (sin subir a ningún sitio). Revisado que no se guarda ninguna clave.
- **Tests:** 95, todos pasan.

**Recomendación para publicar:** la nube empieza limpia (preparar-proyecto + crear-usuarios + subir el CSV real). El script de limpieza solo hace falta si se quiere limpiar la base de datos local.

## 4. Qué nos queda para terminar

**«Terminado» significa:** el equipo real entra en la app publicada desde su ordenador o móvil, los leads de GHL llegan solos, los avisos de los reportes llegan por email/WhatsApp y un caller y un closer han trabajado un día real sin problemas.

### ⭐ Lo primero · Arreglar errores (revisar `Arreglar-dashboard.md`) ✅ (los 36, 10 oct 2026)

Antes que todo lo demás (decisión de Cristian, 9 oct 2026). La auditoría del código encontró 36 puntos, ordenados por prioridad en `Arreglar-dashboard.md`.

- [x] Cristian lee `Arreglar-dashboard.md` y dice qué se arregla y en qué orden. **Decisiones (10 oct 2026):** primero los 🔴 y 🟠 (13 puntos); los 🟡 y 🟢 se deciden después · **Punto 24:** cambiar el rol o desactivar a alguien (en toda la app) solo lo hace el CEO; el director solo puede quitar a la persona de su proyecto · **Punto 1:** subida directa del navegador a Supabase (se mantienen los 15 MB) · **Punto 2:** cada uno solo crea accesos de su rol o inferior; nadie cambia su propia comisión ni marca como pagada su propia liquidación. Aclarado después: **solo el CEO y el director cambian comisiones** (de roles y de personas); el director no puede cambiar la suya ni la de su rol; **el CEO queda fuera** de la regla de «la propia».
- [x] 🔴 Arreglar los 4 de «Antes de publicar» (**4 de 4 hechos:** punto 1, subida directa, commit `c490247` · punto 2, permisos de Equipo, comisiones y liquidaciones, commit `b6f9e42` · punto 3, claves cifradas con `CLAVE_CIFRADO`, commit `58035f0` · punto 4, límite de intentos en la base, commit `2ef70be`; 10 oct 2026) (archivos de más de 4,5 MB en Vercel, permisos de la sección Equipo, claves sin cifrar, límite de intentos).
- [x] 🟠 Arreglar los 9 de «Cifras o datos mal» ✅ 10 oct 2026 (punto 5 en `abe03ff`; 6 a 13 en `4ae7fba`).
- [x] 🟡 Los 14 de robustez y 🟢 los 9 de limpieza ✅ 10 oct 2026. **Cristian (10 oct 2026): hacer los 30 que quedan seguidos, en orden (7 a 36), y un solo commit al terminar.** Decisiones: **23** los leads de quien se quita quedan sin asignar (con aviso de cuántos) · **26** al borrar una venta, la cita vuelve a «seguimiento» y el lead deja de estar vendido, con aviso de recalcular comisiones · **27** un reporte por persona y día; el segundo envío sustituye al primero sin reavisar · **34** el CEO recibe siempre los avisos de reportes · **35** se mantiene la clave también en la URL del webhook de GHL · **36** sí nonces e índices; los tests de clics quedan apuntados.
- [x] Después de cada grupo: tests, prueba en el navegador (Proyecto Prueba) y marcar en `Arreglar-dashboard.md` lo arreglado.
- [x] El punto 24 (solo el CEO cambia rol o desactiva): hecho.

**Pendientes apuntados al arreglar los 🔴 (10 oct 2026; Cristian decide si se hacen y cuándo):**
- [x] Equipo: ocultar el editor de comisiones a quien ya no puede usarlo. ✅ 10 oct 2026: Equipo (ficha, comisión de cada rol y alta: sin «Una propia» y solo roles iguales o inferiores), Programas (casillas de comisión desactivadas) y Liquidaciones (sin botón en la tuya). Visto en pantalla como closer.
- [x] Límite de intentos: si la base no responde, se deja pasar. ✅ Confirmado por Cristian el 10 oct 2026.
- [x] PDF subido y no guardado: ✅ 10 oct 2026, al preparar cada subida se borran los archivos de más de 1 día que no usa ningún recurso (y los CSV de más de 1 día). Con test.
- [x] Ver en pantalla los avisos del punto 2 entrando como director o closer. ✅ 10 oct 2026, visto como **closer** y como **director** (con permiso de Cristian, el director se añadió un momento a Proyecto Prueba con una liquidación de 0 € de prueba; todo deshecho después y comprobado en la base). Director: edita comisiones de Closer, Caller y CEO pero no la de Director ni la suya; no puede marcar su liquidación.
- [ ] Probar en Vercel real: subida directa (CSP con la dirección de Supabase) y límite con varias copias del servidor. (Solo se puede al publicar.)

### Paso 0 · Pendientes de Claude antes de lanzar 🟡 (5 de 7 hechos; el 5 lo decide Cristian y el 6 va en el Paso C)

Detectados al repasar lo construido (9 oct 2026). Orden recomendado: 1, 2 y 3 antes de la revisión de Cristian; 4 y 6 antes de publicar; 5 lo decide Cristian.

- [x] **1. Probar la app en modo producción en local.** ✅ Hecho el 9 oct 2026 (puerto 3200, 31 pantallas, cabeceras de producción). El HTTPS real solo se puede ver al publicar.
- [x] **2. Evitar citas duplicadas desde GHL.** ✅ Resuelto en V2-2/V2-3 (índice único por cita de GHL; con test).
- [x] **3. Medir la velocidad con muchos leads.** ✅ Medido el 10 oct 2026 en local (Supabase en Docker) con `tests/rendimiento/medir.test.ts` (solo corre con `MEDIR=1`; crea un proyecto de prueba con datos inventados y lo borra al terminar; comprobado que no queda nada). Datos por cada N leads: 2N actividades, N/3 citas, N/12 ventas y la mitad de ellas con un cobro.
  | Qué (ms) | 10.000 leads | 30.000 leads |
  |---|---|---|
  | Funnel/Ranking: cargar datos | 313-513 | 2.268-2.708 |
  | Funnel: calcular | 181 → **56** con el arreglo de abajo | 620 → **149** con el arreglo |
  | Ranking: calcular | 14 | 32 |
  | Agendas: cargar + calcular | 153 + 6 | 1.040 + 23 |
  | Finanzas: cargar + resumen | 79 + 52 | 745 + 140 |
  | Webhook: lead nuevo / que ya existe | 8 / 14 | 17 / 23 |
  - Conclusión (medida del paso 0.3): con 10.000 leads el Funnel tarda menos de 1 s; con 30.000, unos 3 s (lo que más pesa es cargar todos los datos). Los webhooks no dependen del tamaño (arreglo 15).
  - ⚠ **Desde el H2 (10 oct) la carga es mayor:** contar personas obliga a cargar el lead de cada llamada; con 30.000 leads, cargar datos del Funnel pasa a **~4,2-5 s** (medido; ver H2). Cristian: se deja así hasta el Paso G.
  - ⚠ **Medido en local.** En la nube cada página de 1000 filas es un viaje por internet; con 30.000 leads hay ~60 páginas seguidas solo de actividades. Hipótesis sin medir: varios segundos más.
  - ✅ **Arreglado (Cristian, 10 oct 2026; commit `9fe7653`):** el cálculo de «Agendado → Venta» (arreglo 6, de Claude) creaba un formateador de fechas en cada llamada; ahora usa uno solo. Medido otra vez: 56 ms con 10.000 y 149 ms con 30.000.
  - **Cristian espera más de 30.000 leads en Maestria en un año** → pendiente importante «Calcular en la base de datos» (Paso G). Se habla antes de empezar.
- [x] **4. Límite de intentos exacto al publicar.** ✅ Hecho el 10 oct 2026 (arreglo 4 de la auditoría): ahora se cuenta en la base de datos.
- [ ] **5. Las guías y el plan no se suben a GitHub** (están fuera de `app/`). Decidir si se meten dentro — **lo decide Cristian** (es mover archivos).
- [ ] **6. Actualizar la Supabase CLI** de la 2.90 a la 2.120 antes de usarla con la nube. **Cristian (10 oct 2026): se hace en el Paso C.** Ojo: está instalada con Homebrew y Homebrew pide marcar `supabase/tap` como de confianza (`brew trust`), un ajuste de seguridad que tiene que hacer Cristian.

- [x] **7. Poner al día las guías.** ✅ Hecho el 10 oct 2026 (Cristian lo pidió). Encontrado al revisar el plan:
  - `GUIA-PUBLICAR.md` dice que el límite de intentos «vive en la memoria del servidor» (arreglado en el punto 4), habla de «37 tablas» (son **38**, comprobado en la base) y de «240+ tests» (son **294**); en «Si algo falla» falta: «Falta la variable CLAVE_CIFRADO» y «las subidas de PDF o CSV fallan» (falta `NEXT_PUBLIC_SUPABASE_URL` al compilar).
  - `GUIA-GHL.md`: el closer de `closer_email` tiene que ser **miembro del proyecto** (arreglo 20); el lead se encuentra también **por teléfono** si no trae email (18); una cita sin id no se duplica (19); las citas borradas en GHL pasan a «cancelada» al sincronizar (21).
  - Qué se cambió: en `GUIA-PUBLICAR.md`, la lista de seguridad (38 tablas, límite en la base, nonce, claves cifradas, subida directa, 290+ tests), que solo el CEO desactiva, guardar `CLAVE_CIFRADO`, y 3 filas nuevas en «Si algo falla»; quitada la limitación del límite en memoria. En `GUIA-GHL.md`, lo de los arreglos 18 a 21, el CEO en los destinatarios (34), un reporte al día sin repetir aviso (27) y que la clave también vale en la URL (35).

**Detalles menores (no bloquean):**
- [ ] La pantalla de «algo ha fallado» está hecha pero no se ha podido ver con un error real.
- [x] ~~Un lead que no existe responde 200 en vez de 404~~: **es el comportamiento documentado de Next** (`node_modules/next/dist/docs/01-app/02-guides/streaming.md`, línea 617): con la pantalla de «cargando» del panel la respuesta ya ha empezado con 200 y Next no puede cambiarlo; en su lugar añade `noindex`. Para tener 404 habría que quitar el «cargando» de todo el panel. Recomendación de Claude (10 oct): dejarlo así (app privada).
- [ ] No hay tests automáticos de pantallas completas (clics como una persona); los 325 tests prueban la lógica y los permisos. (Cristian, 10 oct 2026: quedan apuntados.)
- [ ] El script de limpieza no hace copia de seguridad antes de borrar; añadirla si algún día se ejecuta.
- [ ] Resumir las secciones antiguas del plan (3b, 3c, 3d) si Cristian lo quiere más corto.

### Paso A · Revisión de Cristian 🟡 (abierta desde el 10 oct 2026; lo que pida Cristian durante la revisión va al Paso H)
- [x] Repaso como CEO, caller y closer hecho por Claude el 9 oct 2026 (6.9). Fallo de seguridad arreglado.
- [ ] Cristian prueba a arrastrar un lead con el ratón en «CRM de callers» (Claude no puede probarlo).
- [ ] Cristian mira el diseño nuevo en su móvil (Claude solo revisó a fondo el Funnel a 375 px). Desde el móvil, en la misma wifi, con la IP del Mac en vez de `localhost`.
- [ ] Cristian prueba con su ratón: arrastrar en Pre-call y en Post-call (Agendas → Llamadas) y el menú «⋯» de una columna del CRM (arreglado sin verlo en pantalla).
- [ ] Revisión completa de Cristian: la app entera (v1 + v2 + los 36 arreglos + Paso H). Usuarios de prueba en la sección 0. Lo que encuentre se apunta y Cristian decide si se arregla antes de publicar.

### Paso B · Datos que tiene que pasar Cristian ⬜
- [ ] **CSV del equipo:** `nombre,email,rol,proyecto` de los 6 callers, 2 closers, 2 directores y el CEO. Decir también **qué director(es) tienen Administración** (lo activa el CEO) y si algún director debe ver Equipo, Programas, Finanzas o Clientes (Permisos por sección).
- [x] **Precios de Maestria:** confirmados por Cristian el 9 oct 2026: **$47 / $1997 / $4997** (los del plan).
- [ ] **Precios** de los servicios para empresas (o confirmar «precio personalizado»).
- [ ] **De `source` a pipeline:** qué `source` manda cada landing y a qué pipeline va (lo enseñará Cristian).
- [ ] **Prioridad por formulario** (se habla más adelante, ver 6.6). Desde V2-11, si hay Scoring IA la cola usa su nota; la A/B/C sigue para cuando no lo hay.
- [ ] **Al final, para probar:** token de integración privada de GHL (con los permisos `calendars/events.readonly`, `contacts.readonly` y `conversations/message.readonly`) + id de la subcuenta, el calendario o usuario de GHL de cada closer, el usuario de GHL de cada caller, la API key de Fathom de cada closer, la clave de la API de Claude y la de Deepgram.
- [ ] **Columnas reales** de los pipelines (o que las cree el director después desde la app).
- [ ] **Prioridad A/B/C:** confirmar o cambiar los criterios (invertir «Sí, ahora», «Ya mismo», horas por semana, situación, experiencia).
- [ ] **Links de pago** de Stripe de cada producto (se pueden poner luego desde la app, en «Links y recursos»).

### Paso C · Publicar (sigue `GUIA-PUBLICAR.md`) ⬜
- [ ] Antes de nada: actualizar la Supabase CLI (Paso 0.6; los comandos los ejecuta Cristian).
- [ ] Cristian crea las cuentas de GitHub, Supabase y Vercel (Claude guía).
- [ ] Supabase: desactivar «Allow new users to sign up».
- [ ] Claude sube el código a GitHub (repositorio privado) y crea las tablas en la nube (`supabase db push`): son las **20 migraciones** (incluidas objetivos, citas sin duplicar, CRM único y permisos por persona), incluidas las 3 del 10 oct (subida directa, límite de intentos y robustez).
- [ ] Vercel: `NEXT_PUBLIC_SUPABASE_URL` tiene que estar puesta **antes** del primer despliegue (la regla de seguridad del navegador se escribe al compilar; sin ella fallan las subidas de PDF y CSV). Conectar el repositorio, carpeta `app`, las 4 variables (las 3 de Supabase + `CLAVE_CIFRADO`, generada con `openssl rand -base64 32` y guardada en el gestor de contraseñas) (+ `ANTHROPIC_API_KEY` y `DEEPGRAM_API_KEY` para la v2) y desplegar.
- [ ] `preparar-proyecto.mjs --confirmar` → Maestria con sus pipelines y productos.
- [ ] `crear-usuarios.mjs equipo.csv --confirmar` → el equipo real; repartir las contraseñas temporales por un canal privado.
- [ ] Subir desde la app un CSV nuevo de contactos de GHL.
- [ ] Comprobar en Vercel real lo que en local no se puede: subir un PDF y un CSV (subida directa a Supabase), el límite de intentos con varias copias del servidor, HTTPS y que la consola del navegador no muestra bloqueos de seguridad.
- [ ] (Opcional) dominio propio.

### Paso D · Conectar GHL (sigue `GUIA-GHL.md`) ⬜
- [ ] Workflow «Lead nuevo» con sus preguntas del formulario.
- [ ] Workflow «Cita agendada» (elegir en GHL la fecha de la cita y el email del closer).
- [ ] Workflow «Cambio de etapa», solo si hace falta.
- [ ] Workflow de avisos de reportes (Inbound Webhook) y pegar su URL en Administración → Proyecto.
- [ ] Comprobar en Administración → Integraciones → «Últimos eventos» y ajustar lo marcado «⚠ comprobar».
- [ ] Con GHL real, comprobar los arreglos que solo se probaron simulados: lead reconocido por teléfono (18), cita sin id que no se duplica (19), closer que no es del proyecto (20) y, sobre todo, **que una cita borrada en GHL pasa a «cancelada» y ninguna buena se cancela** (21; ver Riesgos).
- [ ] Avisos de reportes: comprobar que le llegan al CEO aunque no sea miembro (34) y que un segundo reporte del mismo día no repite el aviso (27).

### Paso E · Día real de prueba ⬜
- [ ] Un caller y un closer trabajan un día con la app.
- [ ] Revisar el Funnel, KPIs, los objetivos (avance y racha), los reportes y los avisos de ese día.
- [ ] Antes de ese día: Cristian pone los objetivos y lanzamientos reales en KPIs → Objetivos.
- [ ] Ajustes finales.

### Paso F · Opcional ⬜
- [ ] Limpiar la copia local (`limpiar-pruebas.mjs --confirmar`), solo con permiso de Cristian. No hace falta para publicar: la nube empieza limpia.

### Paso G · Calcular en la base de datos ⬜ (importante: Cristian espera más de 30.000 leads en un año)
Hoy el Funnel, KPIs, el Ranking, Agendas y Finanzas cargan **todos** los datos del proyecto en cada visita y calculan en el servidor de la app. Medido en local: con 30.000 leads, el Funnel tarda **~4,2-5 s** solo en cargar desde el H2 (~2,4 s antes, paso 0.3); en la nube será más (sin medir). «Mis objetivos» y el objetivo del equipo ya cargan solo lo necesario (H3/H4).
- [ ] Hablarlo con Cristian **antes de empezar**: es un cambio grande (funciones o vistas en Supabase que devuelvan las cifras ya calculadas por periodo, filtro y persona).
- [ ] Decidir cuándo: antes o después de publicar (con 896 leads hoy no corre prisa; con el ritmo esperado, sí antes de llegar a ~10.000-15.000).
- [ ] Al hacerlo: las cifras tienen que salir **iguales** que ahora (tests que comparen los dos cálculos con los mismos datos) y volver a medir con `tests/rendimiento/medir.test.ts`.

### Paso H · Peticiones de Cristian durante su revisión (10 oct 2026) 🟡 (H1 diseño ✅ · H2 KPIs ✅ · H3 objetivos ✅ · H4 objetivos visibles ✅ · H5 permisos 🟡 sin commit · H6 tableros 🟡 sin commit lo último · H7 un solo CRM 🟡 sin commit · H8 Mi Funnel 🟡 sin commit)
Pedido tal cual por Cristian. **Antes de empezar: resolver las dudas con Cristian.**
1. **Métricas de los callers:** % de agenda sobre lead contactado · % de agenda sobre lead que contesta · % de cierre sobre lead contactado · % de cierre sobre lead agendado · % de asistencia de sus leads · % de cierre sobre asistencia.
2. **Métricas de los closers:** % de cierre sobre agenda · % de cierre sobre asistencia · % de facturación · % de cash collected.
3. **Objetivos** personalizables para callers, closers y directores de ventas: diarios, semanales y de lanzamiento.
4. **Rediseño de la marca de todo el dashboard** con estilo glassmorphism (iOS / Apple).

**Decisiones de Cristian (10 oct 2026, noche):**
- **Orden: diseño → métricas → objetivos**, una fase cada vez y se enseña cada una antes de seguir.
- **H1 · Diseño:** glassmorphism estilo iOS/Apple con los **colores de marca** (granate Eternity, azul Maestria), claro y oscuro. **Primero una prueba en 2-3 pantallas** (menú, Funnel y una tabla) con capturas; cuando Cristian la apruebe, a toda la app.
- **H2 · Métricas:** sección nueva **«KPIs», solo director y CEO**, y también en el **Funnel**. Caller: *contactado* = le ha llamado al menos una vez (cualquier resultado); *contesta* = al menos una llamada distinta de «No contesta»; se cuentan personas. *Cierre* del caller = ventas que cierra el closer en citas que agendó ese caller (su low ticket, aparte). Closer: «% facturación» y «% cash collected» = **% de su objetivo**. *(Sustituido al empezar el H2: sin depender de objetivos, parte del total de los closers + % cobrado; ver «Decisiones de Cristian al empezar el H2».)*
- **H3 · Objetivos:** de **actividad** (llamadas, contactados, agendas; citas atendidas) y **resultados** (asistencias, ventas, facturación, cash); **no** de porcentajes. Los ponen el CEO o el director **por rol y, si quieren, por persona** (manda el de la persona). El del **director = del equipo entero**. **Lanzamiento** = nombre + fecha de inicio y fin, que se puede unir al «evento» de los leads. Cada caller y closer **ve solo su avance**; los de todos, en KPIs.

**H1 · Diseño ✅ (10 oct 2026, commit `0ad6a55` en `main`)**
- Qué se hizo: prueba en la rama de git `diseno-glass` y, aprobada, a toda la app: colores con vidrio translúcido + desenfoque, fondo con luz azul y granate, menú lateral flotante con el activo en píldora, ventanas tipo hoja de iOS, letra del sistema en Apple (SF Pro), y versión sólida para quien pide «reducir transparencia». Capturas hechas con Playwright (borradas después, con permiso de Cristian). Como los colores son comunes, el cambio se ve en toda la app; revisadas a fondo: menú, Funnel, Ventas, ventana de Programas y móvil 375 px. 294 tests pasan.
  - Fallos encontrados y arreglados en la prueba: **ventanas encerradas dentro de las tarjetas** (lo detectó Cristian; el vidrio hace de marco de lo «fixed») → las ventanas se dibujan en `<body>` con `Portal` · **logo del selector de proyecto desvaído** (lo detectó Cristian) y lupas de los buscadores → por delante del campo · desbordamiento horizontal en Ventas (ya existía; columna `1fr` que no encoge) → `minmax(0,1fr)` en 6 cuadrículas.
  - ✅ **Ventas:** el «Cash collected» resta ya las devoluciones (Cristian, 10 oct): 1700 €, igual que Finanzas y el Funnel.
  - ✅ **Aprobado por Cristian y pasado a toda la app** (commit `0ad6a55`, unido a `main`). Revisión: las 29 pantallas en claro y en oscuro con Playwright (58 comprobaciones: sin desbordes, sin errores, sin errores de consola) y hojas de miniaturas revisadas a ojo; arreglados además los interruptores apagados, que no se veían en claro. 294 tests pasan.
  - ✅ El servidor de desarrollo (puerto 3100) se había quedado con una caché vieja del CSS. Con permiso de Cristian (10 oct) se borró la caché `app/.next/dev` (1,5 GB, se regenera sola) y ya sirve el CSS al día (comprobado en el navegador). También se borraron, con su permiso, las capturas y registros de Playwright (`PROYECTOS/GENERAL/.playwright-mcp`, 12 MB).
  - **Dónde está el diseño en el código:** `src/app/globals.css` (colores en `:root` y `.dark`; `--panel` translúcido, `--brillo`, `--apagado`, `--desenfoque: 30px`; la pieza `vidrio`; `.tarjeta` con esquinas de 22 px; `.ventana` para las ventanas; versión sólida con `prefers-reduced-transparency`) · `src/components/barra-lateral.tsx` (menú flotante) · `src/components/modal.tsx` y `src/components/portal.tsx` (ventanas fuera de las tarjetas) · `src/components/toasts.tsx`. Letra: SF Pro en Apple y Geist en el resto.
  - [ ] Decidir si se borra la rama `diseno-glass` (ya está unida a `main`; no hace falta para nada). Lo decide Cristian.

**H2 · Métricas en «KPIs» y en el Funnel ✅ (10 oct 2026, commit `1a5e340`; falta que Cristian lo vea en su pantalla)**
- [x] Sección «KPIs» (menú Ventas, debajo del Funnel; solo director y CEO) con las métricas de cada caller y cada closer, una fila «Total» por grupo, filtros de periodo y «¿Cómo se calcula cada número?». Código: `src/lib/kpis.ts`, `src/components/tablas-kpis.tsx`, `src/app/(panel)/kpis/page.tsx`.
- [x] Las mismas tablas en el Funnel, en una sección nueva «KPIs por persona» (la tabla «Vendedores» de antes se deja como estaba).
- [x] % del closer sin objetivos (decisión de Cristian): parte del total de los closers + % cobrado de lo vendido.
- [x] Sin nada sobre lo que calcular, el % sale «—» y no «0 %» (fallo visto al probar, arreglado).
- [x] Tests: `tests/unit/kpis.test.ts` (9 casos calculados a mano); comprobado que fallan si se rompen 3 reglas (agendar = contestada, low ticket aparte, canceladas fuera). **303 tests pasan**, tsc y eslint limpios.
- [x] Navegador (Playwright contra el 3100, que era del otro chat): KPIs y Funnel cargan, sin errores de consola, sin desbordes en ordenador ni a 375 px. Se vio con **Maestria** (solo lectura): cifras comprobadas con SQL (Carla 6 llamadas / 4 contactados / 3 contestan / 1 agendado; Ana 1 cita, 1.997 $, 500 $ = 25 % cobrado). (Captura borrada con permiso de Cristian.)
- [x] Un closer no entra en /kpis: comprobado en el navegador en el H3 (sin «KPIs» en el menú y /kpis le devuelve a su pantalla). El caller usa la misma comprobación (`esJefe`); no visto en pantalla.
- [x] Velocidad medida otra vez (`MEDIR=1`). KPIs calcular: 34 ms con 10.000 leads y 216-290 ms con 30.000. ⚠ **Contar personas obliga a cargar el lead de cada llamada:** con 30.000 leads, cargar datos del Funnel pasa de ~2,4-2,6 s a **~4,2-5 s** (medido dos veces con y dos sin el cambio). Con 10.000 leads: 408 ms. Refuerza el Paso G. **Cristian (10 oct): se deja así hasta el Paso G.** Captura y registros de Playwright borrados con su permiso.
- ~~Dudas de forma~~ resueltas: «KPIs» va en el menú Ventas, debajo del Funnel, fija para director y CEO.

**Decisiones de Cristian al empezar el H2 (10 oct 2026):**
- Fórmulas de la tabla de abajo: **confirmadas**, con estos cambios:
- **Contactado** = le llamó por teléfono **o le mandó un WhatsApp** · **contesta** = respondió la llamada · **«Agendar» cuenta como llamada contestada** (en el código, agendar no apunta una llamada: `leads/acciones.ts:98-102`; sin esto el % de agenda podía pasar del 100 %).
- **Closer, sin depender de objetivos:** (A) **su parte del total** en facturación y en cash y (B) **% cobrado de lo que vendió** (cobrado de sus ventas del periodo ÷ lo facturado en esas ventas). Lo importante es medir a **cada closer por separado** para ver mejoras, con una fila de **total de los closers** debajo.
- ⚠ Interpretación de Claude (Cristian: «se miden los KPIs de cada closer y después el total de todos los closers»): en la A, el total es **lo de los closers** (Juan 4.000 € de 9.000 € de closers = 44 %); el low ticket de los callers no entra. Se cambia fácil si no es así.
- **KPIs fija para director y CEO** (no entra en Permisos por sección).

**Criterios de Claude al programar el H2 (se pueden cambiar):**
- *Agendados del caller:* leads distintos con una cita creada por él en el periodo, **también si después se reagendó** (al contar personas no se repite; si no, perdería la agenda cuando el closer la reagenda).
- *Cerrados del caller:* compras de esos leads desde el día de su agenda **hechas por otro** (su propio low ticket va aparte, en su columna).
- *Asistencia del caller:* cuenta la cita del lead desde su agenda aunque la haya reagendado el closer.
- *% cierre sobre asistencia:* solo cuentan los cerrados que asistieron (así nunca pasa del 100 %).

**Fórmulas propuestas por Claude (confirmadas por Cristian el 10 oct 2026, con los cambios de arriba).** Todo por persona y para el periodo elegido; se cuentan **personas (leads distintos)**, no llamadas.

| Métrica | Fórmula propuesta |
|---|---|
| *Caller* · leads contactados | leads distintos a los que el caller llamó **o escribió por WhatsApp** en el periodo (cualquier resultado; agendar cuenta) |
| *Caller* · leads que contestan | de esos, los que tuvieron al menos una llamada distinta de «No contesta» |
| *Caller* · leads agendados | leads distintos con una cita agendada por el caller en el periodo (sin contar las reagendadas) |
| % de agenda sobre lead contactado | agendados ÷ contactados |
| % de agenda sobre lead que contesta | agendados ÷ que contestan |
| *Caller* · leads cerrados | de sus agendados, los que compraron desde el día de la agenda (misma regla que el arreglo 6) |
| % de cierre sobre lead contactado | cerrados ÷ contactados |
| % de cierre sobre lead agendado | cerrados ÷ agendados |
| % de asistencia de sus leads | de sus agendados con la cita ya pasada, los que asistieron (cerrada, seguimiento o perdida) ÷ esos agendados (sin contar canceladas) |
| % de cierre sobre asistencia (caller) | cerrados ÷ asistidos |
| *Closer* · % de cierre sobre agenda | citas cerradas ÷ citas suyas en el periodo (por fecha de la cita, sin reagendadas ni canceladas) |
| *Closer* · % de cierre sobre asistencia | citas cerradas ÷ citas a las que asistió el lead |
| *Closer* · % de facturación | ~~facturación del periodo ÷ su objetivo~~ → **su facturación ÷ la de todos los closers** (decisión de Cristian) |
| *Closer* · % de cash collected | ~~cash ÷ su objetivo~~ → **su cash ÷ el de todos los closers**, y además **% cobrado de lo que vendió** |

**H3 · Objetivos ✅ (10 oct 2026, commit `62fb93f`; falta que Cristian lo vea en su pantalla)**
- [x] Migración `20261012090000_objetivos.sql` (tablas `lanzamientos` y `objetivos`, con RLS; aplicada en local: 17 migraciones). Cada cambio es una fila nueva; quitar = fila sin valor.
- [x] KPIs → pestaña «Objetivos»: avance de ahora de cada persona (hoy, esta semana, este mes y lanzamientos en curso), «Nuevo objetivo», «Objetivos puestos» (con quitar) y «Lanzamientos» (crear con evento opcional y borrar). Código: `src/lib/objetivos.ts`, `src/lib/objetivos-constantes.ts`, `src/app/(panel)/kpis/acciones.ts`, `objetivos-cliente.tsx`, `src/components/barras-objetivos.tsx`.
- [x] «Mis objetivos» arriba de «Mis leads» (caller; el jefe ve los del caller que mira) y de «Mis agendas» (closer, solo los suyos). Cargan **solo los datos de esa persona** (la pantalla del caller se recarga cada minuto).
- [x] Tests: 6 de la lógica (fecha fija; fallan si se rompen 3 reglas: manda la persona, días del diario, filtro del evento) + 5 de integración (permisos, validaciones, quitar con histórico, lanzamiento en cascada, «Mis objetivos» = cuenta con todo el proyecto) + tablas nuevas en el test de RLS. **314 tests pasan**, tsc y eslint limpios.
- [x] Navegador (Playwright, Proyecto Prueba): objetivo «Cash collected mensual 2.000» para Ana guardado desde el formulario (2.000 leído como 2000); Ana lo ve en «Mis agendas» (0 € de 2000 €: correcto, las 2 ventas de Proyecto Prueba son del CEO, comprobado con SQL); el closer no ve KPIs en el menú y /kpis le devuelve a su pantalla; sin errores de consola; móvil 375 px sin desbordes. Maestria solo se miró (sin objetivos, nada escrito).
- [x] Velocidad (`MEDIR=1`): con 30.000 leads, avance de todos 125 ms, «Mis objetivos» 56 ms (caller) y 103 ms (closer); con 10.000, 181 y 66 ms.
- ⚠ No probado en el navegador (sí en tests): crear y borrar un lanzamiento, quitar un objetivo, el diario con días, el avance del director (Proyecto Prueba no tiene callers ni director miembro). La captura de pantalla no se pudo hacer (Playwright se quedaba esperando).
- **Dato de prueba nuevo en Proyecto Prueba:** objetivo de Ana «Cash collected mensual 2.000» (no se borra sin permiso).
- Pendientes de mejora (Cristian decide): no hay vista de periodos pasados (los datos ya guardan el histórico) · con un evento de muchos leads, «Mis objetivos» lee todos los leads de ese evento en cada recarga.
- **Respuestas de Cristian (10 oct 2026):** se ponen en una **pestaña «Objetivos» dentro de KPIs** · semana de **lunes a domingo** · si se cambia un objetivo, **vale desde esa semana** (el histórico guarda el anterior) · los lanzamientos **pueden coincidir en fechas** · lanzamiento con evento unido: **solo cuentan los leads de ese evento**; sin evento, todo lo de esas fechas · objetivo diario **por defecto de lunes a viernes, personalizable** · director: **cualquier cifra, sumando todo el equipo** · se añaden objetivos **mensuales** (diario, semanal, mensual y de lanzamiento).
- **Plan del H3 aprobado por Cristian (10 oct 2026):** 1) pestaña «Objetivos» en KPIs: para quién (rol o persona; manda la persona) · periodo (diario, semanal, mensual o lanzamiento) · cifra · número · días del diario (por defecto L-V); debajo, el avance de todos · 2) lanzamientos en la misma pestaña (nombre, inicio, fin, evento opcional) · 3) barras de avance arriba de «Mis leads» y «Mis agendas», cada uno solo lo suyo · 4) tests, navegador y commit.
- **Cifras (aprobadas):** caller: llamadas, contactados, agendas (mismas reglas que KPIs) · closer: **citas atendidas** = sus citas del periodo ya registradas (cerrada, seguimiento, perdida, no-show o no califica), asistencias, ventas, facturación, cash · el caller también ventas/facturación de su low ticket.
- ~~Dudas abiertas (se preguntan al empezar el H3):~~ resueltas arriba (día y semana en la zona horaria del proyecto, como el resto de la app): dónde se ponen los objetivos (¿en KPIs, en Equipo o en una pantalla propia?) · qué día empieza la semana (¿lunes?) · el día y la semana se cuentan en la zona horaria del proyecto · si dos lanzamientos pueden solaparse en fechas · si un lanzamiento sin «evento» unido cuenta todo lo de esas fechas · qué pasa con el avance si cambia el objetivo a mitad de semana.

### Paso H4 · Objetivos visibles y que motiven ✅ (10 oct 2026, commit `5d2367c`; visto por Cristian como caller y closer)
Pregunta de Cristian: cómo hacer que el equipo vea los objetivos a diario y se motive. **Elegido:** 1) objetivo de hoy en grande (anillo con el %, «te faltan X» y celebración al cumplirlo) · 2) racha de días · 3) objetivo del equipo visible para todos. **Descartado:** ranking por % (iba contra «cada uno ve solo lo suyo»), mensajes diarios por WhatsApp/email y modo TV (cada uno trabaja desde su casa).
- **Racha:** cuenta los días en que cumplió **todos** sus objetivos diarios; los días sin objetivo (p. ej. fin de semana) no la cortan.
- **Equipo para todos:** se usan los objetivos del director (ya son del equipo entero) y los callers y closers ven **todas las cifras, también el dinero**.
- Criterios de Claude (se pueden cambiar): hoy solo suma a la racha si ya está cumplido (si no, no la corta todavía) · cada día usa el objetivo que había ese día · se mira hasta 60 días atrás («60+») · la celebración sale una vez al día por persona.
- [x] Panel «Mis objetivos» en «Mis leads» y «Mis agendas»: objetivos de hoy en grande (anillo de 104 px, «Te faltan X» / «¡Cumplido! 🎉», verde al cumplir), racha («🔥 N días seguidos» o «Empieza tu racha hoy»), el resto en barras y «Objetivo del equipo». Celebración (confeti de emojis + aviso) una vez al día cuando cumple todos los de hoy; con «reducir movimiento», solo el aviso; va en `<Portal>`. El bloque del equipo también arriba de KPIs → Objetivos. Código: `calcularRacha`, `avancesDelEquipo`, `panelObjetivos` en `src/lib/objetivos.ts`; `src/components/barras-objetivos.tsx`, `src/components/celebracion.tsx`; animación en `globals.css`.
- [x] El equipo se calcula cargando solo los datos desde el inicio del periodo en curso (no todo el proyecto); la racha, los de la persona de los últimos 60 días.
- [x] Tests: 7 nuevos (racha: fin de semana, hoy, «todos», objetivo puesto a mitad, día marcado sin cumplir; equipo; carga ligera = carga completa para equipo y racha). Rompí 3 reglas de la racha y los tests lo detectan. **321 tests pasan**, tsc y eslint limpios.
- [x] Navegador (Proyecto Prueba, como Ana): se ven racha, anillo «0 de 1 · Te faltan 1» (correcto: su cita de hoy está en «confirmación pendiente», comprobado con SQL), su objetivo del mes y el del equipo; sin errores de consola; 375 px sin desbordes.
- [x] Velocidad: panel del caller (suyo + racha + equipo) 467 ms con 10.000 leads y 202 ms con 30.000; closer 200 / 124 ms.
- ⚠ No visto en el navegador: la celebración (en Proyecto Prueba no hay forma de cumplir un objetivo sin inventar datos) ni la racha con días cumplidos (sí en tests). Captura imposible (Playwright se queda esperando).
- [x] Cristian lo vio en Maestria (como Carla y como closer, con objetivos de prueba que se borraron después) y pidió el panel un 30 % más pequeño: de 449 a 308 px de alto (−31 %, medido en el navegador; anillo de 104 a 68 px), sin desbordes a 375 px. El componente es común: las barras de KPIs → Objetivos también se ven más pequeñas.
- **Datos de prueba nuevos en Proyecto Prueba:** objetivos «Citas atendidas diario 1» (closers) y «Facturación semanal 5.000» (equipo), además del de Ana del H3.

### Paso H5 · Permisos de todas las secciones, por rol y por persona 🟡 (hecho en local el 10 oct 2026, sin commit; falta que Cristian lo pruebe)
Pedido tal cual (con 2 capturas: Administración → Permisos y la lista «Equipo de Maestria»): *«Hay que hacer algo así pero con todas las secciones (CRM, ventas, callers…). Y que yo pueda hacer click en su perfil y poder cambiar o dar permisos a cada closer.»* Cristian: «No lo hagas, apúntalo para hacer el plan dentro del plan».
- **Hoy (comprobado en el código):** Administración → Permisos solo tiene 4 secciones de «Empresa» (Equipo, Programas, Finanzas, Clientes) × Directores, Closers y Callers, y se dan **por rol** (V2-8). El resto del menú va fijo por rol en `src/app/(panel)/layout.tsx` y cada página lo vuelve a comprobar (`esJefe`, rol caller/closer…).
- **Secciones del menú que hay hoy:** Funnel, KPIs, CRM, Callers / Mis leads, CRM de callers / Mi CRM, Agendas / Mis agendas, Llamadas de GHL / Mis llamadas grabadas, Ventas, Ranking del equipo, Links y recursos, Reportes, Equipo, Programas, Finanzas, Clientes y Administración.
- **Qué se haría (idea, sin decidir):** 1) la tabla de Permisos con todas las secciones, por rol · 2) en la lista del equipo, clic en una persona → su ficha con sus permisos (encima de los de su rol) · 3) que cada página y cada acción del servidor respete esos permisos, no solo el menú.
- **Respuestas de Cristian (10 oct 2026, antes de empezar):** **manda la persona** (si su ficha dice algo, vale eso; si no, lo de su rol) · solo **«ve / no ve»** cada sección · cambian permisos **el CEO y el director con Administración** (el director nunca se da más a sí mismo ni da más de lo que tiene) · **nunca** se dan a callers y closers: **Administración, Finanzas y Equipo** · ficha de permisos para **todas las personas** (el CEO siempre todo) · si se da a alguien una sección de otro rol (p. ej. Agendas a un caller), **ve solo lo suyo**. **«Lo suyo», confirmado por Cristian (10 oct):** 1) caller con Agendas → las citas que agendó, **solo mirar** · 2) caller con Ventas → sus ventas · 3) closer con «Mis leads» → los leads que tiene como closer, en cola · 4) caller/closer con Funnel o KPIs → solo sus números, sin poner objetivos · 5) con Clientes → los que vendió o agendó · 6) con Programas → todos, solo mirar · 7) Equipo, Finanzas y Administración, nunca. Quitar una sección que su rol tiene = deja de verla y no puede entrar.
- [x] **Hecho en local (10 oct 2026, sin commit), en 2 partes:**
  - **Parte 1:** migración `20261012120000_permisos_persona.sql` (tabla `permisos_persona`, con RLS) · `src/lib/permisos.ts` + `permisos-constantes.ts`: 15 secciones, lo de siempre de cada rol (`DEFECTO`), lo que nunca se da (`NUNCA`: Equipo y Finanzas a caller y closer; «Mi Funnel» no aplica a director), **manda la persona, luego el rol, luego lo de siempre**; el CEO siempre todo · menú según permisos (grupos vacíos fuera) · cada página con `exigirPagina` (sin la sección, a su inicio) · inicio = la de su rol o la primera que tenga; sin ninguna, página «Sin acceso» · las descargas de Agendas comprueban la sección · **las 59 acciones** de 11 módulos comprueban su sección (Ventas también vale con Agendas, porque Post-call cobra; las de leads valen con Cola, CRM, Agendas o Clientes) · Administración → Permisos: tabla con todas las secciones (también para el director con Administración: nunca la fila de directores ni dar lo que no tiene) y botón «Permisos» en cada persona de Equipo (Como su rol / Sí / No; nunca el CEO ni uno mismo).
  - **Parte 2 («lo suyo»):** Funnel → «Mi Funnel» · KPIs → solo su fila, sin totales ni Objetivos · «Mis leads» a un closer → sus leads como closer · Agendas a un caller → Métricas, Llamadas (Agendas, Pre-call, Post-call) y Análisis **solo con las citas que agendó** (y las ventas de esos leads), sin botones, sin arrastre, sin PDF ni exportar; el servidor ya no le dejaba cambiar citas de un closer · Ventas a un caller → las suyas (ya era así) · Clientes → los que vendió o agendó (también en sus acciones; sin «Nuevo cliente» ni editar pasos) · Programas → solo mirar (sin botones y bloqueado en el servidor).
- [x] **Tests:** nuevo `permisos-persona.test.ts` (6: regla persona › rol › siempre; quitar Ventas y Agendas a un closer corta el cobro y «como su rol» lo devuelve; límites del director; inicio sin «Mis leads» y «Sin acceso»; Clientes y Agendas de un caller) + `permisos_persona` en el test de RLS. Adaptados a las decisiones nuevas: permisos por rol (V2-8), arreglo 2 (el closer ya no entra en Equipo/Finanzas; Programas solo mirar) y 4 textos de rechazo («No tienes acceso a esta sección»). Comprobado que fallan si se rompe «manda la persona» o «nunca». **337 tests pasan**, tsc y eslint limpios, `next build` correcto, `npm audit` 0.
- [x] **Navegador (Proyecto Prueba):** como CEO, tabla de Permisos completa (valores de siempre, «Nunca» y «—») y ficha de Carla (sin botón para el CEO; Equipo y Finanzas «Nunca»); dado «Agendas: sí» a Carla y quitado «Ranking» a los callers → Carla sin «Ranking» en el menú, con «Mis agendas»: solo su cita, 3 pestañas, sin arrastrar, sin «Registrar», «Mover a», «Crear llamada» ni «Sincronizar GHL»; Métricas con sus citas y sin PDF. Sin errores de consola (un aviso antiguo de «módulo no encontrado» fue del momento en que se guardaron los archivos a medias; desaparece al recargar). Después se devolvió todo como estaba.
- ⚠ No probado en el navegador: caller con Clientes / Ventas / KPIs, closer con «Mis leads» y Programas solo mirar (sí en tests o por código común).
- Criterios de Claude: «Nuevo cliente» y editar los pasos del onboarding siguen siendo de CEO y director aunque se dé Clientes a un caller o closer · el cobro de una venta vale con «Ventas» o «Agendas».
- ~~Dudas para Cristian antes de planificarlo~~ (resueltas arriba):
  - ¿El permiso de una persona manda sobre el de su rol, igual que en los objetivos?
  - ¿Solo «ver o no ver» cada sección, o también «ver solo lo suyo / ver lo de todos»? (Ej.: un closer que ve Ventas, ¿ve solo sus ventas o las de todo el equipo?)
  - ¿Quién puede cambiar permisos: solo el CEO (como hoy en Permisos) o también el director con Administración?
  - ¿Hay secciones que nunca se deben poder dar (p. ej. Administración a un caller)?
  - ¿Sirve para todas las personas o solo para closers (dijo «cada closer»)?
- ⚠ **Riesgo:** toca la seguridad de toda la app (cada página y cada una de las acciones del servidor). Hará falta revisar los permisos uno a uno, con tests como los del Bloque 3 y el arreglo 2.

### Paso H6 · Arrastrar en Pre-call y Post-call, y cita duplicada al agendar 🟡 (10 oct 2026, commits `715af62` y `c4ee7ef`; **sin commit:** mover todo en Post-call y «Cerradas»; falta que Cristian pruebe el arrastre con su ratón)
- **Fallo encontrado en una captura de Cristian:** Lázaro (Maestria) tenía 2 citas iguales (Ana, 24 oct 16:14, agendadas por Carla) creadas con 0,6 s de diferencia: probable doble clic en «Agendar». `agendarCita` no evitaba crear otra cita igual (el CSV de citas y GHL sí). Cristian: arreglarlo ahora y borrar la repetida.
- **Pedido:** poder arrastrar las tarjetas en Agendas → Llamadas → 02 Pre-call (Pendiente / Confirmación pendiente / Confirmado / No califica), como en el CRM. Se queda «Mover a…» (sirve en móvil).
- [x] Borrada la cita repetida de Lázaro (con permiso; no tenía grabaciones ni análisis). Queda la buena del 24 oct.
- [x] Arreglo del duplicado: migración `20261012100000_citas_sin_duplicar.sql` (índice único lead + closer + hora en las citas creadas en la app que siguen vivas; las de GHL ya tenían el suyo; no había otros duplicados) y «Agendar» avisa: «Ese lead ya tiene una cita con ese closer a esa hora». Test: 2 «Agendar» a la vez → 1 cita; otra hora, otro closer o tras cancelar, sí. Falla si se quita el índice (comprobado). 18 migraciones aplicadas en local.
- [x] Arrastre en Pre-call: cada tarjeta se arrastra y soltar en una columna = «Mover a» (que se queda, para el móvil). Probado en el navegador simulando los eventos de arrastre (cita de prueba en Proyecto Prueba: Pendiente → Confirmado, aviso «Movida a «Confirmado»» y estado en la base; la cita se borró después). ⚠ **Con el ratón de Playwright no suelta** (igual que en el CRM): falta que Cristian lo pruebe con su ratón.
- [x] **Cristian (10 oct): quitar «Métricas de la semana» de Pre-call** («no tiene sentido ponerlo 2 veces»): quitado el bloque, la función `metricasSemana` y su test.
- [x] **Fallo del CRM (captura de Cristian):** el menú «⋯» de una columna era transparente (se leían las tarjetas de detrás) y el 8.º color saltaba de línea. Arreglado en `crm/tablero.tsx`: menú `vidrio ventana` (casi opaco + desenfoque) y 240 px de ancho con los colores en una fila. tsc y eslint limpios. ⚠ **No visto en pantalla** (Cristian paró la comprobación).
- ⚠ Al mover la cita de prueba de Pre-call quedó una línea en el historial de ese lead de Proyecto Prueba («cita confirmada»); no se borra sin permiso (pendiente 5 de la sección 0). En las pruebas siguientes los datos de prueba se borraron enteros.
- [x] Commit `715af62` (todo lo de arriba).
- **Pedido (Cristian, 10 oct, con captura):** «03 Post-call» también debería verse como Pre-call (tablero). Hecho abajo.
- [x] **Post-call como tablero, con el estilo de Pre-call** (commit `c4ee7ef`; `closer/llamadas/tablero-postcall.tsx`) (Cristian, 10 oct: «hacerlo ya», aunque luego el H7 lo pueda cambiar): 8 columnas (Pendientes, Reagendadas, Reserva, Cuotas, En seguimiento, No-show, Canceladas, Perdidas; «Cerradas» se añadió después, ver abajo) y «Tabla» para la lista de siempre. Soltar en Seguimiento / No-show / Canceladas / Perdidas = cambia el estado; en **Reagendadas** abre la ventana para la fecha nueva; en **Reserva** o **Cuotas** abre «Registrar venta» con esa forma de pago.
  - ~~Reglas del commit `c4ee7ef`~~ (sustituidas por «mover todo», abajo): desde «Pendientes» → Seguimiento, No-show, Perdidas, Reagendadas, Reserva o Cuotas; desde «En seguimiento» → Perdidas, Reserva o Cuotas; las terminadas (no-show, cancelada, perdida, reagendada) y las ventas no se arrastran. Otro destino → aviso «Desde «X» no se puede pasar a «Y»». En Seguimiento y Perdidas se piden las estrellas (las exige el servidor). «Pipeline / Tabla» como en Pre-call (la vista de pestañas de siempre = Tabla). `FormVenta` acepta `tipoInicial`.
  - Probado en el navegador como Ana (Proyecto Prueba, cita de prueba simulando el arrastre): Canceladas → aviso y sin cambio; Reserva → «Registrar venta… (reserva)» con Reserva elegida; Reagendadas → pide fecha; Seguimiento → pide estrellas; No-show → movida directa. Tabla y móvil 375 px bien; sin errores de consola. Cita y línea de historial de prueba borradas. 322 tests pasan. ⚠ Arrastre con ratón real sin probar (lo prueba Cristian).
- [x] **Post-call: que todo se pueda mover y arrastrar** (hecho en local, **sin commit**; sustituye las reglas de arrastre del commit `c4ee7ef`) (Cristian, 10 oct, con captura: Ruben en Reagendadas y su venta en Reserva no se movían). Decisiones de Cristian:
  - **Citas:** todas se mueven a cualquier columna, también las terminadas y las reagendadas (avisado: una cita reagendada ya tiene otra nueva y moverla puede contar dos veces en las métricas).
  - **Ventas (Reserva / Cuotas):** a cualquier columna. Fuera de Reserva/Cuotas **se borra la venta** (con confirmación; cobros y plazos con ella; arreglo 26) y su cita pasa a esa columna. **Reserva ↔ Cuotas = cambia la forma de pago** y rehace los plazos de lo que falta.
  - **El closer puede borrar sus propias ventas** (antes solo director y CEO; cambia `ventas/acciones.ts`).
  - **Se quita el arreglo 32**: cualquier cita se puede reagendar, aunque esté cancelada, perdida o ya reagendada (va contra lo decidido en la auditoría; confirmado por Cristian).
  - También «Mover a…» en cada tarjeta, como en Pre-call (para el móvil).
  - Hecho: `tablero-postcall.tsx` (todas las tarjetas se arrastran y tienen «Mover a…»), `cambiarFormaPago` en `ventas/acciones.ts` (rehace los plazos que faltan; lo cobrado después de vender queda como un plazo), `borrarVenta` deja borrar al closer sus ventas y devuelve la cita, `registrarVenta` acepta `cita_id` (cierra la cita arrastrada aunque estuviera terminada), `NO_REAGENDABLES` = solo «cerrada» (criterio de Claude: la cerrada tiene su venta; para moverla se arrastra la venta).
  - Tests: nuevo `postcall-mover.test.ts` (Reserva → 3 cuotas → reserva con importes calculados a mano; venta desde cita perdida; borrar devuelve la cita) y adaptados el de permisos (closer borra lo suyo, caller no) y el del arreglo 32. Comprobado que fallan sin `cita_id`. **324 tests pasan**.
  - Navegador (Ana, Proyecto Prueba, datos de prueba borrados después): venta Reserva → Cuotas (3 × 500 € en la base) → Perdidas (aviso de borrado + estrellas; venta y plazos borrados, cita «perdida» con 3★) · «Mover a…» pendiente → No-show · Perdidas → Reagendadas con fecha nueva (sin el bloqueo del arreglo 32). Sin errores de consola.
  - [x] **Columna «Cerradas»** (Cristian, 10 oct): ventas **pagadas del todo** y vendidas **este mes** (por la fecha de la venta; criterio de Claude), color verde, entre Cuotas y En seguimiento; también en la vista Tabla. Cita → Cerradas = «Registrar venta» con pago completo · Cerradas → otra columna de citas = borra la venta (con confirmación) · Cerradas → Reserva/Cuotas = aviso «ya está pagada del todo» · **Reserva/Cuotas → Cerradas = registrar el cobro de lo que falta** (criterio de Claude: Cerradas son las pagadas). Probado en el navegador como Ana (los 4 casos; datos de prueba borrados) y test unitario. 325 tests pasan. Sin commit.

### Paso H7 · Un solo CRM para todos, con el mismo estilo 🟡 (hecho en local el 10 oct 2026, sin commit; falta que Cristian lo pruebe)
Pedido (con capturas del CRM general y de los pipelines): *«Todos los CRMs que haya tienen que tener el mismo estilo, tanto en callers, como en closers, como en el CRM general que pueda ver el director o el CEO. De hecho el CRM solo lo puede modificar el admin, pero tienen que estar sincronizados.»* Vino como respuesta a «¿Post-call como CRM?».
- **Hoy (comprobado en el código):** tres formas distintas de ordenar: CRM general = pipelines con columnas editables (`etapa_id` del lead) · CRM de callers = columnas fijas por resultado de llamada (`estado_caller`) · closers = Pre-call / Post-call por estado de la cita.
- **Decisiones de Cristian (10 oct):** **mismas columnas para todos** (un solo CRM: las columnas del pipeline; cada uno ve solo sus leads) · el admin **solo** controla las columnas (crear, renombrar, color, orden, borrar columnas y pipelines); **mover leads lo hace cada uno con los suyos** · admin = **CEO y director con Administración** · se hace **después**.
- **Cristian (10 oct 2026): el tablero de Post-call (commit `c4ee7ef`) NO se cambia en el H7.** Se queda tal cual (8 columnas, reglas de arrastre y ventanas al soltar).
- **Cristian (10 oct 2026): el tablero de Pre-call SÍ entra en el H7:** sus columnas se ajustan desde el CRM, y eso solo lo hacen el CEO y el admin (director con Administración).
- **Respuestas de Cristian (10 oct 2026, antes de empezar):**
  - **Columnas con estado unido:** el admin puede unir una columna a un estado del lead («No contesta», «Llamar luego», «Agendado», «No interesa», «Vendido»…). Los botones del caller mueven la tarjeta a esa columna y arrastrar a esa columna cambia el estado; las columnas sin estado son libres. La cola del caller sigue igual.
  - Arrastrar a una columna unida a «Agendado» **abre «Agendar»** (closer, fecha, estrellas); igual «Llamar luego» (pide fecha) y «Vendido» (abre la venta).
  - **Pre-call:** desde el CRM el admin cambia **nombre, color y orden** de sus 4 columnas (siguen siendo los 4 estados de la cita).
  - Un **closer** ve en el CRM **sus leads** (asignados a él); un **caller**, **los asignados a él**.
  - **Menú:** un solo «CRM»: CEO y director ven todos los leads con filtro por persona; caller y closer ven «Mi CRM» con los suyos. **Desaparece «CRM de callers».**
- **2.ª tanda de respuestas (10 oct 2026, al leer el código):** se añaden **«No contesta» y «Llamar luego»** a todos los pipelines (y a los nuevos), detrás de «Nuevos» y ya unidas · se unen las que ya existen por nombre (lo que la app ya hacía): **Nuevos = Nuevo · Agendados = Agendado · Descartados = No interesa · Cerrados = Vendido**; en Orgánico la venta sigue yendo a Low ticket / Grupal / VIP según el producto.
- **Plan del H7 (Claude, 10 oct):** 1) migración: `etapas.estado_caller` (una por pipeline) + columnas nuevas + uniones + `proyectos.precall_columnas` · 2) las acciones del caller mueven la tarjeta a la columna unida (si no hay, como antes, por nombre) · 3) un solo CRM en `/crm`: jefes todos con filtro por persona, caller y closer «Mi CRM» con los suyos; arrastrar a una columna unida = el botón (con su ventana); `/caller/crm` lleva a `/crm` · 4) columnas, pipelines, uniones y Pre-call: solo CEO y director con Administración · 5) Pre-call lee nombre, color y orden de `precall_columnas` · 6) tests, navegador (CEO, director, Carla y Ana en Proyecto Prueba) y plan.
- Criterio de Claude: la migración mueve a «No contesta» / «Llamar luego» los leads con ese estado que estén en «Nuevos» (en Maestria, 8: 6 y 2, comprobado con SQL); los que estén en otra columna no se tocan.
- [x] **Hecho en local (10 oct 2026, sin commit):**
  - Migración `20261012110000_crm_unico.sql` (aplicada en local en una transacción; 19 migraciones): `etapas.estado_caller` (una columna por estado y pipeline), uniones por nombre, «No contesta» y «Llamar luego» en todos los pipelines, los 8 leads de Maestria movidos y `proyectos.precall_columnas`. Comprobado con SQL: los 4 pipelines de Maestria quedan Nuevos · No contesta · Llamar luego · Agendados · … (en «Webinar 1» sigue la columna «Llamada 2», que ya existía).
  - `leads/acciones.ts`: los botones mueven la tarjeta a la columna unida (si no hay, por nombre, como antes; en Orgánico la venta va antes a la columna del producto).
  - `crm/acciones.ts`: columnas, pipelines, `unirEstado` y `guardarColumnasPrecall` **solo CEO y director con Administración**; `moverLead` para cada uno con sus leads y nunca a una columna unida a otro estado (para eso, su botón). Pipelines nuevos con 6 columnas ya unidas.
  - `crm/page.tsx` + `tablero.tsx` + `ventanas-estado.tsx`: un solo CRM; jefes con filtro por persona; caller y closer «Mi CRM» con sus leads (y se recarga cada minuto); soltar en una columna unida = su botón (con su ventana: Llamar luego, Agendar, No interesa, Venta); menú «⋯» con «Unir a un estado» y aviso «↔ Estado» en la columna; «Columnas de Pre-call» (nombre, color y orden). Menú: «CRM» / «Mi CRM»; `/caller/crm` lleva a `/crm`; se quitó `caller/crm/tablero-caller.tsx` (sus ventanas pasan a `ventanas-estado.tsx`).
  - Pre-call lee `precall_columnas` (`columnasPrecall` en `lib/llamadas.ts`); acepta colores «#…» y los del tema.
  - `scripts/proyecto-base.json` + `base-comun.mjs`: Maestria se crea en la nube con «No contesta», «Llamar luego» y las uniones (si no, `limpiar-pruebas` las habría borrado). ⚠ Probado solo en simulación (en local Maestria ya existe).
- [x] **Tests:** nuevo `crm-unico.test.ts` (6: uniones solo admin y una por estado, botones → columna, sin unión → por nombre, arrastrar suyos / ajenos / columna unida, Pre-call) y adaptados 2 (el caller ya mueve los suyos; columnas solo con Administración). Comprobado que fallan si se rompen 2 reglas. **331 tests pasan**, tsc y eslint limpios.
- [x] **Navegador (Proyecto Prueba, con permiso):** Carla: «Mi CRM» solo con su lead, sin controles de admin; soltar en «No contesta» = estado y llamada (comprobado con SQL); en «Llamar luego» se abre su ventana; a «En seguimiento» (libre) se mueve; `/caller/crm` → `/crm`. CEO: todos los controles, filtro por persona (solo los de Carla), menú «⋯» **opaco** (88 % + desenfoque) con **los 8 colores en una fila** y «Unir a un estado», «Columnas de Pre-call» guardadas y vistas en Pre-call (luego devueltas a las de siempre), Funnel completo tras el cambio y `/mi-funnel` → `/funnel`. Director (tiene Administración) ve controles. Ana: «Mi CRM» con sus 3 leads (SQL). Sin errores de consola.
- ⚠ No probado en el navegador: un director **sin** Administración (el de prueba la tiene; está en los tests) y crear pipelines/columnas de verdad (en tests sí).
- Durante las pruebas **Docker Desktop se cerró solo** y tumbó Supabase; se volvió a abrir y los datos estaban intactos (19 migraciones, 901 leads).
- ~~Dudas para antes de planificarlo~~ (resueltas arriba): qué pasa con las columnas fijas del caller (No contesta, Llamar luego…) y su cola, que dependen de `estado_caller` · cómo encajan Pre-call / Post-call (estados de la cita) y Reserva / Cuotas (salen de una venta) · si mover un lead de columna debe cambiar también su estado (p. ej. a «Agendados» sin cita) · qué ve cada closer (¿los leads con cita suya?).
- ⚠ Cambio grande: toca cola del caller, métricas (KPIs, Funnel, objetivos usan estados de citas y llamadas), webhooks y reglas de las entradas.

### Paso H8 · «Mi Funnel» para cada caller y closer 🟡 (hecho en local el 10 oct 2026, sin commit; falta que Cristian lo vea)
Pedido: *«Cada closer y caller tienen que poder ver una sección de "Funnel" pero solo de sus datos (sus llamadas, sus cierres…) y en esa sección ponemos los objetivos. Ponerlo en KPIs → Objetivos no tiene sentido porque esa sección solo la ven los directores y el CEO.»*
- Aclarado por Claude: KPIs → Objetivos es donde el director o el CEO **ponen** los objetivos; cada caller y closer ya **ve** los suyos arriba de «Mis leads» / «Mis agendas» (H3/H4). La idea del Funnel personal tiene sentido igualmente.
- Ya existe lo necesario: el Funnel filtra por persona (filtro «vendedor») y la fila de cada persona de KPIs ya calcula sus porcentajes.
- **Decisiones de Cristian (10 oct 2026, al empezar):** contenido = **las dos cosas**: sus KPIs en tarjetas (las de su fila de KPIs, con Hoy / Semana / Mes / Todo y gráfico día a día) **y debajo el Funnel de siempre filtrado a él** · objetivos **completos en los dos sitios** (su Funnel y arriba de «Mis leads» / «Mis agendas», como hoy) · se llama **«Mi Funnel»**, **primero del menú** Ventas; al entrar cada uno sigue empezando en «Mis leads» / «Mis agendas» · los objetivos se siguen poniendo en KPIs → Objetivos.
- [x] Hecho: página `src/app/(panel)/mi-funnel/page.tsx` (solo caller y closer; un jefe va a /funnel): arriba sus objetivos (`PanelObjetivos`, el mismo de «Mis leads»), filtros de periodo, «Mis KPIs» en tarjetas (su fila de KPIs) y debajo el Funnel filtrado a él (`calcularFunnel` con su perfil). El cuerpo del Funnel (tarjetas, tasas y gráficos) pasa a `src/components/cuerpo-funnel.tsx` y lo usan los dos Funnel. «Mi Funnel» primero del menú Ventas para caller y closer.
- [x] Probado en el navegador: **Ana** (Proyecto Prueba): 2 citas, 1 asistida, 1 cerrada, 0 € (las ventas de Proyecto Prueba son del CEO; comprobado con SQL) · **Carla** (metida un rato en Proyecto Prueba, con permiso): 2 llamadas al mismo lead = 1 contactado, 1 contesta, 1 agendado (100 %), asistencia «—» (su cita es futura). Sin errores de consola; 375 px sin desbordes. 325 tests pasan (no hay tests nuevos: reutiliza `calcularKpis`, `calcularFunnel` y `panelObjetivos`, que ya los tienen).
- [x] Visto como CEO (en el H7): el Funnel del CEO sale completo tras sacar su cuerpo a la pieza común, y un jefe en /mi-funnel va a /funnel.
- ⚠ Carga: «Mi Funnel» carga todo el proyecto, como el Funnel (con 30.000 leads, ~4-5 s; Paso G).
- [x] Datos de prueba quitados al terminar el H5 (con permiso): Carla y el director fuera de Proyecto Prueba y el lead «PRUEBA Mi Funnel» borrado (con su cita y sus 4 actividades).
- ~~Dudas~~ (resueltas arriba): ¿ahora o más adelante? · qué cifras ve cada uno (propuesta: caller → llamadas, contactados, agendas, sus %, low ticket; closer → citas, asistencias, cierres, % cierre, facturación, cash) · los objetivos: ¿se mueven al Funnel, se quedan en los dos sitios o un resumen en «Mis leads»/«Mis agendas»? · ¿se siguen poniendo en KPIs → Objetivos?

### Versión 2 ✅
Terminada en local (sección 6, V2-0 a V2-12); falta solo la revisión de Cristian (Paso A) y probar con claves reales.

## 5. Riesgos y avisos

- **GHL:** el formato del JSON ya lo definimos nosotros (Event = CUSTOM). Lo que no está documentado por GHL son los nombres de algunas variables (fecha de la cita, usuario asignado, etapa) y de algunos disparadores: se eligen en GHL y se prueban en el paso 4.
- **Avisos por GHL (no verificado):** puede que el director y el CEO tengan que existir como contactos en GHL para recibir email/WhatsApp.
- ~~**Límite de intentos:** vive en la memoria del servidor~~ ✅ Desde el 10 oct 2026 se cuenta en la base de datos.
- **Copias de seguridad y pausa por inactividad de Supabase:** sin verificar en el plan que se contrate.
- **Docker:** la app local solo funciona con Docker Desktop abierto.
- **Copia local con datos de prueba** mezclados con los 893 leads (no afecta a la nube si se empieza limpia).
- **Supabase local abierto a la red:** Cristian decidió no preocuparse (solo local).
- **Llamadas de los callers (v2):** se traen de GHL (decisión de Cristian), así que solo cuentan las que se hacen desde GHL; las de WhatsApp o el móvil propio no se graban.
- **Dependencias:** `npm audit` de producción: 0. En herramientas de desarrollo quedan avisos «altos» de `braces` dentro del eslint de Next (no van a la app publicada; el arreglo que propone npm rompería Next 16). Ver 6.17.
- **Versiones:** Supabase CLI 2.90.0 (existe la 2.120.0). Hoy funciona; se actualiza en el Paso C (Paso 0.6).
- **Volumen:** Cristian espera más de 30.000 leads en un año. Con la forma actual de calcular (todo en memoria) las pantallas de cifras se vuelven lentas; ver el Paso G.
- **Citas borradas en GHL (arreglo 21):** según la especificación oficial, la lista de citas de GHL no pagina; si con GHL real llegara incompleta, la app cancelaría citas buenas. Comprobarlo en el Paso D.
- **Ventas frente a Finanzas (10 oct 2026):** las dos restan ya las devoluciones, pero miden cosas distintas: **Ventas** = lo cobrado de las ventas **hechas** en el periodo (con todas sus cuotas, sean del mes que sean); **Finanzas, Funnel y Agendas** = lo cobrado **dentro** del periodo. En Proyecto Prueba coinciden (1700 €); en otros meses pueden dar cifras distintas sin que haya un error. Si se quiere una sola definición, lo decide Cristian.
- **Seguridad del navegador:** desde el arreglo 36 los scripts necesitan nonce, pero los **estilos** siguen admitiendo código en línea (`unsafe-inline`), porque el nonce no cubre los atributos `style="…"` que usa la app. Riesgo bajo.
- **Clave del webhook de GHL en la URL:** se mantiene por decisión de Cristian (arreglo 35); la clave puede quedar en registros de servidores intermedios. La guía recomienda la cabecera `x-eternity-secreto`.
- **Diseño glass en móvil:** revisado a fondo solo el Funnel a 375 px (y el resto sin desbordes en ordenador). Conviene que Cristian lo mire en su móvil.
- **Diseño glass y equipos lentos (10 oct 2026):** el desenfoque del vidrio (`backdrop-filter`) cuesta más a la tarjeta gráfica; en ordenadores o móviles viejos la app puede ir algo más lenta al desplazarse. **Sin medir.** Quien active «reducir transparencia» en su sistema ve superficies sólidas.
- **Para programar ventanas nuevas:** una tarjeta de vidrio encierra a las piezas «fixed» que tenga dentro; toda ventana o capa flotante nueva tiene que ir dentro de `<Portal>` (`src/components/portal.tsx`).
- **Caché del modo desarrollo:** si el puerto 3100 sirve un CSS viejo aunque se reinicie, la causa es la caché `app/.next/dev` (borrarla, con permiso, y reiniciar).
- **Post-call «mover todo» (10 oct 2026, decisiones de Cristian):** (1) sin el arreglo 32, reagendar una cita terminada o ya reagendada crea otra cita viva más; (2) mover una cita «reagendada» a otra columna puede hacer que la misma reunión cuente dos veces en KPIs, Funnel y objetivos; (3) arrastrar una venta fuera de Reserva/Cuotas/Cerradas **la borra** (con sus cobros y plazos; baja facturación, cash y comisiones) y ahora también lo puede hacer el closer con las suyas. Hay confirmación antes de borrar.
- **Mismo lead con varias citas vivas:** la regla nueva de la base (H6) solo impide repetir **la misma hora con el mismo closer**; dos citas del mismo lead a horas distintas siguen siendo posibles.
- **`CLAVE_CIFRADO` (10 oct 2026):** si se pierde o se cambia, el token de GHL y las claves de Fathom guardados ya no se pueden leer y hay que volver a pegarlos. Guardarla en el gestor de contraseñas.

## 6. Versión 2 (decidida el 9 oct 2026)

**Qué es:** todo lo útil para ventas de la app que usa hoy el equipo (58 capturas en `Dashboard ventas/` y `Dashboardddd ventas/`) + la IA + lo que antes era «v2». **Marca y diseño de Eternity, no el de las capturas. Textos en español de España.** No se publica hasta tenerlo todo.

**Reglas de Cristian para la v2:**
- Es un **dashboard de ventas**: solo entra lo que sirve para vender o medir ventas (incluye operaciones y producto en lo que afecte a ventas).
- **Nada de Stripe ni pasarelas de pago** (la pantalla «Medios de pago» de las capturas NO entra). El método de pago se sigue apuntando a mano.
- **Clientes = quien ha comprado.** Nada de aula, cursos, certificados ni carreras.
- Las secciones nuevas (Equipo, Programas, Finanzas, Clientes) las ve **solo el CEO**; en Administración se podrá dar o quitar acceso por sección.
- Se **mantienen los 4 roles**; cada rol y cada persona tiene lo que cobra (comisión) para que Finanzas lo liquide.
- Las **estrellas de calidad del lead** las pone el closer al cerrar la llamada o el caller, según quién la lleve.

### 6.1 Bloques (en este orden; cada uno se prueba antes del siguiente)

| Bloque | Qué | Estado |
|---|---|---|
| V2-0 ✅ | **Datos de entrada completos:** pantalla «Entradas» (una dirección por landing, guardar **todo** lo que llega, reglas tipo GHL: si campo = valor → pipeline, columna y etiqueta). Guardar de cada lead `source`, `event`, `page_url`, `referrer`, UTM (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `utm_id`), `fbclid`, `gclid`, `ttclid`, `quiz_score` y todas las respuestas `quiz_*` (ver 6.5), y enseñarlos en la ficha del lead. El webhook de GHL que ya existe también deja de perder datos. Estrellas del caller («No contesta» = 1; al agendar, «llamar luego» o «no interesa» elige de 2 a 5) y del closer (al cerrar la llamada). Devoluciones en ventas (importe y fecha; la comisión pagada no se descuenta) | ✅ 9 oct 2026 (6.16) |
| V2-1 ✅ | **Agendas · Métricas:** embudo agendadas→asistencias→cerradas, cash y facturación, % cierre, ticket medio, calificados 4★+, media de estrellas, pendientes, devoluciones, agendas por origen (pipeline) y por UTM, vista individual y comparativa por closer (comparativa: solo director y CEO), filtro por producto y por `event`, Día/Semana/Mes/Año/Personalizado, «Generar reporte». Detalle en 6.12 | ✅ 9 oct 2026 (6.17) |
| V2-2 ✅ | **Agendas · Llamadas:** calendario (mes/semana/día), crear llamada, importar y exportar, Pre-call en tablero (Pendiente / Confirmación pendiente / Confirmado / No califica) con métricas de la semana *(quitadas el 10 oct, H6)*, Post-call por estados (pendientes, reagendadas, reserva, cuotas, seguimiento, no-show, canceladas, perdidas), tabla o tablero, buscar. Detalle en 6.12 | ✅ 9 oct 2026 (6.17) |
| V2-3 ✅ | **Calendario de GHL por closer:** botón «Sincronizar GHL» + sincronización automática, sin citas duplicadas (resuelve el pendiente 2 del Paso 0), aviso «agendas sin unir a un lead». Ver 6.2 | ✅ 9 oct 2026 (6.17) |
| V2-4 ✅ | **Equipo:** organigrama (áreas de ventas, ver 6.15), alta de miembro en 6 pasos como en las capturas (persona, puesto, comisión, acceso, rol, revisión). **Cada rol tiene su comisión por defecto** y se puede cambiar al crear o editar a la persona; igual en todos los productos o distinta por producto. Incluye el % del caller cuando cierra el closer (3 % por defecto) y su % cuando vende él el low ticket, todo personalizable. Sirve para que Finanzas calcule qué se paga a cada uno | ✅ 9 oct 2026 (6.17) |
| V2-5 ✅ | **Programas** (= productos), como en las capturas: crear producto con datos básicos y precio (moneda, pago único o cuotas, varía o no), activo/inactivo, comisión por producto. Sin aula, plazas, certificados ni carreras | ✅ 9 oct 2026 (6.17) |
| V2-6 ✅ | **Finanzas:** resumen (facturación, cash, profit, ROAS), ventas y pagos pendientes (cuotas/reservas, vencidos, no paga), liquidaciones de comisiones, ingresos extra, gastos, cuentas, movimientos (importar CSV, conciliación bancaria), divisas (cambio EUR→USD a mano), exportar Excel | ✅ 9 oct 2026 (6.17) |
| V2-7 ✅ | **Clientes** (solo quien ha comprado), tal cual la captura: total de clientes y volumen, activos/pausados/abandonados, tabla o tarjetas, Seguimiento, Finanzas, Casos de éxito y Onboardings | ✅ 9 oct 2026 (6.17) |
| V2-8 ✅ | **Permisos por sección** en Administración: el CEO da o quita acceso **por rol** (todos los directores iguales), con interruptores por sección (Programas, Finanzas, Equipo, Clientes…) | ✅ 9 oct 2026 (6.17) |
| V2-9 ✅ | **Fathom por API:** cada closer añade su cuenta (nombre, API key, formato de título); grabaciones, conciliar grabación con su cita | ✅ 9 oct 2026 (6.17) |
| V2-10 ✅ | **IA:** revisión IA (autocompletar el cierre), análisis de llamadas (resumen, puntuación, objeciones, coaching…), configurar IA (contexto del negocio y agentes), estudio de respuestas cash × llamada, scoring de leads | ✅ 9 oct 2026 (6.17) |
| V2-11 ✅ | **Resto de la antigua v2:** coach de IA en directo, priorización con IA, reparto por horarios, grabación/transcripción de llamadas de callers | ✅ 9 oct 2026 (6.17) |
| V2-12 ✅ | Tests, seguridad, móvil, actualizar `GUIA-GHL.md` y `GUIA-PUBLICAR.md` (ahora hay landings directas, calendario por API, Fathom y la clave de Claude) y revisión de Cristian de todo | ✅ 9 oct 2026 (6.17) · falta la revisión de Cristian |

### 6.2 Cómo se conecta el calendario de GHL (comprobado en la documentación oficial, 9 oct 2026)

- GHL tiene `GET /calendars/events` con `locationId`, `startTime` y `endTime` (en milisegundos) y **uno de** `calendarId` o `userId` (el dueño de la cita). Fuente: marketplace.gohighlevel.com/docs/ghl/calendars/get-calendar-events
- Se autentica con un **Private Integration Token** de la subcuenta (Ajustes → Private Integrations), en la cabecera `Authorization: Bearer`. Fuente: marketplace.gohighlevel.com/docs/Authorization/PrivateIntegrationsToken
- **Ventaja: la app es la que pregunta a GHL**, así que funciona en local sin túnel ni webhook.
- **Plan sencillo:** el CEO pega una vez el token y el `locationId` del proyecto; a cada closer se le pone su usuario o calendario de GHL. La app trae sus citas al pulsar «Sincronizar GHL» y cada pocos minutos. Sin duplicados (se guarda el id de la cita de GHL).
- ✅ **Comprobado en la especificación oficial** (github.com/GoHighLevel/highlevel-api-docs, `apps/calendars.json` y `apps/contacts.json`): base `https://services.leadconnectorhq.com`; citas `Version: 2021-04-15`, permiso `calendars/events.readonly`; contactos `Version: 2021-07-28`, permiso `contacts.readonly`. Llamada real hecha con un token falso: GHL la rechaza y la app lo explica. Falta probar con el token real.

### 6.3 Fathom e IA (comprobado / sin comprobar)

- **Fathom** (developers.fathom.ai/faq): una clave por usuario (Ajustes de usuario → API Access), cabecera `X-Api-Key`, `GET /meetings` con paginación; disponible en todos los planes; webhooks firmados. ✅ URL base comprobada en V2-9 (`https://api.fathom.ai/external/v1`). ⚠ Los límites de uso siguen sin comprobar.
- **Fathom sin programar (opciones encontradas el 9 oct 2026):**
  1. **Clave copiada y pegada:** el closer copia su clave de Fathom y la pega en la app una vez. No programa nada. Funciona en local. Trae transcripción → permite la IA.
  2. **Webhook de Fathom:** el closer pega una URL de la app en Fathom (Ajustes → API Access → Add Webhook). Sin programar, pero solo funciona con la app publicada.
  3. **Zapier** (disparadores «New Transcript», «New AI Summary»; fuente: zapier.com/apps/fathom/integrations): sin código, pero necesita cuenta de Zapier (⚠ coste sin comprobar).
  4. **Solo el enlace:** el closer pega el enlace de la grabación al cerrar. Lo más simple, pero **sin transcripción no hay análisis de IA**.
- **IA:** API de Claude, modelo Sonnet 5.5 (decisión de Cristian, V2-10). Hace falta una clave de API y tiene coste por uso. ⚠ Clave sin crear.

### 6.4 Respuestas de Cristian (9 oct 2026)

- **Paso A (revisión de la v1):** «haz lo mejor para el proyecto» → Claude repasa él mismo la v1 como CEO, caller y closer antes de tocar Agendas, y apunta lo que falle (ver 6.6).
- **Origen:** el pipeline es el origen, **y además hay que guardar y enseñar las UTM** (todo lo que se trackea, ver 6.5).
- **Estrellas:** una escala distinta para caller y para closer (aprobadas en 6.8).
- **Devoluciones:** sí, marcar una venta como devuelta (importe y fecha).
- **Equipo y productos:** como en las capturas, para saber qué se paga a cada persona y tenerlo todo controlado como CEO.
- **Comisiones:** cada rol tiene una comisión; se puede cambiar al crear el perfil.
- **Permisos:** todos los directores iguales, con opción de darles Programas, Finanzas u otras secciones del CEO.
- **Claves (GHL, Fathom, Claude):** se prueban al final, cuando esté todo hecho.

### 6.5 Lo que envían hoy las landings (2 ejemplos reales pasados por Cristian)

Los dos llegan a un webhook de entrada de GHL (`services.leadconnectorhq.com/hooks`).

| Campo | Biblioteca de recursos | Opt-in de la masterclass |
|---|---|---|
| `source` | `recursos` | `landing-codigo-maestria` |
| `event` | — | `Masterclass AI 2026-10-15` |
| `page_url`, `referrer` | sí | sí |
| UTM, `fbclid`, `gclid`, `ttclid` | **no vienen** | sí (vacíos en la prueba) |
| `tags` | `recursos-ia` | — |
| `quiz_score` | 14 | **no viene** |
| Preguntas `quiz_*` | situación, experiencia IA, objetivo 90 días, tiempo semanal, inversión, inicio (6) | edad, estado, situación laboral, uso de IA, ha cobrado, mayor freno, resultado deseado, ingresos actuales (8) |

### 6.6 Fallos encontrados al revisar (9 oct 2026)

1. **El webhook de la app perdería casi todo:** solo guarda como respuesta los campos con «¿?» o dentro de `customData`. Las `quiz_*`, las UTM, `source`, `event` y `quiz_score` se perderían. Se arregla en V2-0.
2. **La prioridad A/B/C no reconoce estos nombres:** busca la palabra «invertir» y el campo se llama `quiz_inversion`. Además, **el opt-in de la masterclass no pregunta por la inversión ni por cuándo empezar**, así que todos sus leads saldrían «Prioridad C». Hay que decidir cómo puntuar cada formulario. **Cristian: «luego hablamos de eso»** → apuntado en el Paso B; mientras tanto la prioridad sigue como está.
3. Las preguntas cambian según la landing; la app debe guardarlas tal cual llegan y enseñarlas con un nombre legible.

### 6.7 Estrellas (aprobadas, ver 6.8)

- **Caller:** sustituida por la escala de Cristian (ver 6.8).
- **Closer, al cerrar la llamada** («¿qué tal prospecto era de verdad?»): 5 = encaja y puede pagar ya · 4 = encaja y paga con plazo · 3 = encaja pero sin dinero ahora · 2 = poco encaje · 1 = no califica.
- «Calificados 4★+» = citas con 4 o 5 estrellas del closer. Así se ve si el caller acierta (sus estrellas frente a las del closer).

### 6.8 Respuestas de Cristian (2.ª ronda, 9 oct 2026)

- **Fathom por API, como lo hace la app actual** (captura del modal): cada closer añade su cuenta con **nombre, API key de Fathom y formato de título opcional** (`{nombre cliente}: Sesión…`, para sacar el nombre del cliente del título de la reunión y unirla con su cita).
- **Webhooks: que no se pierda nada.** Todo lo que llegue se guarda entero en la app y **después se interpreta como en GHL**. El flujo de GHL que usan hoy: *Inbound webhook → Create contact → Update contact field (aquí va al CRM y al pipeline correcto) → Add tag → Wait*, con ramas según `quiz_completed` (verdadero/falso). La app debe adaptarse a lo que mande cada landing (cada una manda datos distintos).
- **Las landings envían directamente a la app** (opción A), además de a GHL.
- **De `source` a pipeline:** Cristian lo enseñará más adelante. **Prioridad por formulario:** se habla más adelante.
- **Filtrar métricas por `event`** (cada masterclass): sí.
- **Estrellas del caller (aprobadas por Cristian):** 1 = no responde · 2 = responde pero no sabe nada · 3 = responde y está interesado · 4 = responde y quiere saber más · 5 = responde y quiere comprar. **Estrellas del closer:** la propuesta de 6.7, aprobada.
- **Comisiones:** se calculan sobre la facturación y sobre el cash collected (aclarado en 6.10). **El caller cobra si el closer cierra, normalmente un 3 %**, personalizable. **Se liquida cada mes.**

### 6.9 Repaso de la v1 por Claude (Paso A, 9 oct 2026)

- Tests: **95 de 95 pasan**.
- **CEO:** las 14 páginas responden (200, entre 160 y 520 ms) y la consola del navegador no muestra errores.
- **Caller y closer:** cada uno abre sus páginas y se le redirige fuera de las que no le tocan (comprobado leyendo la redirección de cada página).
- **Arrastrar con el ratón en «CRM de callers»: sin resultado.** El tablero usa el arrastre nativo del navegador y el ratón simulado de Claude lo empieza pero no lo suelta. No demuestra ni que funcione ni que falle → **lo tiene que probar Cristian con su ratón** (30 segundos). No se cambió ningún dato.
- ⛔ **Fallo de seguridad encontrado:** la clave secreta del webhook de GHL (`webhook_secreto`) de **todos los proyectos** se envía al navegador en todas las páginas y a todos los usuarios, también a los callers (`src/app/(panel)/layout.tsx:55` pasa los proyectos enteros a la barra lateral). Con esa clave alguien del equipo podría meter leads falsos. Arreglo: pasar a la barra solo id, nombre y color. ✅ **Arreglado el 9 oct 2026** (`proyectoParaMenu` en `src/lib/formato.ts`): comprobado que la clave ya no aparece en 5 páginas como closer; test nuevo; 96 de 96 tests pasan.

### 6.10 Respuestas de Cristian (3.ª ronda, 9 oct 2026)

- **Comisiones (opción C):** la app enseña dos cifras, la comisión sobre lo facturado y la comisión sobre lo cobrado; **se paga sobre lo cobrado**, cada mes, según vaya entrando el dinero (reserva, cuotas).
- **Devoluciones:** la comisión ya pagada **no se descuenta**; la asume la empresa.
- **Pantalla «Entradas»** en Administración: aprobada (una dirección por landing, guardar todo, reconocer nombre/email/teléfono, reglas tipo GHL).
- **Fathom:** «lo que es opcional no hace falta» → sin el campo «Callback secret». El «Formato de título» se queda (6.11).

### 6.11 Respuestas de Cristian (4.ª ronda, 9 oct 2026)

- **Seguridad de las landings: «olvídate de esto».** → Cada landing tiene su propia dirección secreta (como los webhooks de entrada de GHL); sin más protección. Se mantienen el límite de tamaño y de ritmo que ya tiene la app.
- **Fathom: el «Formato de título» se queda** (Claude lo cree importante: es lo que une cada grabación con su cita). El «Callback secret» no entra.

### 6.12 Lista detallada de lo que hay en las capturas (para no olvidar nada)

✅ = entra · ✗ = no entra (decisión de Cristian)

**Agendas › Métricas (V2-1)**
- ✅ Embudo agendadas → asistencias → cerradas, con perdidas, no-show, reagendadas y canceladas debajo.
- ✅ Cash collected (cobrado, neto) y facturación (contratos cerrados).
- ✅ Indicadores: % cierre/asistencia, ticket medio, calificados 4★+, media de estrellas, pendientes, devoluciones.
- ✅ Agendas por fuente: por pipeline y por UTM. ✗ La pestaña «Instagram» de la captura (no tenemos esa fuente).
- ✅ % cierre: cerradas, perdidas, no-show, reagendadas, canceladas, tasa de asistencia, tasa de cancelación.
- ✅ Individual / Comparativa (closers lado a lado) · filtro por producto · filtro por `event` · Día/Semana/Mes/Año/Personalizado · ‹ › para ir de periodo en periodo · Actualizar.
- ✅ «Generar reporte» en PDF (resumen del periodo para descargar). ✗ «Personalizar» (6.13).
- ✅ Ver el equipo de ventas en Agendas (comparativa de closers): **solo director y CEO** (6.13). El closer ve solo lo suyo.

**Agendas › Llamadas (V2-2 y V2-3)**
- ✅ Contadores arriba: pendientes, cerradas, perdidas.
- ✅ 01 Agendas: calendario Mes/Semana/Día/Personalizado con «N llamadas» por día y «Info» del día; buscar por nombre, email o teléfono; filtros Todos/Pendientes/Cerradas/Perdidas/No-show/Reagendadas/Canceladas; Crear llamada; Importar; Exportar; ordenar por fecha; 4 vistas (calendario, tabla, lista, semana).
- ✅ Aviso «Hay N agendas sin unir a un lead → Revisar» (citas de GHL que no encuentran su lead) y «Ver inválidas».
- ✅ 02 Pre-call: ~~métricas de la semana (total agendadas, confirmadas, no confirmadas, se presentaron)~~ (quitadas por Cristian el 10 oct, H6), tablero Pendiente / Confirmación pendiente / Confirmado / No califica, o tabla. Tarjeta con nombre, teléfono, fecha de la llamada, «agendada el…», botones Registrar, Mover a y Chat (WhatsApp). ✗ «Enviar» (fuera de momento, 6.14). Filtros: agendada el, fecha de llamada, UTM, orden, Estados.
- ✅ 03 Post-call: Pendientes, Reagendadas, Reserva (seña), Cuotas, En seguimiento, No-show, Canceladas, Perdidas; tablero o lista; «Estados». *(Desde el H6, 10 oct: tablero con arrastre por defecto, columna «Cerradas» y «Tabla» para la lista.)*
- ✅ «Sincronizar GHL» (calendario de cada closer). ✗ «Sincronizar Calendly» (solo usáis GHL).

**Agendas › Llamadas › 04 Grabaciones (V2-9)**
- ✅ Lista / Calendario · Todas / Pendientes / Conciliadas · periodo · Cuentas (Fathom de cada closer: nombre, API key, formato de título). ✗ Aircall. ✗ Callback secret.
- ✅ Conciliar: unir cada grabación con su cita (automático por el título; a mano si no se puede).

**Agendas › Llamadas › 05 Revisión IA y 06 Cualificación (V2-10)**
- ✅ Revisión IA: autocompletado de llamadas (la IA rellena el cierre y el closer lo confirma), llamadas sin lead asignado, conciliaciones dudosas.
- ✅ Cualificación › Estudio: por cada respuesta del formulario, cuánto se cierra y cuánto cash entra por llamada (cash × llamada); elegir preguntas; exportar CSV.
- ✅ Cualificación › Scoring IA.

**Agendas › Análisis (V2-10)**
- ✅ Resumen: llamadas analizadas, puntuación media, puntuación más alta, tasa de cierre.
- ✅ Llamadas: lista con búsqueda, periodo y filtros Cerrados / No cerrados / Seguimiento.
- ✅ Manual: evaluación a mano de las llamadas analizadas (sin evaluar / evaluadas).
- ✅ Configurar IA en 4 pasos: alcance (general o por producto), contexto del negocio, agentes, revisión. Agentes: objeciones, estructura de la llamada, psicología del cliente, cualificación, miedos y creencias limitantes, puntos de mejora (coaching), timeline emocional, frustraciones, deseos, aspiraciones, perfil de la persona, autocompletado del cierre. Cada uno «predeterminado» o «personalizar». ✗ El «system prompt» avanzado (es opcional).

**Equipo (V2-4)**
- ✅ Organigrama por áreas (círculo) y lista de áreas con su número de personas · Dar de alta un miembro · Ver inactivos.
- ✅ Alta en 6 pasos con vista previa: 1 persona y área (uno o varios a la vez) · 2 puesto (o crear puesto nuevo) · 3 comisión (% , igual en todos los productos o distinta por producto, gráfico «se lleva / queda en la empresa») · 4 acceso · 5 rol (los 4 roles de la app) · 6 revisión (+ marcar como líder de su área).
- ✅ Áreas: todo lo relacionado con ventas (6.15); Claude propone las áreas exactas al llegar a V2-4.
- ✅ Acceso: «crear acceso ahora» y «solo en el organigrama» (6.13). ✗ «invitar de otra plataforma» y «vincular cuenta existente».
- ✗ «Contratación». ✗ «Cuentas y Roles» (ya está en Administración) (6.15).

**Programas (V2-5)**
- ✅ Resumen: nº de programas, activos/inactivos, precio medio · buscar · Todos/Activos/Inactivos · vista tarjetas o lista · activar/desactivar.
- ✅ Nuevo programa: datos básicos (nombre, descripción, categoría, color, activo, «Back-end offer») · precios (cómo paga: una vez o cuotas; moneda; precio; ¿varía por divisa?) · comisiones.
- ✗ Carreras, certificados, medios de pago, plazas, acceso al aula, acceso gratuito, reuniones 1-1.

**Finanzas (V2-6)**
- ✅ Resumen: facturación, cash collected, profit (cash − gastos), ROAS · elegir qué gastos cuentan en profit/ROAS · «de dónde viene el cash» (venta nueva, cuotas, back-end) · cuentas por cobrar · periodo actual frente al anterior · mapa de cobros por día · gráfico de 6 meses · guía financiera.
- ✅ Ventas: transacciones (buscar, filtros, exportar Excel) y pagos pendientes (total por cobrar, por vencer, vencidos, no paga; pendientes/completados/no paga/resumen; cuotas/reservas; nuevo deudor).
- ✅ Liquidaciones: pendientes/pagados/todos por mes · «Calcular comisiones a todos» · dos cifras (sobre facturado y sobre cobrado) y se paga sobre lo cobrado · el caller cobra su % cuando cierra el closer.
- ✅ Ingresos extra y gastos con categorías · gastos registrados y programados.
- ✅ Cuentas (saldo, entró, salió, transferir) · movimientos (listado, importar CSV, conciliación bancaria).
- ✅ Divisas: el cambio EUR→USD se pone a mano (6.13). ✗ Actualización automática diaria.
- ✗ «Por divisa / Unificado USD» solo si hay más de una moneda.

**Clientes (V2-7)**
- ✅ Total de clientes y volumen total · Activos / Pausados / Abandonados / Todos · buscar · tabla o tarjetas · nuevo cliente.
- ✅ Botones Seguimiento, Finanzas, Casos de éxito y Onboardings: tal cual la captura, siempre solo de quien ha comprado (6.13).

- ✅ **Respuestas de Cristian (9 oct 2026, al llegar a V2-7; la captura de Clientes sale vacía):** Seguimiento = próxima fecha de contacto y notas de cada cliente, en «Vencidos / Hoy / Próximos», con botón para apuntar uno nuevo · Onboardings = lista de pasos que se marcan (los edita el CEO), con el % hecho de cada cliente · Finanzas = por cliente lo comprado, pagado, lo que falta y su próximo plazo (sale de Finanzas) · Casos de éxito = marcar al cliente con su resultado, enlace al testimonio y fecha · «Nuevo cliente» = cliente + su venta (cuenta en Ventas y Finanzas) · Activo / Pausado / Abandonado se marca a mano (al comprar entra «Activo»).

**Permisos (V2-8)** ✅ Interruptores por sección y por rol (Administración), solo el CEO.

### 6.13 Respuestas de Cristian (5.ª ronda, 9 oct 2026)

1. **«Ver el equipo de ventas» en Agendas:** solo el director y el CEO.
2. **Métricas:** sí a «Generar reporte» (resumen del periodo para descargar); no a «Personalizar».
3. **Botón «Enviar» de la tarjeta de pre-call:** se le explicó a Cristian → **fuera de momento** (6.14).
4. **Áreas del organigrama: solo Ventas** (ya lo había dicho; Claude no lo apuntó). ~~⚠ Claude entiende: una sola área «Ventas»… Pendiente de confirmar.~~ Resuelto en 6.15: «todo lo relacionado con ventas»; en V2-4 se crearon 4 áreas editables.
5. **Acceso al dar de alta:** las dos opciones, «crear acceso ahora» y «solo en el organigrama».
6. **Clientes:** tal cual la captura (Seguimiento, Finanzas, Casos de éxito, Onboardings, lista, tabla/tarjetas). ⚠ Recordatorio: siempre solo de quien ha comprado.
7. **Divisas:** cambio EUR→USD puesto a mano.
8. **Comisión del caller cuando vende él el low ticket:** personalizable en la app.
9. **Estrellas del caller:** «No contesta» pone 1 sola; al agendar, «llamar luego» o «no interesa» el caller elige de 2 a 5. Aprobado.

### 6.14 Respuestas de Cristian (6.ª ronda, 9 oct 2026)

- **Botón «Enviar» de pre-call:** fuera de momento.

### 6.15 Respuestas de Cristian (7.ª ronda, 9 oct 2026)

1. **«Solo ventas» = todo lo relacionado con ventas** (no se refería a un área concreta). «El plan está bien.» → Las áreas exactas del organigrama se proponen al llegar a V2-4.
2. ✗ **«Contratación».** «Cuentas y Roles» no se duplica: usuarios y roles solo en Administración.
3. **«Generar reporte» en PDF.**

### 6.16 Bloque V2-0 hecho (9 oct 2026) ✅

**Qué hay nuevo**
- **Administración → Entradas (landings):** crear una entrada por landing (nombre, pipeline y columna por defecto), su dirección para copiar, «Nueva dirección», activar/desactivar, borrar y **reglas tipo GHL** (campo · es igual a / contiene / viene relleno / viene vacío · valor → pipeline, columna y etiqueta; el campo se elige de los que ya han llegado). Debajo, los últimos envíos con su estado, el motivo si falló, «Ver lead» y el JSON entero.
- **Dirección pública** `/api/webhooks/entrada/[token]`: admite envíos desde el navegador de la landing (CORS). Guarda siempre el envío entero; después lo interpreta.
- **Interpretación** (`src/lib/entrada.ts`): nombre (y apellido sacado del nombre completo), email, teléfono, etiquetas, respuestas `quiz_*` y el objeto `quiz` sin repetir y con nombre legible («Objetivo 90 días»), `customData` de GHL, fuente, evento, UTM, fbclid, gclid, ttclid, página y «venía de», puntuación del cuestionario, y **todo lo demás en «datos»** (menos las cabeceras que añade GHL; el original completo queda en el registro del envío).
- **El webhook de GHL que ya existía** usa la misma interpretación: ya no pierde datos.
- **Ficha del lead:** nueva sección «Origen y seguimiento» (fuente, evento, puntuación, UTM…) y «Todo lo que se recibió»; estrellas del caller; estrellas de cada cita; devolución en sus ventas.
- **Estrellas:** caller en «Llamar luego», «No interesa» (ahora abre una ventana) y «Agendar», en la ficha y en el tablero del caller; «No contesta» = 1 sola. Closer en «Seguimiento», «Perdida» y «Cerrada» (dentro de la venta); «No califica» = 1 sola. Si falta, aviso en rojo en español.
- **Devoluciones** en Ventas: botón «Devolución» (solo director y CEO), importe hasta lo cobrado, fecha y motivo; se ve «Devuelto X» en Ventas y en la ficha.

**Decisiones que ha tomado Claude (se pueden cambiar):**
1. Si un lead vuelve a entrar, **se queda su primer origen** (fuente, evento, UTM); el nuevo evento queda apuntado en su historial y el envío completo en el registro.
2. Las reglas solo colocan a los **leads nuevos**; a uno que ya existe no se le mueve de columna (igual que hacía la v1 con el CSV).
3. Al volver a entrar, **etiquetas y respuestas se suman** (antes se sustituían y se perdían las anteriores; cambia también al reimportar un CSV).
4. Sin email, se reconoce a la persona **por el teléfono** (solo los dígitos, mínimo 6).
5. Una sola devolución por venta.

**Pruebas hechas**
- 121 tests (25 nuevos): interpretación con los 2 envíos reales (datos personales inventados), reglas, entrada completa contra la base local (404, CORS, guardar todo, reglas, no duplicar, primer origen, teléfono, rechazo sin email ni teléfono, entrada desactivada), estrellas y devoluciones. Comprobado que detectan fallos (al romper «primer origen» a propósito, el test falla).
- En el navegador, en «Proyecto Prueba»: crear entrada y regla, enviar los 2 ejemplos (200) y uno sin email (422 con motivo), ficha del lead, «Llamar luego» con estrellas, bloqueo sin estrellas, agendar con 3★, cerrar con venta y 5★, devolución de 300. Datos comprobados en la base. Móvil a 375 px sin desbordes.

**Lo que no está probado / queda**
- ⚠ Con una landing real no se puede probar en local (la landing no llega a localhost): al publicar.
- ~~⚠ Las métricas (Funnel, Ventas) todavía no restan las devoluciones ni enseñan estrellas o UTM~~: hecho en V2-1, arreglo 5 (Funnel) y H1 (Ventas).
- Detalle menor: tras crear una entrada, el formulario se queda con el nombre escrito (se podría crear dos veces sin querer).

**Respuestas de Cristian (9 oct 2026)**
1. ✅ **Fallo de la v1 arreglado:** al cerrar una cita, la venta es del closer de esa cita aunque la cierre el director o el CEO. Desde la ficha (sin cita), el jefe sigue eligiendo el vendedor. 2 tests nuevos; comprobado que el test falla sin el arreglo. **Ojo:** la venta de prueba del «Proyecto Prueba» se hizo antes del arreglo y sigue a nombre del CEO.
2. Datos de prueba del «Proyecto Prueba»: **se mantienen por ahora.**
3. ✅ Guardado en git: `fix: no enviar el secreto del webhook al navegador` y `feat: v2-0 entradas de landings, estrellas y devoluciones`.

### 6.17 Bloques V2-1 a V2-12 (hechos, 9 oct 2026)

**V2-1 ✅ Agendas · Métricas.** Agendas tiene 3 pestañas (Métricas · Llamadas · Análisis). Métricas: embudo, cash (neto de devoluciones) y facturación, % cierre y call/close, ticket medio, calificados 4★+, media de estrellas (closer y caller), pendientes, devoluciones, agendas por pipeline y por UTM, panel de % cierre; Individual / Comparativa (solo director y CEO); filtros de closer, producto y evento; Día / Semana / Mes / Año / Personalizado con ‹ ›; «Generar reporte» descarga un PDF real (librería `pdf-lib`). Abajo, «¿Cómo se calcula cada número?».
- Decisión: en Agendas solo cuentan las ventas de los closers (las del low ticket de los callers van en Ventas y Finanzas).
- Pruebas: 9 tests nuevos (periodos, métricas calculadas a mano, PDF con acentos y €); PDF abierto y revisado como imagen; 8 variantes de la página probadas en el navegador.
- `npm audit`: 0 fallos en lo que va a producción; 9 avisos en herramientas de desarrollo (vitest/eslint), ya estaban → revisar en V2-12.

**V2-2 ✅ Agendas · Llamadas.** Pestañas 01 Agendas (calendario Mes / Semana / Día / Lista, filtros por estado, punto de color por estado con su leyenda), 02 Pre-call (métricas de la semana con ‹ › *(quitadas el 10 oct, H6)*, tablero Pendiente / Confirmación pendiente / Confirmado / No califica o tabla; tarjeta con Registrar, Mover a y Chat; orden por fecha o por «agendada el») y 03 Post-call (Pendientes, Reagendadas, Reserva, Cuotas, En seguimiento, No-show, Canceladas, Perdidas; en Reserva y Cuotas, «Cobro»). Arriba: buscador, filtro de closer y de UTM, **Crear llamada** (buscar lead), **Importar** CSV (solo jefes) y **Exportar** CSV (abre en Excel; protegido contra fórmulas). Contadores de pendientes, cerradas y perdidas.
- Estado nuevo «confirmación pendiente». Las citas de GHL repetidas se actualizan y ya no se duplican (resuelve el pendiente 2 del Paso 0).
- Decisión: al agendar, las estrellas solo son obligatorias para el caller (si agenda un jefe o un closer, son opcionales).
- Pruebas: 11 tests nuevos (reparto en pestañas, calendario, búsqueda sin acentos y por teléfono, importar CSV con errores explicados, permisos, GHL sin duplicar) · en el navegador: calendario, Crear llamada, tablero de pre-call y Mover a, 8 sub-pestañas de post-call, 4 vistas y el CSV. 143 tests.
- Corregido al probar: el título del mes salía «Octubre De 2026» y «1 Llamadas».

**V2-3 ✅ Calendario de GHL por closer.** Administración → Integraciones: token privado (solo se escribe; nunca vuelve al navegador) + id de la subcuenta, «Probar conexión» y el calendario (o usuario) de GHL de cada closer. Agendas → Llamadas: «Sincronizar GHL» y sincronización automática al abrir si han pasado más de 10 minutos. Trae las citas de hace 30 días a dentro de 60; une cada cita con su lead (por el contacto de GHL; si no existe, lo crea con el email o teléfono del contacto); no duplica; actualiza hora y estado (confirmada, cancelada, no-show) **sin pisar lo que ya registró el closer**. Las que no se pueden unir quedan en «Hay N sin unir a un lead → Revisar» (unir a un lead o descartar) y las inválidas en «Ver inválidas».
- Pruebas: 6 tests con GHL simulado en su formato oficial (unir, crear lead, sin unir, inválida, cancelada, no duplicar, no pisar, token rechazado, cabeceras y parámetros exactos, permisos). Token falso guardado y buscado en 7 páginas: no aparece en ninguna. 149 tests.
- Pendiente: probar con el token real de Cristian (acordado para el final).

**V2-4 ✅ Equipo y comisiones.** Menú nuevo «Empresa» (Equipo, Programas, Finanzas, Clientes), que por defecto **solo ve el CEO** (los permisos para abrirlo a otros roles llegan en V2-8; la tabla ya existe). Equipo: organigrama por áreas (con líder, puesto, rol, «sin acceso» y comisión propia), «Ver inactivos», editor de áreas (nombre y color), **comisión de cada rol** (% por venta; caller además % por agenda cerrada, 3 % por defecto) y **alta en 6 pasos** con vista previa (persona, uno o varios a la vez · puesto o puesto nuevo · comisión de su rol o propia, igual o distinta por producto, con anillo y ejemplo · acceso: crear ahora o solo organigrama · rol · revisión con «Editar» y «líder»). Ficha de cada persona: área, puesto, líder, activo, comisión y «Darle acceso a la app».
- Orden de la comisión: persona-producto → persona → producto (V2-5) → rol; un 0 usa el siguiente.
- Decisiones: 4 áreas iniciales (Dirección, Ventas, Operaciones, Producto), editables · el grupo antiguo del menú «Equipo» (Links y Reportes) pasa a llamarse «Día a día» · los organigramas en tarjetas por área en vez del círculo de la captura (se lee mejor).
- Pruebas: 9 tests (orden de comisiones, preparar equipo sin duplicar, permisos por defecto, alta sin cuenta / varios / con cuenta que entra de verdad, dar acceso después, comisión de rol y de persona, áreas). Alta completa hecha en el navegador. Corregido al probar: el aviso «Pon el nombre» salía antes de escribir nada y el editor de comisiones se descolocaba.

**Regla de Cristian (9 oct 2026):** todos los errores y fallos que se encuentren se apuntan aquí y se arreglan al final (V2-12), sin parar el bloque.

**Lista de fallos para arreglar al final (V2-12):**
1. ✅ **Arreglado en V2-12.** (V2-5, viene de la v1) Los campos de dinero leen «4.600» (punto de miles en español) como 4,6. Afecta a ventas, cobros, devoluciones, precios y porcentajes. Propuesta: entender «4.600» y «1.997,50» como en España (y seguir aceptando «4600» y «1997.5»). **También pasa al importar el CSV del banco en Finanzas** («1.000» entra como 1).
2. ✅ **Arreglado en V2-12.** (V2-6) Accesibilidad: en las ventanas (nuevo gasto, cuentas…) y en la v1, el texto de cada campo no está unido a su campo (`label` sin `htmlFor`); un lector de pantalla no sabe qué es cada casilla.
3. ✅ **Arreglado en V2-12** (Cristian eligió las últimas 9 cifras). (V2-0, sale en V2-7) Al reconocer a alguien por teléfono, «+34 600 111 222» y «600 111 222» cuentan como personas distintas (se comparan todas las cifras). Propuesta: comparar las últimas 9 cifras.
4. ✅ **Arreglado en V2-12.** (Limpieza) La exportación de llamadas tiene su propia copia de la protección de CSV; usar la nueva `src/lib/csv-excel.ts`.
5. ✅ **Arreglado (9 oct 2026, Cristian: «toda la app»).** (v1) Los porcentajes salían con punto y pegados («66.7%»). Ahora en toda la app, el PDF y el aviso de los reportes salen como en España: «66,7 %» (función `pct` en `formato.ts`, 46 sitios cambiados). Tests nuevos de `pct` y comprobación del PDF; 248 tests. Comprobado en el navegador: el Funnel enseña «66,7 %» y cabe en el anillo. Commit `68378a8` y `next build` correcto.

**Regla de Cristian (9 oct 2026, 2):** los fallos del bloque que se está construyendo se arreglan en el momento; los de partes ya hechas o de la v1 se apuntan aquí.
**✅ Limpieza hecha en V2-12 (Cristian: «sí, bórralo»):** la acción antigua `guardarProducto` y el formulario `FormProducto` de Administración ya no se usan en pantalla (los productos se editan en Programas); solo los usan los tests de permisos de la v1.

**V2-5 ✅ Programas.** Empresa → Programas: resumen (nº de programas, activos/inactivos, precio medio), buscador, Todos/Activos/Inactivos, tarjetas (agrupadas por categoría) o lista, interruptor de activo, clientes por programa. «Nuevo programa» / «Gestionar programa»: Datos básicos (nombre, descripción, categoría, color, activo, lo vende el caller, back-end offer), Precios (una vez o en cuotas y cuántas, precio o personalizado, precio en la otra moneda, link de pago) y Comisiones por rol para ese programa (vacío = la del rol), con «Falta completar». La pestaña antigua «Productos» de Administración enlaza aquí. Al vender un programa en cuotas, el formulario de venta ya sale en «Cuotas» con su número.
- Pruebas: 4 tests (permiso por sección, guardar todo, validaciones —incluido un link «javascript:» rechazado—, precio personalizado y activar). Pantalla revisada.

**V2-6 ✅ Finanzas.** Empresa → Finanzas, 8 pestañas:
- **Resumen** (con periodo y ‹ ›): facturación, cash collected (neto de devoluciones), profit (caja) y ROAS frente al periodo anterior (si el anterior está a 0 no se enseña un «+100 %» engañoso) · cuentas por cobrar, gastos que cuentan en profit/ROAS, ingresos extra · «de dónde viene el cash» (venta nueva, cuotas y restos, back-end) · mapa de cobros por día (más oscuro = más cobrado) · últimos 6 meses en 4 gráficos pequeños (facturación, cash, gastos, profit) · «Guía financiera» · si hay cambio puesto, el equivalente en la otra moneda (≈ $).
- **Ventas:** Transacciones (buscar, Completo/Reserva/Cuotas, «Exportar Excel», botones Cobro y Devolución) y Pagos pendientes (total por cobrar, por vencer, vencidos, no paga · Pendientes/Completados/No paga/Resumen por mes · Cuotas/Reservas/Deudores · «Nuevo deudor» · cambiar fecha · «No paga»). Al vender en reserva o cuotas se crean solos los plazos (reserva: el resto a 30 días; cuotas: una al mes, la última ajusta los céntimos); los cobros tapan los plazos por orden de fecha. Lo que ya estaba vendido con dinero pendiente pasó a tener su plazo.
- **Liquidaciones:** mes con ‹ ›, Pendientes/Pagados/Todos, «Calcular comisiones a todos», por persona: sobre facturado y **sobre cobrado (lo que se paga)**, detalle venta a venta; el caller cobra su % de agenda cuando el closer cierra su cita. «Pagada» (eligiendo cuenta) crea el gasto en «Comisiones»; «Desmarcar» lo quita. Recalcular no toca las pagadas.
- **Ingresos extra** y **Egresos** (Registrados con su reparto por categoría · Programados con «Registrar pago», que apunta el gasto y pasa la fecha al siguiente). Categorías editables y casilla «cuenta en profit/ROAS».
- **Cuentas:** saldo, entró y salió del periodo, «Transferir», «Nueva cuenta» con los métodos de cobro que recibe (un método solo va a una cuenta; lo demás va a la cuenta por defecto «Todo»).
- **Movimientos:** listado, Todos/Sin conciliar/Conciliados, «Importar CSV» del banco (negativo = gasto; las filas malas se explican) y «Conciliar» (darle categoría).
- **Divisas:** 1 USD = … EUR, a mano.
- Decisiones de Claude (se pueden cambiar): un gasto sin categoría cuenta en el profit (para no esconder gastos) · en «Pagos pendientes», un deudor puesto a mano que paga entra como ingreso extra · el cash por día y por mes se cuenta en la zona horaria del proyecto.
- Arreglado al probar (fallo del propio bloque): la cuenta «Todo» se creó dos veces al abrir dos páginas a la vez → migración que deja una y no deja repetirla (test que falla sin el arreglo). También: texto engañoso en Liquidaciones vacías, «1 movimientos», «Por defecto» en vez del nombre de la cuenta.
- Pruebas: 8 tests de integración (permiso, plazos al vender en cuotas, validaciones y datos de otro proyecto, cuentas y transferencias, CSV del banco y conciliar, deudor, liquidaciones de closer y caller con pagar/recalcular/desmarcar, preparar 4 veces a la vez); comprobado que el de liquidaciones falla si se rompe la comisión del caller. **177 tests.** En el navegador (Proyecto Prueba): las 8 pestañas, nuevo gasto (150,50 € → profit 549,50 y ROAS 4,65, hechos a mano), tipo de cambio 0,92 (1000 € ≈ $1,087), calcular comisiones, CSV exportado (abre con acentos y comas). Móvil a 375 px sin desbordes en 5 pestañas.
- **No probado en pantalla** (sí en tests): importar CSV del banco, transferir, gastos programados y pagar una liquidación. Datos de prueba nuevos en Proyecto Prueba: un gasto «Anuncios prueba» de 150,50 € y el cambio 0,92.

**V2-7 ✅ Clientes.** Empresa → Clientes, como la captura: arriba Seguimiento · Finanzas · Casos de éxito · Onboardings · Nuevo cliente; total de clientes y volumen total (lo vendido a clientes); Activos / Pausados / Abandonados / Todos con su número; buscador (nombre, email o teléfono); Tabla o Tarjetas. **Solo sale quien ha comprado** (aparece solo al registrar una venta).
- Cada cliente: programa, cliente desde, comprado, lo que falta, % de onboarding, próximo contacto y estado; «Gestionar» abre su ficha: estado (a mano), Seguimiento (nota + próximo contacto, con sus notas anteriores), Onboarding (marcar pasos) y Caso de éxito (resultado, enlace https al testimonio y fecha).
- Seguimiento: columnas Vencidos / Hoy / Próximos / Sin fecha (los abandonados no salen) con «Apuntar». Finanzas: comprado, pagado, devuelto, falta y próximo plazo (sale de Ventas y Finanzas, enlace a Pagos pendientes). Casos de éxito: tarjetas con «Ver testimonio». Onboardings: tabla con un ✓ por paso, primero los más atrasados, y «Pasos del onboarding» para editarlos (3 de ejemplo al empezar: Bienvenida enviada, Acceso dado, Llamada de inicio hecha).
- «Nuevo cliente» en 2 pasos: datos (nombre, apellido, email o teléfono) → qué compró (el mismo formulario de venta). Si ya existe con ese email o teléfono, la venta se le suma; si la venta tiene un error, no queda ningún lead a medias.
- Decisiones de Claude (se pueden cambiar): el volumen total es la facturación de todas sus compras · cada nota de seguimiento también queda en el historial del lead.
- Pruebas: 6 tests (permiso, solo compradores, seguimiento, onboarding, caso de éxito con enlace «javascript:» rechazado, nuevo cliente con plazo, sin duplicar por email ni por teléfono y sin lead suelto si falla); comprobado que 2 fallan si se quitan esas protecciones. **183 tests.** En el navegador (Proyecto Prueba): lista, tarjetas, las 4 vistas, apuntar un seguimiento (sale en «Hoy») y crear un cliente nuevo con su venta. Móvil 375 px sin desbordes.
- No probado en pantalla (sí en tests): marcar un paso de onboarding y guardar un caso de éxito. Datos de prueba nuevos en Proyecto Prueba: «Cliente Prueba» (cliente.prueba@ejemplo.test) con una venta de 1000 € y una nota de seguimiento en Ana.

**V2-8 ✅ Permisos por sección.** Administración → Permisos (pestaña que solo ve el CEO): tabla con Equipo, Programas, Finanzas y Clientes × Directores, Closers y Callers, con un interruptor en cada casilla («Siempre» para el CEO). Al abrir una sección a un rol, la ven todas las personas de ese rol en el proyecto (menú «Empresa» y la página); al cerrarla, dejan de poder entrar y de usar sus botones. Aviso: Finanzas enseña todo el dinero; Equipo deja dar de alta y cambiar comisiones (aunque nadie que no sea el CEO puede crear otro CEO).
- Pruebas: 3 tests (solo el CEO —ni un director con Administración—, roles y secciones válidos, abrir a directores = entran los dos directores y no los closers, cerrar quita el acceso, el CEO siempre todo). **186 tests.** En el navegador: abrir y cerrar «Finanzas para directores» (queda guardado; se dejó cerrado otra vez).
- No probado: entrar como director para ver el menú con la sección abierta (lo cubre el test de la función que arma el menú).

**V2-9 ✅ Fathom por API.** Agendas → Llamadas → **04 Grabaciones**: Lista / Calendario · Todas / Pendientes / Conciliadas (con su número) · periodo con ‹ › · **Cuentas** · **Sincronizar Fathom**.
- API comprobada en la documentación oficial (developers.fathom.ai, «List meetings», 9 oct 2026): `GET https://api.fathom.ai/external/v1/meetings`, cabecera `X-Api-Key`, `created_after`, `include_summary`, `include_transcript`, paginación con `next_cursor`.
- Cuentas: cada closer añade la suya (un jefe puede añadirla para cualquier closer): nombre, API key (solo se escribe; nunca vuelve al navegador) y formato de título (`{nombre cliente}: Sesión…`; «…» vale cualquier cosa). Botón «Probar», editar y quitar (las grabaciones ya traídas se quedan).
- Sincronizar: trae las grabaciones desde la última vez − 1 día (la primera vez, 60 días), con resumen y transcripción (para la IA de V2-10). No duplica y **no pisa lo hecho a mano**.
- Conciliar sola, solo con citas del mismo closer y si hay **una única** que encaja: 1) email del invitado = email del lead, 2) nombre sacado del título, 3) hora ±30 min. Si hay dudas, queda «Pendiente» con el motivo («2 citas posibles ese día»). A mano: elegir la cita (las de ±3 días, de la más cercana a la más lejana), «Unir», «Desunir», «Descartar» y «Recuperar». Una cita no puede tener dos grabaciones.
- Decisión de Claude (se puede cambiar): la sincronización de Fathom es con el botón (no automática al abrir, como la de GHL), para no gastar las peticiones de Fathom.
- Pruebas: 6 tests unitarios (sacar el nombre del título, los 3 criterios, no elegir si hay 2) y 5 de integración con Fathom simulado en su formato oficial (cuentas y permisos, 2 páginas, cabecera y parámetros exactos, conciliar por email y por título, dejar pendiente, no duplicar ni pisar lo descartado a mano, conciliar a mano con sus reglas, clave rechazada explicada). Comprobado que fallan si se rompe la paginación. En el navegador: añadir cuenta y «Probar» contra la Fathom **real** con una clave inventada → «Fathom no acepta la API key…» (la dirección y la cabecera llegan bien); la clave no aparece en el HTML de la página.
- **Pendiente:** probar con la clave real de un closer (acordado para el final). Queda en Proyecto Prueba la cuenta «Fathom prueba» con la clave inventada (no la borro sin permiso).

**Respuestas de Cristian (9 oct 2026, al empezar V2-10):** modelo **Claude Sonnet 5.5** · la clave de Claude va **en el servidor** (`ANTHROPIC_API_KEY`, en Vercel al publicar) · cada llamada se analiza **sola al conciliar** su grabación (y botón «Re-analizar»).

**V2-10 ✅ IA.**
- **Agendas → Análisis:** Resumen (llamadas analizadas, puntuación media, la más alta, tasa de cierre, últimas analizadas) · Llamadas (buscar, periodo, closer, Cerrados / No cerrados / Seguimiento) · Manual (solo jefes: nota de 1 a 10 y comentario; Sin evaluar / Evaluadas). Ficha de cada llamada: puntuación, resultado, resumen, una tarjeta por agente, enlace a Fathom y a la ficha del lead, «Re-analizar». Arriba (jefes): «Configurar IA» y «Analizar pendientes». Si falta la clave, aviso en amarillo y las llamadas esperan en cola.
- **Configurar IA en 4 pasos:** alcance (general o un programa; el del programa manda) · contexto del negocio · 12 agentes (objeciones, estructura, psicología, cualificación, miedos y creencias, coaching, timeline emocional, frustraciones, deseos, aspiraciones, perfil, autocompletado del cierre), cada uno activo o no y «Predeterminado» o «Personalizar» · revisión. Solo director y CEO.
- **Llamadas → 05 Revisión IA:** autocompletado (la IA propone estado, estrellas y nota; «Confirmar» lo aplica a la cita; si propone «Cerrada», lleva a la ficha para registrar la venta) · agendas sin lead · conciliaciones dudosas (enlace a Grabaciones).
- **Llamadas → 06 Cualificación** (solo jefes): Estudio por pregunta y respuesta (leads, llamadas, cerradas, % cierre, cash y **cash por llamada** con barra), elegir preguntas, «Exportar CSV» · Scoring IA: Claude ve **solo la tabla del estudio** (sin nombres ni contactos) y da de −10 a +10 puntos a cada respuesta; cada lead tiene una nota de 0 a 100 y salen los 25 mejores que aún no han comprado.
- Cómo se llama a Claude (guía oficial `claude-api` leída): SDK oficial `@anthropic-ai/sdk` 0.133, `claude-sonnet-5-5`, esfuerzo medio, respuesta en JSON con formato fijo (y revisada antes de guardar: nota 0-100, estados inventados fuera) y **`fallbacks: "default"`** (recomendado por Anthropic: si un filtro de seguridad rechaza la llamada, el servidor la reintenta en otro modelo; con Sonnet 5.5 solo cubre algunos motivos). Si Claude se niega o falla, el análisis queda «Error» con el motivo en español y se puede reintentar. El análisis va después de responder (`after`), así la pantalla no espera.
- Coste aproximado (precios oficiales de Sonnet 5.5, 2 $ / 10 $ por millón de tokens): unos 0,05-0,08 $ por llamada de 1 hora. **No medido con llamadas reales.**
- Arreglado al construir (fallos del propio bloque): una función de datos estaba en un archivo de acciones (se habría podido llamar desde el navegador sin comprobar la sesión) → movida a un archivo solo de servidor · los `**` salían en bruto en la lista · un «Cerrada» confirmado se quedaba pendiente para siempre.
- Pruebas: 5 tests unitarios (formato según agentes activos, prompt con contexto e instrucciones, revisión de lo que devuelve Claude, estudio y nota de lead) y 7 de integración con un **Claude falso** (nunca se llama al de verdad en los tests): configuración solo jefes y sin duplicar, petición exacta (modelo, fallbacks, cabecera beta, formato, contexto, agente apagado fuera, transcripción), guardar, negativa de Claude → «Error», autocompletado (otro closer no; confirmar aplica estado y estrellas; «Cerrada» no cierra sola), evaluación manual, scoring sin datos personales y sin respuestas inventadas. Comprobado que fallan si se quita el filtro de respuestas inventadas. **209 tests.** En el navegador (Proyecto Prueba): Análisis vacío con el aviso de la clave, Configurar IA de punta a punta (guardado comprobado en la base), Revisión IA, Cualificación con los datos de prueba (700 € = 1000 − 300 devueltos), y la ficha de un análisis **de prueba metido a mano** (marcado «PRUEBA», sin Claude). Móvil 375 px sin desbordes.
- **No probado:** ninguna llamada real a Claude (falta la clave; acordado para el final), ni con una transcripción real de Fathom. Datos de prueba nuevos en Proyecto Prueba: la configuración de IA general («Contexto de prueba…») y la grabación + análisis «PRUEBA».

**Respuestas de Cristian (9 oct 2026, al llegar a V2-11):**
- Los callers llaman **desde GHL**; quiere que eso llegue al dashboard. Comprobado en la especificación oficial de GHL (github GoHighLevel/highlevel-api-docs, `apps/conversations.json`): se pueden **listar las llamadas** (`GET /conversations/messages/export?channel=Call`), **descargar la grabación** (`GET /conversations/messages/{id}/locations/{locationId}/recording`, audio WAV) y **pedir la transcripción de GHL** (`GET /conversations/locations/{locationId}/messages/{id}/transcription`); permiso `conversations/message.readonly`, Version `2021-04-15`. ⚠ La API **no deja lanzar llamadas** desde la app (enviar mensaje no admite llamadas; «outbound call» solo apunta una llamada hecha fuera).
- Grabación/transcripción: **traerlas de GHL**; si GHL no tiene la transcripción, se pasa a texto con **Deepgram** (comprobado en su documentación oficial: `POST https://api.deepgram.com/v1/listen?model=nova-3&language=es`, `Authorization: Token …`, audio en binario `audio/wav`; nova-3 admite español). Clave `DEEPGRAM_API_KEY` en el servidor, como la de Claude.
- Se traen **todas las llamadas contestadas** de la subcuenta (no solo las de los callers), de más de 1 minuto.
- Coach de IA: **versión sencilla** (el caller o closer escribe lo que dice el lead y Claude responde cómo manejarlo; sin audio).
- Priorización con IA: la cola del caller se ordena por el **Scoring IA** si está calculado; si no, la A/B/C de siempre.
- Reparto por horarios: **turnos por caller** (días y horas); un lead nuevo va por turno rotativo a quien esté en su horario; si no hay nadie, al rotativo de siempre.

**V2-11 ✅ Resto de la antigua v2.**
- **Llamadas de GHL** (menú Ventas → «Llamadas de GHL»; el caller ve «Mis llamadas grabadas»): «Traer llamadas de GHL» trae **todas las llamadas contestadas de más de 1 minuto** de la subcuenta (desde la última vez − 1 día; la primera vez, 14 días), sin duplicar, unidas a su lead (por el contacto de GHL) y a quien llamó (por su usuario de GHL). En segundo plano: transcripción de GHL si la tiene; si no, grabación + **Deepgram** (nova-3, español); si no hay grabación, «Sin audio». Después Claude la analiza: nota 0-100, interés del lead (estrellas del caller), resumen, objeciones, puntos de mejora y siguiente paso. Ficha de cada llamada con la transcripción. «Reintentar» si falla. Filtro por persona y «Sin asignar», periodo. Aviso si faltan las claves.
- **Integraciones:** nueva sección «Llamadas de GHL: quién es quién» (usuario de GHL de cada caller y director) y el permiso nuevo del token (`conversations/message.readonly`) explicado.
- **Coach de IA (versión sencilla):** botón «Coach IA» en los botones del lead (caller, ficha) y en las citas del closer. Se escribe lo que dice el lead y Claude responde: qué hay detrás, 2-3 frases para decir y una pregunta para seguir. Usa el contexto de «Configurar IA» y las respuestas del formulario del lead (nunca su email ni teléfono). No guarda nada. Esfuerzo bajo para que tarde poco.
- **Priorización con IA:** si hay Scoring IA, la cola del caller («Por llamar») y su CRM ordenan por la nota 0-100 del scoring (50 si sus respuestas no salen en el scoring) y se ve «· IA» junto a la prioridad; si no hay scoring, la A/B/C de siempre.
- **Reparto por horarios:** nuevo modo «Por horarios» en Administración → Proyecto y reparto, y el horario de cada caller (días L-D y de qué hora a qué hora, en la hora del proyecto). Un lead nuevo va por turno rotativo a los callers en su horario; si no hay nadie, entre todos. Un turno que pasa de medianoche cuenta para el día en que empieza.
- Arreglado al construir (fallos del propio bloque): los errores de Claude salían como «Algo ha fallado» en el coach y el scoring (ahora dicen el motivo, p. ej. «Falta la clave de Claude») · el texto de permisos del token no decía el nuevo permiso · un caso del test de medianoche lo escribí al revés.
- Pruebas: 7 tests unitarios (horarios con zona horaria y medianoche, cola con scoring, qué llamadas cuentan, transcripción de GHL en sus dos formas, Deepgram: dirección, cabeceras y frases) y 6 de integración con GHL, Deepgram y Claude **simulados** con su formato oficial (usuario de GHL solo jefes; traer solo las útiles, unir lead y caller, no duplicar, parar en la fecha; transcripción por GHL y por Deepgram; sin clave de Deepgram = error explicado; sin grabación = «sin audio»; a Claude no le llegan email ni teléfono; reparto por horarios con lunes y noche; coach con permisos, sin datos personales y con el mensaje claro sin clave). Comprobado que fallan si se rompe el filtro de turnos. **222 tests.** En el navegador: «Llamadas de GHL» (vacía, con el aviso de claves), «Por horarios» en Administración, la sección de Integraciones y el coach (con el error explicado). Móvil 375 px sin desbordes.
- **No probado:** nada contra GHL ni Deepgram reales (faltan el token con el permiso nuevo y la clave de Deepgram; acordado para el final). En Proyecto Prueba no hay callers, así que el editor de horarios y el de usuarios de GHL solo se han visto vacíos (sí probados en los tests). ⚠ Por la forma de la respuesta de la transcripción de GHL, la especificación describe una frase, no la lista; la app acepta las dos formas, pero hay que confirmarlo con una llamada real.
- **Límite:** la API de GHL **no deja lanzar llamadas** desde la app; se sigue llamando desde GHL.

**V2-12 ✅ Tests, seguridad, móvil, guías y revisión.**
- **Lista de fallos del final, arreglada:** 1) importes como en España en todos los campos de dinero y porcentajes y en el CSV del banco («4.600» = 4600, «1.997,50» = 1997,5; siguen valiendo «4600» y «1997.5»), con 19 casos de prueba y una venta de «4.600» guardada de verdad · 2) accesibilidad: las 108 etiquetas de los formularios unidas a su campo (comprobado en el navegador que cada campo tiene nombre y que el diseño no cambia) · 3) teléfonos: con 9 cifras o más se comparan las últimas 9 («+34 600 111 222» = «600 111 222») · 4) la exportación de llamadas usa la protección de CSV común (comprobado el BOM y el formato) · limpieza del formulario antiguo de productos (sus 2 tests ahora comprueban lo mismo con Programas).
- **Seguridad:** todas las acciones del servidor comprueban sesión y permiso (revisado con un script; las 3 sin comprobación son cambiar el tema, entrar y salir) · ninguna clave (GHL, Fathom, Claude, Deepgram) llega al navegador: buscada la clave de Fathom de prueba en 15 páginas, en ninguna · las 37 tablas con RLS · los enlaces que vienen de Fathom solo se guardan si son https · lo que devuelve la IA solo se enseña como texto y nunca cambia una cita sin que alguien lo confirme · a Claude no le llegan emails ni teléfonos (con test).
- **Roles revisados en el navegador:** caller (menú sin Empresa ni Agendas; las 7 páginas de jefes le mandan fuera sin enseñar datos; exportaciones 403) y closer (sin Configurar IA, Manual ni Cualificación, ni a mano; ve su propio análisis). Corregido: en el menú del closer «Mis llamadas grabadas» salía antes que «Mis agendas».
- **Dependencias:** vitest 3 → 4.1.11 (quita los 2 avisos críticos y el moderado; los 242 tests pasan). Quedan 5 avisos «altos» de `braces` dentro del eslint de Next: el arreglo que propone npm es bajar eslint-config-next a la 14 (no vale con Next 16); solo afecta a la herramienta de revisar código, no a la app. Producción: 0.
- **Vercel:** según su documentación, con «fluid compute» una función dura como mucho 300 s en el plan gratuito → el análisis y las transcripciones van de 4 en 4 (lo que quede, en la siguiente vuelta).
- **Guías actualizadas:** `GUIA-PUBLICAR.md` (claves nuevas, Fathom de cada closer, Configurar IA, comprobaciones, límites y problemas típicos) y `GUIA-GHL.md` (Parte 3: landings directas; Parte 4: token con sus 3 permisos, calendario de cada closer y llamadas). `.env.example` con las 2 claves nuevas.
- Móvil: cada pantalla nueva comprobada a 375 px sin desbordes (en cada bloque).
- **Resultado final:** 242 de 242 tests (30 archivos), tsc y eslint limpios.
- **Después (Cristian lo pidió):** commit `0334e4c` (sin claves: `.env.local` y `scripts/salida` fuera) y `next build` correcto (30 rutas, TypeScript sin errores); el servidor del otro chat siguió funcionando.
- **No probado:** nada contra GHL, Fathom, Claude ni Deepgram reales (faltan las claves); el arrastre con ratón en el CRM de callers sigue pendiente de que lo pruebe Cristian.
- **Para Cristian:** revisar la v2 entera · ~~decir si se guarda en git (110 archivos sin commit)~~ (guardado el 9 oct, `0334e4c`) · decir si se borran los datos de prueba de «Proyecto Prueba» (lista abajo; por ahora **se mantienen**, decisión del 9 oct) · preparar las claves para probar al final.
- **Datos de prueba que quedan en Proyecto Prueba** (no se borra nada sin permiso): gasto «Anuncios prueba» 150,50 € · tipo de cambio 0,92 · cliente «Cliente Prueba» con venta de 1000 € · nota de seguimiento en Ana · cuenta de Fathom «Fathom prueba» (clave inventada) · configuración de IA general («Contexto de prueba…») · grabación + análisis «PRUEBA» · cuenta «Todo» y categorías de Finanzas, 3 pasos de onboarding de ejemplo.

**Versión compilada probada (9 oct 2026, Cristian lo pidió):** `next start` en http://localhost:3200 (configuración «eternity-produccion» en `.claude/launch.json` de GENERAL). Arranca en 162 ms. 31 pantallas cargan (200) con su contenido, el estilo se aplica, PDF del reporte (`%PDF`) y CSV de Finanzas bien, navegación del periodo y acciones del servidor (coach) funcionan, cabeceras de producción puestas (CSP sin `unsafe-eval`, HSTS, `X-Frame-Options: DENY`), móvil 375 px sin desbordes, salir y volver a entrar funciona. Consola sin errores salvo al cerrar sesión: 4 `ERR_SSL_PROTOCOL_ERROR` porque la regla `upgrade-insecure-requests` de producción hace que el navegador pida `https://localhost:3200/login` (el servidor manda `/login`, comprobado con curl); solo pasa en local sin https, no en Vercel.


**Versión compilada probada otra vez tras el arreglo de porcentajes (9 oct 2026, commit `68378a8`):** 31 pantallas cargan con su contenido; 0 porcentajes pegados; el Funnel enseña «66,7 %»; PDF y CSV bien; cambiar de periodo y el coach funcionan; cabeceras de producción puestas; móvil 375 px sin desbordes en 4 pantallas. Sin errores nuevos en la consola (los 4 `ERR_SSL_PROTOCOL_ERROR` que quedaban eran de la prueba anterior, misma marca de tiempo).
