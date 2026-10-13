# Plan · Dashboard de ventas (app Eternity)

> Al día: 13 oct 2026, 12:20 (hora de España). **Solo lo que falta.** Lo hecho, con todo su detalle (qué, commit y cómo se probó), está en la versión anterior de este plan en git: `git show 607d901:docs/plan.md`; lo más antiguo, en `plan-historial-10oct.md` y `plan-historial-11oct.md`.

**Índice:** 1. Dónde estamos · 2. Lo que falta · 3. Decisiones vigentes · 4. Riesgos · 5. Dónde está cada cosa

---

## 1. Dónde estamos

- **App publicada:** https://dashboard.eternity.llc (también https://dashboard-de-ventas-iota.vercel.app). Cada commit a `main` se publica solo y pasa los **tests en GitHub** (tipos, lint, 217 unitarios y 247 de integración: en verde el 13 oct, `d9ec22e`).
- **Hecho (fases 1 a 7, del 10 al 13 oct):** dominio y accesos por email · velocidad (KPIs 770 → 84 KB, menú sin precargas) · ventanas y selectores propios · Biblioteca con sus 6 respuestas (workflow «0. AP - Biblioteca»: Opportunity Created → Wait 1 min → Webhook con Custom data) · CRM como GHL (tarjeta común, arrastrar columnas y pipelines, «+» de columna, barra masiva con borrar solo para el CEO, varios pipelines por persona con 🔗, columna de citas de GHL elegible, CSV más rápido) · KPIs en tarjetas, embudo dibujado (KPIs y Agendas), organigrama en árbol, onboarding de closers en línea de pasos · botón **«Guion»** (sin «Llamar»), página Guiones, el caller ya no vende · links de pago por programa con la Reserva aparte (los 11 de Stripe, comprobados) · cerrar soltando en «Cerrados» · tests en GitHub · **pipelines iguales que GHL** (13 oct: nombres, orden, columnas y cada lead en su columna de GHL; bloque 0).
- **Migraciones:** todas aplicadas en la nube (13 oct, las lanzó Cristian).
- **Datos de Maestria (13 oct):** 1.370 leads (60 con caller); 17 citas. Por pipeline (con las tarjetas 🔗): Agendas orgánico 27 · Biblioteca 1.358 · Webinar 1 111 · DFY 0. **Equipo:** 14 reales + 2 de prueba; acceso enviado a todos; falta que entren Antonio y los 4 closers. En el organigrama sale un 4.º director, «Thiago», que no estaba en el plan.
- **«Terminado»** = el equipo real entra en la app (ordenador o móvil), los leads de GHL llegan solos, los avisos de los reportes llegan, y un caller y un closer trabajan un día real sin problemas.

---

## 2. Lo que falta (en este orden)

