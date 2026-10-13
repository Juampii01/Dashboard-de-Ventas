# Plan · Dashboard de ventas (app Eternity)

> Al día: 12 oct 2026, 23:10 (hora de España). Lo ya hecho, con detalle, está en `plan-historial-10oct.md`, `plan-historial-11oct.md`, la guía `GUIA-GHL.md` («Cómo está montado en Maestria») y en git (`git log`).

**Índice:** 1. Dónde estamos · 2. Plan por fases · 3. Decisiones vigentes · 4. Riesgos · 5. Dónde está cada cosa

---

## 1. Dónde estamos

- **App publicada:** https://dashboard.eternity.llc (también https://dashboard-de-ventas-iota.vercel.app). Cada commit a `main` se publica solo; hoy 3 commits no le llegaron a Vercel y se relanzaron por la API (ver Fase 3).
- **Funciona en la nube:** login, emails de acceso (Resend), subida de CSV, leads de la Biblioteca que entran solos **con sus 6 respuestas** (arreglado el 12 oct) y citas de los 4 calendarios de GHL.
- **Datos de Maestria (base, 12 oct):** 1.274 leads, 1.214 sin caller; 16 citas.
- **Equipo:** 14 personas reales (CEO, 3 directores, 6 callers, 4 closers) + 2 de prueba. **Acceso enviado a todos.** Han entrado y hecho la bienvenida 9: Cris y José, Juan, Junior, y los 6 callers (Tomás, Felipe, Miguel Angel, Hanna, Lucas, Facundo). **Faltan:** Antonio (director) y los 4 closers (Andrés, Renzo, Cristian Ortiz, José Gómez).
- **Fases:** 1 casi hecha (falta Antonio) · 2 hecha salvo el «despertar» de Vercel y que lo notes en tu Mac · 3 hecha, falta tu visto bueno con el ancho de tu Mac · Biblioteca sin respuestas: **resuelto** (12 oct) · pendientes nuevos: CSV que se congela y actividad en GHL · siguiente: Fase 4.
- **Falta para terminar:** repartir los leads y un día real con un caller y un closer.
- **«Terminado»** = el equipo real entra en la app (ordenador o móvil), los leads de GHL llegan solos, los avisos de los reportes llegan, y un caller y un closer trabajan un día real sin problemas.

---

## 2. Plan por fases (acordado con Cristian el 12 oct)

> Salió de `borrador-de-plan.md` (16 puntos de Cristian, con su análisis y sus respuestas). El orden lo decidió Cristian. Sin tiempos estimados.

**Fase 1 · Dominio y accesos (ahora)**
- [x] **Dominio `dashboard.eternity.llc`** (12 oct): añadido en Vercel; CNAME `dashboard` → `2c2ff403e7e26992.vercel-dns-017.com` en GoDaddy (lo añadió Claude con permiso); responde con HTTPS; `APP_URL` cambiada. La dirección `.vercel.app` sigue funcionando (GHL no se rompe; sus workflows se pasan al dominio nuevo con calma). Ojo: la sesión es por dirección; en el dominio nuevo hay que entrar otra vez.
- [x] **Email de acceso** (12 oct, `e55a58b` … ): Administración → Equipo → «Enviar acceso por email» (marcar personas o «Todos los activos»; confirmar en el mismo botón). Enlace de un solo uso que **dura 24 h** (ajuste «Email OTP expiration» de Supabase = 86.400 s; Supabase avisa de que pasa de lo recomendado). Al abrirlo: **pantalla de entrada animada** (logo, saludo, barra ~3 s) → bienvenida (los nuevos crean ahí su contraseña) o «Mi perfil» con el aviso para cambiarla.
- [x] **«¿No puedes entrar? Te mandamos un enlace»** en el login (misma respuesta exista o no el email; 3 por email y 10 por conexión cada hora).
- [x] Probado de verdad (12 oct): email de bienvenida a `info@eternity.llc` → llegó, Cristian entró por el dominio nuevo. **Sin probar todavía:** una persona nueva creando su contraseña en la bienvenida, y «¿No puedes entrar?» con un email real.
- [x] **Antonio** creado (12 oct; lo lanzó Cristian; el primer intento falló con «no existe el proyecto», seguramente por la red, y el segundo fue bien) y **acceso enviado** («Enviado a Antonio»). Su contraseña temporal quedó en `scripts/salida/usuarios-creados-2026-10-12-10-50.csv` (no hace falta: crea la suya al entrar; borrar con los demás CSV).
- [x] Acceso enviado a **Juan y Junior** (12 oct, «Enviado a Juan, Junior»). Los 3 directores entran solo a familiarizarse, sin tocar nada (se lo dice Cristian).
- [ ] Comprobar en la base que los 3 directores han entrado y terminado la bienvenida (con su contraseña). 12 oct, 16:25: Juan y Junior sí; **Antonio todavía no**.
- [x] **Facundo Fruhwald** (caller) creado desde Administración (12 oct; teléfono `+5493517916015`: Cristian lo dio sin el 9 de móvil de Argentina y pidió añadirlo) y **acceso enviado a los 10 callers y closers** (Felipe, Miguel Angel, Hanna, Lucas, Tomás, Facundo, Andrés, Renzo, Cristian Ortiz, José Gómez; sin los perfiles de prueba). La app respondió «Enviado a…» los 10; no comprobado en Resend (su clave no está en local).
- **Hecha cuando:** los 3 directores han recibido su acceso y han entrado.

