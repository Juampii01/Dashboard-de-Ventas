# Plan · Dashboard de ventas (app Eternity)

> Al día: 16 oct 2026, 23:00 (hora de España). **Solo lo que falta.** Lo hecho, con todo su detalle (qué, commit y cómo se probó), está en las versiones anteriores de este plan en git (`git show 607d901:docs/plan.md` hasta el 13 oct; `git show 333a636:docs/plan.md`, el del 13 oct por la noche); lo más antiguo, en `plan-historial-10oct.md` y `plan-historial-11oct.md`. **Lo de los canales de las citas (16 oct), en `plan-GHL.md`.**

**Índice:** 1. Dónde estamos · 2. Lo que falta · 3. Decisiones vigentes · 4. Riesgos · 5. Dónde está cada cosa

---

## 1. Dónde estamos

- **App publicada:** https://dashboard.eternity.llc (también https://dashboard-de-ventas-iota.vercel.app). Cada commit a `main` se publica solo (reactivado el 16 oct tras el rollback de Juampi) y pasa los **tests en GitHub** (tipos, lint, 231 unitarios y los de integración; en verde el 16 oct).
- **Hecho del 10 al 13 oct:** dominio y accesos por email · velocidad (primera parte) · ventanas y selectores propios · Biblioteca con sus 6 respuestas · CRM como GHL (tarjeta común, arrastrar columnas y pipelines, barra masiva, varios pipelines por persona con 🔗) · KPIs en tarjetas, embudos, organigrama, onboarding de closers · botón «Guion» y página Guiones · links de pago · cerrar soltando en «Cerrados» · tests en GitHub · pipelines iguales que GHL · popup del lead · Closers sin botones · selector de pipeline · «Link agenda» · KPIs y Agendas fusionados · «Llamadas de GHL» oculto.
- **Hecho el 16 oct (detalle en `plan-GHL.md`):**
  - **PR #1 de Juampi deshecho** (PR #2); de él solo se aprovechó la idea de guardar el origen de cada cita.
  - **Citas de GHL solo por API, cada 30 s** (programador de Supabase → `/api/ghl/leer/[proyecto]`), por calendario («0. Calendar Principal», «#2 Callers», «#1 Maestria founders»), con su **canal por UTM** (callers, yt, ig, p1, email, biblioteca, webinar, dfy, directo, otro), su calendario y su closer por el usuario de GHL. Cancelar solo tras comprobar cada cita en GHL. Un lead vendido sigue vendido. «Confirmación pendiente» no la pisa GHL.
  - **Pipelines nuevos** en la app y en GHL: «0. Agendas General» (todas las citas), Email, Biblioteca, Webinar, DFY y P1 (Píldora 1, solo en la app; en GHL ya existía). Cada cita va a su canal y a General, con la etiqueta «Canal: …».
  - **Filtro por canal** en Agendas (y su exportación), CRM y KPIs; «GHL · YouTube» en lugar de «Calendario GHL».
  - **Workflows de GHL** («2. Agendan llamada» y «2 . WH - FORM AGENDA GENERAL»): ramas yt/youtube, ig/instagram, email, webinar, dfy; publicados por Cristian.
  - Ids de GHL de Felipe y Cintia puestos · «Link agenda» = `codigomaestria.com/agenda?utm_source=callers` · permiso `calendars.readonly` en GHL.
- **Migraciones:** todas aplicadas en la nube (las últimas, `20261017110000_citas_canal` y `20261017120000_leer_ghl_cada_30s`, el 16 oct, las lanzó Cristian).
- **Datos de Maestria (16 oct, 22:50):** 1.619 leads (185 con caller); 37 citas (16 con canal; las 21 anteriores al 13 oct, sin canal). Por pipeline (con las tarjetas 🔗): General 36 · Orgánico 49 · Callers 8 · YT 2 · Email 1 · Biblioteca 1 · IG 0 · P1 0 · Webinar 0 · DFY 0 · Biblioteca Recursos 1.604 · Webinar 1 111 · DFY AI Services 0. **Equipo** (dato del 13 oct, no revisado hoy): 14 reales + 2 de prueba; faltaba que entraran Antonio y los 4 closers; un 4.º director, «Thiago», que no estaba en el plan.
- **«Terminado»** = el equipo real entra en la app (ordenador o móvil), los leads de GHL llegan solos, los avisos de los reportes llegan, y un caller y un closer trabajan un día real sin problemas.

---

## 2. Lo que falta (en este orden)

**1 · Ahora: velocidad** (Cristian, 16 oct: «carga súper lento», lo primero)
- [ ] **Mejorar velocidad:** que la app se sienta casi instantánea al navegar. Todo en `docs/Mejorar-velocidad.md`: lo hecho el 13 oct, lo medido, cómo lo hacen los SaaS «pro», la propuesta (A recomendada, B, C) y el orden (medir todas las secciones → lo visto al instante → precarga del menú → servidor más rápido → tiempo real → medir otra vez). Incluye quitar la medición temporal (`src/lib/tiempos.ts`).
- [ ] **Decidir antes de empezar (Cristian):** ¿A, B o C? · ¿vale ver un dato de hace un momento durante menos de 1 s a cambio de que todo salga al instante? · ¿se toca la comprobación de la sesión?

**2 · Canales de las citas: lo que queda** (detalle en `plan-GHL.md`)
- [ ] **Sábado 18 oct:** mirar Vercel → Usage (leer GHL cada 30 s; si va a pasar del 50 % de la memoria del mes, bajar a 60 s). Si se pasa del límite gratis, Vercel apaga esa parte hasta 30 días.
- [ ] **Una reserva real** con el link de callers (prueba aplazada por Cristian el 16 oct): que la cita caiga en su pipeline y en General con su etiqueta, y que GHL cree 2 oportunidades (General + canal).
- [ ] Equipo: cambiar en anuncios, bios y WhatsApp los links al formato `/agenda?utm_source=…` y buscar la errata `utm_source=bibliotec`.
- [ ] Despublicar en GHL los 4 workflows viejos «1-4. AP - Cita …» (la app ya ignora sus avisos; no corre prisa).

**3 · Pendiente de Cristian (de antes)**
- [ ] ¿Borrar los 24 leads de prueba de Biblioteca y los 2 «Test» de Webinar? (entre los 24 hay 4 que parecen reales: David, Aneudy, Thiago, Juan).
- [ ] ¿«No le interesa» del caller mueve a «No cualifican»? (hoy no mueve en los pipelines de origen).
- [ ] El número de la pestaña «Closers» cuenta solo citas abiertas (el tablero enseña también las de «No califica»): ¿que cuente todas?
- [ ] Las vistas Lista/Día/Tabla de Agendas conservan sus botones (Confirmar, Cerrada…): ¿se dejan?
- [ ] «Repartir leads» solo con icono también en la tabla de la Biblioteca (KPIs)?
- [ ] Los 3 documentos borrados en el Mac sin guardar en git (`Arreglar-dashboard.md`, `plan-historial-10oct.md`, `plan-historial-11oct.md`): ¿a propósito? Si sí, se quitan sus menciones; si no, se recuperan.
- [ ] **Subir el CSV de GHL** (KPIs → Biblioteca → «Subir CSV de leads»): ¿ya no se queda en «Importando…»? (sin probar con tu archivo de 1.282 filas).
- [ ] **Subir el CSV de Webinar 1** (prueba de «varios pipelines»): ¿sigue haciendo falta?
- [ ] **Visto bueno en pantalla** de lo nuevo: CRM (tarjetas, arrastrar columnas y pipelines, doble clic para renombrar, barra masiva, «+», filtro por canal), KPIs (por persona, objetivos y canal), Agendas (canal), organigrama, onboarding de closers, «Guion» y Guiones, links de pago.
- [ ] **Contestar:** a) **zona horaria** («que se pueda poner cualquier hora y punto»): ¿cualquier zona del mundo?, ¿quitar la conversión?, ¿otra cosa? b) **coach IA en directo**: ¿desde dónde llaman los callers? c) **DFY**: ¿lleva links de pago? d) **Thiago**: ¿lo diste de alta tú como director? e) **móvil**: ¿un «Mover a…» solo para el móvil? f) **Reserva**: ¿en su apartado o como un link más? g) «Llamar ahora →» de la cola: ¿cambiar a «Ver →»?
- [ ] **Guiones reales** de caller y closer y una llamada de prueba de cada uno.
- Avisos: los tests de integración de GitHub fallaron 2 veces el 13 oct por la base de pruebas, sin relación con el cambio (al repetir, en verde). La ventana de «Nuevo lead» quedó en el código sin uso.

