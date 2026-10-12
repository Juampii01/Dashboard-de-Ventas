# Plan · Dashboard de ventas (app Eternity)

> Al día: 12 oct 2026. Lo ya hecho, con detalle, está en `plan-historial-10oct.md`, `plan-historial-11oct.md`, la guía `GUIA-GHL.md` («Cómo está montado en Maestria») y en git (`git log`).

**Índice:** 1. Dónde estamos · 2. Plan por fases · 3. Decisiones vigentes · 4. Riesgos · 5. Dónde está cada cosa

---

## 1. Dónde estamos

- **App publicada:** https://dashboard-de-ventas-iota.vercel.app. Cada commit a `main` se publica solo.
- **Funciona en la nube:** login, emails (Resend), subida de CSV, leads de la Biblioteca que entran solos y citas de los 4 calendarios de GHL que entran solas (las que tienen cita van a «Orgánico → Agendados»).
- **Datos de Maestria:** 1.192 leads, **todos sin caller**; 16 citas reales; 0 datos de prueba.
- **Equipo:** 12 personas creadas (CEO, 2 directores, 5 callers, 4 closers). **Nadie ha entrado todavía.**
- **Falta para terminar:** repartir los leads, mandar los accesos y un día real con un caller y un closer.
- **«Terminado»** = el equipo real entra en la app (ordenador o móvil), los leads de GHL llegan solos, los avisos de los reportes llegan, y un caller y un closer trabajan un día real sin problemas.

---

## 2. Plan por fases (acordado con Cristian el 12 oct)

> Salió de `borrador-de-plan.md` (16 puntos de Cristian, con su análisis y sus respuestas). El orden lo decidió Cristian. Sin tiempos estimados.

**Fase 1 · Dominio y accesos (ahora)**
- [x] **Dominio `dashboard.eternity.llc`** (12 oct): añadido en Vercel; CNAME `dashboard` → `2c2ff403e7e26992.vercel-dns-017.com` en GoDaddy (lo añadió Claude con permiso); responde con HTTPS; `APP_URL` cambiada. La dirección `.vercel.app` sigue funcionando (GHL no se rompe; sus workflows se pasan al dominio nuevo con calma). Ojo: la sesión es por dirección; en el dominio nuevo hay que entrar otra vez.
- [x] **Email de acceso** (12 oct, `e55a58b` … ): Administración → Equipo → «Enviar acceso por email» (marcar personas o «Todos los activos»; confirmar en el mismo botón). Enlace de un solo uso que **dura 24 h** (ajuste «Email OTP expiration» de Supabase = 86.400 s; Supabase avisa de que pasa de lo recomendado). Al abrirlo: **pantalla de entrada animada** (logo, saludo, barra ~3 s) → bienvenida (los nuevos crean ahí su contraseña) o «Mi perfil» con el aviso para cambiarla.
- [x] **«¿No puedes entrar? Te mandamos un enlace»** en el login (misma respuesta exista o no el email; 3 por email y 10 por conexión cada hora).
- [x] Probado de verdad (12 oct): email de bienvenida a `info@eternity.llc` → llegó, Cristian entró por el dominio nuevo. **Sin probar todavía:** una persona nueva creando su contraseña en la bienvenida, y «¿No puedes entrar?» con un email real.
- [ ] Alta de **Antonio** (director con Administración): CSV listo en `scripts/salida/director-antonio.csv` y simulado; **falta que Cristian lance** `node --env-file=.env.produccion scripts/crear-usuarios.mjs scripts/salida/director-antonio.csv --confirmar`.
- [ ] Mandar el acceso a los **3 directores** (Juan, Junior y Antonio) cuando Cristian lo diga. Entran solo a familiarizarse, sin tocar nada.
- **Hecha cuando:** los 3 directores han recibido su acceso y han entrado.