**Fase 2 · Velocidad**
- [x] **Medido en la nube** (12 oct, con la sesión del CEO y los datos reales de Maestria, 3 veces cada una; tiempo de servidor + red desde España): Funnel 0,8-1,3 s (3,8 s la primera vez: Vercel «despierta» la función), KPIs 0,9-1,2 s, Agendas 0,6-1 s, CRM 0,7-0,8 s, Ventas 0,6-0,75 s, Ranking 0,65-0,76 s, Equipo 0,6-0,67 s, Administración 0,67-0,79 s; el login, 0,45 s.
- [x] **Región:** las funciones de Vercel están en **iad1 (Washington)**, junto a Supabase (East US): no hay que cambiarla (la cabecera `x-vercel-id` lo dice: `cdg1::iad1`, entra por París y se ejecuta en Washington).
- [x] **Individual ↔ Comparativa al instante** (`0fc2a87`): las dos vistas llegan calculadas y el botón solo cambia cuál se ve (antes cada clic volvía a pedir la página: ~1 s sin ninguna señal).
- [x] **Barra de carga** arriba mientras un filtro o el periodo traen datos (antes solo se atenuaba el filtro).
- [x] **Probado en pantalla por Claude** (12 oct, app publicada, datos reales): Comparativa sale al momento tras el clic; al cambiar el periodo estando en Comparativa se queda en Comparativa con los números nuevos (Cristian Ortiz 8 → 7 en «Semana»); al recargar sigue en Comparativa; vuelve bien a Individual; el filtro de closer funciona (José: 8 esta semana, igual que en Comparativa); la barra azul sale arriba mientras carga; consola sin errores; las 8 pantallas con la barra de periodo responden 200. **Fallo encontrado y arreglado:** al cambiar el periodo en Comparativa la dirección perdía `vista=comparativa` (al recargar volvía a Individual). Agendas sigue tardando lo mismo en el servidor (0,6-0,9 s) aunque ahora calcula las dos vistas.
- [ ] Que Cristian lo note en su Mac.
- [x] **Dónde se va el tiempo** (12 oct, midiendo cuándo empieza a llegar cada pantalla): el login, sin datos, ya tarda 0,3-0,5 s (viaje España ↔ Washington + comprobar la sesión); el icono, que no pasa por el servidor, 0,05 s. **Funnel solo tarda ~0,1 s más que el login** en empezar: sus cálculos son rápidos. **KPIs pesaba 770 KB** (7 veces el Funnel) porque la Biblioteca metía las 1.188 personas dentro de la página.
- [x] **KPIs → Biblioteca sin las filas dentro** (`06b865c`): la página sale con resúmenes y barras (**770 KB → 84 KB**) y la tabla pide sus filas después («Cargando los 1206 leads…»). Probado: la tabla carga con sus 1.206 leads, buscador y filtros.
- [x] **Menú lateral** (`6c8c29e`): precargaba **todas** las pantallas al aparecer (medido con la pestaña visible: **24 peticiones al servidor en 10 s** al abrir KPIs, dos tandas de 12, cada una con las consultas de sesión y permisos). Ahora solo precarga la que se señala con el ratón, el foco o el dedo. Medido después: **2 peticiones** (las pestañas de KPIs) y, al pasar el ratón por «Funnel», se precarga y abre bien. Los 503 que marcaba la herramienta no salen en Vercel ni al repetir las peticiones a mano (12 de 12 con 200): seguramente precargas canceladas por el navegador (sin confirmar).
- [ ] El «despertar» de Vercel (2-4 s la primera vez tras un rato sin uso o tras publicar).
- **Hecha cuando:** te enseño las medidas de antes y de después, y lo notas tú en tu Mac.

