# Plan · Dashboard de ventas (app Eternity)

> Al día: 11 oct 2026. Lo ya hecho, con todo su detalle (pruebas, cifras, respuestas de cada ronda), está en `plan-historial-10oct.md` y `plan-historial-11oct.md`; la auditoría, en `Arreglar-dashboard.md`. Este plan solo tiene lo que falta, las decisiones vigentes y los riesgos.

---

## 1. Dónde estamos

- **La app está hecha y probada en local, sin publicar.** Incluye v1, v2, la auditoría, el Paso H, el Paso 0 y el 1.0 menos el bloque 6. Lo hecho y su commit, en la sección 7.
- **Comprobado el 11 oct:** 424 tests automáticos pasan, la app compila sin errores, 0 fallos de seguridad conocidos en las librerías, 29 cambios de base de datos (todos aplicados en local) y 43 tablas protegidas. Todo guardado en git; nada subido a la nube.
- **Revisión cruzada del 11 oct** (app, guías y plan): las 31 pantallas cargan sin errores en Proyecto Prueba y las 29 de Maestria, en menos de 0,7 s; `preparar-proyecto` y `crear-usuarios` funcionan en simulación y los campos de `proyecto-base.json` existen en la base; no quedan restos de lo que se quitó; las cifras de la Biblioteca de la guía cuadran con la base; los textos de pantalla que citan las guías existen. Puestas al día las 2 guías (fecha, onboarding con horario, la ficha de cada persona, preguntas editables).
- **No se publica hasta que esté todo** (Cristian, 11 oct).
- **«Terminado»** = el equipo real entra en la app publicada (ordenador o móvil), los leads de GHL llegan solos, los avisos de los reportes llegan, y un caller y un closer trabajan un día real sin problemas.

## 2. Pendiente de que decidas tú

| Qué | Mi propuesta |
|---|---|
| Mis criterios (sección 6.2) | Revisarlos en tu revisión (paso 3). |

Decidido el 11 oct: la pasada de punta a punta se prepara ya; la lista de «imprescindible para publicar» (4.2) se queda tal cual; las 3 mejoras de la 4.4 van **antes de publicar**, y la zona horaria, como dice la 6.1. Resend sigue sin cuenta ni DNS.

## 3. Lo siguiente, en orden

| # | Qué | Quién | Estado |
|---|---|---|---|
| 1 | **Pasada de punta a punta contigo**: CSV → reparto → caller → agenda → venta → Funnel, con los 1.005 leads de la Biblioteca, en Proyecto Prueba. | Cristian la hizo, Claude guió y comprobó en la base | **Hecha (11 oct)**: funciona y los números cuadran; salieron 6 mejoras (4.4) y el cambio de agendar por link de GHL. Datos de la pasada borrados con permiso (las 37 tablas como antes). |
| 2 | **Bloque 6 · Emails con Resend** (sección 4.1) | Claude | Bloqueado: falta la cuenta de Resend y los DNS (5.1) |
| 3 | **Tu revisión completa** (5.2) y arreglar lo que salga | Cristian, luego Claude | Después de la pasada, a la vez que el 2 |
| 4 | **Las mejoras de la 4.4**, en su orden (primero los 4 puntos de la pasada, luego agendar por link de GHL, luego el resto), una a una, con su commit | Claude | **Siguiente** (Cristian, 11 oct: antes de publicar) |
| 5 | **Publicar** (sección 4.2) | Los dos | Después de 1, 2, 3 y 4 |
| 6 | **Conectar GHL** (sección 4.3) | Los dos | Después de publicar |
| 7 | **Día real** con un caller y un closer, y ajustes | Los dos | Al final |

---

## 4. Lo que me falta a mí (Claude)

**Cómo trabajo en cada paso:** tests que fallen si se rompe la regla, la app compila, prueba en pantalla en Proyecto Prueba (datos «PRUEBA» borrados al terminar), plan y guías al día, te lo enseño y commit.