**4 · Claude, después de tus respuestas**
- [ ] **«Llamadas de GHL» está OCULTO** (Cristian, 13 oct). Para volver a enseñarlo: `LLAMADAS_GHL_VISIBLE = true` en `src/app/(panel)/layout.tsx`.
- [ ] Zona horaria y coach IA en directo (según tus respuestas; el coach necesita la clave de Deepgram).
- [ ] Lo que salga de tu visto bueno y de las pruebas con CSV.
- [ ] Comprobar en la base que Antonio y los 4 closers han entrado y terminado la bienvenida.
- [ ] Sin probar todavía: una persona nueva creando su contraseña; «¿No puedes entrar?» con un email real; el límite de intentos del login; arrastrar pipelines; cerrar soltando en «Cerrados»; Objetivos con objetivos puestos; onboarding de closers con clientes; «Guion» visto como caller; la app en el móvil.
- [ ] Pequeño: en CRM, «Tablero · Lista» casi no marca cuál está elegido.
- [ ] Vigilar cuántos leads de la Biblioteca llegan sin respuestas; si son muchos, subir el Wait a 3-5 min.

**5 · GHL, al final (juntos)**
- [ ] **Actividad de los leads en GHL** («No activities yet»): la landing no usa formularios de GHL; opciones: código de seguimiento externo de GHL en la landing, o arreglar los UTM en «Create contact» del workflow viejo.
- [ ] **Leads nuevos de Webinar, Orgánico y DFY** (hoy solo entra sola la Biblioteca; el resto, por CSV). Se puede hacer como las citas: leerlos por la API.
- [ ] Ids de GHL de los callers (sin ellos, sus llamadas de GHL no se atribuyen) y llamadas de GHL.
- [ ] Avisos de los reportes por WhatsApp.
- [ ] Pasar el workflow «0. AP - Biblioteca» a `dashboard.eternity.llc` (hoy apunta a `.vercel.app`, que funciona).
- [ ] Idea: que `/api/signup` de la landing mande también las respuestas directamente a la app.