**Fase 3 · Diseño común** (piezas que usan todas las pantallas)
- [x] **Ventanas propias** (`277abae`, 12 oct): las 27 de confirmar y las 4 de escribir texto ya son de la app (`src/components/dialogos.tsx`: `confirmar()` y `pedirTexto()`, estilo glass, en español, botón rojo «Sí, seguir» si borra o quita). No queda ningún `confirm(`/`prompt(` en el código. Probado en pantalla por Claude (app publicada, sesión de Cristian, solo «Cancelar»): CRM → «Renombrar pipeline» (sale el nombre actual seleccionado) y «Borrar pipeline» (aviso rojo con el detalle); al cancelar, «Webinar 1» sigue igual; consola sin errores. **Publicación:** Vercel falló dos veces con `git_info_fail` (no pudo leer el commit en GitHub; 12:55-13:13, la build ni empezó; en local compilaba). Relanzado el mismo commit por la API de Vercel con permiso de Cristian → READY. Si vuelve a pasar: relanzar; si se repite, reconectar el repo en Vercel → Settings → Git.
- [x] **Un solo estilo de selección** (`fe8bb05`, `bc5173b`, `a6f80c0`, 12 oct). Decisiones de Cristian: casillas para marcar filas de listas e interruptor para los sí/no sueltos; buscador solo con más de 8 opciones; todo de una vez; las pestañas y selectores azules que ya había (Hoy/Semana/Mes, Todos/Activos, pestañas de KPIs y Administración…) **se quedan como están**. Piezas en `src/components/eleccion.tsx`: `Desplegable` y `Pastillas` se usan igual que un `<select>` (por dentro hay uno escondido: formularios, `onChange` y `required` siguen igual); `Pastillas corto` enseña solo lo de antes del paréntesis. CSS en `globals.css`: casilla verde, `.interruptor`, `.pastilla`. Resultado: 0 `<select>` del navegador; 40 desplegables propios y 21 de pastillas (las listas fijas de hasta 4 opciones); 17 interruptores; radios de Equipo como pastillas. Probado en pantalla por Claude (sin guardar): Programas (interruptores; pastilla «En cuotas» saca «Número de cuotas»; cancelado), Ventas (buscador: «José» + Enter filtra y cambia la dirección), CRM («Quién ve» con pastillas cortas en una línea; vista Lista con casillas, interruptor y desplegables). **Sin probar en pantalla:** el resto de las 24 pantallas una a una, móvil, y guardar de verdad un formulario con las piezas nuevas. **Pendiente (no tocado):** en CRM, «Tablero · Lista» casi no marca cuál está elegido (ya era así). **Vercel:** `a6f80c0` no llegó a Vercel (sin despliegue ni aviso en GitHub en 9 min); relanzado por la API con permiso de Cristian → READY.
- [x] **Barra de filtros** (`a048b93`, 12 oct): el `ml-auto` la mandaba a la derecha y, al no caber, bajaba pegada a la derecha con un hueco. Ahora solo va a la derecha en pantallas de 1536 px o más; en las demás, a la izquierda (Agendas, Análisis y Llamadas grabadas; Finanzas y Grabaciones no lo tenían). Probado en Agendas a 1280 px: dos filas alineadas. **Sin probar:** el móvil y el ancho exacto de tu Mac. **Vercel:** hoy 3 commits no le llegaron (12:55-13:13 `git_info_fail`; `a6f80c0` y `a048b93` ni se recibieron); relanzados por la API con permiso de Cristian. Pendiente: revisar/reconectar el repo en Vercel → Settings → Git (Cristian).
- **Hecha cuando:** no queda ninguna ventana «… says» en la app y te enseño las 7 pantallas de la barra con el ancho de tu Mac.
- [ ] **Falta para cerrarla:** enseñarte las pantallas de la barra con el ancho de tu Mac (solo probé Agendas a 1280 px) y tu visto bueno.

