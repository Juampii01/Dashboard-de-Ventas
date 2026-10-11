# Plan · Dashboard de ventas (app Eternity)

> Al día: 11 oct 2026 (noche). Lo ya hecho, con todo su detalle (pruebas, cifras, respuestas de cada ronda), está en `plan-historial-10oct.md` y `plan-historial-11oct.md`; la auditoría, en `Arreglar-dashboard.md`. Este plan tiene dónde estamos, lo que falta, las decisiones vigentes y los riesgos.

---

## 1. Dónde estamos

- **LA APP ESTÁ PUBLICADA (11 oct): https://dashboard-de-ventas-iota.vercel.app** y Cristian ya ha entrado como CEO.
- **Lo que hay en la nube:**
  - **GitHub:** repositorio privado `eternitydevzz/Dashboard-de-ventas` (rama `main`).
  - **Supabase:** proyecto «eternity» (ref `crbwqaxpeexeonffuiyo`, East US, plan gratis), con los 30 cambios de base de datos, el registro libre cerrado y «Confirm email» activado (los usuarios se crean ya confirmados).
  - **Vercel:** proyecto `dashboard-de-ventas` en la cuenta gratis (Hobby) `cristianortizmaestria-9940`, unida al GitHub `eternitydevzz`. 4 variables: dirección y publishable de Supabase (Config), secret de Supabase y `CLAVE_CIFRADO` (Secret). Cada cambio que se sube a `main` se publica solo.
  - **Maestria preparada:** 4 pipelines de origen (Webinar 1, Biblioteca Recursos, Orgánico, DFY AI Services), «Callers» (7 columnas, con «Link enviado») y «Closers» (13), y 4 productos (Membresía 47 $, Grupal 1.997 $, VIP 4.997 $, DFY a medida).
  - **Equipo creado:** 10 personas (CEO «Cris y José», Juan y Junior directores con Administración, 5 callers y 2 closers) + 2 perfiles de prueba (closer-test y caller-test). Contraseñas solo en `scripts/salida/usuarios-creados-2026-10-11-13-38.csv` y `…-13-46.csv` (fuera de GitHub).
- **Comprobado en la nube:** el login carga (200) y Cristian entra; las cabeceras de seguridad están (CSP, HSTS, X-Frame-Options…); el webhook de GHL responde. **Sin comprobar todavía:** velocidad con datos, subir PDF y CSV, límite de intentos y la consola del navegador (4.2).
- **En local:** 436 tests (431 + 5 de emails; con Docker apagado solo se pasan los 192 rápidos), la app compila, 30 cambios de base de datos.
- **Docker apagado por defecto** (Cristian, 11 oct: consume mucha RAM). Se enciende 5 minutos solo para pasar los tests de integración antes de un cambio importante.
- **Sin Resend** (decisión de Cristian, 11 oct): no hay enlaces mágicos ni cambio de email por correo; el equipo entra con email y contraseña.
- **«Terminado»** = el equipo real entra en la app publicada (ordenador o móvil), los leads de GHL llegan solos, los avisos de los reportes llegan, y un caller y un closer trabajan un día real sin problemas.

## 2. Pendiente de que decidas tú

| Qué | Mi propuesta |
|---|---|
| Mis criterios (sección 6.2) | Revisarlos cuando recorras la app. |
| Pasar Vercel a Pro (el plan gratis es para uso no comercial, según sus condiciones; sin volver a comprobar hoy) | Cuando tengas una tarjeta que funcione: se mueve el proyecto o se conecta la otra cuenta. |
| `calcularVendedores` quedó sin uso en la app (solo lo usan 3 tests) | Quitarlo con sus tests cuando haya un rato. |
| En Proyecto Prueba (local) queda una venta antigua de prueba (9 oct) a nombre del CEO (Ana sale con «1 cerrada · 0 €») | Borrarla o pasarla a Ana; solo afecta a las pruebas en local. |

## 3. Lo siguiente, en orden