**Fase 2 · Velocidad**
- [ ] Medir en la nube cuánto tarda cada pantalla; comprobar la región de Vercel.
- [ ] Que «Individual ↔ Comparativa» y los botones que solo cambian la vista sean instantáneos; señal de «cargando».
- **Hecha cuando:** te enseño las medidas de antes y de después, y lo notas tú en tu Mac.

**Fase 3 · Diseño común** (piezas que usan todas las pantallas)
- [ ] Ventanas propias en vez de las del navegador (las 31 de «… says»).
- [ ] Un solo estilo de selección: interruptor verde para sí/no, pastillas para pocas opciones y desplegable propio para muchas.
- [ ] Barra de filtros que se vea bien en pantallas pequeñas (componente común de 7 pantallas).
- **Hecha cuando:** no queda ninguna ventana «… says» en la app y te enseño las 7 pantallas de la barra con el ancho de tu Mac.

**Fase 4 · CRM como GHL**
- [ ] Tarjeta común en pipelines de origen, Callers y Closers; sin «Mover a…»: solo se arrastra.
- [ ] Casilla en cada tarjeta y acciones masivas: asignar caller/closer, mover de columna o pipeline, etiquetas, exportar y borrar (borrar con confirmación, solo CEO y directores).
- [ ] Pipelines: ordenarlos arrastrando y renombrarlos con doble clic; que «Orgánico → Agendados» no dependa del nombre.
- [ ] **La misma persona en varios pipelines** (una tarjeta por pipeline, como GHL); en Funnel, KPIs y comisiones cuenta como una persona. Después, workflows de lead nuevo de Webinar, Orgánico y DFY, y subir sus CSV.
- **Hecha cuando:** todas las tarjetas se ven iguales, las acciones masivas funcionan en Proyecto «Test» y el CSV de Webinar 1 crea sus tarjetas sin quitarlas de Biblioteca (con las cifras de Funnel comprobadas en la base).

**Fase 5 · Pantallas más estéticas**
- [ ] KPIs (Por persona y Objetivos) en tarjetas visuales; al pulsar a alguien, ventana con su información de esa sección y botón para ir a su ficha (Administración/Equipo).
- [ ] Embudo dibujado en KPIs (Leads → Contactados → Agendados → Asistieron → Cerrados) y el mismo dibujo en Agendas.
- [ ] Equipo: organigrama más visual; pulsar el nombre abre su perfil.
- [ ] Onboarding de los closers: seguimiento visual por cliente y pasos editables en el sitio.
- **Hecha cuando:** te enseño cada pantalla y das el visto bueno.

**Fase 6 · Guion de llamadas** (Cristian pide los guiones de caller y de closer al equipo)
- [ ] Sección de llamadas con el guion por pasos, checklist, pistas, objeciones con respuesta y botones de resultado; editable por director y CEO, que pueden revisar lo que marcó cada uno.
- **Hecha cuando:** los dos guiones están cargados y un caller y un closer de prueba hacen una llamada siguiendo el guion.

**Fase 7 · Otros** (lo que ya estaba en el plan)
- [ ] Comprobaciones de la nube (PDF, límite de login, consola), arreglos pequeños, ids de GHL de los callers y llamadas de GHL, claves de Fathom/Claude/Deepgram, avisos por WhatsApp, cerrar moviendo a «Cerrados», cambiar la zona horaria, pruebas con GHL real de lo simulado.
- [ ] **Tests en GitHub** (Cristian: de lo último). ⚠ Hasta entonces, los cambios de la Fase 4 (varios pipelines) solo los vigilan los tests unitarios y la prueba en pantalla.
- [ ] **Segunda versión, de lo último:** coach con IA que escucha la llamada en directo («DI AHORA», transcripción en vivo).

**Al final del todo · lo de Cristian:** pagar Google Workspace (**antes del 2 nov 2026: quedan 21 días a 12 oct**), guardar las claves en su gestor, usuarios de GHL de los callers, claves de Fathom/Claude/Deepgram, Vercel Pro, repartir los leads, mandar los accesos al resto del equipo y **día real** con un caller y un closer.