**✅ Resuelto · Leads de la Biblioteca sin respuestas** (12 oct; probado con un lead de prueba de Cristian, que llegó con 6/6 respuestas)
- **Causa (comprobada en el código de la landing `biblioteca.codigomaestria.com`):** la landing manda dos envíos a su `/api/signup`: `step: 'registro'` (pop-up con los datos) y después `step: 'cuestionario'` (las 6 respuestas). El primero ya hace que el workflow viejo «AP - Biblioteca de recursos» cree el contacto, la etiqueta y la oportunidad, así que el nuestro saltaba con el contacto vacío; el segundo guardaba las respuestas en GHL, pero ya no volvía a disparar el nuestro. Además, el Webhook normal de GHL **no manda los campos personalizados** si no se ponen en *Custom data*.
- **Cómo queda «0. AP - Biblioteca»** (carpeta «1. Dashboard ventas»; el viejo no se toca): disparador **«Opportunity Created · In pipeline is 2. Biblioteca Recursos»** → **Wait 1 min** → «B · Webhook (Entrada)» con las 6 preguntas en *Custom data* (`{{contact.en_qu_situacin_ests_hoy}}`, `…qu_experiencia_tienes_con_ia`, `…qu_quieres_lograr_en_los_prximos_90_das`, `…cunto_tiempo_por_semana_le_puedes_dedicar`, `…si_encuentras_el_programa_correcto_ests_en_condiciones_de_invertir_en_tu_formacin`, `…cundo_quieres_empezar`) → Wait de siempre. Guardado y publicado.
- **A vigilar:** quien tarde más de 1 min en el cuestionario llega sin respuestas (si pasa a menudo, subir el Wait a 3-5 min). Idea para más adelante: que `/api/signup` mande también las respuestas a la app.
- [ ] Comprobar que los leads que entraron vacíos antes del arreglo quedaron al día con el CSV de Cristian (depende del punto siguiente).
- [ ] **Subir CSV se congela** (12 oct, Cristian): KPIs → Biblioteca → «Subir CSV de leads» con la exportación de GHL (`Export_Contacts_All_Oct_2026_11_09_PM.csv`, 1.282 filas, 15 columnas, pipeline Biblioteca Recursos, reparto apagado): la ventana se queda en «Importando…» sin terminar. Sin investigar: ver si al final se guardó algo, cuánto tarda y si es un límite de tiempo de Vercel; arreglarlo para que avance por tandas y enseñe el progreso.
- [ ] **Sin actividad en GHL** (12 oct, Cristian): los contactos de la Biblioteca salen con «No activities yet» y atribución «CRM Workflows». Visto: el formulario de la landing no es de GHL (manda a su `/api/signup` y de ahí al «Inbound Webhook» del workflow viejo), así que GHL no ve ni la visita ni el formulario. Falta confirmar y buscar el arreglo (por ejemplo, código de seguimiento de GHL en la landing). En «Create contact» del viejo, utm source/campaign salen como «ningún paso da este valor».
- Acceso: Playwright usa el Chrome de Cristian con la extensión «Playwright MCP Bridge» (`--extension` + token en `~/.claude.json`, 12 oct).