**0 · Ahora, Claude: pipelines de la app iguales que GHL (Cristian, 13 oct)** · objetivo: mismo orden de pipelines, mismas columnas y misma cantidad de leads. Comparación del 13 oct (API de GHL): GHL «0. Agendas órganico» 27 (Form 10 · Agendan 14 · Confirman 0 · No confirman 2 · No show 0 · Cerrados 0 · No cualifican 1 · Seguimiento 0), «1. Biblioteca Recursos» 1.334 (Registrados), «2. Webinar 1» 109 (Optin 8 · Form completo 101 · Nivel 1-3), «3. DFY AI Services» 0 (Agendado); app: Biblioteca 1.343, Orgánico 17, Webinar 1 7, DFY 0.
- [x] Nombres y orden como GHL: «0. Agendas orgánico», «1. Biblioteca Recursos», «2. Webinar 1», «3. DFY AI Services»; «Callers» y «Closers» al final. La tilde de «órganico» se corrige en la app y en GHL.
- [x] Columnas como GHL en Orgánico, Webinar 1 y DFY; se quitan las que GHL no tiene **salvo «Cerrados»**, que se queda en todos (cerrar soltando). **Biblioteca: columnas sin tocar.**
- [x] Leads con cita de GHL → «Agendan» (antes «Orgánico → Agendados»).
- [x] Biblioteca: añadir los leads de GHL que faltan. Los 7 de Webinar 1 y los 17 de Orgánico, cada uno en su columna de GHL.
- [x] Revisar lo que dependía de los nombres (webhook por nombre de pipeline, plantillas, guía) y probarlo en la app.
- **Hecho (13 oct, `d9ec22e`, tests de GitHub en verde):** Cristian lanzó `scripts/igualar-ghl.mjs --confirmar` (Claude no puede escribir en la base de la nube: se lo bloquea el sistema de permisos). 8 leads cambiaron de columna y se crearon 126 tarjetas 🔗; una 2.ª pasada simulada no cambia nada (1.470 bien). Comprobado en pantalla (Playwright): pestañas en el orden de GHL, columnas nuevas y «Cerrados ↔ Vendido» en su sitio. Código: el webhook acepta el nombre sin número ni tildes, agendar a mano mueve a «Agendan», la columna de citas se busca por el nombre nuevo o el viejo, plantilla y guía al día, `proyecto-base.json` con la estructura de GHL (si no, `limpiar-pruebas` habría borrado las columnas nuevas). Tilde corregida también en GHL.
- **Comparación final (GHL → app):** Agendas orgánico 28 → 27 (falta un «Test» de hoy: Orgánico no tiene workflow) · Biblioteca 1.334 → 1.358 (+24 de prueba o ejemplo que GHL no tiene) · Webinar 1 109 → 111 (+2 «Test» en Optin) · DFY 0 → 0. Columnas: todas iguales salvo Biblioteca (sin tocar) y «Cerrados» de más.
- [ ] **Pendiente de Cristian:** ¿borrar los 24 leads de prueba de Biblioteca y los 2 «Test» de Webinar? (entre los 24 hay 4 que parecen reales: David, Aneudy, Thiago, Juan). ¿«No le interesa» del caller debe mover a «No cualifican»? (hoy no mueve en los pipelines de origen). Un lead que llegue por el webhook sin pipeline va ahora a «0. Agendas orgánico» (el primero).

**A · Ahora, Cristian (para seguir)**
- [ ] **Subir el CSV de GHL** (KPIs → Biblioteca → «Subir CSV de leads»): ¿ya no se queda en «Importando…»? (el arreglo de velocidad está puesto, sin probar con tu archivo de 1.282 filas). ¿Quedan al día los leads de la Biblioteca que entraron sin respuestas antes del arreglo?
- [ ] **Subir el CSV de Webinar 1** (prueba de «varios pipelines»): sus tarjetas 🔗 ya están desde el 13 oct (las puso `igualar-ghl` leyendo GHL: 104). Falta decidir si el CSV sigue haciendo falta (serviría para probar la subida y las respuestas); si se sube, el Funnel tiene que seguir contando personas (lo compruebo yo en la base).
- [ ] **Visto bueno en pantalla** de lo nuevo: CRM (tarjetas, arrastrar columnas y pipelines, doble clic para renombrar, barra masiva, «+»), KPIs (por persona y objetivos), embudo (KPIs y Agendas), organigrama, onboarding de closers, botón «Guion» y página Guiones, links de pago, y lo de las fases 2 y 3 en tu Mac (velocidad y la barra de filtros con tu ancho de pantalla).
- [ ] **Contestar:** a) **zona horaria**: dijiste «que se pueda poner cualquier hora y punto, simplifica»: ¿cualquier zona del mundo?, ¿quitar la conversión de los horarios?, ¿otra cosa? b) **coach IA en directo**: ¿desde dónde llaman los callers (móvil, WhatsApp, marcador de GHL en el navegador)? Si la llamada no pasa por el navegador, la app no puede oírla. c) **DFY**: ¿lleva links de pago? d) **Thiago**: ¿lo diste de alta tú como director? e) **móvil**: arrastrar no funciona en el móvil; ¿quieres un «Mover a…» solo para el móvil? f) **Reserva**: ¿vale en su apartado de la ventana o la quieres como un link más de la lista? g) el aviso «Llamar ahora →» de la cola (solo abre el lead): ¿le cambio el texto a «Ver →»?
- [ ] **Guiones reales** de caller y closer (los pides al equipo) y una llamada de prueba de cada uno siguiendo el guion.
- [ ] Revisar en Vercel → Settings → Git la conexión con GitHub (el 12 oct 3 commits no llegaron solos).