| # | Qué | Quién | Estado |
|---|---|---|---|
| 1 | Pasada de punta a punta (Proyecto Prueba, 1.005 leads) | Cristian, Claude guió | ✅ Hecha (11 oct) |
| 2 | Mejoras de la 4.4 antes de publicar (los 4 puntos de la pasada y agendar por link de GHL) | Claude | ✅ Hechas (11 oct) |
| 3 | **Publicar** (4.2) | Los dos | ✅ Publicada (11 oct); faltan las comprobaciones de 4.2 |
| 4 | **Bloque 6 · Resend** (4.1) | Los dos | **Casi**: código publicado (`e2fefba`), clave puesta, dominio en «Pending» (verificando DNS). Falta «Verified» y la prueba real |
| 5 | **Link de agenda** | Claude | ✅ `https://codigomaestria.com/agenda` (la landing con el calendario), puesto en Maestria (11 oct) |
| 6 | **Conectar GHL** (4.3): workflows de lead nuevo y cita agendada, token, calendarios | Los dos | **Siguiente** (Cristian ya está dentro de GHL) |
| 7 | **Subir los leads reales** a Maestria (exportación nueva de GHL → CRM → Biblioteca Recursos) | Cristian, Claude comprueba | Pendiente |
| 8 | **Mandar los accesos al equipo** por WhatsApp y borrar los 2 archivos de contraseñas | Cristian | Pendiente |
| 9 | Comprobaciones de la nube que faltan (4.2) | Claude | Pendiente |
| 10 | Mejoras de después de publicar (4.4): cerrar moviendo a «Cerrados» y zona horaria | Claude | Pendiente |
| 11 | **Día real** con un caller y un closer, y ajustes | Los dos | Al final |

---

## 4. Lo que me falta a mí (Claude)

**Cómo trabajo en cada paso:** tests que fallen si se rompe la regla, la app compila, prueba en pantalla en Proyecto Prueba (datos «PRUEBA» borrados al terminar), plan y guías al día, te lo enseño y commit. **Yo no pego claves ni contraseñas ni creo cuentas:** eso lo haces tú (te lo dejo preparado).

### 4.1 Bloque 6 · Emails con Resend (11 oct, en marcha)
**Decisiones de Cristian (11 oct):** remitente `Eternity <no-reply@eternity.llc>` (dominio raíz, no subdominio); la app manda ella misma los emails con Resend (no se toca el correo de Supabase); se hace todo el bloque.
- [x] Dominio `eternity.llc` añadido en Resend (región North Virginia); registros en GoDaddy con «Auto configure»: `send` y `rsend` (CNAME) y `resend._domainkey` (TXT). El correo de Google Workspace (MX y SPF de la raíz) no se ha tocado.
- [ ] **Resend: dominio «Verified».** Los 3 registros ya responden en GoDaddy (comprobado con dig en ns71 y ns72); Resend está en «Pending · Checking DNS» (dice que puede tardar horas). Hasta entonces Resend rechaza los envíos.
- [x] Código: `src/lib/email.ts` (envío con Resend), los avisos de reportes también por email al CEO y a los directores, «Enviar enlace mágico» activo en la ficha (solo administradores), página `/auth/confirm` que recibe el enlace (caduca en 1 h, un solo uso) y aviso en el login si el enlace no vale. 5 tests nuevos (servidor local en lugar de Resend); probado en local que el enlace crea la sesión y no se puede reutilizar.
- [x] `APP_URL` puesta en Vercel. `.env.example`, `GUIA-PUBLICAR.md` (paso 4 bis) y `GUIA-GHL.md` (el email ya no hace falta en GHL) al día.
- [x] **`RESEND_API_KEY` en Vercel** (la creó y la pegó Cristian) y publicado otra vez (`ed40af6`). Comprobado en la nube que `/auth/confirm` responde.
- [ ] Probar de verdad: un enlace mágico a Cristian y un reporte de prueba.

### 4.2 Publicar (sigo `GUIA-PUBLICAR.md`)
- [x] Código en GitHub (repositorio privado `eternitydevzz/Dashboard-de-ventas`).
- [x] Base en Supabase con los 30 cambios y el registro libre cerrado. Al subirlos falló uno (`gen_random_bytes` necesita `extensions.` en la nube); arreglado en `cc562d0`.
- [x] Vercel con sus 4 variables y publicado. Sin la de Resend (aplazado).
- [ ] ~~Resend: verificar eternity.llc~~ → aplazado (4.1).
- [x] Maestria preparada (simulación y de verdad); la base creó sola «Callers» y «Closers».
- [x] Equipo real (10) y los 2 perfiles de prueba creados (los lanzó Cristian).
- [x] Cristian entra como CEO en la app publicada.
- [ ] **Medir la velocidad en la nube** con los leads ya subidos (en local, el Funnel con 30.000 leads carga en ~1 s). Si va lenta, se arregla.
- [ ] Comprobar en la nube: subir PDF y CSV, límite de intentos de login y que la consola del navegador no da errores. (HTTPS y cabeceras: ✅ comprobado.)
- [ ] Ajustes de Vercel: región de las funciones junto a Supabase (Washington, iad1) ⚠ comprobar en Settings → Functions.
- [ ] Repasar contigo la lista «Comprobar al terminar» de la guía.
- [ ] Dejar la app lista con tus datos: link de agenda, reparto, horarios, comisiones, permisos, IA, onboarding, Finanzas, links y recursos.
- [ ] Actualizar la herramienta de Supabase de mi Mac (de la 2.90 a la 2.120) cuando ejecutes `brew trust supabase/tap`. Hoy funciona con la 2.90.