**Tirada fases 4-7 (pedida por Cristian el 12 oct, 23:30): todo seguido, sin preguntar; lo que necesite de él se apunta aquí y se hace al final.**
- **Preguntas** (si no contesta, voy con el «por defecto» y lo marco como supuesto): 1) datos de la tarjeta (def.: nombre, teléfono, programa/estrellas, caller/closer, etiquetas, días en la columna); 2) caller/closer por persona o por tarjeta (def.: por persona); 3) borrar en masa = quitar tarjeta (def.) o borrar persona (solo CEO, aviso rojo); 4) exportar (def.: CSV de las columnas de la vista Lista); 5) «+» de columna (def.: después de «Repartir leads»); 6) organigrama (def.: CEO → 3 directores → callers y closers); 7) referencia visual para KPIs (def.: el glass actual); 8) guiones (def.: sección con guion de ejemplo editable; los reales, al final); 9) botones de resultado (def.: los que ya hay); 10) Reserva (def.: botón aparte en la ventana de links de cada programa); 11) coach IA en directo (def.: lo último, hasta donde se pueda sin claves); 12) zona horaria (como está decidida). Y: ¿tests en GitHub antes del cambio de «varios pipelines»? (recomendado; mientras tanto sigo el orden de Cristian y dejo ese cambio para el final de la Fase 4).
- **Permisos** (sin ellos, se deja en local y se sube al final): 1) commit y push a `main` por bloques (publica en la app del equipo); 2) migraciones en la base de la nube, con copia de seguridad antes; 3) leer la base de la nube; 4) probar en la app publicada (proyecto «Test») creando y borrando datos de prueba; 5) relanzar despliegues de Vercel; 6) añadir librería para arrastrar; 7) workflow de GitHub Actions; 8) Playwright en el Chrome de Cristian.
- **Respuestas de Cristian (12 oct, 23:45):** 1) tarjeta: lo que yo vea mejor · 2) caller/closer como ahora (de la persona, como en GHL) · 3) **borrar en masa, solo el CEO**; asignar, etiquetas y mover, también los directores · 4) no entendió «exportar» (explicárselo al final) · 5) el «+», que quede bien estético · 6) organigrama, sí · 7) estilo glass · 8) guion de ejemplo, sí · 9) botones de resultado los de ahora, **pero quitar que el caller pueda cerrar venta y que al pulsar «Llamar» se abra algo** · 10) y 11) ok · zona horaria: «que se pueda poner cualquier hora y punto, simplifica» (⚠ confirmar qué quiere decir antes de hacerlo) · **permisos: sí a todo**.
- **Al final, con Cristian:** GHL (actividad, workflows de Webinar/Orgánico/DFY, ids de callers, avisos por WhatsApp), claves (Fathom, Claude, Deepgram), guiones reales, DFY.

**Fase 4 · CRM como GHL** (hecha por mi parte el 12 oct, `e315403`, `1da4ccd`, `df60450`; falta la migración y tu prueba)
- [x] **Tarjeta común** (`components/tarjeta-crm.tsx`) en origen, «Callers» y «Closers»: casilla, nombre (abre la ficha), «hace X d», teléfono, email, chips (inversión, oferta, estado, 3 etiquetas, caller y closer); en Closers, la fecha y quién agendó, y sus botones (Registrar, Chat). **Sin «Mover a…»: solo se arrastra** (⚠ en el móvil arrastrar no funciona: en Closers ya no hay otra forma de mover una cita desde el tablero).
- [x] **Acciones masivas** (`crm/barra-masiva.tsx`): al marcar tarjetas (tablero o lista) sale una barra con asignar caller/closer, mover a cualquier columna libre de los pipelines de origen o de «Callers», añadir/quitar etiqueta, exportar a CSV y **borrar (solo el CEO)**. Criterio mío: el borrado en masa se salta los leads con citas o ventas (al borrar un lead se borran sus citas, ventas, cobros y comisiones). Probado en pantalla: la barra sale en una línea y «Borrar» solo con el CEO (sin pulsar nada).
- [x] **Columnas** se arrastran (en los tres tipos de pipeline) y **«+» azul** al lado de «Repartir leads» para crear columna. Probado en pantalla en Webinar 1: «Cerrados» delante de «Agendados», se guarda (sigue así al recargar) y se devolvió a su sitio.
- [x] **Pipelines**: se ordenan arrastrando (quien crea pipelines) y **doble clic en el pipeline abierto lo renombra**. Sin probar en pantalla.
- [x] **«Orgánico → Agendados» ya no depende del nombre**: el proyecto guarda la columna (`proyectos.etapa_citas_ghl`, migración `20261016090000`); se elige en el «⋯» de la columna («Aquí van los leads con cita de GHL»). Sin la migración, sigue buscando por nombre.
- [x] **La misma persona en varios pipelines** (`tarjetas_extra`, migración `20261016100000`, `lib/tarjetas.ts`): el lead conserva su pipeline principal (lo que usan botones, citas, webhooks y cifras) y gana una tarjeta en cada otro pipeline por el que entra (CSV, landing). En el CRM sale con 🔗, se arrastra y se mueve en masa dentro de su pipeline; la ficha dice «🔗 también en…». Funnel, KPIs y comisiones siguen contando personas. Criterio mío: una cita de GHL ya no saca al lead de su pipeline (p. ej. Biblioteca): gana su tarjeta en la columna de citas. **Sin probar con datos** (falta la migración).
- [x] **CSV más rápido** (posible causa del «Importando…» congelado): al actualizar leads existentes, `guardarLeads` hacía 2-3 viajes seguidos a la base por lead (1.282 filas ≈ 3.000 viajes; seguramente pasaba del tiempo máximo de Vercel, sin confirmar). Ahora lee por tandas de 500 y escribe de 20 en 20. Sin probar con tu CSV.
- [ ] **Lo tiene que lanzar Cristian** (a mí me lo bloquea el sistema de permisos): en la carpeta `app`, `supabase db push` (aplica las 2 migraciones de la Fase 4; la simulación dice que solo faltan esas).
- [ ] Prueba final («hecha cuando»): subir el CSV de Webinar 1 → sus leads de la Biblioteca salen también en Webinar 1 sin salir de la Biblioteca, y Funnel cuenta personas (comprobar en la base). Workflows de lead nuevo de Webinar, Orgánico y DFY: al final, con GHL.