**B · Claude, después de tus respuestas**
- [ ] Zona horaria (según lo que contestes).
- [ ] Coach IA en directo (según desde dónde se llame; necesita la clave de Deepgram).
- [ ] Lo que salga de tu visto bueno y de las pruebas con CSV.
- [ ] Comprobar en la base que Antonio y los 4 closers han entrado y terminado la bienvenida.
- [ ] Sin probar todavía (lo pruebo cuando haya datos o me digas): una persona nueva creando su contraseña en la bienvenida; «¿No puedes entrar?» con un email real; el límite de intentos del login; arrastrar pipelines; cerrar soltando en «Cerrados»; KPIs → Objetivos con objetivos puestos; onboarding de closers con clientes; el botón «Guion» visto como caller; la app en el móvil.
- [ ] Pequeño (no tocado): en CRM, «Tablero · Lista» casi no marca cuál está elegido.
- [ ] Vigilar unos días cuántos leads de la Biblioteca llegan sin respuestas (si tardan más de 1 min en el cuestionario); si son muchos, subir el Wait a 3-5 min.

**C · GHL, al final (juntos)**
- [ ] **Justo después del bloque 0: que la app lea de GHL** (pipelines y columna de cada lead por la API; el permiso *View Opportunities* ya está puesto). Decidir antes: **¿quién manda si no coinciden?** (hoy «la app es el CRM»), cada cuánto se lee (Vercel Hobby: límite de tareas programadas sin comprobar) y qué workflows sobran (los de citas, quizá el de Biblioteca; Webinar, Orgánico y DFY ya no harían falta).
- [ ] **Actividad de los leads en GHL** («No activities yet», atribución «CRM Workflows»): la landing no usa formularios de GHL (manda a su `/api/signup` y de ahí al «Inbound Webhook» del workflow viejo), así que GHL no ve ni la visita ni el formulario; por las fechas, seguramente nunca la tuvieron (sin confirmar). Opciones: código de seguimiento externo de GHL en la landing, o arreglar los UTM en «Create contact» del workflow viejo (salen como «ningún paso da este valor»).
- [ ] Workflows de lead nuevo de **Webinar, Orgánico y DFY** (hoy solo entra sola la Biblioteca; el resto, por CSV).
- [ ] Ids de GHL de los callers (sin ellos, sus llamadas de GHL no se atribuyen) y llamadas de GHL.
- [ ] Avisos de los reportes por WhatsApp.
- [ ] Pruebas con GHL real de lo que se probó simulado.
- [ ] Pasar los workflows de GHL a `dashboard.eternity.llc` (hoy apuntan a la dirección `.vercel.app`, que funciona).
- [ ] Idea: que `/api/signup` de la landing mande también las respuestas directamente a la app (sin depender del Wait de GHL).

**D · Lo de Cristian, al final del todo**
- [ ] Pagar Google Workspace **antes del 2 nov 2026** (si no, dejan de salir los emails de la app).
- [ ] Claves de Fathom, Claude y Deepgram (las pegas tú en la app).
- [ ] Usuarios de GHL de los callers.
- [ ] Guardar las claves en tu gestor de contraseñas y borrar los CSV de contraseñas de `scripts/salida/`.
- [ ] Vercel Pro.
- [ ] **Repartir los leads** (los ~1.200 están sin caller; sin reparto, los callers no tienen cola).
- [ ] **Día real** con un caller y un closer.

**Cómo trabajo:** voy en este orden; cada cosa compila, pasa los tests de GitHub, la pruebo en pantalla y la apunto aquí. **Yo no pego claves ni contraseñas, no creo cuentas y no borro datos en GHL:** eso lo haces tú. Las migraciones de la base las lanzas tú (`cd` a la carpeta `app` y `supabase db push`): a mí me lo bloquea el sistema de permisos.

---

## 3. Decisiones vigentes