**Cómo se pasa de fase:** al terminar cada una te la enseño y no empiezo la siguiente sin tu visto bueno. Sin tiempos estimados (Cristian).

**Decisiones que cambian** (de las decisiones vigentes del plan): «sin dominio propio» → `dashboard.eternity.llc`; «accesos por WhatsApp, sin email de bienvenida» → email de acceso con enlace; «un lead en un solo pipeline» → una tarjeta por pipeline.

**Cómo trabajo en cada paso:** la app compila, tests unitarios (sin Docker hasta los tests en GitHub), prueba en pantalla en la app publicada (proyecto «Test»), plan y guías al día, te lo enseño y commit. **Yo no pego claves ni contraseñas, no creo cuentas y no borro datos en GHL:** eso lo haces tú.

---

## 3. Decisiones vigentes

### 3.1 Tuyas
| Tema | Decisión |
|---|---|
| Base | Sin Stripe ni pasarelas: cada venta la apunta quien la hace. **La app es el CRM; GHL solo trae datos** (webhooks, landings, calendarios y llamadas). |
| Aspecto | Diseño glass con granate Eternity y azul Maestria; español de España; dólares y hora de Nueva York por defecto. |
| Nube | Planes gratuitos para empezar (Supabase gratis; Vercel Hobby mientras no funcione la tarjeta) y, desde el 12 oct, dominio propio **`dashboard.eternity.llc`** (Fase 1; Vercel Hobby lo permite). Emails con Resend (11 oct). |
| Equipo real | Creado con `scripts/salida/equipo.csv`. Una sola cuenta CEO para «Cris y José»; Juan, Junior y **Antonio** (12 oct), directores con Administración. **Cristian y José también son closers** (12 oct), con sus emails de GHL, para las citas de «#1 Maestria founders»; cuentan en KPIs, Ranking y comisiones. Los accesos los manda Cristian por WhatsApp. |
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
| Zona horaria | La cambia un administrador; solo Nueva York o Madrid. Al cambiarla, los horarios de cada persona se convierten para que sigan a la misma hora real; lo ya guardado por día se queda como está. (Por hacer: Fase 7.) |
| Horario | En la hora del proyecto, con la del aparato al lado. Obligatorio en el onboarding de callers y closers; cada uno cambia el suyo en «Mi perfil» y un administrador, el de cualquiera. |
| Llamadas de closers | Duración (30 min por defecto), descanso, aviso mínimo y máximo al día: solo el administrador, generales o por closer (para las citas a mano). |
| Comisiones | Tramos mensuales en dólares, editables en Administración, sobre toda la facturación del mes; las cuotas, con el % del mes de la venta; se paga sobre lo cobrado. Callers y closers por tramos; CEO y directores con su % propio; interruptor por persona. Las devoluciones no descuentan lo pagado y siguen contando para su tramo. La Membresía no paga comisión ni suma para el tramo (casilla por producto). |
| Ficha de cada persona | La misma en Equipo y en Administración. Datos y comisión para quien tiene Equipo; el resto, solo CEO y directores con Administración. La marca de prueba, solo el CEO; el email lo cambia el administrador directamente. |
| Reporte | Preguntas editables en Administración; del closer, las 3 de las tasas son fijas. Cada reporte guarda sus preguntas. |
| Onboarding de closers | Sus clientes = a quienes les registró una venta. Los puntos los editan el CEO y los directores. |
| Cola del caller | La prioridad A/B/C no ordena; primero los «llamar luego» y «link enviado» que ya tocan, luego nuevos, luego «no contesta», y dentro, del más nuevo al más viejo. |
| Emails | (11 oct) La app manda ella misma los emails con Resend, desde `Eternity <no-reply@eternity.llc>` (dominio raíz, decisión de Cristian): el aviso de cada reporte (al CEO y a los directores) y el enlace mágico que un administrador manda desde la ficha (caduca en 1 h, un solo uso). No se toca el correo de Supabase. El cambio de email lo hace un administrador directamente (no manda email). **Cambiado el 12 oct:** los accesos van por **email**, con un enlace de un solo uso para que cada uno cree su contraseña (Fase 1); primero los 3 directores, que entran solo a familiarizarse. |
| GHL (12 oct) | Workflows de la app en la carpeta «1. Dashboard ventas», numerados, **siempre publicados** y con un Wait de 999 días al final. Acción **Webhook normal** (no «Custom webhook», que es premium). Primero leads y después agendas. Calendarios: «#2 Callers» y «#3 Closers» = Andrés y Renzo; «#1 Maestria founders» y «#1 Llamada de Descubrimiento» = Cristian y José (dos calendarios distintos, workflows 3 y 4). **Todo lead con cita de GHL va a «Orgánico → Agendados»** (publicado el 12 oct). El link de agenda de los callers lleva a «#1 Maestria founders». Los leads se suben con CSV (lo hace Cristian). |
| Leads en varios pipelines (12 oct) | Cristian quiere que un lead pueda estar en varios pipelines para ver los números de cada fuente (decidido el 12 oct: una tarjeta por pipeline, como GHL; Fase 4). |
| Lo configura el equipo | Qué `source` de cada landing va a qué pipeline (Administración → Entradas), las columnas del CRM, los pasos de los dos onboardings, las cuentas y categorías de Finanzas, el link de agenda, y los links y recursos. |
| Docker (12 oct) | **No se vuelve a usar Docker.** Los tests de integración irán en GitHub (Fase 7, de lo último). |
| Commits | Por bloques. En este repositorio van firmados por `eternitydevzz` (si no, Vercel Hobby bloquea la publicación). |