**Fase 5 · Pantallas más estéticas** (hecha por mi parte el 13 oct, `9d01734`, `8043ef6`; falta tu visto bueno)
- [x] **KPIs → Por persona** en tarjetas glass (`components/tarjetas-kpis.tsx`): por persona 4 números grandes y 3 tasas en barras; al pulsarla, ventana con todo su detalle y «Ver su ficha» (`/equipo?ficha=…`). La tabla de siempre queda plegada en «Ver como tabla (con los totales)». Probado en pantalla con datos reales (6 callers, 4 closers; la ventana de Tomás sale con su detalle y el botón).
- [x] **KPIs → Objetivos** en tarjetas (`components/tarjeta-objetivos.tsx`): anillo con el avance medio y «X de Y cumplidos»; al pulsarla, sus barras y «Ver su ficha». Sin probar en pantalla.
- [x] **Embudo dibujado** (`components/embudo.tsx`): en KPIs, Leads → Contactados → Agendados → Asistieron → Cerrados, con el % que pasa de un paso al siguiente; en Agendas, el mismo dibujo con sus pasos (Agendadas → Asistencias → Cerradas). Probado en KPIs (1.117 leads este mes; el resto a 0 porque aún no hay llamadas apuntadas). Aviso: cada paso cuenta lo del periodo, no es la misma tanda de personas.
- [x] **Equipo → organigrama en árbol**: CEO → directores → Closers y Callers (y «Sin acceso a la app»); **pulsar el nombre abre su ficha**. La vista por áreas sigue debajo. Probado en pantalla (sale un 4.º director, «Thiago», que no está en el plan).
- [x] **Onboarding de closers**: cada cliente con anillo de % y una línea de pasos (círculo = pulsar para marcar; ✓ verde con la fecha); el CEO y los directores renombran, quitan y añaden puntos ahí mismo. **Sin probar con datos**: todavía no hay clientes.
- **Hecha cuando:** te enseño cada pantalla y das el visto bueno.