### 3.1 Tuyas
| Tema | Decisión |
|---|---|
| Base | Sin Stripe ni pasarelas: cada venta la apunta quien la hace. **La app es el CRM; GHL solo trae datos** (webhooks, landings, calendarios y llamadas). |
| Aspecto | Diseño glass con granate Eternity y azul Maestria; español de España; dólares y hora de Nueva York por defecto. |
| Nube | Planes gratuitos para empezar (Supabase gratis; Vercel Hobby mientras no funcione la tarjeta) y, desde el 12 oct, dominio propio **`dashboard.eternity.llc`** (Fase 1; Vercel Hobby lo permite). Emails con Resend (11 oct). |
| Equipo real | Creado con `scripts/salida/equipo.csv`. Una sola cuenta CEO para «Cris y José»; Juan, Junior y **Antonio** (12 oct), directores con Administración. **Cristian y José también son closers** (12 oct), con sus emails de GHL, para las citas de «#1 Maestria founders»; cuentan en KPIs, Ranking y comisiones. Los accesos van por email desde la app (12 oct; antes, por WhatsApp). |
| Roles | Solo el CEO cambia el rol o desactiva a alguien. Administración, Finanzas y Equipo nunca para callers ni closers. Las comisiones las cambian el CEO y los directores (un director, ni la suya ni la de su rol). |
| Permisos | Por sección y por pipeline (Editar / Ver / Sin acceso), por rol o por persona; manda la persona. Una sección de otro rol = solo lo suyo. CEO y director con Administración, siempre todo. |
| CRM | Como GHL: pipelines de origen con sus columnas, «Callers» (por el resultado de la llamada, con «Link enviado») y «Closers» (Pre-call y Post-call). Las columnas las personaliza el equipo. |
| Clientes | Solo quien ha comprado. |
| Estrellas | Caller: 1 no responde · 2 no sabe nada · 3 interesado · 4 quiere saber más · 5 quiere comprar (las pone al marcar «Link enviado»). Closer: 5 paga ya · 4 con plazo · 3 sin dinero ahora · 2 poco encaje · 1 no califica. |
| Agendar | Por link de GHL: el caller marca «Link enviado» con sus estrellas; cuenta como agendado cuando llega la cita de GHL, con su hora y su closer; la agenda es de quien envió el link (si nadie, del caller del lead). Si en 2 días no reserva, vuelve a la cola. Directores, CEO y closers pueden crear citas a mano. **Todas las citas se reagendan y se mueven en la app**, también las de GHL. Sin rotación de closers. |
| Venta | Antes de la hora de la cita: se guarda y la cita se cierra «ahora». Desde la ficha, un jefe sin elegir vendedor la deja a nombre del closer de la cita. Método de pago «Stripe» por defecto. **El caller no registra ventas** (13 oct). En un pipeline de origen, soltar en la columna unida a «Vendido» («Cerrados») abre «Registrar venta». |
| Post-call | Todo se mueve a cualquier columna; sacar una venta de su columna la borra (con confirmación); «Cerradas» = pagadas del todo este mes. |
| KPIs | Se cuentan personas; contactado = llamada o WhatsApp; agendar cuenta como contestada; el cash es lo que entró en el periodo (igual en Ventas, Finanzas, Funnel y Agendas); de cada closer, su parte del total en facturación y cash y su % cobrado. El Funnel tiene una sola tabla por persona («KPIs por persona») y el Ranking usa las mismas reglas. «Mi Funnel»: cada caller y closer ve sus objetivos, sus KPIs y su Funnel. |
| Objetivos | Por rol o persona (manda la persona); el del director = equipo entero; semana de lunes a domingo; diario de lunes a viernes por defecto; racha = cumplir todos los diarios. |
| IA | Claude Sonnet 5.5; cada llamada se analiza al unirla a su cita. Llamadas de GHL: las contestadas de más de 1 minuto; si GHL no transcribe, Deepgram. |
| Biblioteca | Primera pestaña de KPIs (director y CEO). Su clasificación («Oferta») es un dato de cada lead que se recalcula solo; no ordena la cola. Cada CSV nuevo pone al día los datos. |
| Productos | Membresía (47 $/mes, sin fin), Grupal (1.997 $), VIP (4.997 $) y DFY (precio personalizado). Cada uno con su dossier y sus **links de pago en una ventana** (Grupal y VIP: PIF, 2 meses, 4 semanas, 8 semanas y 3 meses; los links están en la migración `20261016120000_links_pago.sql`). La **Reserva** (100 $) es un link aparte que sale en todos menos en la Membresía. DFY: pendiente. |
| Reparto de leads | Solo entre callers. A mano, con el botón (vista previa automática, 4 formas) o automático al entrar con % por caller que suman 100, apagado y al 0 % por defecto. Con «solo en su horario» y nadie en horario, se reparte igual entre los que tienen %. |
| Zona horaria | Hoy: Nueva York por defecto. Cristian (12 oct): «que se pueda poner cualquier hora y punto, simplifica» (pendiente de aclarar, ver 2-A). |
| Horario | En la hora del proyecto, con la del aparato al lado. Obligatorio en el onboarding de callers y closers; cada uno cambia el suyo en «Mi perfil» y un administrador, el de cualquiera. |
| Llamadas de closers | Duración (30 min por defecto), descanso, aviso mínimo y máximo al día: solo el administrador, generales o por closer (para las citas a mano). |
| Comisiones | Tramos mensuales en dólares, editables en Administración, sobre toda la facturación del mes; las cuotas, con el % del mes de la venta; se paga sobre lo cobrado. Callers y closers por tramos; CEO y directores con su % propio; interruptor por persona. Las devoluciones no descuentan lo pagado y siguen contando para su tramo. La Membresía no paga comisión ni suma para el tramo (casilla por producto). |
| Ficha de cada persona | La misma en Equipo y en Administración. Datos y comisión para quien tiene Equipo; el resto, solo CEO y directores con Administración. La marca de prueba, solo el CEO; el email lo cambia el administrador directamente. |
| Reporte | Preguntas editables en Administración; del closer, las 3 de las tasas son fijas. Cada reporte guarda sus preguntas. |
| Onboarding de closers | Sus clientes = a quienes les registró una venta. Los puntos los editan el CEO y los directores. |
| Cola del caller | La prioridad A/B/C no ordena; primero los «llamar luego» y «link enviado» que ya tocan, luego nuevos, luego «no contesta», y dentro, del más nuevo al más viejo. |
| Emails | (11 oct) La app manda ella misma los emails con Resend, desde `Eternity <no-reply@eternity.llc>` (dominio raíz, decisión de Cristian): el aviso de cada reporte (al CEO y a los directores) y el enlace mágico que un administrador manda desde la ficha (caduca en 1 h, un solo uso). No se toca el correo de Supabase. El cambio de email lo hace un administrador directamente (no manda email). **Cambiado el 12 oct:** los accesos van por **email**, con un enlace de un solo uso para que cada uno cree su contraseña (Fase 1); primero los 3 directores, que entran solo a familiarizarse. |
| GHL (12 oct) | Workflows de la app en la carpeta «1. Dashboard ventas», numerados, **siempre publicados** y con un Wait de 999 días al final. Acción **Webhook normal** (no «Custom webhook», que es premium). Primero leads y después agendas. Calendarios: «#2 Callers» y «#3 Closers» = Andrés y Renzo; «#1 Maestria founders» y «#1 Llamada de Descubrimiento» = Cristian y José (dos calendarios distintos, workflows 3 y 4). **Todo lead con cita de GHL va a «0. Agendas orgánico → Agendan»** (antes «Orgánico → Agendados», renombrada el 13 oct; la columna se elige en su «⋯»; un lead que ya estaba en otro pipeline gana su tarjeta allí sin salir del suyo). El link de agenda de los callers lleva a «#1 Maestria founders». Los leads se suben con CSV (lo hace Cristian). |
| Pipelines como GHL (13 oct) | Los pipelines de origen se llaman, se ordenan y tienen las columnas de GHL: «0. Agendas orgánico» (Form · Agendan · Confirman · No confirman · No show · Cerrados · No cualifican · Seguimiento), «1. Biblioteca Recursos» (columnas de la app sin tocar: Nuevos…), «2. Webinar 1» (Optin · Form completo · Nivel 1-3 · Cerrados) y «3. DFY AI Services» (Agendado · Cerrados); después Closers y Callers. **«Cerrados» se queda en todos** (cerrar soltando). Tilde corregida también en GHL. Para el navegador, **siempre Playwright Bridge**. |
| Leads en varios pipelines (12 oct) | Una tarjeta por pipeline, como GHL: el lead tiene su pipeline principal y una tarjeta (🔗) en cada otro por el que entra. Funnel, KPIs y comisiones cuentan personas. |
| CRM (12-13 oct) | Se mueve solo arrastrando (sin «Mover a…»). Borrar en masa, solo el CEO (se salta leads con citas o ventas); asignar, etiquetas, mover y exportar, también los directores. |
| Llamar (13 oct) | Sin botón «Llamar» (llamar desde la app, función futura). Botón **«Guion»**: abre el guion con sus botones de resultado; los guiones los editan CEO y directores en «Guiones». |
| Lo configura el equipo | Qué `source` de cada landing va a qué pipeline (Administración → Entradas), las columnas del CRM, los pasos de los dos onboardings, las cuentas y categorías de Finanzas, el link de agenda, y los links y recursos. |
| Docker (12 oct) | **No se vuelve a usar Docker.** Los tests de integración corren en GitHub. |
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
- Un lead que vuelve a entrar mantiene su primer origen y suma etiquetas y respuestas; si entra por otro pipeline, gana su tarjeta allí. Sin email se le reconoce por el teléfono (últimas 9 cifras).
- Una cita de GHL no saca al lead de su pipeline: gana su tarjeta en la columna de citas; el que nace con la cita entra ya en ella.
- El guion de ejemplo sale hasta que guardéis el vuestro.
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
- **Solo la Biblioteca entra sola:** un lead nuevo de Webinar, Orgánico o DFY no llega a la app hasta que se cree su workflow, se suba un CSV o se lance otra vez `scripts/igualar-ghl.mjs` (lo lanza Cristian; ejemplo: el «Test» de Orgánico del 13 oct). Lo resuelve la lectura desde GHL (bloque C).
- **Lead por webhook sin pipeline:** va al primer pipeline, que desde el 13 oct es «0. Agendas orgánico» (antes Biblioteca). Hoy no afecta: la Biblioteca entra por su Entrada.
- **Móvil:** arrastrar no funciona; en el tablero de Closers no hay otra forma de mover una cita (pendiente de tu respuesta, 2-A).
- **Velocidad en la nube:** medida el 12 oct (Fase 2): 0,6-1,3 s por pantalla; la primera vez tras un rato sin uso, 2-4 s.
- **Emails:** funcionan (probado el 11 oct). Dependen de que el correo de Google Workspace siga pagado (aviso: antes del 2 nov 2026).
- **Dominio raíz en Resend** (decisión de Cristian): si algún email de la app se marcara como spam, afectaría también a la reputación del correo normal de @eternity.llc (Google Workspace). Resend recomendaba un subdominio.