### 3.2 Mis criterios (puedes cambiarlos)
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
- Un lead que vuelve a entrar mantiene su primer origen y suma etiquetas y respuestas; sin email se le reconoce por el teléfono (últimas 9 cifras). ⚠ **Cristian quiere cambiarlo** (12 oct): que pueda estar en varios pipelines, con una tarjeta por pipeline (Fase 4).
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

## 4. Riesgos y avisos

**Pueden hacer daño el primer día:**
- **Citas de GHL:** su lista no va por páginas; si llegara incompleta, la app cancelaría citas buenas (Fase 7; la primera sincronización cuadró). Los workflows de citas están publicados: si alguno se despublica, ningún caller suma agendas de ese calendario.
- **Leads sin caller:** los ~1.200 están sin repartir y el reparto automático está apagado: hasta que se reparta, los callers no tienen cola.
- **Solo la Biblioteca entra sola:** un lead nuevo de Webinar, Orgánico o DFY no llega a la app hasta que se cree su workflow o se suba un CSV.
- **Velocidad en la nube:** sin medir con datos (Fase 2).
- **Emails:** funcionan (probado el 11 oct). Dependen de que el correo de Google Workspace siga pagado (aviso: antes del 2 nov 2026).
- **Dominio raíz en Resend** (decisión de Cristian): si algún email de la app se marcara como spam, afectaría también a la reputación del correo normal de @eternity.llc (Google Workspace). Resend recomendaba un subdominio.

**A tener en cuenta:**
- **GHL:** «Custom webhook» es premium y la subcuenta no tiene saldo (aviso «Payment method is missing» en GHL): se usa el Webhook normal. Los workflows solo funcionan **publicados**.
- **Sin tests de integración hasta montarlos en GitHub** (Cristian no quiere Docker): mientras tanto, un cambio en webhooks, reparto, comisiones o permisos solo lo vigilan los 178 tests unitarios y la prueba en pantalla. Los 247 de integración son los que pillaron, por ejemplo, el fallo de la hora de las citas.
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

## 5. Cómo entrar y dónde está cada cosa