**Fase 6 · Guion de llamadas** (hecha por mi parte el 13 oct, `65d51f9`; faltan los guiones reales y la migración)
- [x] **«Llamar» ya no abre ninguna app** (antes era `tel:`; supuesto mío: abre el guion dentro de la app). Sale una ventana con el teléfono y «Copiar número», los pasos (qué decir con `{nombre}` y `{tu nombre}` rellenados, checklist y pistas), las objeciones con buscador y, al final, los botones de resultado de siempre (No contesta, Llamar luego, Link enviado o Agendar, No interesa y, salvo al caller, Venta). Al elegir el resultado se guarda lo marcado. Probado en pantalla en la ficha de Eduardo (cerrado sin elegir resultado).
- [x] **El caller ya no registra ventas** (servidor, ficha y CRM).
- [x] **Página «Guiones»** (menú «Día a día», CEO y directores): editar el guion del caller y el del closer (pasos, qué decir, checklist, pistas, objeciones; subir, bajar, quitar; «Volver al de ejemplo») y **«Lo que marcó cada uno»** (cuándo, quién, lead, checklist hecho y resultado; filtro por persona). Hasta que guardéis el vuestro, sale el **guion de ejemplo** (`lib/guiones.ts`).
- [ ] Migración `20261016110000_guiones.sql` (la lanza Cristian con `supabase db push`): sin ella no se guarda ni el guion editado ni lo marcado.
- [ ] Cargar los guiones reales (los pide Cristian al equipo) y una llamada de prueba de un caller y un closer.

**Fase 7 · Otros** (lo que ya estaba en el plan)
- [ ] Comprobaciones de la nube (PDF, límite de login, consola), arreglos pequeños, ids de GHL de los callers y llamadas de GHL, claves de Fathom/Claude/Deepgram, avisos por WhatsApp, cerrar moviendo a «Cerrados», cambiar la zona horaria, pruebas con GHL real de lo simulado.
- [ ] **Programas · varios links de pago** (Cristian, 12 oct): Grupal y VIP necesitan varios links (un pago, dos pagos, tres pagos…); la Membresía sigue con uno. Al pulsar el link se abre una ventana con todos los links de ese programa.
  - Links de Stripe (los pasó Cristian, 12 oct):
    - **Reserva** · 100 $ (link aparte, vale para cualquier programa; Cristian, 12 oct): https://buy.stripe.com/4gM9AScwe5aA7HEgEnbwk1K
    - **Grupal** · PIF 1.997 $: https://buy.stripe.com/7sYdR867Q32s3ro73Nbwk1L
    - **Grupal** · 1.020 $ × 2 meses: https://buy.stripe.com/fZu8wO7bU6eE4vsbk3bwk1M
    - **Grupal** · 510 $ × 4 semanas: https://buy.stripe.com/6oU14m7bU46w9PM87Rbwk1N
    - **Grupal** · 260 $ × 8 semanas: https://buy.stripe.com/cNi8wO8fY7iIe62bk3bwk1O
    - **Grupal** · 700 $/mes × 3 meses: https://buy.stripe.com/00w14m53M9qQ8LI4VFbwk1P
    - **VIP** · PIF 4.997 $: https://buy.stripe.com/14A6oGfIqcD22nk2Nxbwk1Q
    - **VIP** · 2.550 $ × 2 meses: https://buy.stripe.com/14AbJ02VE46w7HEafZbwk1R
    - **VIP** · 1.275 $ × 4 semanas: https://buy.stripe.com/28E4gybsa6eEbXU3RBbwk1S
    - **VIP** · 650 $ × 8 semanas: https://buy.stripe.com/3cI7sK2VE5aAaTQbk3bwk1T
    - **VIP** · 1.735 $ × 3 meses: https://buy.stripe.com/bJe00i2VE0Uk7HEgEnbwk1U
  - [ ] **DFY:** pendiente decidir si lleva links (precio personalizado).
- [ ] **Tests en GitHub** (Cristian: de lo último). ⚠ Hasta entonces, los cambios de la Fase 4 (varios pipelines) solo los vigilan los tests unitarios y la prueba en pantalla.
- [ ] **Segunda versión, de lo último:** coach con IA que escucha la llamada en directo («DI AHORA», transcripción en vivo).