**A tener en cuenta:**
- **GHL:** «Custom webhook» es premium y la subcuenta no tiene saldo (aviso «Payment method is missing» en GHL): se usa el Webhook normal. Los workflows solo funcionan **publicados**.
- **Tests** (13 oct): ya corren solos en GitHub en cada push (217 unitarios + 247 de integración, en verde). Si un push sale en rojo, mirarlo antes de seguir (GitHub → Actions).
- **Vercel Hobby** (gratis) es para uso no comercial según sus condiciones (no comprobado hoy): pasar a Pro cuando se pueda. Solo publica commits firmados por `eternitydevzz` (ya configurado en este repositorio).
- **Contraseñas en archivos de texto** (`scripts/salida/contraseñas.md`, `usuarios-creados-….csv`, `.env.produccion`): fuera de GitHub, pero en tu Mac sin cifrar. Pasar lo importante a un gestor de contraseñas y borrar los de usuarios cuando estén enviados.
- **Supabase gratuito:** sin copias de seguridad garantizadas y puede pausarse si no se usa (límites exactos sin comprobar).
- **Clave de cifrado:** si se pierde, hay que volver a pegar el token de GHL y las claves de Fathom.
- **Recordatorios de GHL:** si se reagenda en la app una cita que vino de GHL, GHL sigue recordando al lead la hora vieja salvo que se cambie también allí.
- **GHL:** algunas variables no están documentadas; puede que director y CEO tengan que ser contactos de GHL para recibir avisos (sin comprobar); la app no puede lanzar llamadas. Columna de citas de GHL: va guardada («0. Agendas orgánico → Agendan»); si se borrara, se busca por nombre («Agendas orgánico» u «Orgánico» → «Agendan» o «Agendados»). Las citas de prueba que siguen en GHL vuelven en cada sincronización.
- **Llamadas de los callers:** solo cuentan las hechas desde GHL (no WhatsApp ni su móvil), y solo se atribuyen si el caller tiene su id de GHL puesto (hoy ninguno).
- **Post-call:** mover una cita «reagendada» puede contar la misma reunión dos veces; sacar una venta de su columna la borra con sus cobros y comisiones (pide confirmación).
- **Citas:** un lead puede tener dos citas a horas distintas.
- **Onboarding de closers:** si dos closers le venden al mismo cliente, comparten la checklist.
- **Clave del webhook en la dirección** (tu decisión): puede quedar en registros intermedios; la guía recomienda mandarla en la cabecera.
- Riesgos bajos: los estilos admiten código en línea; el diseño glass puede ir algo más lento en equipos viejos.