- **La app publicada:** https://dashboard-de-ventas-iota.vercel.app (tu acceso: `info@eternity.llc`, contraseña en `scripts/salida/usuarios-creados-2026-10-11-13-38.csv`, fila «Cris y José»).
- **GHL:** subcuenta **Maestria** (Location ID `ZGWJLBH58RJtl2iGhykp`) · workflows en Automation → carpeta **«1. Dashboard ventas»** (0 Biblioteca, 1 Callers, 2 Closers, 3 Founders, 4 Descubrimiento) · Private Integration **«App Eternity (dashboard)»** · en la app: Administración → **Integraciones GHL** (token, ids de closers, «Últimos eventos») y → **Entradas** («GHL · Biblioteca»).
- **Paneles:** Vercel → proyecto `dashboard-de-ventas` (cuenta `cristianortizmaestria-9940`) · Supabase → proyecto «eternity» (organización «eternitydevzz's Org»; el otro proyecto, «creatuagencia-maestria», no es de esta app) · GitHub → `eternitydevzz/Dashboard-de-ventas`.
- **Claves:** `scripts/salida/contraseñas.md` (contraseña de la base y `CLAVE_CIFRADO`) y `.env.produccion` (secret de Supabase, para los scripts). Ninguno se sube a GitHub.
- **En local:** abrir Docker Desktop → servidor `eternity-dashboard` → http://localhost:3100 (versión compilada: `eternity-produccion` → http://localhost:3200; los dos en `PROYECTOS/GENERAL/.claude/launch.json`). Si el login falla, primero `open -a Docker`; si sale el diseño viejo, borrar `app/.next/dev` (con permiso) y reiniciar.
- **Perfiles de prueba en la nube:** closer-test@ y caller-test@eternity.llc (contraseñas en `scripts/salida/usuarios-creados-2026-10-11-13-46.csv`; no cuentan en cifras). Para probar en la nube sin avisar a nadie: añadirlos al proyecto «Test» y quitarlos al acabar.
- **Para Claude con el navegador:** los clics «por referencia» a veces no llegan a la página (comprobado el 11 oct); pulsar por coordenadas. Las ventanas del navegador (`confirm`) las tiene que aceptar Cristian.
- **Usuarios de prueba en local** (`@eternity.test`, contraseña en `scripts/seed.mjs`): ceo@, director@ (con Administración), closer1@ (Ana), closer2@, caller1@ (Carla), caller2@, caller3@, caller4@.
- **Datos locales (Docker, solo en tu Mac):** Maestria = 1.005 leads de la Biblioteca del 10 oct (copia vieja, no se toca en las pruebas). Proyecto Prueba = donde pruebo. **Los datos reales están en la nube.**
- **Proyecto «Test» en la nube** (de Cristian): solo con el CEO; para probar en la nube sin avisar a los directores. Tiene 2 reportes de prueba de caller-test (se dejan: no cuentan en cifras).
- **Docker:** ya no se usa (Cristian, 12 oct). El servidor local (3100/3200) y los tests de integración lo necesitaban; ahora se prueba en la app publicada (proyecto «Test») y los tests de integración irán en GitHub (Fase 7).
- **Para programar:** toda ventana nueva va dentro de `<Portal>`.

| Dónde | Qué |
|---|---|
| `app/docs/plan.md` | Este plan |
| `app/docs/plan-historial-10oct.md` · `plan-historial-11oct.md` | Copias históricas, con todo el detalle de lo hecho (no se tocan). Lo del 11-12 oct (Resend, GHL paso a paso): versión anterior del plan en git, `02aa87f` |
| `app/docs/GUIA-PUBLICAR.md` · `GUIA-GHL.md` | Cómo publicar y cómo conectar GHL |
| `app/docs/Arreglar-dashboard.md` | La auditoría (36 puntos) |
| `app/scripts/` | `preparar-proyecto`, `crear-usuarios`, `limpiar-pruebas` (simulan sin `--confirmar`) y `seed` (solo local) |
| `app/scripts/salida/` | Fuera de GitHub: CSV del equipo y de los closers, los 4 de contraseñas, `contraseñas.md` y el CSV de la Biblioteca del 10 oct |
| `app/README.md` | Entrada al proyecto: enlaza este plan y las guías |