### 4.3 Conectar GHL (sigo `GUIA-GHL.md`)
- [ ] **Antes de nada, comprobar que GHL manda todas las citas** (su lista no va por páginas): si llegara incompleta, la app cancelaría citas buenas. Se prueba con un closer con muchas citas antes de activar la sincronización para todos.
- [ ] Workflows: «Lead nuevo» y **«Cita agendada» (imprescindible: es el que da la agenda a los callers con el sistema del link)**; «Cambio de etapa» si hace falta; avisos de reportes. Comprobar en Administración → Integraciones → «Últimos eventos».
- [ ] Token de GHL y calendarios de cada closer (Administración → Integraciones y ficha de cada closer). El token lo pegas tú.
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

**Después de publicar (Cristian, 11 oct):**
- [ ] **Cerrar moviendo la tarjeta:** al soltar en «Cerrados» de cualquier CRM se abre «Registrar venta»; al guardar queda cerrada en todos (lead, Callers, «Cerradas» de Post-call y la cita) y cuenta en Funnel, Ventas y comisiones; si se cancela, vuelve a su sitio. Solo closers, directores y CEO.
- [ ] **Cambiar la zona horaria del proyecto** (6.1). Lo comprobado: la zona es `proyectos.zona_horaria` (solo Nueva York y Madrid); las citas guardan el momento exacto; los horarios guardan la hora del reloj (hay que convertirlos); los reportes, solo el día; 39 archivos usan la zona. **Ojo:** entre Nueva York y Madrid no siempre hay 6 h (unas semanas, 5 h) y un horario puede pasar al día siguiente al convertirlo; probar los dos casos.

---

## 5. Lo que te toca a ti (Cristian)

### Ahora
- [ ] **Subir los leads:** exportación nueva de GHL (todos los contactos) → app → CRM → pipeline **Biblioteca Recursos** → Subir CSV → Importar (sin marcar «Repartir»). Pásame el mensaje verde y lo compruebo.
- [x] Link de agenda: `https://codigomaestria.com/agenda` (puesto, 11 oct).
- [ ] **Mandar a cada persona su acceso por WhatsApp** (dirección, email y contraseña de `usuarios-creados-…csv`) y después **borrar los 2 archivos** de contraseñas (lo haces tú).
- [ ] Guardar en tu gestor de contraseñas lo de `scripts/salida/contraseñas.md` (contraseña de la base y `CLAVE_CIFRADO`) y la secret de `.env.produccion`. Si `CLAVE_CIFRADO` se pierde, hay que volver a pegar el token de GHL y las claves de Fathom.

### Para conectar GHL
- [ ] El token de GHL (Private Integration) y los ids de calendario de cada closer (los pegas tú).
- [ ] Crear en GHL los workflows que te indique.

### Cuando puedas
- [ ] Crear la cuenta de Resend y conseguir que alguien añada los DNS de eternity.llc (para el bloque 6).
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
| Nube | Planes gratuitos para empezar (Supabase gratis; Vercel Hobby mientras no funcione la tarjeta) y la dirección gratuita de Vercel (sin dominio propio). Publicada sin Resend. |
| Equipo real | Creado con `scripts/salida/equipo.csv`. Una sola cuenta CEO para «Cris y José»; Juan y Junior, directores con Administración. Los accesos los manda Cristian por WhatsApp. |
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
| Emails | Resend desde eternity.llc para enlaces mágicos, cambio de email y avisos; sin email de bienvenida. Aplazado hasta tener la cuenta y los DNS. |
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
- Un lead que vuelve a entrar mantiene su primer origen y suma etiquetas y respuestas; sin email se le reconoce por el teléfono (últimas 9 cifras).
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

---

## 8. Riesgos y avisos