**6 · Lo de Cristian, al final del todo**
- [ ] Pagar Google Workspace **antes del 2 nov 2026** (si no, dejan de salir los emails de la app).
- [ ] Claves de Fathom, Claude y Deepgram (las pegas tú en la app).
- [ ] Usuarios de GHL de los callers.
- [ ] Guardar las claves en tu gestor de contraseñas y borrar los CSV de contraseñas de `scripts/salida/`.
- [ ] Vercel Pro (también reduciría los arranques «en frío»; sin verificar cuánto).
- [ ] **Repartir los leads** (de 1.619, solo 185 tienen caller; sin reparto, los callers no tienen cola).
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
| GHL (16 oct) | **Las citas se leen solo por la API, cada 30 s** (programador de Supabase → `/api/ghl/leer/[proyecto]`, con la clave del proyecto), de los calendarios elegidos en el proyecto (`ghl_calendarios`: «0. Calendar Principal», «#2 Callers», «#1 Maestria founders»). El closer sale de su usuario de GHL. Los avisos de cita de los workflows solo se guardan (no crean nada). Leads: la Biblioteca entra por su Entrada (workflow «0. AP - Biblioteca», Webhook normal); el resto, por CSV (lo hace Cristian). El link de agenda de los callers es `https://codigomaestria.com/agenda?utm_source=callers` (lo copia «Link agenda» y lo manda «Link enviado»). |
| Pipelines como GHL (13-16 oct) | Los pipelines de origen se llaman, se ordenan y tienen las columnas de GHL: «0. Agendas YT», «Orgánico», «IG», «P1», «Callers», «General», «Email», «Biblioteca», «Webinar» y «DFY» (Form · Agendan · Confirman · No confirman · No show · Cerrados · No cualifican · Seguimiento), «1. Biblioteca Recursos» (columnas de la app: Nuevos…), «2. Webinar 1» y «3. DFY AI Services»; después Closers y Callers. **«Cerrados» se queda en todos** (cerrar soltando) y nace unida a «Vendido» al crear un pipeline. Para el navegador, **siempre Playwright Bridge**. |
| Canales de las citas (16 oct) | Todo se mide por UTM (`/agenda?utm_source=X`): callers, yt (o youtube), ig (o instagram), p1, email, biblioteca (o la errata bibliotec), webinar, dfy; sin UTM = Directo; uno desconocido = Otro. Las páginas viejas `/agenda-yt` y `/agenda-ig` valen igual. Cada cita va a «Agendan» del pipeline de su canal (Directo → Orgánico; Otro, sin pipeline propio) **y** a «0. Agendas General»; el lead lleva la etiqueta «Canal: …» (solo en la app). Filtro por canal en Agendas, CRM y KPIs. Un lead vendido sigue vendido aunque reserve otra llamada. «Confirmación pendiente» no la pisa el «confirmed» de GHL. |
| Leads en varios pipelines (12 oct) | Una tarjeta por pipeline, como GHL: el lead tiene su pipeline principal y una tarjeta (🔗) en cada otro por el que entra. Funnel, KPIs y comisiones cuentan personas. |
| CRM (12-13 oct) | Barra: selector de pipeline como GHL a la izquierda del buscador (con «+ Nuevo pipeline»; renombrar con doble clic), llave de permisos, Tablero/Lista, Subir CSV y «Repartir leads» (solo icono). Sin «Nuevo lead», sin renombrar/borrar pipeline con botones y sin «Sin caller asignado». Se mueve solo arrastrando (sin «Mover a…»). Borrar en masa, solo el CEO (se salta leads con citas o ventas); asignar, etiquetas, mover y exportar, también los directores. |
| Closers (13 oct) | Card de cita sin botones (ni «Registrar» ni «Chat»): se mueve arrastrando, en el CRM y en Agendas → Pre-call/Post-call. «No califica» se ve siempre en su columna. Las vistas Lista/Día/Tabla de Agendas conservan sus botones (pendiente de Cristian). |
| Card del lead (13 oct) | Clic en cualquier parte de la card (menos sus botones y la casilla) = popup con contacto, dónde está, equipo, etiquetas y oferta, y respuestas del formulario; botón «Ver toda la info» a la ficha. El teléfono no abre la app Teléfono: en el popup se copia con aviso. También en las filas de la Biblioteca (KPIs). |
| Llamar (13 oct) | Sin botón «Llamar» (llamar desde la app, función futura). Botón **«Guion»**: abre el guion con sus botones de resultado; los guiones los editan CEO y directores en «Guiones». **«Link agenda»** (en lugar de «Coach IA») copia el link de agenda. |
| KPIs y Agendas (13 oct) | Agendas = Llamadas y Análisis (sin «Métricas»). KPIs → «Por persona» = barra de Agendas (Individual/Comparativa, closer, producto, periodo con flechas) + métricas de closers + callers y closers como antes + «Generar reporte». El periodo vale para toda la página; closer y producto, solo para las métricas de agendas. «Llamadas de GHL» oculto en el menú (se retoma más adelante). |
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
- **Citas de GHL:** se leen cada 30 s por la API; si el programador de Supabase se para (proyecto en pausa, token caducado), no entra ninguna cita: lo avisa Agendas («Última lectura de GHL: hace X», en rojo a los 5 min). Una cita que deja de venir se comprueba una a una en GHL antes de cancelarla.
- **Leads sin caller:** los ~1.200 están sin repartir y el reparto automático está apagado: hasta que se reparta, los callers no tienen cola.
- **Solo la Biblioteca entra sola (leads):** un lead nuevo de Webinar, Orgánico o DFY sin cita no llega a la app hasta que se suba un CSV o se lance `scripts/igualar-ghl.mjs` (lo lanza Cristian). Si reserva cita, sí entra (por la API).
- **Lead por webhook sin pipeline:** va al primer pipeline, «0. Agendas YT». Hoy no afecta: la Biblioteca entra por su Entrada y las citas ya no entran por webhook.
- **Móvil:** arrastrar no funciona; en el tablero de Closers no hay otra forma de mover una cita (pendiente de tu respuesta, 2-A).
- **Velocidad en la nube:** CRM medido el 13 oct: servidor 0,34–0,64 s (hasta ~2 s «en frío» tras un rato sin uso); Cristian lo siente lento al navegar (ver `docs/Mejorar-velocidad.md`).
- **Emails:** funcionan (probado el 11 oct). Dependen de que el correo de Google Workspace siga pagado (aviso: antes del 2 nov 2026).
- **Dominio raíz en Resend** (decisión de Cristian): si algún email de la app se marcara como spam, afectaría también a la reputación del correo normal de @eternity.llc (Google Workspace). Resend recomendaba un subdominio.

**A tener en cuenta:**
- **GHL:** «Custom webhook» es premium y la subcuenta no tiene saldo (aviso «Payment method is missing» en GHL): se usa el Webhook normal. Los workflows solo funcionan **publicados**.
- **Tests** (13 oct): corren solos en GitHub en cada push (222 unitarios + 248 de integración, en verde); la base de pruebas falló 2 veces sin motivo y al repetir salió en verde. Si un push sale en rojo, mirarlo antes de seguir (GitHub → Actions).
- **Vercel Hobby** (gratis) es para uso no comercial según sus condiciones: pasar a Pro cuando se pueda. Solo publica commits firmados por `eternitydevzz` (ya configurado en este repositorio). **Leer GHL cada 30 s gasta del plan gratis** (estimado: peticiones ~9 %, memoria 20-40 % del mes; medir el 18 oct); si se pasa un límite, Vercel apaga esa parte hasta 30 días.
- **Contraseñas en archivos de texto** (`scripts/salida/contraseñas.md`, `usuarios-creados-….csv`, `.env.produccion`): fuera de GitHub, pero en tu Mac sin cifrar. Pasar lo importante a un gestor de contraseñas y borrar los de usuarios cuando estén enviados.
- **Supabase gratuito:** sin copias de seguridad garantizadas y puede pausarse si no se usa (límites exactos sin comprobar).
- **Clave de cifrado:** si se pierde, hay que volver a pegar el token de GHL y las claves de Fathom.
- **Recordatorios de GHL:** si se reagenda en la app una cita que vino de GHL, GHL sigue recordando al lead la hora vieja salvo que se cambie también allí.
- **GHL:** algunas variables no están documentadas; puede que director y CEO tengan que ser contactos de GHL para recibir avisos (sin comprobar); la app no puede lanzar llamadas. El canal de una cita es la última página por la que entró el contacto: se guarda al leerla (en 30 s) y no cambia después.
- **Llamadas de los callers:** solo cuentan las hechas desde GHL (no WhatsApp ni su móvil), y solo se atribuyen si el caller tiene su id de GHL puesto (hoy ninguno).
- **Post-call:** mover una cita «reagendada» puede contar la misma reunión dos veces; sacar una venta de su columna la borra con sus cobros y comisiones (pide confirmación).
- **Citas:** un lead puede tener dos citas a horas distintas.
- **Onboarding de closers:** si dos closers le venden al mismo cliente, comparten la checklist.
- **Clave del webhook en la dirección** (tu decisión): puede quedar en registros intermedios; la guía recomienda mandarla en la cabecera.
- Riesgos bajos: los estilos admiten código en línea; el diseño glass puede ir algo más lento en equipos viejos.

---

## 5. Cómo entrar y dónde está cada cosa

- **La app publicada:** https://dashboard.eternity.llc (también https://dashboard-de-ventas-iota.vercel.app; tu acceso: `info@eternity.llc`, contraseña en `scripts/salida/usuarios-creados-2026-10-11-13-38.csv`, fila «Cris y José»).
- **GHL:** subcuenta **Maestria** (Location ID `ZGWJLBH58RJtl2iGhykp`) · workflows de la app en Automation → carpeta **«1. Dashboard ventas»** (0. AP - Biblioteca · 1. AP - Cita Callers · 2. AP - Cita General · 3. AP - Cita IG · 4. AP - Cita YT); los de la carpeta «2. Agendas» son vuestros (mueven las oportunidades), no de la app · Private Integration **«App Eternity (dashboard)»** (permisos: calendario, contactos, mensajes y, desde el 13 oct, *View Opportunities*; mismo token) · en la app: Administración → **Integraciones GHL** (token, ids de closers, «Últimos eventos») y → **Entradas** («GHL · Biblioteca»).
- **Paneles:** Vercel → proyecto `dashboard-de-ventas` (cuenta `cristianortizmaestria-9940`) · Supabase → proyecto «eternity» (organización «eternitydevzz's Org»; el otro proyecto, «creatuagencia-maestria», no es de esta app) · GitHub → `eternitydevzz/Dashboard-de-ventas`.
- **Claves:** `scripts/salida/contraseñas.md` (contraseña de la base y `CLAVE_CIFRADO`) y `.env.produccion` (secret de Supabase, para los scripts). Ninguno se sube a GitHub.
- **Perfiles de prueba en la nube:** closer-test@ y caller-test@eternity.llc (contraseñas en `scripts/salida/usuarios-creados-2026-10-11-13-46.csv`; no cuentan en cifras). Para probar en la nube sin avisar a nadie: añadirlos al proyecto «Test» y quitarlos al acabar.
- **Para Claude con el navegador:** los clics «por referencia» a veces no llegan a la página (comprobado el 11 oct); pulsar por coordenadas. La app ya no usa ventanas del navegador (`confirm`), son propias (Fase 3). En GHL (12 oct) los clics normales a veces se quedan colgados: funciona pulsar con JavaScript sobre el elemento. GHL tarda 15-25 s en cargar y a veces devuelve 404 en la dirección aunque la página carga.
- **Proyecto «Test» en la nube** (de Cristian): solo con el CEO; para probar en la nube sin avisar a los directores. Tiene 2 reportes de prueba de caller-test (se dejan: no cuentan en cifras).
- **Tests:** en GitHub → Actions («Tests»), en cada push. En el Mac no hay base local (sin Docker): se prueba en la app publicada (proyecto «Test»).
- **Para Claude, navegador (Cristian, 13 oct):** para GHL y la app publicada se usa **siempre Playwright con la extensión «Playwright Bridge»** (el Chrome de Cristian, con sus sesiones abiertas); no el navegador de la app de Claude (no tiene la sesión de GHL).
- **Para Claude con Playwright:** si la pestaña está oculta (`document.visibilityState`), Chrome la frena: no vale para medir y el editor de GHL no se dibuja; `page.bringToFront()` la trae delante. Nunca cambiar el tamaño de la pestaña de Cristian (deja un tamaño falso que no se puede quitar). Esperar ~2,5 s tras cargar antes de pulsar con JavaScript.
- **Para programar:** toda ventana nueva va dentro de `<Portal>`.

| Dónde | Qué |
|---|---|
| `app/docs/plan.md` | Este plan (solo lo que falta) · lo hecho hasta el 13 oct: `git show 607d901:docs/plan.md` y `333a636` |
| `app/docs/plan-GHL.md` | Canales de las citas y lectura de GHL por API (16 oct): decisiones, fases, datos comprobados y la lista de links por canal |
| `app/docs/plan-historial-10oct.md` · `plan-historial-11oct.md` | Copias históricas, con todo el detalle de lo hecho (no se tocan). Lo del 11-12 oct (Resend, GHL paso a paso): versión anterior del plan en git, `02aa87f` |
| `app/docs/GUIA-PUBLICAR.md` · `GUIA-GHL.md` | Cómo publicar y cómo conectar GHL |
| `app/docs/Mejorar-velocidad.md` | Velocidad de la app: medidas, investigación y propuesta (**lo siguiente**, 16 oct) |
| `app/docs/Arreglar-dashboard.md` | La auditoría (36 puntos) |
| `app/scripts/` | `preparar-proyecto`, `crear-usuarios`, `limpiar-pruebas`, `igualar-ghl` (simulan sin `--confirmar`) y `seed` (solo local). `igualar-ghl` lo lanza Cristian: `CLAVE_CIFRADO="$(grep 'CLAVE_CIFRADO' scripts/salida/contraseñas.md \| grep -oE '[A-Za-z0-9+/]{43}=' \| head -1)" node --env-file=.env.produccion scripts/igualar-ghl.mjs --confirmar` |
| `app/scripts/salida/` | Fuera de GitHub: CSV del equipo y de los closers, los 4 de contraseñas, `contraseñas.md` y el CSV de la Biblioteca del 10 oct |
| `app/README.md` | Entrada al proyecto: enlaza este plan y las guías |
