# Plan · Dashboard de ventas (app Eternity)

> Al día: 12 oct 2026 (GHL conectado, leads limpiados, «Orgánico → Agendados» publicado y plan repasado entero). Lo ya hecho, con todo su detalle (pruebas, cifras, respuestas de cada ronda), está en `plan-historial-10oct.md` y `plan-historial-11oct.md`; la auditoría, en `Arreglar-dashboard.md`. Este plan tiene dónde estamos, lo que falta, las decisiones vigentes y los riesgos.

---

## 1. Dónde estamos

- **LA APP ESTÁ PUBLICADA (11 oct): https://dashboard-de-ventas-iota.vercel.app** y Cristian ya ha entrado como CEO.
- **Lo que hay en la nube:**
  - **GitHub:** repositorio privado `eternitydevzz/Dashboard-de-ventas` (rama `main`).
  - **Supabase:** proyecto «eternity» (ref `crbwqaxpeexeonffuiyo`, East US, plan gratis), con los 30 cambios de base de datos, el registro libre cerrado y «Confirm email» activado (los usuarios se crean ya confirmados).
  - **Vercel:** proyecto `dashboard-de-ventas` en la cuenta gratis (Hobby) `cristianortizmaestria-9940`, unida al GitHub `eternitydevzz`. 6 variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `APP_URL` (Config); `SUPABASE_SECRET_KEY`, `CLAVE_CIFRADO` y `RESEND_API_KEY` (Secret). Cada cambio que se sube a `main` se publica solo.
  - **Maestria preparada:** 4 pipelines de origen (Webinar 1, Biblioteca Recursos, Orgánico, DFY AI Services), «Callers» (7 columnas, con «Link enviado») y «Closers» (13), y 4 productos (Membresía 47 $, Grupal 1.997 $, VIP 4.997 $, DFY a medida).
  - **Equipo creado:** 12 personas: CEO «Cris y José» (`info@eternity.llc`), Juan y Junior directores con Administración, 5 callers (Felipe, Miguel, Hanna, Lucas, Tomás) y **4 closers** (Andrés, Renzo y, desde el 12 oct, **Cristian Ortiz** `cristianortiz@astraire.com` y **José Gómez** `jose@eternity.llc`, los founders, que atienden el calendario «#1 Maestria founders»), + 2 perfiles de prueba (closer-test y caller-test). **Nadie del equipo ha entrado todavía** (onboarding sin hacer: los accesos no se han mandado). Contraseñas solo en 4 archivos `scripts/salida/usuarios-creados-…csv` (fuera de GitHub): `2026-10-11-13-38` (equipo y CEO), `2026-10-11-13-46` (perfiles de prueba, las que valen), `2026-10-12-02-36` (Cristian y José closers) y `2026-10-10-22-30` (los mismos perfiles de prueba, del 10 oct; sin comprobar si aún valen).
  - **Datos reales en Maestria (12 oct):** **1.178 leads** (Biblioteca Recursos 1.165 · Webinar 1 8 · Orgánico 5; contado en la base el 12 oct), **todos sin caller** (reparto automático apagado y al 0 %), y **15 citas reales** (de la sincronización con GHL); los 15 leads con cita, en «Orgánico → Agendados» (12 oct).
  - **GHL conectado** (4.3 y `GUIA-GHL.md` → «Cómo está montado en Maestria»): leads de la Biblioteca al momento, citas de los 3 calendarios al momento, y token para sincronizar citas (y, más adelante, llamadas).
- **Comprobado en la nube:** el login carga (200) y Cristian entra; las cabeceras de seguridad están (CSP, HSTS, X-Frame-Options…); los leads de la Biblioteca y las citas de GHL llegan solos; la subida de CSV (1.094 leads) y la pestaña Biblioteca de KPIs; los emails (Resend). **Sin comprobar todavía:** velocidad con 1.178 leads, subir un PDF, límite de intentos de login, la consola del navegador y la región de Vercel (4.2).
- **En local:** 451 tests (447 pasan y 4 de velocidad que solo se lanzan a mano) + 2 de «Orgánico → Agendados» (4.3): **449 pasan**. **Suite completa pasada entera por última vez el 12 oct (mañana)**, con Docker encendido unos minutos y apagado después. Si `supabase start` falla por `pg_meta`/`studio`, arrancar sin ellos: `supabase start -x studio,postgres-meta,logflare,vector,imgproxy,supavisor`. La app compila; 30 cambios de base de datos.
- **Docker apagado por defecto** (Cristian, 11 oct: consume mucha RAM). Se enciende 5 minutos solo para pasar los tests de integración antes de un cambio importante. **La app no lo necesita** (usa Supabase en la nube); solo sirve para una copia vacía de la base en el Mac, donde los tests crean y borran datos falsos.
- 12 oct: Docker Desktop se quedó sin responder; **Cristian lo reinició** y volvió a funcionar (tuve que hacer `supabase stop` y arrancar otra vez, porque la base local se había parado).
- **Resend (emails) terminado** (4.1, 11 oct): dominio «Verified» y probado en la nube: el enlace mágico entra y no se puede reutilizar, y el aviso de un reporte llega por email (los dos a «Recibidos», no a spam), con el diseño glass de la app.
- **Proyecto «Test» en la nube** (de Cristian): solo con el CEO; sirve para probar en la nube sin avisar a los directores. Tiene 2 reportes de prueba de caller-test (10 y 11 oct).
- **«Terminado»** = el equipo real entra en la app publicada (ordenador o móvil), los leads de GHL llegan solos, los avisos de los reportes llegan, y un caller y un closer trabajan un día real sin problemas.

## 2. Pendiente de que decidas tú

| Qué | Mi propuesta |
|---|---|
| **Un lead en varios pipelines** (4.4): ¿una tarjeta por pipeline o un lead en varios? ¿cómo cuenta en Funnel, KPIs, reparto y comisiones? | Decidirlo antes de subir los leads de otras fuentes y de crear sus workflows. |
| **Leads nuevos de Webinar, Orgánico y DFY:** hoy solo la Biblioteca entra sola (workflow 0). ¿Se crea un workflow por fuente, como el 0? | Sí, uno por fuente, cuando esté decidido lo de varios pipelines. |
| **Avisos de reportes por WhatsApp** (GHL, `GUIA-GHL.md` Parte 2): sin montar; por email ya llegan. | Montarlo si lo quieres por WhatsApp; si no, se queda solo el email. |
| **Reparto de los 1.178 leads:** todos sin caller y el reparto automático apagado. | Antes del día real: % de cada caller y encenderlo (Administración → Proyecto y reparto), o repartir a mano desde la Biblioteca. |
| **Ids de GHL de los callers** (para «Llamadas de GHL»): sin poner. En GHL vi como usuarios a Lucas y Miguel; Felipe, Hanna y Tomás no salían (sin comprobar si hay más páginas). | Que cada caller tenga usuario en GHL y poner su id en Integraciones; si no, sus llamadas no se le atribuyen. |
| Mis criterios (sección 6.2) | Revisarlos cuando recorras la app. |
| Pasar Vercel a Pro (el plan gratis es para uso no comercial, según sus condiciones; sin volver a comprobar hoy) | Cuando tengas una tarjeta que funcione: se mueve el proyecto o se conecta la otra cuenta. |
| `calcularVendedores` quedó sin uso en la app (solo lo usan 3 tests) | Quitarlo con sus tests cuando haya un rato. |
| En Proyecto Prueba (local) queda una venta antigua de prueba (9 oct) a nombre del CEO (Ana sale con «1 cerrada · 0 €») | Borrarla o pasarla a Ana; solo afecta a las pruebas en local. |
| Los 2 reportes de prueba en «Test» (10 y 11 oct) | Dejarlos: solo se ven en «Test» y el perfil no cuenta en cifras. |
| El CSV `usuarios-creados-2026-10-10-22-30.csv` (los mismos 2 perfiles de prueba, del 10 oct) | Borrarlo tú junto con los otros cuando mandes los accesos. |

## 3. Lo siguiente, en orden

| # | Qué | Quién | Estado |
|---|---|---|---|
| 1 | Pasada de punta a punta (Proyecto Prueba, 1.005 leads) | Cristian, Claude guió | ✅ Hecha (11 oct) |
| 2 | Mejoras de la 4.4 antes de publicar (los 4 puntos de la pasada y agendar por link de GHL) | Claude | ✅ Hechas (11 oct) |
| 3 | **Publicar** (4.2) | Los dos | ✅ Publicada (11 oct); faltan las comprobaciones de 4.2 |
| 4 | **Bloque 6 · Resend** (4.1) | Los dos | ✅ Verificado, probado en la nube y con el diseño glass (11 oct) |
| 5 | **Link de agenda** | Claude | ✅ `https://codigomaestria.com/agenda` (la landing con el calendario), puesto en Maestria (11 oct). Detrás está **«#1 Maestria founders»** (Cristian, 12 oct): las citas que consiguen los callers las atienden Cristian y José; llegan por el workflow 3 y cuentan para el caller igual |
| 6 | **Conectar GHL** (4.3): workflows de lead nuevo y cita agendada, token, calendarios | Los dos | **Casi**: ✅ leads de la Biblioteca solos (workflow 0) · ✅ citas de los 3 calendarios solas (workflows 1-3, hora arreglada) · ✅ token y sincronización (20 citas, horas bien) · ✅ closers Cristian y José. ✅ «Orgánico → Agendados» publicado. **Falta:** borrar las pruebas en GHL, workflows de las otras fuentes, ids de GHL de los callers, avisos por WhatsApp (si se quieren) y probar las llamadas de GHL |
| 7 | **Subir los leads reales** a Maestria (exportación nueva de GHL → CRM → Biblioteca Recursos) | Cristian, Claude comprueba | **Biblioteca ✅** (12 oct): 1.158 leads al subir el CSV (1.094 del CSV + 64 del workflow); hoy 1.165, porque siguen entrando solos, sin emails repetidos, todos en Biblioteca Recursos sin caller; 1.154 con las 6 respuestas; KPIs → Biblioteca rellena. **Webinar 1:** solo 8 nuevos (el resto ya estaba en Biblioteca) → depende de «un lead en varios pipelines» (4.4). DFY y demás, después |
| 8 | **Repartir los leads** entre los callers (% y reparto automático, o a mano) | Cristian / directores | Pendiente (todos sin caller) |
| 9 | **Mandar los accesos al equipo** por WhatsApp y borrar los 4 archivos de contraseñas | Cristian | Pendiente |
| 10 | Comprobaciones de la nube que faltan (4.2) | Claude | Pendiente |
| 11 | **Un lead en varios pipelines** (4.4), cuando Cristian lo decida | Claude | Pendiente de decidir |
| 12 | Mejoras de después de publicar (4.4): cerrar moviendo a «Cerrados» y zona horaria | Claude | Pendiente |
| 13 | **Día real** con un caller y un closer, y ajustes | Los dos | Al final |

---

## 4. Lo que me falta a mí (Claude)

**Cómo trabajo en cada paso:** tests que fallen si se rompe la regla, la app compila, prueba en pantalla en Proyecto Prueba (datos «PRUEBA» borrados al terminar), plan y guías al día, te lo enseño y commit. **Yo no pego claves ni contraseñas ni creo cuentas:** eso lo haces tú (te lo dejo preparado).

### 4.1 Bloque 6 · Emails con Resend ✅ (11 oct)
**Decisiones de Cristian (11 oct):** remitente `Eternity <no-reply@eternity.llc>` (dominio raíz, no subdominio); la app manda ella misma los emails con Resend (no se toca el correo de Supabase); se hace todo el bloque.
- [x] Dominio `eternity.llc` añadido en Resend (región North Virginia); registros en GoDaddy con «Auto configure»: `send` y `rsend` (CNAME) y `resend._domainkey` (TXT). El correo de Google Workspace (MX y SPF de la raíz) no se ha tocado.
- [x] **Resend: dominio «Verified»** (comprobado en el panel de Resend el 11 oct).
- [x] Código: `src/lib/email.ts` (envío con Resend), los avisos de reportes también por email al CEO y a los directores, «Enviar enlace mágico» activo en la ficha (solo administradores), página `/auth/confirm` que recibe el enlace (caduca en 1 h, un solo uso) y aviso en el login si el enlace no vale. 5 tests nuevos (servidor local en lugar de Resend); probado en local que el enlace crea la sesión y no se puede reutilizar.
- [x] `APP_URL` puesta en Vercel. `.env.example`, `GUIA-PUBLICAR.md` (paso 4 bis) y `GUIA-GHL.md` (el email ya no hace falta en GHL) al día.
- [x] **`RESEND_API_KEY` en Vercel** (la creó y la pegó Cristian) y publicado otra vez (`ed40af6`). Comprobado en la nube que `/auth/confirm` responde.
- [x] Probado de verdad (11 oct): enlace mágico a `info@eternity.llc` desde la ficha → «Delivered» en Resend, llega a Recibidos, Cristian entra (Supabase: `login` 16:47) y al reutilizarlo da 403 «One-time token not found». Reporte de caller-test en el proyecto «Test» (allí no hay directores, así que solo avisa al CEO) → email «Test · Reporte de Caller Test» con todas las respuestas, en Recibidos.
- [x] **Caller-test fuera del proyecto «Test»** (lo quitó Cristian el 11 oct; comprobado en la base: en «Test» solo queda el CEO y caller-test sigue activo). Quedan 2 reportes de prueba en «Test» (10 y 11 oct).
- [x] **Emails con el diseño glass de la app** (Cristian, 11 oct) · `88229b7`: `src/lib/plantilla-email.ts` (degradado, tarjeta translúcida, logo, botón granate). Gmail no admite el desenfoque (`backdrop-filter`, según caniemail.com), así que se imita. El aviso del reporte, con sus respuestas en una tabla, **visto en Gmail** y bien. El del enlace mágico, también visto en Gmail («Tu enlace para entrar en Test»).
- [x] Al enviar el reporte ahora dice «Reporte enviado. Tu equipo ya tiene el aviso.» (antes «Tu director…», aunque solo lo recibiera el CEO; Cristian, 11 oct).
- [x] Borrados con permiso los 3 archivos de las capturas (`captura.js`, `ver-enlace.js`, `ver-reporte.js` en `PROYECTOS/GENERAL/.playwright-mcp/`).
- [x] **Nombre «—» en las tarjetas de Reportes** · `850a8c9`: la página buscaba los nombres en `equipo()`, que deja fuera los perfiles de prueba (`es_prueba`) y a quien ya no está; ahora busca también ahí (con `conBajas`). Publicado y **visto en pantalla** (11 oct, como caller-test: «Caller Test» en las dos tarjetas).
- [x] **Primer clic que no abre** (Reportes, y luego la ficha en Equipo y en Administración): **no es de la app, es de la herramienta de Claude**. Comprobado el 11 oct con un registro de eventos en la página: al pulsar por referencia, a la página no le llegó ningún evento (0); al pulsar por coordenadas le llegó el clic completo y la ficha se abrió. Sin cambios en el código.

### 4.2 Publicar (sigo `GUIA-PUBLICAR.md`)
- [x] Código en GitHub (repositorio privado `eternitydevzz/Dashboard-de-ventas`).
- [x] Base en Supabase con los 30 cambios y el registro libre cerrado. Al subirlos falló uno (`gen_random_bytes` necesita `extensions.` en la nube); arreglado en `cc562d0`.
- [x] Vercel con sus variables y publicado (hoy son 6, con `APP_URL` y `RESEND_API_KEY`).
- [x] Resend: dominio verificado y prueba real → ver 4.1.
- [x] Maestria preparada (simulación y de verdad); la base creó sola «Callers» y «Closers».
- [x] Equipo real (10, y el 12 oct los closers Cristian y José: 12) y los 2 perfiles de prueba creados (los lanzó Cristian).
- [x] Cristian entra como CEO en la app publicada.
- [ ] **Medir la velocidad en la nube** con los leads ya subidos (en local, el Funnel con 30.000 leads carga en ~1 s). Si va lenta, se arregla.
- [ ] Comprobar en la nube: subir PDF y CSV, límite de intentos de login y que la consola del navegador no da errores. (HTTPS y cabeceras: ✅ comprobado.)
- [ ] Ajustes de Vercel: región de las funciones junto a Supabase (Washington, iad1) ⚠ comprobar en Settings → Functions.
- [ ] Repasar contigo la lista «Comprobar al terminar» de la guía.
- [ ] Dejar la app lista con tus datos: reparto, horarios, comisiones, permisos, IA, onboarding, Finanzas, links y recursos. (El link de agenda ya está.)
- [ ] Actualizar la herramienta de Supabase de mi Mac (de la 2.90 a la 2.120) cuando ejecutes `brew trust supabase/tap`. Hoy funciona con la 2.90.

### 4.3 Conectar GHL (sigo `GUIA-GHL.md`; resumen de cómo quedó en su sección «Cómo está montado en Maestria»)
- [x] **Lead nuevo de Biblioteca → app, automático** (11 oct, decisión de Cristian: primero leads, después agendas). En GHL (subcuenta Maestria), carpeta «1. Dashboard ventas», workflow **«0. AP - Biblioteca»**, **publicado** por Cristian: disparador «Contact Tag» = se añade «biblioteca recursos» (la etiqueta la pone el workflow de siempre, «AP - Biblioteca de recursos», que no se ha tocado) → acción **«B · Webhook (Entrada)»** (Webhook normal, no premium) a la Entrada de la app **«GHL · Biblioteca»** (Maestria → Administración → Entradas; pipeline Biblioteca Recursos, primera columna) → «Wait» (lo puso Cristian).
  - Probado con «Test workflow» y el contacto «PRUEBA Dashboard»: el lead entró en Maestria · Biblioteca Recursos con su id de GHL y **las 6 respuestas** con su pregunta exacta (GHL manda todos los campos del contacto por su nombre). Lead de prueba borrado después (con permiso; Maestria vuelve a 0 leads).
  - **Se descartó la A** («Custom webhook», premium): GHL la saltó con «COMPANY does not have enough funds» (la subcuenta no tiene saldo para acciones premium). Quitada del workflow.
  - ✅ **Comprobado con leads reales** (11-12 oct): entran solos con la etiqueta «biblioteca recursos» (63 inscritos en el workflow el 12 oct). Sin comprobar: un lead que repite y ya tenía la etiqueta quizá no vuelva a dispararlo.
  - Falta borrar en GHL los contactos de prueba «PRUEBA Dashboard» (`info+prueba@eternity.llc`), «PRUEBA Closers» (`info+prueba2@eternity.llc`) y «Kiiiriii» (`kiiir@test.com`): lo hace Cristian (sección 5). En Administración → Entradas → «GHL · Biblioteca» queda el registro del envío de prueba.
- [ ] Fallo pequeño visto: en Administración → Entradas sale «En local (localhost) las landings no pueden llegar…» aunque la app está publicada.
- [x] **Leads reales entrando** (11 oct): desde las 17:54 UTC, con la etiqueta «biblioteca recursos». 3 llegaron sin respuestas porque GHL ya las mandó vacías (sin mirar en GHL por qué; después el CSV no les añadió respuestas: siguen 3 sin ninguna).
- [x] **Citas → app** (11 oct, decisión de Cristian: 2 workflows y Wait de 999 días al final). Calendarios de GHL (los dos Round robin, 45 min): **«#2 Callers - Maestria»** y **«#3 Closers - Maestria»** (los dos con Andrés y Renzo; emails iguales que en la app; al principio se creyó que #3 era de Cristian y José, ver «Calendarios» abajo). En la carpeta «1. Dashboard ventas», **publicados**: **«1. AP - Cita Callers»** y **«2. AP - Cita Closers»** = «Customer booked appointment» (filtro «In calendar») → **Webhook normal** «Cita (app)» a `/api/webhooks/ghl/<Maestria>` con Custom data `tipo=cita_agendada`, `fecha` = Appointment · Start Date Time, `closer_email` = Appointment · Assigned User · Email, y cabecera `x-eternity-secreto` (clave de Maestria, `704d0dde…`) → Wait 999 días. (El 2 es copia del 1 con el otro calendario.)
  - **Probado con una reserva real** (11 oct, la hizo Cristian en «#2 Callers»): la cita llegó a Maestria con closer = Andrés y su id de GHL. **Fallo encontrado y arreglado** · `f16b240`: GHL manda `calendar.startTime` sin zona («2026-10-14T15:30:00», hora de `calendar.selectedTimezone` = Nueva York) y la app lo leía como UTC → la cita quedaba **4 h antes**. Ahora se lee en la zona del calendario (o la del proyecto) con `fechaDeGhl` (`src/lib/formato.ts`); el `fecha` de Custom data llega como texto («Wednesday, October 14, 2026 9:30 PM») y no se usa. 5 tests nuevos + uno de integración con el formato real. **Comprobado en la nube** reenviando el webhook real: 19:30 UTC = 15:30 Nueva York = 21:30 Madrid, sin duplicar. Lead y cita de prueba borrados en la app; cita cancelada en GHL (12 oct).
  - **Probado «#3 Closers»** (12 oct, reserva de Cristian «PRUEBA Closers»): llega con la hora buena (19:30 UTC = 15:30 Nueva York) y closer Andrés (correcto). Cita cancelada en GHL y lead de prueba borrado (Maestria: 0 citas).
  - **Calendarios (Cristian, 12 oct):** «#2 Callers - Maestria» y «#3 Closers - Maestria» = Andrés y Renzo (los closers actuales); **«#1 Maestria founders» = founders (Cristian y José)**, el que más se usa ahora (en el filtro del workflow salía con su nombre anterior, «#1 Llamada de Descubrimiento | MaestrIA - Vende AI Services en USA»: Cristian confirmó que es el mismo, lo renombró). ✅ Workflow **«3. AP - Cita Founders»** (copia del 2 con ese calendario) **publicado** el 12 oct. Sin probar con una reserva por webhook; sus citas reales sí entraron por la sincronización (con su closer y su hora).
  - **Pregunta de Cristian: ¿no era más fácil la API de GHL?** Para lo que entra al momento, no (la API no avisa; los webhooks sí). Para traer lo que ya existe, sí: el token trae las citas de cada closer (30 días atrás, 60 adelante). Para traer todos los leads con la API no hay nada hecho; se usa el CSV (Cristian lo exporta y sube actualizado). La hora de la sincronización resultó bien (la API sí manda la zona; ver «Primera sincronización»).
  - **Decisión de Cristian:** **2 closers, Cristian y José**, con sus emails de GHL. ✅ Creados el 12 oct (los lanzó Cristian con `crear-usuarios.mjs` y `scripts/salida/closers-founders.csv`): «Cristian Ortiz» `cristianortiz@astraire.com` y «José Gómez» `jose@eternity.llc`, rol closer, activos y en Maestria (comprobado en la base). Cuentan en KPIs, Ranking y comisiones de closers. Contraseñas en `scripts/salida/usuarios-creados-2026-10-12-02-36.csv`.
  - Cita de prueba de «#2 Callers» **cancelada en GHL** (12 oct).
  - **Citas reales reservadas antes de publicar los workflows** (Sofía Ramires, Christian, José Ramón Romero, Alejandro Tovar, Lenin, Wendy…): ✅ las trajo la primera sincronización (12 oct).
  - Aprendido: la clave de la A (ya borrada) era la del proyecto «Test» (`86b6dd79…`), no la de Maestria.
- [ ] **Comprobar que GHL manda todas las citas** (su lista no va por páginas): si llegara incompleta, la app cancelaría citas buenas. Primera sincronización (12 oct): 20 citas en la app (4 pasadas y 16 desde el 12 oct); GHL «Appointment list view» enseñaba también 16 desde el 12 oct; no se canceló ninguna (con 0 citas antes no había nada que cancelar). Repasarlo cuando haya muchas más citas.
- [x] Workflows «Lead nuevo» (solo la Biblioteca, workflow 0) y **«Cita agendada»** (los 3 calendarios, workflows 1-3), publicados y comprobados en «Últimos eventos».
- [ ] Workflows de **lead nuevo de las otras fuentes** (Webinar, Orgánico, DFY): sin crear (sección 2; depende de «un lead en varios pipelines»).
- [ ] «Cambio de etapa»: no hace falta (la app es el CRM).
- [ ] **Avisos de reportes por WhatsApp** (Parte 2 de `GUIA-GHL.md`): sin montar (sección 2). Por email ya llegan.
- [ ] **Llamadas de GHL:** poner el id de usuario de GHL de cada caller (y de Juan y Junior si llaman) en Integraciones y probar «Traer llamadas de GHL» con una llamada real (sección 2: Felipe, Hanna y Tomás no salían como usuarios de GHL).
- [x] **Token de GHL** (12 oct): Private Integration «App Eternity (dashboard)» en Maestria con solo `calendars/events.readonly`, `contacts.readonly` y `conversations/message.readonly` (la creó Claude; el token lo pegó Cristian). Location ID `ZGWJLBH58RJtl2iGhykp`. «Probar conexión» correcto. Id de usuario de GHL de cada closer: Andrés `GFc1HiIWJkr1PlTQOSNn`, Renzo `Dyz4qLnUYxbkfyEJ3srG`, Cristian `DubIbjsps2tK1fhLcgcP`, José `J8xk7z0XlRevokd1bsH8`.
- [x] **Primera sincronización** (12 oct, 04:04 UTC; arrancó sola al abrir Agendas): «20 nuevas · 0 actualizadas · 0 sin unir · 0 inválidas». **Horas correctas** comparadas con GHL (Sofía 12 oct 15:30 EDT = 19:30 UTC; Christian 08:00 EDT = 12:00 UTC…): la API manda la hora con zona, así que `ghl-sync.ts` no necesita el arreglo del webhook. 11 citas se unieron a leads de Biblioteca; **9 crearon un lead nuevo en «Webinar 1»** (el primer pipeline): 5 reales (Wendy, José Ramón, Lenin, Moisés, Adriàn) y 4 de prueba (Kiiiriii, PRUEBA Closers, «Test» tst@test.com, «Prueba» info+prueba-lia). Las 2 citas de prueba canceladas vuelven en cada sincronización porque siguen en GHL (canceladas).
- [x] **Decidido y hecho (Cristian, 12 oct):** borrados en la app los 5 leads de prueba que vinieron de GHL (Kiiiriii, PRUEBA Closers, «Test» tst@test.com y team@test.com, «Prueba» info+prueba-lia) con sus citas; los 5 reales (Wendy, José Ramón, Lenin, Moisés, Adriàn) pasados a **«Orgánico → Nuevos»**. Quedan 15 citas reales.
- [ ] **Cristian:** borrar en GHL las 5 citas de prueba (si no, la sincronización las vuelve a traer y crea otra vez sus leads): Kiiiriii y PRUEBA Closers (canceladas, 14 oct), «Test» tst@test.com (30 sep y 9 oct) y «Prueba» info+prueba-lia (2 oct). Claude no borra datos para siempre.
- [x] **«Orgánico → Agendados»** (decisión de Cristian, 12 oct) · `2947412`: todo lead con cita de GHL (webhook o sincronización) pasa a «Orgánico», columna «Agendados» (una cita cancelada no lo mueve). `moverAAgendadosOrganico` en `src/lib/leads.ts`, llamada desde el webhook (`route.ts`) y desde `ghl-sync.ts`; 2 tests de integración (suite completa: 449 pasan), compila y publicado en Vercel. **Los 15 leads que ya tenían cita, movidos a «Orgánico → Agendados»** (comprobado en la base: 0 por mover). Sin probar todavía con una cita nueva real. Busca el pipeline por el nombre «Orgánico» y la columna «Agendados»: si se renombran, deja de mover.
- [ ] El texto de Administración → Integraciones GHL sigue explicando el «Custom webhook» (premium) y sus cuerpos JSON: ponerlo como se montó (Webhook normal, Custom data y cabecera).
- [ ] Ajustar las marcas «⚠ comprobar» de las guías con tus pantallas de GHL, Supabase y Vercel.
- [ ] Landings directas: una entrada por landing en Administración → Entradas.
- [ ] Probar con GHL real lo que solo se ha simulado: «Link enviado» → reserva → la cita llega a nombre del caller con sus estrellas; lead por teléfono; cita sin id sin duplicar; closer que no es del proyecto; cita borrada en GHL → «cancelada»; reagendar en la app una cita de GHL; avisos al CEO aunque no sea miembro; un segundo reporte del día no repite el aviso.
- [ ] Probar con las claves reales: calendario de GHL, llamadas de GHL con Deepgram, Fathom y la IA (análisis, coach y puntuación).
- [ ] Medir el gasto real de Claude y Deepgram los primeros días (calculado ~0,05-0,08 $ por llamada de 1 hora, sin medir).

### 4.4 Mejoras

**Hechas el 11 oct (salieron de la pasada):**
- [x] Vista previa automática al repartir (sin botón «Ver reparto») · `f64f64a`.
- [x] Venta antes de la hora de la cita: se guarda y la cita se cierra «ahora» («Cita adelantada: era el…» en el historial); la sincronización de GHL ya no toca citas terminadas · `a094747`.
- [x] Funnel con una sola tabla por persona («KPIs por persona»); una venta que un jefe registra desde la ficha va al closer de la cita · `b6dbca1`. Ranking con las mismas reglas · `d47c48e`.
- [x] Método de pago «Stripe» por defecto: se queda así (Cristian).

**Hecho el 11 oct: agendar por link de GHL** · `b8ff0e3` (cambio de base 30)
- [x] El caller pulsa **«Link enviado»** con sus estrellas (2-5): se abre WhatsApp con el link escrito, el lead pasa a la columna «Link enviado» de «Callers» y sale de la cola; vuelve como «llamar luego» a los 2 días si no ha llegado su cita.
- [x] Cuenta como **agendado** cuando llega la cita de GHL (webhook, sincronización o «unir»), con su hora, su closer y las estrellas del caller. La agenda (KPIs, Ranking y comisión) es de quien marcó «Link enviado»; si nadie, del caller del lead; sin caller, de nadie.
- [x] Los callers ya no agendan a mano; directores, CEO y closers sí.
- [x] Fuera la rotación de closers (sus datos se quedan en la base; la función `sumar_rotacion` queda sin uso).
- [x] Todas las citas se reagendan y se mueven en la app, también las de GHL; la cita nueva no lleva el id de GHL, así la sincronización no le cambia la hora.
- [x] Link de agenda del proyecto en Administración → Proyecto y reparto (solo administradores, solo https).

**Pendiente nuevo (Cristian, 12 oct): un lead en varios pipelines**
- [ ] Hoy un lead está en **un solo pipeline**: al subir un CSV, si la persona ya existe (mismo email) se pone al día pero **se queda en su primer pipeline** (criterio de 6.2). Con el CSV de Webinar 1 solo entraron 8 nuevos; de 107 con etiqueta de webinar, 100 siguen en Biblioteca. **Cristian quiere que pueda «duplicarse»** para ver bien los números de cada fuente. **Antes de hacerlo, decidir con Cristian:** ¿la misma persona aparece una vez en cada pipeline (una tarjeta por pipeline) o es un solo lead que «pertenece» a varios? ¿Cómo cuenta en Funnel, KPIs, reparto y comisiones (una persona o una por pipeline)? ¿Qué pasa al llamarla o venderle desde uno de los pipelines? Y, si hace falta, que la subida respete la etapa de GHL.

**Después de publicar (Cristian, 11 oct):**
- [ ] **Cerrar moviendo la tarjeta:** al soltar en «Cerrados» de cualquier CRM se abre «Registrar venta»; al guardar queda cerrada en todos (lead, Callers, «Cerradas» de Post-call y la cita) y cuenta en Funnel, Ventas y comisiones; si se cancela, vuelve a su sitio. Solo closers, directores y CEO.
- [ ] **Cambiar la zona horaria del proyecto** (6.1). Lo comprobado: la zona es `proyectos.zona_horaria` (solo Nueva York y Madrid); las citas guardan el momento exacto; los horarios guardan la hora del reloj (hay que convertirlos); los reportes, solo el día; 39 archivos usan la zona. **Ojo:** entre Nueva York y Madrid no siempre hay 6 h (unas semanas, 5 h) y un horario puede pasar al día siguiente al convertirlo; probar los dos casos.

---

## 5. Lo que te toca a ti (Cristian)

### Ahora
- [ ] **Guardar la clave de Resend** (`re_…`) en tu gestor o en `contraseñas.md`: **no está en `contraseñas.md`** (comprobado el 11 oct) y Resend no la vuelve a enseñar.
- [x] Resend «Verified»: enlace mágico y reporte probados (11 oct).
- [ ] **Google Workspace:** Gmail avisa de que no puede renovar la suscripción; hay que actualizar el pago **antes del 2 nov 2026** o `info@eternity.llc` deja de recibir correo (y con él los avisos y enlaces de la app).
- [x] Link de agenda: `https://codigomaestria.com/agenda` (puesto, 11 oct).
- [ ] **Mandar a cada persona su acceso por WhatsApp** (dirección, email y contraseña de `usuarios-creados-…csv`) y después **borrar los 4 archivos** `usuarios-creados-…csv` de contraseñas (lo haces tú; el 4.º es el de los closers Cristian y José, del 12 oct).
- [ ] Guardar en tu gestor de contraseñas lo de `scripts/salida/contraseñas.md` (contraseña de la base y `CLAVE_CIFRADO`) y la secret de `.env.produccion`. Si `CLAVE_CIFRADO` se pierde, hay que volver a pegar el token de GHL y las claves de Fathom.

### Para conectar GHL (paso 6)
- [x] Token de GHL pegado y conexión probada (12 oct). Workflows creados y publicados en «1. Dashboard ventas». Calendarios aclarados (4.3). Closers Cristian y José creados.
- [x] Docker reiniciado (12 oct); «Orgánico → Agendados» probado y publicado.
- [ ] **Borrar en GHL** las 5 citas de prueba (Kiiiriii y PRUEBA Closers del 14 oct; «Test» tst@test.com del 30 sep y 9 oct; «Prueba» info+prueba-lia del 2 oct) y los contactos de prueba (PRUEBA Dashboard, PRUEBA Closers, Kiiiriii).
- [x] Calendario del link de agenda: «#1 Maestria founders» (12 oct).
- [ ] **Usuarios de GHL de los callers** (Felipe, Hanna, Tomás no salían) para «Llamadas de GHL».
- [ ] **GHL avisa «Payment method is missing»**: sin saldo no funcionan las acciones premium (no las usamos, pero conviene saberlo).
- [ ] Decidir: workflows de las otras fuentes, avisos por WhatsApp y «un lead en varios pipelines» (sección 2).

### Después de GHL (paso 7)
- [x] **Subir los leads de la Biblioteca** (12 oct): 1.158 en Maestria. Webinar 1 subido: solo 8 nuevos (el resto ya estaba; ver 4.4 «un lead en varios pipelines»).
- [ ] Subir los de otras fuentes (DFY…) cuando se resuelva lo de varios pipelines.
- [ ] **Repartir los leads** entre los callers (con los directores): % de cada caller en Administración → Proyecto y reparto y encender el reparto automático, o repartir a mano desde KPIs → Biblioteca («Repartir leads»).

### Cuando puedas
- [x] Cuenta de Resend y DNS de eternity.llc (hechos el 11 oct con «Auto configure» de GoDaddy).
- [ ] Pasar Vercel a Pro.
- [ ] Recorrer la app con calma (lo nuevo del 1.0 y del 11 oct), arrastrar tarjetas con tu ratón y mirarla en el móvil.
- [ ] Revisar mis criterios (6.2).
- [ ] Ejecutar `brew trust supabase/tap` en tu terminal (no es urgente).
- [ ] Las claves de Fathom, Claude y Deepgram (las pones tú en Vercel o en la app).
- [ ] Que el equipo ponga en la app: objetivos y lanzamientos, contexto del negocio para la IA, links de pago y de dossier, y recursos.
- [ ] Organizar el día real con un caller y un closer.

---

## 6. Decisiones vigentes

### 6.1 Tuyas
| Tema | Decisión |
|---|---|
| Base | Sin Stripe ni pasarelas: cada venta la apunta quien la hace. **La app es el CRM; GHL solo trae datos** (webhooks, landings, calendarios y llamadas). |
| Aspecto | Diseño glass con granate Eternity y azul Maestria; español de España; dólares y hora de Nueva York por defecto. |
| Nube | Planes gratuitos para empezar (Supabase gratis; Vercel Hobby mientras no funcione la tarjeta) y la dirección gratuita de Vercel (sin dominio propio). Emails con Resend (11 oct). |
| Equipo real | Creado con `scripts/salida/equipo.csv`. Una sola cuenta CEO para «Cris y José»; Juan y Junior, directores con Administración. **Cristian y José también son closers** (12 oct), con sus emails de GHL, para las citas de «#1 Maestria founders»; cuentan en KPIs, Ranking y comisiones. Los accesos los manda Cristian por WhatsApp. |
| Roles | Solo el CEO cambia el rol o desactiva a alguien. Administración, Finanzas y Equipo nunca para callers ni closers. Las comisiones las cambian el CEO y los directores (un director, ni la suya ni la de su rol). |
| Permisos | Por sección y por pipeline (Editar / Ver / Sin acceso), por rol o por persona; manda la persona. Una sección de otro rol = solo lo suyo. CEO y director con Administración, siempre todo. |
| CRM | Como GHL: pipelines de origen con sus columnas, «Callers» (por el resultado de la llamada, con «Link enviado») y «Closers» (Pre-call y Post-call). Las columnas las personaliza el equipo. |
| Clientes | Solo quien ha comprado. |
| Estrellas | Caller: 1 no responde · 2 no sabe nada · 3 interesado · 4 quiere saber más · 5 quiere comprar (las pone al marcar «Link enviado»). Closer: 5 paga ya · 4 con plazo · 3 sin dinero ahora · 2 poco encaje · 1 no califica. |
| Agendar | Por link de GHL: el caller marca «Link enviado» con sus estrellas; cuenta como agendado cuando llega la cita de GHL, con su hora y su closer; la agenda es de quien envió el link (si nadie, del caller del lead). Si en 2 días no reserva, vuelve a la cola. Directores, CEO y closers pueden crear citas a mano. **Todas las citas se reagendan y se mueven en la app**, también las de GHL. Sin rotación de closers. |
| Venta | Antes de la hora de la cita: se guarda y la cita se cierra «ahora». Desde la ficha, un jefe sin elegir vendedor la deja a nombre del closer de la cita. Método de pago «Stripe» por defecto. |
| Post-call | Todo se mueve a cualquier columna; sacar una venta de su columna la borra (con confirmación); «Cerradas» = pagadas del todo este mes. |
| KPIs | Se cuentan personas; contactado = llamada o WhatsApp; agendar cuenta como contestada; el cash es lo que entró en el periodo (igual en Ventas, Finanzas, Funnel y Agendas); de cada closer, su parte del total en facturación y cash y su % cobrado. El Funnel tiene una sola tabla por persona («KPIs por persona») y el Ranking usa las mismas reglas. «Mi Funnel»: cada caller y closer ve sus objetivos, sus KPIs y su Funnel. |
| Objetivos | Por rol o persona (manda la persona); el del director = equipo entero; semana de lunes a domingo; diario de lunes a viernes por defecto; racha = cumplir todos los diarios. |
| IA | Claude Sonnet 5.5; cada llamada se analiza al unirla a su cita. Llamadas de GHL: las contestadas de más de 1 minuto; si GHL no transcribe, Deepgram. |
| Biblioteca | Primera pestaña de KPIs (director y CEO). Su clasificación («Oferta») es un dato de cada lead que se recalcula solo; no ordena la cola. Cada CSV nuevo pone al día los datos. |
| Productos | Membresía (47 $/mes, sin fin), Grupal (1.997 $), VIP (4.997 $) y DFY (precio personalizado). Cada uno con link de pago y de dossier. |
| Reparto de leads | Solo entre callers. A mano, con el botón (vista previa automática, 4 formas) o automático al entrar con % por caller que suman 100, apagado y al 0 % por defecto. Con «solo en su horario» y nadie en horario, se reparte igual entre los que tienen %. |
| Zona horaria | La cambia un administrador; solo Nueva York o Madrid. Al cambiarla, los horarios de cada persona se convierten para que sigan a la misma hora real; lo ya guardado por día se queda como está. (Por hacer: 4.4.) |
| Horario | En la hora del proyecto, con la del aparato al lado. Obligatorio en el onboarding de callers y closers; cada uno cambia el suyo en «Mi perfil» y un administrador, el de cualquiera. |
| Llamadas de closers | Duración (30 min por defecto), descanso, aviso mínimo y máximo al día: solo el administrador, generales o por closer (para las citas a mano). |
| Comisiones | Tramos mensuales en dólares, editables en Administración, sobre toda la facturación del mes; las cuotas, con el % del mes de la venta; se paga sobre lo cobrado. Callers y closers por tramos; CEO y directores con su % propio; interruptor por persona. Las devoluciones no descuentan lo pagado y siguen contando para su tramo. La Membresía no paga comisión ni suma para el tramo (casilla por producto). |
| Ficha de cada persona | La misma en Equipo y en Administración. Datos y comisión para quien tiene Equipo; el resto, solo CEO y directores con Administración. La marca de prueba, solo el CEO; el email lo cambia el administrador directamente. |
| Reporte | Preguntas editables en Administración; del closer, las 3 de las tasas son fijas. Cada reporte guarda sus preguntas. |
| Onboarding de closers | Sus clientes = a quienes les registró una venta. Los puntos los editan el CEO y los directores. |
| Cola del caller | La prioridad A/B/C no ordena; primero los «llamar luego» y «link enviado» que ya tocan, luego nuevos, luego «no contesta», y dentro, del más nuevo al más viejo. |
| Emails | (11 oct) La app manda ella misma los emails con Resend, desde `Eternity <no-reply@eternity.llc>` (dominio raíz, decisión de Cristian): el aviso de cada reporte (al CEO y a los directores) y el enlace mágico que un administrador manda desde la ficha (caduca en 1 h, un solo uso). No se toca el correo de Supabase. El cambio de email lo hace un administrador directamente (no manda email). Sin email de bienvenida: los accesos van por WhatsApp. |
| GHL (12 oct) | Workflows de la app en la carpeta «1. Dashboard ventas», numerados, **siempre publicados** y con un Wait de 999 días al final. Acción **Webhook normal** (no «Custom webhook», que es premium). Primero leads y después agendas. Calendarios: «#2 Callers» y «#3 Closers» = Andrés y Renzo; «#1 Maestria founders» = Cristian y José. **Todo lead con cita de GHL va a «Orgánico → Agendados»** (publicado el 12 oct). El link de agenda de los callers lleva a «#1 Maestria founders». Los leads se suben con CSV (lo hace Cristian). |
| Leads en varios pipelines (12 oct) | Cristian quiere que un lead pueda estar en varios pipelines para ver los números de cada fuente (por diseñar, 4.4). |
| Lo configura el equipo | Qué `source` de cada landing va a qué pipeline (Administración → Entradas), las columnas del CRM, los pasos de los dos onboardings, las cuentas y categorías de Finanzas, el link de agenda, y los links y recursos. |
| Commits | Por bloques. En este repositorio van firmados por `eternitydevzz` (si no, Vercel Hobby bloquea la publicación). |

### 6.2 Mis criterios (puedes cambiarlos)
- Agendado → Venta cuenta personas, compras desde el día de la agenda, aunque cierre el closer.
- KPIs: los agendados del caller cuentan aunque se reagenden; el % de cierre sobre asistencia, solo con los que asistieron.
- Racha: hoy solo suma si ya está cumplido; cada día usa su objetivo; hasta 60 días; celebración una vez al día.
- Al borrar una venta sin cita, el lead vuelve a «Nuevo»; con cita, a «Agendado».
- Post-call: la cita cerrada no se reagenda; llevar Reserva o Cuotas a «Cerradas» registra el cobro de lo que falta.
- Un director puede cambiar la comisión del rol CEO.
- La casilla «Cuenta para comisión» la cambian el CEO o un director.
- En la Membresía, la facturación es la del primer mes; los meses siguientes entran como cobros.
- «Nuevo cliente» y el onboarding de clientes son del CEO y los directores; cobrar vale con «Ventas» o «Agendas».
- Pipelines por defecto: los de origen, Ver para todos; «Callers», para callers y directores; «Closers», para closers y directores.
- Un lead que vuelve a entrar mantiene su primer origen y suma etiquetas y respuestas; sin email se le reconoce por el teléfono (últimas 9 cifras). ⚠ **Cristian quiere cambiarlo** (12 oct): que pueda estar en varios pipelines (4.4).
- En Agendas solo cuentan las ventas de closers; un gasto sin categoría cuenta en el profit; Fathom se sincroniza con el botón.
- Reparto: el tope cuenta como «sin trabajar» Nuevo, No contesta y Llamar luego; le toca a quien tiene menos para su %, y la cuenta empieza de cero al cambiar los %.
- «Link enviado» cuenta como contacto (como un WhatsApp).
- Una cita de GHL que llega para un lead con «Link enviado» le quita la fecha de «insistir».
- Al reagendar con un closer sin horario, solo se comprueba que no choque con otra cita.
- A un caller o closer, Programas le enseña solo «Tus clientes».
- Los links de los productos y el link de agenda, solo https.
- Si falla guardar el historial de un lead, se apunta en el registro y la acción sigue.
- Si se borra una venta «adelantada», la cita vuelve a «seguimiento» con la hora adelantada (la original queda en el historial).

---

## 7. Lo que está hecho

| Qué | Commit |
|---|---|
| v1: roles, callers, closers, Funnel, webhooks de GHL, CRM, ficha del lead, reportes, CSV, tests, seguridad, guías y scripts | — |
| v2 (V2-0 a V2-12): landings, estrellas, devoluciones, Agendas, calendario de GHL, Equipo y comisiones, Programas, Finanzas, Clientes, Permisos, Fathom, IA, llamadas de GHL con Deepgram, coach | `0334e4c` |
| Auditoría: los 36 arreglos | `c490247` … `4ae7fba` |
| Paso H: diseño glass, KPIs, objetivos, Pre-call y Post-call con arrastre, permisos por rol y persona, un solo CRM, «Mi Funnel» | `0ad6a55` … `adb7080` |
| Paso 0 y Paso G: pipelines «Callers» y «Closers» con sus permisos; carga rápida (Funnel con 30.000 leads de ~2,8 s a ~1 s en local) | `6a887c6`, `2e3a407` |
| 1.0 · «Llamadas de GHL» oculta, perfiles de prueba, Biblioteca, oferta de cada lead, reparto a mano, productos renombrados, Membresía mensual | `fa6c34b` |
| 1.0 · Horario como GHL, «Mi perfil», disponibilidad de los closers, reparto automático con % | `f102dce` |
| 1.0 · Rotación de closers (quitada el 11 oct), comisiones por tramos, «Cuenta para comisión» | `0f6c688` |
| 1.0 · Pasada en pantalla de lo que solo estaba en tests, y arreglo del formulario de landings | `ed4bcce` |
| 1.0 · Ficha de cada persona, reporte editable, onboarding de closers, Links y recursos, cola sin prioridad | `c3bf914` |
| Pasada de punta a punta (11 oct) y su plan | `115a99a` |
| 4.4 · Vista previa automática al repartir | `f64f64a` |
| 4.4 · Venta antes de la hora cierra la cita «ahora»; GHL no toca citas terminadas | `a094747` |
| 4.4 · Funnel con una sola tabla por persona; venta desde la ficha al closer de la cita | `b6dbca1` |
| 4.4 · Ranking con las mismas reglas que «KPIs por persona» | `d47c48e` |
| 4.4 · Agendar por link de GHL; fuera la rotación; citas de GHL reagendables en la app | `b8ff0e3` |
| Publicar: guía corregida (Root Directory vacío), migraciones arregladas para la nube, primera publicación | `46886d9`, `cc562d0`, `959af89`, `119d64a`, `06b4064` |
| Bloque 6 · Resend: avisos de reportes por email, enlace mágico, `/auth/confirm`; publicado con la clave | `e2fefba`, `ed40af6` |
| Emails con el diseño glass de la app | `88229b7` |
| Reportes: nombre de perfiles de prueba y bajas | `850a8c9` |
| Citas de GHL: hora leída en la zona del calendario (llegaban 4 h antes) | `f16b240` |
| Plan: pruebas de Resend, diseño visto en Gmail, «primer clic» explicado | `1bc14d9` … `da43f49` |
| Aviso del reporte «Tu equipo ya tiene el aviso» | `1329cbe` |
| GHL conectado (workflows, token, sincronización, leads subidos): todo en GHL y en la base, sin código nuevo; plan y guías | `a3dbfb3` … `b3a49c3` |
| Todo lead con cita de GHL pasa a «Orgánico → Agendados» | `2947412` |

---

## 8. Riesgos y avisos

**Pueden hacer daño el primer día:**
- **Citas de GHL:** su lista no va por páginas; si llegara incompleta, la app cancelaría citas buenas (4.3; la primera sincronización cuadró). Los workflows de citas están publicados: si alguno se despublica, ningún caller suma agendas de ese calendario.
- **Leads sin caller:** los 1.178 están sin repartir y el reparto automático está apagado: hasta que se reparta, los callers no tienen cola.
- **Solo la Biblioteca entra sola:** un lead nuevo de Webinar, Orgánico o DFY no llega a la app hasta que se cree su workflow o se suba un CSV.
- **Velocidad en la nube:** sin medir con datos (4.2).
- **Emails:** funcionan (probado el 11 oct). Dependen de que el correo de Google Workspace siga pagado (aviso: antes del 2 nov 2026).
- **Dominio raíz en Resend** (decisión de Cristian): si algún email de la app se marcara como spam, afectaría también a la reputación del correo normal de @eternity.llc (Google Workspace). Resend recomendaba un subdominio.

**A tener en cuenta:**
- **GHL:** «Custom webhook» es premium y la subcuenta no tiene saldo (aviso «Payment method is missing» en GHL): se usa el Webhook normal. Los workflows solo funcionan **publicados**.
- **Docker** (solo para los tests): el 12 oct se quedó sin responder y hubo que reiniciarlo; si vuelve a pasar, reiniciar Docker Desktop y, si la base local no arranca, `supabase stop` y `supabase start -x …` (sección 1).
- **Vercel Hobby** (gratis) es para uso no comercial según sus condiciones (no comprobado hoy): pasar a Pro cuando se pueda. Solo publica commits firmados por `eternitydevzz` (ya configurado en este repositorio).
- **Contraseñas en archivos de texto** (`scripts/salida/contraseñas.md`, `usuarios-creados-….csv`, `.env.produccion`): fuera de GitHub, pero en tu Mac sin cifrar. Pasar lo importante a un gestor de contraseñas y borrar los de usuarios cuando estén enviados.
- **Supabase gratuito:** sin copias de seguridad garantizadas y puede pausarse si no se usa (límites exactos sin comprobar).
- **Clave de cifrado:** si se pierde, hay que volver a pegar el token de GHL y las claves de Fathom.
- **Recordatorios de GHL:** si se reagenda en la app una cita que vino de GHL, GHL sigue recordando al lead la hora vieja salvo que se cambie también allí.
- **GHL:** algunas variables no están documentadas; puede que director y CEO tengan que ser contactos de GHL para recibir avisos (sin comprobar); la app no puede lanzar llamadas. «Orgánico → Agendados» busca el pipeline y la columna por su nombre: si se renombran, deja de mover. Las citas de prueba que siguen en GHL vuelven en cada sincronización.
- **Llamadas de los callers:** solo cuentan las hechas desde GHL (no WhatsApp ni su móvil), y solo se atribuyen si el caller tiene su id de GHL puesto (hoy ninguno).
- **Post-call:** mover una cita «reagendada» puede contar la misma reunión dos veces; sacar una venta de su columna la borra con sus cobros y comisiones (pide confirmación).
- **Citas:** un lead puede tener dos citas a horas distintas.
- **Onboarding de closers:** si dos closers le venden al mismo cliente, comparten la checklist.
- **Clave del webhook en la dirección** (tu decisión): puede quedar en registros intermedios; la guía recomienda mandarla en la cabecera.
- Riesgos bajos: los estilos admiten código en línea; el diseño glass puede ir algo más lento en equipos viejos.

---

## 9. Cómo entrar y dónde está cada cosa

- **La app publicada:** https://dashboard-de-ventas-iota.vercel.app (tu acceso: `info@eternity.llc`, contraseña en `scripts/salida/usuarios-creados-2026-10-11-13-38.csv`, fila «Cris y José»).
- **GHL:** subcuenta **Maestria** (Location ID `ZGWJLBH58RJtl2iGhykp`) · workflows en Automation → carpeta **«1. Dashboard ventas»** (0 Biblioteca, 1 Callers, 2 Closers, 3 Founders) · Private Integration **«App Eternity (dashboard)»** · en la app: Administración → **Integraciones GHL** (token, ids de closers, «Últimos eventos») y → **Entradas** («GHL · Biblioteca»).
- **Paneles:** Vercel → proyecto `dashboard-de-ventas` (cuenta `cristianortizmaestria-9940`) · Supabase → proyecto «eternity» (organización «eternitydevzz's Org»; el otro proyecto, «creatuagencia-maestria», no es de esta app) · GitHub → `eternitydevzz/Dashboard-de-ventas`.
- **Claves:** `scripts/salida/contraseñas.md` (contraseña de la base y `CLAVE_CIFRADO`) y `.env.produccion` (secret de Supabase, para los scripts). Ninguno se sube a GitHub.
- **En local:** abrir Docker Desktop → servidor `eternity-dashboard` → http://localhost:3100 (versión compilada: `eternity-produccion` → http://localhost:3200; los dos en `PROYECTOS/GENERAL/.claude/launch.json`). Si el login falla, primero `open -a Docker`; si sale el diseño viejo, borrar `app/.next/dev` (con permiso) y reiniciar.
- **Perfiles de prueba en la nube:** closer-test@ y caller-test@eternity.llc (contraseñas en `scripts/salida/usuarios-creados-2026-10-11-13-46.csv`; no cuentan en cifras). Para probar en la nube sin avisar a nadie: añadirlos al proyecto «Test» y quitarlos al acabar.
- **Para Claude con el navegador:** los clics «por referencia» a veces no llegan a la página (comprobado el 11 oct); pulsar por coordenadas. Las ventanas del navegador (`confirm`) las tiene que aceptar Cristian.
- **Usuarios de prueba en local** (`@eternity.test`, contraseña en `scripts/seed.mjs`): ceo@, director@ (con Administración), closer1@ (Ana), closer2@, caller1@ (Carla), caller2@, caller3@, caller4@.
- **Datos locales (Docker, solo en tu Mac):** Maestria = 1.005 leads de la Biblioteca del 10 oct (copia vieja, no se toca en las pruebas). Proyecto Prueba = donde pruebo. **Los datos reales están en la nube.**
- **Para programar:** toda ventana nueva va dentro de `<Portal>`.

| Dónde | Qué |
|---|---|
| `app/docs/plan.md` | Este plan |
| `app/docs/plan-historial-10oct.md` · `plan-historial-11oct.md` | Copias históricas, con todo el detalle de lo hecho (no se tocan) |
| `app/docs/GUIA-PUBLICAR.md` · `GUIA-GHL.md` | Cómo publicar y cómo conectar GHL |
| `app/docs/Arreglar-dashboard.md` | La auditoría (36 puntos) |
| `app/scripts/` | `preparar-proyecto`, `crear-usuarios`, `limpiar-pruebas` (simulan sin `--confirmar`) y `seed` (solo local) |
| `app/scripts/salida/` | Fuera de GitHub: CSV del equipo y de los closers, los 4 de contraseñas, `contraseñas.md` y el CSV de la Biblioteca del 10 oct |
| `app/README.md` | Entrada al proyecto: enlaza este plan y las guías |