**Al final del todo · lo de Cristian:** pagar Google Workspace (**antes del 2 nov 2026: quedan 21 días a 12 oct**), guardar las claves en su gestor, usuarios de GHL de los callers, claves de Fathom/Claude/Deepgram, Vercel Pro, repartir los leads, ~~mandar los accesos al resto del equipo~~ (hecho el 12 oct) y **día real** con un caller y un closer.

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
| Equipo real | Creado con `scripts/salida/equipo.csv`. Una sola cuenta CEO para «Cris y José»; Juan, Junior y **Antonio** (12 oct), directores con Administración. **Cristian y José también son closers** (12 oct), con sus emails de GHL, para las citas de «#1 Maestria founders»; cuentan en KPIs, Ranking y comisiones. Los accesos van por email desde la app (12 oct; antes, por WhatsApp). |
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
| Productos | Membresía (47 $/mes, sin fin), Grupal (1.997 $), VIP (4.997 $) y DFY (precio personalizado). Cada uno con link de pago y de dossier. **Cambia (12 oct):** Grupal y VIP, varios links de pago (1, 2, 3 pagos…), en una ventana; la Membresía, uno (Fase 7). |
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
- **Velocidad en la nube:** medida el 12 oct (Fase 2): 0,6-1,3 s por pantalla; la primera vez tras un rato sin uso, 2-4 s.
- **Emails:** funcionan (probado el 11 oct). Dependen de que el correo de Google Workspace siga pagado (aviso: antes del 2 nov 2026).
- **Dominio raíz en Resend** (decisión de Cristian): si algún email de la app se marcara como spam, afectaría también a la reputación del correo normal de @eternity.llc (Google Workspace). Resend recomendaba un subdominio.

**A tener en cuenta:**
- **GHL:** «Custom webhook» es premium y la subcuenta no tiene saldo (aviso «Payment method is missing» en GHL): se usa el Webhook normal. Los workflows solo funcionan **publicados**.
- **Sin tests de integración hasta montarlos en GitHub** (Cristian no quiere Docker): mientras tanto, un cambio en webhooks, reparto, comisiones o permisos solo lo vigilan los 204 tests unitarios (12 oct) y la prueba en pantalla. Los 247 de integración son los que pillaron, por ejemplo, el fallo de la hora de las citas.
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

- **La app publicada:** https://dashboard.eternity.llc (también https://dashboard-de-ventas-iota.vercel.app; tu acceso: `info@eternity.llc`, contraseña en `scripts/salida/usuarios-creados-2026-10-11-13-38.csv`, fila «Cris y José»).
- **GHL:** subcuenta **Maestria** (Location ID `ZGWJLBH58RJtl2iGhykp`) · workflows en Automation → carpeta **«1. Dashboard ventas»** (0 Biblioteca, 1 Callers, 2 Closers, 3 Founders, 4 Descubrimiento) · Private Integration **«App Eternity (dashboard)»** · en la app: Administración → **Integraciones GHL** (token, ids de closers, «Últimos eventos») y → **Entradas** («GHL · Biblioteca»).
- **Paneles:** Vercel → proyecto `dashboard-de-ventas` (cuenta `cristianortizmaestria-9940`) · Supabase → proyecto «eternity» (organización «eternitydevzz's Org»; el otro proyecto, «creatuagencia-maestria», no es de esta app) · GitHub → `eternitydevzz/Dashboard-de-ventas`.
- **Claves:** `scripts/salida/contraseñas.md` (contraseña de la base y `CLAVE_CIFRADO`) y `.env.produccion` (secret de Supabase, para los scripts). Ninguno se sube a GitHub.
- **En local:** ya no se usa (sin Docker desde el 12 oct; ver «Docker» más abajo). Se prueba en la app publicada.
- **Perfiles de prueba en la nube:** closer-test@ y caller-test@eternity.llc (contraseñas en `scripts/salida/usuarios-creados-2026-10-11-13-46.csv`; no cuentan en cifras). Para probar en la nube sin avisar a nadie: añadirlos al proyecto «Test» y quitarlos al acabar.
- **Para Claude con el navegador:** los clics «por referencia» a veces no llegan a la página (comprobado el 11 oct); pulsar por coordenadas. La app ya no usa ventanas del navegador (`confirm`), son propias (Fase 3). En GHL (12 oct) los clics normales a veces se quedan colgados: funciona pulsar con JavaScript sobre el elemento. GHL tarda 15-25 s en cargar y a veces devuelve 404 en la dirección aunque la página carga.
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