---

## 5. Cómo entrar y dónde está cada cosa

- **La app publicada:** https://dashboard.eternity.llc (también https://dashboard-de-ventas-iota.vercel.app; tu acceso: `info@eternity.llc`, contraseña en `scripts/salida/usuarios-creados-2026-10-11-13-38.csv`, fila «Cris y José»).
- **GHL:** subcuenta **Maestria** (Location ID `ZGWJLBH58RJtl2iGhykp`) · workflows en Automation → carpeta **«1. Dashboard ventas»** (0 Biblioteca, 1 Callers, 2 Closers, 3 Founders, 4 Descubrimiento) · Private Integration **«App Eternity (dashboard)»** (permisos: calendario, contactos, mensajes y, desde el 13 oct, *View Opportunities* para comparar pipelines; mismo token) · en la app: Administración → **Integraciones GHL** (token, ids de closers, «Últimos eventos») y → **Entradas** («GHL · Biblioteca»).
- **Paneles:** Vercel → proyecto `dashboard-de-ventas` (cuenta `cristianortizmaestria-9940`) · Supabase → proyecto «eternity» (organización «eternitydevzz's Org»; el otro proyecto, «creatuagencia-maestria», no es de esta app) · GitHub → `eternitydevzz/Dashboard-de-ventas`.
- **Claves:** `scripts/salida/contraseñas.md` (contraseña de la base y `CLAVE_CIFRADO`) y `.env.produccion` (secret de Supabase, para los scripts). Ninguno se sube a GitHub.
- **Perfiles de prueba en la nube:** closer-test@ y caller-test@eternity.llc (contraseñas en `scripts/salida/usuarios-creados-2026-10-11-13-46.csv`; no cuentan en cifras). Para probar en la nube sin avisar a nadie: añadirlos al proyecto «Test» y quitarlos al acabar.
- **Para Claude con el navegador:** los clics «por referencia» a veces no llegan a la página (comprobado el 11 oct); pulsar por coordenadas. La app ya no usa ventanas del navegador (`confirm`), son propias (Fase 3). En GHL (12 oct) los clics normales a veces se quedan colgados: funciona pulsar con JavaScript sobre el elemento. GHL tarda 15-25 s en cargar y a veces devuelve 404 en la dirección aunque la página carga.
- **Proyecto «Test» en la nube** (de Cristian): solo con el CEO; para probar en la nube sin avisar a los directores. Tiene 2 reportes de prueba de caller-test (se dejan: no cuentan en cifras).
- **Tests:** en GitHub → Actions («Tests»), en cada push. En el Mac no hay base local (sin Docker): se prueba en la app publicada (proyecto «Test»).
- **Para Claude, navegador (Cristian, 13 oct):** para GHL y la app publicada se usa **siempre Playwright con la extensión «Playwright Bridge»** (el Chrome de Cristian, con sus sesiones abiertas); no el navegador de la app de Claude (no tiene la sesión de GHL).
- **Para Claude con Playwright:** si la pestaña está en segundo plano, a veces el primer clic no abre la ventana: repetirlo.
- **Para programar:** toda ventana nueva va dentro de `<Portal>`.

| Dónde | Qué |
|---|---|
| `app/docs/plan.md` | Este plan (solo lo que falta) · lo hecho hasta el 13 oct: `git show 607d901:docs/plan.md` |
| `app/docs/plan-historial-10oct.md` · `plan-historial-11oct.md` | Copias históricas, con todo el detalle de lo hecho (no se tocan). Lo del 11-12 oct (Resend, GHL paso a paso): versión anterior del plan en git, `02aa87f` |
| `app/docs/GUIA-PUBLICAR.md` · `GUIA-GHL.md` | Cómo publicar y cómo conectar GHL |
| `app/docs/Arreglar-dashboard.md` | La auditoría (36 puntos) |
| `app/scripts/` | `preparar-proyecto`, `crear-usuarios`, `limpiar-pruebas`, `igualar-ghl` (simulan sin `--confirmar`) y `seed` (solo local). `igualar-ghl` lo lanza Cristian: `CLAVE_CIFRADO="$(grep 'CLAVE_CIFRADO' scripts/salida/contraseñas.md \| grep -oE '[A-Za-z0-9+/]{43}=' \| head -1)" node --env-file=.env.produccion scripts/igualar-ghl.mjs --confirmar` |
| `app/scripts/salida/` | Fuera de GitHub: CSV del equipo y de los closers, los 4 de contraseñas, `contraseñas.md` y el CSV de la Biblioteca del 10 oct |
| `app/README.md` | Entrada al proyecto: enlaza este plan y las guías |