**Pueden hacer daño el primer día:**
- **Citas de GHL:** su lista no va por páginas; si llegara incompleta, la app cancelaría citas buenas (4.3). Y con el agendar por link, **sin el workflow «Cita agendada» ningún caller suma agendas**.
- **Velocidad en la nube:** sin medir con datos (4.2).
- **Sin Resend:** no hay enlaces mágicos ni cambio de email por correo; si alguien olvida su contraseña, se la cambia un administrador desde su ficha.

**A tener en cuenta:**
- **Vercel Hobby** (gratis) es para uso no comercial según sus condiciones (no comprobado hoy): pasar a Pro cuando se pueda. Solo publica commits firmados por `eternitydevzz` (ya configurado en este repositorio).
- **Contraseñas en archivos de texto** (`scripts/salida/contraseñas.md`, `usuarios-creados-….csv`, `.env.produccion`): fuera de GitHub, pero en tu Mac sin cifrar. Pasar lo importante a un gestor de contraseñas y borrar los de usuarios cuando estén enviados.
- **Supabase gratuito:** sin copias de seguridad garantizadas y puede pausarse si no se usa (límites exactos sin comprobar).
- **Clave de cifrado:** si se pierde, hay que volver a pegar el token de GHL y las claves de Fathom.
- **Recordatorios de GHL:** si se reagenda en la app una cita que vino de GHL, GHL sigue recordando al lead la hora vieja salvo que se cambie también allí.
- **GHL:** algunas variables no están documentadas; puede que director y CEO tengan que ser contactos de GHL para recibir avisos (sin comprobar); la app no puede lanzar llamadas.
- **Llamadas de los callers:** solo cuentan las hechas desde GHL (no WhatsApp ni su móvil).
- **Post-call:** mover una cita «reagendada» puede contar la misma reunión dos veces; sacar una venta de su columna la borra con sus cobros y comisiones (pide confirmación).
- **Citas:** un lead puede tener dos citas a horas distintas.
- **Onboarding de closers:** si dos closers le venden al mismo cliente, comparten la checklist.
- **Clave del webhook en la dirección** (tu decisión): puede quedar en registros intermedios; la guía recomienda mandarla en la cabecera.
- Riesgos bajos: los estilos admiten código en línea; el diseño glass puede ir algo más lento en equipos viejos.

---

## 9. Cómo entrar y dónde está cada cosa

- **La app publicada:** https://dashboard-de-ventas-iota.vercel.app (tu acceso: `info@eternity.llc`, contraseña en `scripts/salida/usuarios-creados-2026-10-11-13-38.csv`, fila «Cris y José»).
- **Paneles:** Vercel → proyecto `dashboard-de-ventas` (cuenta `cristianortizmaestria-9940`) · Supabase → proyecto «eternity» (organización «eternitydevzz's Org»; el otro proyecto, «creatuagencia-maestria», no es de esta app) · GitHub → `eternitydevzz/Dashboard-de-ventas`.
- **Claves:** `scripts/salida/contraseñas.md` (contraseña de la base y `CLAVE_CIFRADO`) y `.env.produccion` (secret de Supabase, para los scripts). Ninguno se sube a GitHub.
- **En local:** abrir Docker Desktop → servidor `eternity-dashboard` → http://localhost:3100 (versión compilada: `eternity-produccion` → http://localhost:3200; los dos en `PROYECTOS/GENERAL/.claude/launch.json`). Si el login falla, primero `open -a Docker`; si sale el diseño viejo, borrar `app/.next/dev` (con permiso) y reiniciar.
- **Usuarios de prueba en local** (`@eternity.test`, contraseña en `scripts/seed.mjs`): ceo@, director@ (con Administración), closer1@ (Ana), closer2@, caller1@ (Carla), caller2@, caller3@, caller4@.
- **Datos locales:** Maestria = 1.005 leads reales de la Biblioteca (no se toca en las pruebas). Proyecto Prueba = donde pruebo.
- **Para programar:** toda ventana nueva va dentro de `<Portal>`.

| Dónde | Qué |
|---|---|
| `app/docs/plan.md` | Este plan |
| `app/docs/plan-historial-10oct.md` · `plan-historial-11oct.md` | Copias históricas, con todo el detalle de lo hecho (no se tocan) |
| `app/docs/GUIA-PUBLICAR.md` · `GUIA-GHL.md` | Cómo publicar y cómo conectar GHL |
| `app/docs/Arreglar-dashboard.md` | La auditoría (36 puntos) |
| `app/scripts/` | `preparar-proyecto`, `crear-usuarios`, `limpiar-pruebas` (simulan sin `--confirmar`) y `seed` (solo local) |