### 4.1 Bloque 6 · Emails con Resend (commit propio)
- [ ] Envío de emails desde la app con la clave de Resend: los avisos de los reportes por email (el WhatsApp sigue por el workflow de GHL).
- [ ] Supabase manda sus emails (enlaces mágicos y cambios de email) por Resend, desde @eternity.llc. Sin email de bienvenida: los accesos los mandas tú por WhatsApp.
- [ ] Activar «Enviar enlace mágico» en la ficha de cada persona (hoy está desactivado esperando este bloque).
- [ ] Poner al día `.env.example`, `GUIA-PUBLICAR.md` (crear la cuenta, verificar eternity.llc, la clave en Vercel y en Supabase, «Si algo falla») y `GUIA-GHL.md` Parte 2.
- En local no se pueden mandar emails reales: se prueba con un envío falso en los tests y de verdad al publicar.
- Datos de Resend ([su guía](https://resend.com/docs/send-with-supabase-smtp)): servidor `smtp.resend.com`, puerto 465, usuario `resend`, la clave como contraseña y el dominio verificado.

### 4.2 Publicar (sigo `GUIA-PUBLICAR.md`)
**Imprescindible** (sin esto no se publica):
- [ ] Subir el código a GitHub (repositorio privado).
- [ ] Crear la base en Supabase con los 29 cambios (más el del bloque 6, si lo hay), con el registro libre cerrado.
- [ ] Configurar Vercel con sus variables (incluida la de Resend) y desplegar.
- [ ] Resend: verificar eternity.llc y probar un enlace mágico y un aviso de reporte de verdad.
- [ ] Preparar Maestria: primero simulando, comprobar que crea los pipelines «Callers» y «Closers», y luego de verdad.
- [ ] Crear el equipo real con `scripts/salida/equipo.csv` (ya hecho y simulado; las contraseñas, solo en esa carpeta) y los 2 perfiles de prueba.
- [ ] **Medir la velocidad en la nube** (en local, el Funnel con 30.000 leads carga en ~1 s). Si va lenta, se arregla antes de seguir.
- [ ] Comprobar en Vercel lo que en local no se puede: subir PDF y CSV, límite de intentos, HTTPS y que la consola no da errores.
- [ ] Repasar contigo la lista «Comprobar al terminar» de la guía.

**Después de publicar** (no la bloquea):
- [ ] Subir los contactos de GHL (con el CSV nuevo que me pases).
- [ ] Dejar la app lista con tus datos: reparto y rotación, horarios, comisiones, permisos, IA, onboarding, Finanzas, links y recursos.
- [ ] Actualizar la herramienta de Supabase de mi Mac (de la 2.90 a la 2.120) cuando ejecutes `brew trust supabase/tap`. Hoy funciona con la 2.90.

### 4.3 Conectar GHL (sigo `GUIA-GHL.md`)
- [ ] **Antes de nada, comprobar que GHL manda todas las citas** (su lista no va por páginas): si llegara incompleta, la app cancelaría citas buenas. Se prueba con un closer con muchas citas antes de activar la sincronización para todos.
- [ ] Guiarte en los workflows («Lead nuevo», «Cita agendada», «Cambio de etapa» si hace falta y avisos de reportes) y comprobarlo en Administración → Integraciones → «Últimos eventos».
- [ ] Ajustar las 16 marcas «⚠ comprobar» de las guías con tus pantallas de GHL, Supabase y Vercel.
- [ ] Landings directas: una entrada por landing en Administración → Entradas.
- [ ] Probar con GHL real lo que solo se ha simulado: lead por teléfono, cita sin id sin duplicar, closer que no es del proyecto, cita borrada en GHL → «cancelada», avisos al CEO aunque no sea miembro y que un segundo reporte del día no repita el aviso.
- [ ] Probar con las claves reales: calendario de GHL, llamadas de GHL con Deepgram, Fathom y la IA (análisis, coach y puntuación).
- [ ] Medir el gasto real de Claude y Deepgram los primeros días (calculado ~0,05-0,08 $ por llamada de 1 hora, sin medir).

### 4.4 Mejoras (Cristian, 11 oct: antes de publicar; paso 4)
**Lo primero (salió en la pasada del 11 oct; antes de cada uno, preguntar a Cristian cómo lo quiere):**
- [x] «Repartir» apagado sin explicación → **hecho (11 oct)**: la vista previa sale sola al abrir y se recalcula con cada cambio; sin botón «Ver reparto». Sin filtro con leads, el botón dice «No hay leads que repartir con esos filtros»; con número no válido, «Pon un número de 1 o más». Probado en pantalla en Proyecto Prueba (con Carla, reparto real de 1 lead, deshecho después).
- [x] La ficha del lead deja registrar la venta antes de la hora de la cita → **hecho (11 oct)**, decisión de Cristian: la venta se guarda y la cita se cierra con la hora de ahora («Cita adelantada: era el 12 oct, 16:00» en el historial), así cuenta como asistida hoy. La sincronización de GHL ya no cambia hora, closer ni estado de una cita terminada en la app (si no, devolvería la adelantada a su hora). 3 tests nuevos; probado en pantalla con Ana en Proyecto Prueba y borrado después. Detalle: si luego se borra esa venta, la cita vuelve a «seguimiento» con la hora adelantada (la original queda en el historial).
- [ ] «Ventas» (Vendedores) y «Cerradas» (KPIs por persona) dan números distintos para la misma persona: una cuenta ventas a su nombre y la otra sus citas que acabaron en venta (pasa cuando un director registra la venta en la cita de un closer). Unificar o renombrar.
- [ ] El método de pago sale «Stripe» por defecto.

**Después: agendar por link de GHL (Cristian, 11 oct, tras hablar con el equipo):**
- [ ] El caller manda al lead el link del calendario de GHL y el lead reserva solo. En la app el caller solo marca «Link enviado» (sin hora ni closer).
- [ ] Cuenta como **agendado** (Funnel y KPIs del caller) solo cuando llega la cita de GHL; la hora y el closer salen de GHL.
- [ ] Quitar la rotación de closers (% por closer y los 3 modos, hecha en `0f6c688`): el closer lo pone GHL.
- [ ] Los directores y el CEO pueden seguir creando una cita a mano en la app (hora y closer), por ejemplo si el lead llama directamente.
- [ ] Reagendar: las citas de GHL se reagendan en GHL (la app se pone al día sola; el botón de la app lo explica y no deja); las hechas a mano en la app, en la app. Motivo: la app solo lee el calendario de GHL y en cada sincronización manda la hora de GHL.
- Quitadas del plan por este cambio: «calendario real del closer al agendar» y «que dos agendas no den el mismo closer» (los controla el calendario de GHL).
- Solo se puede probar de verdad al publicar y conectar GHL; en local, con citas de GHL simuladas.

**Después:**
- [ ] **(Después de la pasada · Cristian, 11 oct)** Cerrar moviendo la tarjeta: al soltar una tarjeta en «Cerrados» de cualquier CRM se abre «Registrar venta» (producto, facturación, cash); al guardar queda cerrada en todos (estado del lead, Callers, «Cerradas» de Post-call y la cita) y cuenta en Funnel, Ventas y comisiones; si se cancela, la tarjeta vuelve a su sitio. Solo closers, directores y CEO (los callers no pueden soltar en «Cerrados»). Visto en la pasada: hoy mover a «Cerrados» no registra nada y la venta no cuenta.
- [ ] Que un administrador pueda cambiar la zona horaria del proyecto, como dice la 6.1. Lo comprobado hoy: la zona es `proyectos.zona_horaria` y la base solo acepta Nueva York y Madrid; las citas guardan el momento exacto (no se mueven, solo se ven en otra hora); los horarios guardan la hora del reloj sin zona (estos son los que hay que convertir); los reportes guardan solo el día; 39 archivos usan la zona. **Ojo al hacerlo:** la diferencia entre Nueva York y Madrid no es siempre 6 h (unas semanas de marzo y de octubre-noviembre es 5 h, por los cambios de hora), y un horario puede pasar al día siguiente al convertirlo (20:00-23:00 en Nueva York = 02:00-05:00 del día siguiente en Madrid). Hay que probar los dos casos.

---

## 5. Lo que te toca a ti (Cristian), en orden

### 5.1 Ya, porque bloquea el bloque 6
- [ ] Crear la cuenta de Resend y pasarme su clave.
- [ ] Conseguir a alguien que añada los registros DNS de eternity.llc (puede tardar en activarse: cuanto antes, mejor).

### 5.2 Tu revisión (se puede hacer ya)
- [ ] Ver conmigo la pasada de punta a punta (paso 1 de la sección 3).
- [ ] Recorrer la app con los usuarios de prueba (sección 9). Lo nuevo del 1.0: Biblioteca (KPIs), «Mi perfil», horarios, reparto y rotación (Administración → Proyecto y reparto), Comisiones y Reportes (Administración), la ficha de cada persona (Equipo), «Onboarding» de los closers y Links y recursos.
- [ ] Arrastrar tarjetas **con tu ratón** en el CRM («Callers» y «Closers» también), en Agendas → Pre-call y en Post-call. Yo solo pude simularlo.
- [ ] Mirar el diseño en tu móvil (misma wifi, la IP del Mac en vez de `localhost`).
- [ ] Revisar mis criterios (sección 6.2) y decirme cuáles cambio.

### 5.3 Para publicar
- [ ] Crear las cuentas de GitHub, Supabase y Vercel (te guío paso a paso).
- [ ] Guardar la clave de cifrado en tu gestor de contraseñas cuando la generemos (si se pierde, hay que volver a pegar el token de GHL y las claves de Fathom).
- [ ] Mandar a cada persona del equipo su contraseña por WhatsApp.
- [ ] Ejecutar `brew trust supabase/tap` en tu terminal (no es urgente).

### 5.4 Al final
- [ ] El CSV de contactos exportado de GHL.
- [ ] Las claves de GHL, Fathom, Claude y Deepgram (las pones tú a mano).
- [ ] Crear en GHL los workflows que te indique.
- [ ] Que el equipo ponga en la app: objetivos y lanzamientos, contexto del negocio para la IA, links de pago y de dossier, y recursos.
- [ ] Organizar el día real con un caller y un closer.

---

## 6. Decisiones vigentes

### 6.1 Tuyas
| Tema | Decisión |
|---|---|
| Base | Sin Stripe ni pasarelas: cada venta la apunta quien la hace. La app es el CRM; GHL solo envía datos (webhooks, landings, calendarios y llamadas). |
| Aspecto | Diseño glass con granate Eternity y azul Maestria; español de España; dólares y hora de Nueva York por defecto. |
| Nube | Planes gratuitos para empezar y la dirección gratuita de Vercel (sin dominio propio). Los tests de pantallas completas, después de publicar. |
| Equipo real | Se crea al publicar con `scripts/salida/equipo.csv`. Una sola cuenta CEO para «Cris y José»; Juan y Junior, directores con Administración. |
| Roles | Solo el CEO cambia el rol o desactiva a alguien. Administración, Finanzas y Equipo nunca para callers ni closers. Las comisiones las cambian el CEO y los directores (un director, ni la suya ni la de su rol). |
| Permisos | Por sección y por pipeline (Editar / Ver / Sin acceso), por rol o por persona; manda la persona. Una sección de otro rol = solo lo suyo. CEO y director con Administración, siempre todo. |
| CRM | Como GHL: pipelines de origen con sus columnas, «Callers» (por el resultado de la llamada) y «Closers» (Pre-call y Post-call). Las columnas las personaliza el equipo. |
| Clientes | Solo quien ha comprado. |
| Estrellas | Caller: 1 no responde · 2 no sabe nada · 3 interesado · 4 quiere saber más · 5 quiere comprar. Closer: 5 paga ya · 4 con plazo · 3 sin dinero ahora · 2 poco encaje · 1 no califica. |
| Post-call | Todo se mueve a cualquier columna; sacar una venta de su columna la borra (con confirmación); «Cerradas» = pagadas del todo este mes. |
| KPIs | Se cuentan personas; contactado = llamada o WhatsApp; agendar cuenta como contestada; el cash es lo que entró en el periodo (igual en Ventas, Finanzas, Funnel y Agendas); de cada closer, su parte del total en facturación y cash y su % cobrado. «Mi Funnel»: cada caller y closer ve sus objetivos, sus KPIs y su Funnel. |
| Objetivos | Por rol o persona (manda la persona); el del director = equipo entero; semana de lunes a domingo; diario de lunes a viernes por defecto; racha = cumplir todos los diarios. |
| IA | Claude Sonnet 5.5; cada llamada se analiza al unirla a su cita. Llamadas de GHL: las contestadas de más de 1 minuto; si GHL no transcribe, Deepgram. |
| Biblioteca | Primera pestaña de KPIs (director y CEO). Su clasificación («Oferta») es un dato de cada lead que se recalcula solo; no ordena la cola. Cada CSV nuevo pone al día los datos. |
| Productos | Membresía (47 $/mes, sin fin), Grupal (1.997 $), VIP (4.997 $) y DFY (precio personalizado). Cada uno con link de pago y de dossier. |
| Reparto de leads | Solo entre callers. A mano, con el botón (4 formas) o automático al entrar con % por caller que suman 100, apagado y al 0 % por defecto. Con «solo en su horario» y nadie en horario, se reparte igual entre los que tienen %. |
| Zona horaria | La cambia un administrador; solo Nueva York o Madrid. Al cambiarla, los horarios de cada persona se convierten para que sigan a la misma hora real; lo ya guardado por día (reportes, objetivos, rachas) se queda como está (11 oct). |
| Horario | En la hora del proyecto, con la del aparato al lado. Obligatorio en el onboarding de callers y closers; cada uno cambia el suyo en «Mi perfil» y un administrador, el de cualquiera. |
| Llamadas de closers | Duración (30 min por defecto), descanso, aviso mínimo y máximo al día: solo el administrador, generales o por closer. |
| Agendar | (11 oct) Por link de GHL: el caller marca «Link enviado»; cuenta como agendado cuando llega la cita de GHL, con su hora y su closer. Directores y CEO pueden crear citas a mano. Las citas de GHL se reagendan en GHL; las de a mano, en la app. La rotación de closers se quita (4.4). |
| Comisiones | Tramos mensuales en dólares, editables en Administración, sobre toda la facturación del mes; las cuotas, con el % del mes de la venta; se paga sobre lo cobrado. Callers y closers por tramos; CEO y directores con su % propio; interruptor por persona. Las devoluciones no descuentan lo pagado y siguen contando para su tramo. La Membresía no paga comisión ni suma para el tramo (casilla por producto). |
| Ficha de cada persona | La misma en Equipo y en Administración. Datos y comisión para quien tiene Equipo; el resto, solo CEO y directores con Administración. La marca de prueba, solo el CEO; el email lo cambia el administrador directamente. |
| Reporte | Preguntas editables en Administración; del closer, las 3 de las tasas son fijas. Cada reporte guarda sus preguntas. |
| Onboarding de closers | Sus clientes = a quienes les registró una venta. Los puntos los editan el CEO y los directores. |
| Cola del caller | La prioridad A/B/C no ordena; primero los «llamar luego» que ya tocan, luego nuevos, luego «no contesta», y dentro, del más nuevo al más viejo. |
| Emails | Resend desde eternity.llc para enlaces mágicos, cambio de email y avisos; sin email de bienvenida. |
| Lo configura el equipo | Qué `source` de cada landing va a qué pipeline (Administración → Entradas), las columnas del CRM, los pasos de los dos onboardings, las cuentas y categorías de Finanzas, y los links y recursos. |
| Commits | Por bloques; el 6, solo, cuando esté Resend. |

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
- Reparto: vista previa automática antes de repartir (sale sola, sin botón); el tope cuenta como «sin trabajar» Nuevo, No contesta y Llamar luego.
- Reparto y rotación: le toca a quien tiene menos para su %, y la cuenta empieza de cero al cambiar los %.
- Rotación: por defecto apagada y «lo elige quien agenda»; cuenta todas las citas agendadas en la app; un closer sin horario no entra.
- Al reagendar con un closer sin horario, solo se comprueba que no choque con otra cita.
- A un caller o closer, Programas le enseña solo «Tus clientes».
- Los links de los productos (pago y dossier), solo https.
- Si falla guardar el historial de un lead, se apunta en el registro y la acción sigue.

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
| 1.0 · Rotación de closers, comisiones por tramos, «Cuenta para comisión» | `0f6c688` |
| 1.0 · Pasada en pantalla de lo que solo estaba en tests, y arreglo del formulario de landings | `ed4bcce` |
| 1.0 · Ficha de cada persona, reporte editable, onboarding de closers, Links y recursos, cola sin prioridad | `c3bf914` |

---

## 8. Riesgos y avisos

**Pueden hacer daño el primer día** (tienen su paso en la sección 4):
- **Citas de GHL:** su lista no va por páginas; si llegara incompleta, la app cancelaría citas buenas (4.3).
- **Velocidad en la nube:** sin medir (4.2).
- **Emails:** sin Resend no llegan los enlaces mágicos ni el cambio de email (4.1).

**A tener en cuenta:**
- **Supabase gratuito** (tu decisión): sin copias de seguridad garantizadas y puede pausarse si no se usa (límites exactos sin comprobar).
- **Clave de cifrado:** si se pierde, hay que volver a pegar el token de GHL y las claves de Fathom.
- **GHL:** algunas variables no están documentadas; puede que director y CEO tengan que ser contactos de GHL para recibir avisos (sin comprobar); la app no puede lanzar llamadas.
- **Llamadas de los callers:** solo cuentan las hechas desde GHL (no WhatsApp ni su móvil).
- **Post-call:** mover una cita «reagendada» puede contar la misma reunión dos veces; sacar una venta de su columna la borra con sus cobros y comisiones (pide confirmación).
- **Citas:** un lead puede tener dos citas a horas distintas. Con el agendar por link, la app depende aún más de que GHL mande bien las citas (ver «Citas de GHL» arriba).
- **Onboarding de closers:** si dos closers le venden al mismo cliente, comparten la checklist.
- **Clave del webhook en la dirección** (tu decisión): puede quedar en registros intermedios; la guía recomienda mandarla en la cabecera.
- Riesgos bajos: los estilos admiten código en línea; el diseño glass puede ir algo más lento en equipos viejos.

---

## 9. Cómo entrar y dónde está cada cosa

- **En local:** abrir Docker Desktop → servidor `eternity-dashboard` → http://localhost:3100 (versión compilada: `eternity-produccion` → http://localhost:3200; los dos en `PROYECTOS/GENERAL/.claude/launch.json`). Si el login falla, primero `open -a Docker`; si sale el diseño viejo, borrar `app/.next/dev` (con permiso) y reiniciar.
- **Usuarios de prueba** (`@eternity.test`, con la contraseña que pusiste el 10 oct): ceo@, director@ (con Administración), closer1@ (Ana), closer2@, caller1@ (Carla), caller2@, caller3@, caller4@. En Maestria, también closer-test@ y caller-test@eternity.llc (contraseña en `scripts/salida/`).
- **Datos locales:** Maestria = 1.005 leads reales de la Biblioteca, sin ventas, citas ni objetivos (no se toca en las pruebas). Proyecto Prueba = donde pruebo.
- **Para programar:** toda ventana nueva va dentro de `<Portal>`.

| Dónde | Qué |
|---|---|
| `app/docs/plan.md` | Este plan |
| `app/docs/plan-historial-10oct.md` · `plan-historial-11oct.md` | Copias históricas, con todo el detalle de lo hecho (no se tocan) |
| `app/docs/GUIA-PUBLICAR.md` · `GUIA-GHL.md` | Cómo publicar y cómo conectar GHL |
| `app/docs/Arreglar-dashboard.md` | La auditoría (36 puntos) |
| `app/scripts/` | `preparar-proyecto`, `crear-usuarios`, `limpiar-pruebas` (simulan sin `--confirmar`) y `seed` (solo local) |
