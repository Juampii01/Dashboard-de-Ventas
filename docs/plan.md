# Plan · Dashboard de ventas (app Eternity)

> Creado: 9 oct 2026 · Limpiado y reordenado: 10 oct 2026, noche · Al día: 11 oct 2026 (tras los bloques 5 y 7). El detalle de lo hecho está en las copias históricas: hasta el 10 oct, `plan-historial-10oct.md`; del 1.0 (bloques A a 7 y la pasada de 1.1), `plan-historial-11oct.md`. La auditoría, en `Arreglar-dashboard.md`.

---

## 0. Dónde estamos (léelo primero al retomar)

La app está **terminada en local y probada** (v1, v2, los 36 arreglos de la auditoría, el Paso H, el Paso 0 y, de 1.0, «Antes de todo», el Bloque A, los bloques 1 a 5 y el 7, más la pasada en pantalla de 1.1), **sin publicar**. Último commit: bloques 5 + 7 (`c3bf914`, 11 oct); nada sin guardar. **No se publica hasta que esté todo** (Cristian, 11 oct).

**Lo siguiente, en orden:**
1. **Bloque 6 (emails con Resend)**, con su propio commit. **Bloqueado hasta que Cristian tenga** la cuenta de Resend (y su clave) y a alguien que añada los registros DNS de eternity.llc (2.2).
2. **Tu revisión completa (2.1)**: se puede hacer ya, mientras llega lo de Resend.
3. Lo que salga de tu revisión y las mejoras apuntadas (1.2), y después **publicar (1.3)** y **conectar GHL (1.4)**.

**«Terminado»** = el equipo real entra en la app publicada (ordenador o móvil), los leads de GHL llegan solos, los avisos de los reportes llegan y un caller y un closer trabajan un día real sin problemas.

---

## 1. Lo que me falta a mí (Claude), en orden

### 1.0 Lo que falta del 1.0: Bloque 6 · Emails con Resend
Todo lo demás del 1.0 («Antes de todo», el Bloque A, los bloques 1 a 5 y el 7, y la pasada en pantalla de 1.1) está hecho y con commit; el detalle de cada uno (qué se hizo, tus decisiones, tests y pruebas en pantalla) está en `plan-historial-11oct.md`.

**Cómo se trabaja:** tests que fallen si se rompe la regla, `next build`, prueba en pantalla en Proyecto Prueba (datos «PRUEBA» borrados al terminar), plan y guías al día, te lo enseño y **commit propio** (Cristian, 11 oct).

- [ ] Clave `RESEND_API_KEY` en el servidor y envío de emails de la app (avisos de los reportes por email; el WhatsApp sigue por el workflow de GHL).
- [ ] Supabase con Resend como servidor de correo (enlaces mágicos y cambios de email), remitente @eternity.llc. Sin email de bienvenida: los accesos se los manda Cristian por WhatsApp.
- [ ] Activar «Enviar enlace mágico» en la ficha de cada persona (hoy está desactivado esperando este bloque).
- [ ] Guía paso a paso en `GUIA-PUBLICAR.md` (crear la cuenta, verificar eternity.llc con sus registros DNS, poner la clave en Vercel y en Supabase). En local no se pueden enviar emails reales: se prueba con un envío falso en los tests y con la cuenta real al publicar. **Necesita de Cris:** la cuenta de Resend, su clave y quien añada los registros DNS de eternity.llc.
- **Documentos que poner al día:** `.env.example` (`RESEND_API_KEY`) · `GUIA-PUBLICAR.md` (paso de Resend, variable en Vercel, «Si algo falla») · `GUIA-GHL.md` Parte 2 (el email del aviso sale por Resend; el workflow, solo para WhatsApp) · y siempre el número de tests, migraciones y tablas aquí y en `GUIA-PUBLICAR.md`.
- **Investigado** ([guía de Resend](https://resend.com/docs/send-with-supabase-smtp)): servidor `smtp.resend.com`, puerto 465, usuario `resend`, la clave de Resend como contraseña y un dominio verificado.

### 1.2 Después de tu revisión
- [ ] Mejora (bloque 3, propuesta de Claude): bloquear en la base la elección de la rotación, como ya se hace en el reparto de leads. Hoy, si dos personas agendan justo a la vez, podrían dar el mismo closer a la misma hora (poco probable con este volumen).
- [ ] Mejora (bloque 3, propuesta de Claude): que la ventana de agendar sugiera las horas libres del closer en vez de solo avisar.
- [ ] **Pendiente (Cristian, 11 oct):** que un administrador pueda **cambiar la zona horaria del proyecto** (hoy solo se elige al crearlo). Cuidado: mueve todas las fechas (ventas, KPIs, objetivos, horarios); decidir cómo antes de hacerlo.
- [ ] Arreglar lo que encuentres (lo apunto aquí y tú decides qué va antes de publicar).
- [ ] Cambiar los criterios míos que no te gusten (lista en la sección 4).

### 1.3 Publicar (sigo `GUIA-PUBLICAR.md`)
- [ ] Actualizar la Supabase CLI de la 2.90 a la 2.120. **Necesita de Cris:** ejecutar `brew trust supabase/tap` (ajuste de seguridad del Mac).
- [ ] Subir el código a GitHub (repositorio privado). **Necesita de Cris:** la cuenta de GitHub creada.
- [ ] Crear las tablas en la nube (`supabase db push`: las 29 migraciones de hoy, más la del bloque 6 si la hay). **Necesita de Cris:** el proyecto de Supabase creado, con «Allow new users to sign up» desactivado.
- [ ] Configurar Vercel: carpeta `app`, `NEXT_PUBLIC_SUPABASE_URL` **antes** del primer despliegue, las 3 variables de Supabase, `CLAVE_CIFRADO`, las 2 de IA y `RESEND_API_KEY`. **Necesita de Cris:** la cuenta de Vercel y guardar `CLAVE_CIFRADO` en su gestor de contraseñas.
- [ ] Resend: verificar eternity.llc (los registros DNS pueden tardar en propagarse: hacerlo al principio), poner Resend como servidor de correo de Supabase y probar un enlace mágico y un aviso de reporte reales. **Necesita de Cris:** cuenta de Resend y quien añada los DNS.
- [ ] `preparar-proyecto --confirmar` (Maestria con sus pipelines y productos). **Antes**, sin `--confirmar` (simula) y comprobar que crea Maestria con «Callers» y «Closers» (la prueba que salía en 1.1).
- [ ] `crear-usuarios scripts/salida/equipo.csv --confirmar`: **el CSV ya está hecho** (10 personas, 10 oct; en `scripts/salida/`, fuera de git; simulación correcta). Contraseñas «Maestria-» + 8 caracteres al azar, guardadas solo en `scripts/salida/`. **Necesita de Cris:** mandárselas por WhatsApp (decisión de Cristian). Con ellos se crean también los 2 perfiles de prueba (closer-test y caller-test, marcados «prueba», con «Llamadas de GHL» abierta).
- [ ] Subir los contactos de GHL. **Necesita de Cris:** un CSV nuevo exportado de GHL.
- [ ] Comprobar en Vercel lo que en local no se puede: subir PDF y CSV, límite de intentos, HTTPS, consola sin bloqueos y la velocidad de las cifras en la nube.
- [ ] Dejar la app lista con tus datos (2.3): reparto y horarios de los callers, comisiones, Administración y permisos de cada persona y pipeline, Configurar IA, pasos del onboarding, cuentas y categorías de Finanzas, links y recursos. **Necesita de Cris:** esos datos.
- [ ] Repasar contigo la lista «Comprobar al terminar» de `GUIA-PUBLICAR.md` (entrar como CEO, un caller hace el onboarding, móvil…).

### 1.4 Conectar GHL (sigo `GUIA-GHL.md`)
- [ ] Guiarte en los workflows «Lead nuevo», «Cita agendada», «Cambio de etapa» (si hace falta) y avisos de reportes (su URL se pega en Administración → Proyecto), y comprobar en Administración → Integraciones → «Últimos eventos». **Necesita de Cris:** crearlos en GHL (yo no tengo acceso).
- [ ] Ajustar lo marcado «⚠ comprobar» en las guías (14 cosas: nombres de disparadores y variables de GHL, que la fecha de la cita traiga hora y zona, si director y CEO tienen que ser contactos de GHL, nombre del menú Private Integrations, regiones de Supabase y Vercel, interruptor de registro libre, formato de la transcripción de GHL, versión de la CLI y copias de seguridad de Supabase). **Necesita de Cris:** ver sus pantallas de GHL, Supabase y Vercel.
- [ ] Landings directas: crear en Administración → Entradas una entrada por landing y que cada landing envíe también a su dirección. **Necesita de Cris:** quien edite las landings (y qué `source` manda cada una).
- [ ] Comprobar con GHL real lo probado solo simulado: lead por teléfono, cita sin id sin duplicar, closer que no es del proyecto y **que una cita borrada en GHL pasa a «cancelada» sin cancelar ninguna buena**.
- [ ] Avisos: que le lleguen al CEO aunque no sea miembro y que un segundo reporte del día no repita el aviso.
- [ ] Probar con las claves reales: calendario de GHL, llamadas de GHL + Deepgram, Fathom, Claude (análisis, coach, scoring). **Necesita de Cris:** las claves (2.3).
- [ ] Medir el gasto real de Claude y Deepgram los primeros días (calculado ~0,05-0,08 $ por llamada de 1 hora, sin medir).

### 1.5 Día real y cierre
- [ ] Revisar contigo el día real: Funnel, KPIs, objetivos, reportes y avisos; ajustes finales.

---

## 2. Lo que necesito de ti (Cris), en orden

### 2.1 Ahora
- [ ] **Revisión completa de la app** (v1 + v2 + arreglos + Paso H + Paso 0 + 1.0), empezando por la pasada de punta a punta (CSV → caller → agenda → venta → Funnel), que aún no has visto. Lo nuevo de 1.0 para mirar: Biblioteca (KPIs), «Mi perfil», horarios, reparto y rotación (Administración → Proyecto y reparto), Comisiones y Reportes (Administración), la ficha de cada persona (Equipo), Onboarding de closers y Links y recursos. Usuarios de prueba en la sección 6.
- [ ] Con tu ratón: arrastrar en el CRM (también «Callers» y «Closers»), en Agendas → Pre-call y en Post-call. En 1.1 solo «Llamar luego» funcionó con el ratón simulado; las demás columnas las probé lanzando los eventos desde la página.
- [ ] Mirar el diseño en tu móvil (misma wifi, la IP del Mac en vez de `localhost`).
- [ ] Revisar mis criterios (sección 4) y decirme cuáles cambio.

### 2.2 Para publicar
- [ ] **Lo primero (bloquea el bloque 6):** crear la cuenta de Resend, pasarme su clave y conseguir a alguien con acceso al DNS de eternity.llc (la verificación puede tardar en propagarse).
- [ ] Ejecutar `brew trust supabase/tap` en tu terminal.
- [ ] Crear las cuentas de GitHub, Supabase y Vercel (te guío paso a paso).
- [ ] Guardar `CLAVE_CIFRADO` en tu gestor de contraseñas cuando la generemos.

### 2.3 Datos que tienes que pasarme
(El equipo, DFY, las landings, la cola, las columnas, el reparto, las comisiones y lo configurable ya están decididos: sección 4.)
- [ ] La clave de Resend (bloque 6 y 1.3).
- [ ] CSV de contactos exportado de GHL: **al final** (Cristian).
- [ ] Las claves de GHL, Fathom, Claude y Deepgram: **al final del todo**, las pones tú a mano.
- [ ] Lo que configura el equipo (no me hace falta para seguir): contexto del negocio para la IA (Programas), links de pago y de dossier, recursos (links, PDF, guiones), objetivos y lanzamientos.

### 2.4 GHL y día real
- [ ] Crear en GHL los workflows que te indique (1.4).
- [ ] Poner los objetivos y lanzamientos reales en KPIs → Objetivos.
- [ ] Organizar un día real con un caller y un closer usando la app.

---

## 3. Lo que está hecho

| Qué | Commit |
|---|---|
| v1: roles, callers, closers, Funnel, webhooks GHL, CRM, ficha del lead, reportes, CSV · bloques 1-5 (tests, seguridad, guías, scripts) | — |
| v2 (V2-0 a V2-12): landings, estrellas, devoluciones, Agendas, calendario GHL, Equipo y comisiones, Programas, Finanzas, Clientes, Permisos, Fathom, IA, llamadas de GHL + Deepgram, coach IA, reparto por horarios | `0334e4c` |
| Auditoría: los 36 arreglos | `c490247` … `4ae7fba` |
| H1 diseño glass iOS · H2 KPIs · H3 objetivos · H4 objetivos que motivan | `0ad6a55`, `1a5e340`, `62fb93f`, `5d2367c` |
| H6 tableros Pre-call y Post-call con arrastre, citas sin duplicar | `715af62`, `c4ee7ef`, `adb7080` |
| H5 permisos por rol y persona · H7 un solo CRM · H8 «Mi Funnel» | `adb7080` |
| Paso 0 pipelines «Callers» y «Closers» como GHL, con permisos por pipeline | `6a887c6` |
| Paso G carga rápida (Funnel con 30.000 leads: ~2,8 s → ~1 s en local) · cash de Ventas como Finanzas · objetivos de periodos pasados · limpieza de datos de prueba · plan y guías en `app/docs/` | `6a887c6`, `2e3a407` |
| 1.0 «Antes de todo» (Llamadas de GHL oculta, perfiles de prueba) y Bloque A (Biblioteca en KPIs, oferta de cada lead, reparto manual, productos renombrados, membresía mensual) | `fa6c34b` |
| 1.0 Bloques 1 y 2 (horario como GHL, «Mi perfil», disponibilidad de closers, reparto automático con %) | `f102dce` |
| 1.0 Bloques 3 y 4 (rotación de closers, comisiones por tramos, «Cuenta para comisión») | `0f6c688` |
| 1.0 1.1 (pasada en pantalla y arreglo de la landing) | `ed4bcce` |
| 1.0 Bloques 5 y 7 (ficha de cada persona, reporte editable, onboarding de closers, Links y recursos, cola sin prioridad) | `c3bf914` |

**Comprobado el 11 oct (tras los bloques 5 y 7):** 424 tests pasan (4 de rendimiento se saltan, como siempre) · tsc y eslint limpios · `next build` correcto · `npm audit` de producción 0 · 29 migraciones (11 oct: `rotacion_closers`, `comisiones_tramos` y `bloque7`) · 43 tablas, todas con RLS · nada subido a la nube.

---

## 4. Decisiones vigentes

**Tuyas**
- Sin Stripe ni pasarelas: cada venta la apunta a mano quien la hace (facturación, cash, reserva, cuotas).
- La app es el CRM; GHL solo envía datos (webhooks, landings directas, API para calendarios y llamadas).
- Diseño glass iOS con granate Eternity y azul Maestria; español de España; USD y Nueva York por defecto.
- Clientes = solo quien ha comprado. Comisiones por rol, persona y producto, pagadas sobre lo cobrado cada mes; el caller cobra ~3 % cuando cierra el closer; las devoluciones no descuentan comisión ya pagada.
- Solo el CEO cambia el rol o desactiva a alguien; solo CEO y director cambian comisiones (el director ni la suya ni la de su rol).
- Estrellas del caller: 1 no responde · 2 responde sin saber nada · 3 interesado · 4 quiere saber más · 5 quiere comprar. Del closer: 5 paga ya · 4 con plazo · 3 sin dinero ahora · 2 poco encaje · 1 no califica.
- IA con Claude Sonnet 5.5; cada llamada se analiza al conciliar. Llamadas de GHL: las contestadas de más de 1 minuto; si GHL no transcribe, Deepgram.
- **KPIs** (director y CEO): se cuentan personas · contactado = llamada o WhatsApp · agendar cuenta como contestada · closer: parte del total de los closers en facturación y cash + % cobrado.
- **Objetivos:** de actividad y resultados; por rol o persona (manda la persona); el del director = equipo entero; semana de lunes a domingo; diario L-V por defecto; lanzamientos con evento opcional; racha = cumplir todos los diarios.
- **Post-call:** todo se mueve a cualquier columna; sacar una venta de Reserva/Cuotas/Cerradas la borra (con confirmación); el closer puede borrar sus ventas; «Cerradas» = pagadas del todo este mes.
- **CRM (Paso 0, como GHL):** pipelines de origen con sus columnas (los botones mueven por el nombre) · «Callers» = leads con caller, por el resultado de su llamada · «Closers» = Pre-call y Post-call juntos (también en Agendas) · columnas libres que se añaden y borran · permisos por pipeline: Editar / Ver / Sin acceso, por rol o persona; CEO y director con Administración, siempre Editar.
- **Mi Funnel:** caller y closer ven sus objetivos, sus KPIs y su Funnel.
- **Permisos de secciones:** manda la persona, luego el rol; Administración, Finanzas y Equipo nunca a callers ni closers; una sección de otro rol = solo lo suyo.
- **Cash:** Ventas, Finanzas, Funnel y Agendas cuentan lo que entró dentro del periodo.
- **Equipo real** (10 oct): se crea al publicar con `scripts/salida/equipo.csv`; contraseñas «Maestria-…» que Cristian manda por WhatsApp; Juan y Junior, directores con Administración; «Cris y José», una sola cuenta CEO.
- **Reparto (1.0):** solo entre callers; botón con 4 formas y reasignar; automático al entrar con % por caller (suman 100), apagado por defecto; todo al 0 % hasta que lo configuren los directores; con «solo en horario» y nadie en horario, se reparte igual entre los que tienen %.
- **Horario (1.0, bloque 1):** en la hora del proyecto, con la del aparato al lado; cada uno el suyo (onboarding obligatorio y «Mi perfil»), el administrador el de cualquiera; los ajustes de llamadas de los closers, solo el administrador.
- **Rotación de closers (1.0):** % por closer y modo de elección configurables (como GHL); salta al siguiente si no está libre; disponibilidad como los calendarios de GHL (duración por defecto 30 min, descansos, días libres).
- **Comisiones (1.0):** tramos mensuales sobre toda la facturación del mes; cuotas posteriores con el % del mes de la venta; interruptor por persona para que mande su % propio o los tramos; callers y closers por tramos por defecto, CEO y directores con su % propio; en dólares, editables en Administración; una venta devuelta sigue contando para su tramo; la Membresía no paga comisión ni suma para el tramo (casilla por programa).
- **Rotación de closers (bloque 3):** reagendar = mismo closer y tiene que estar libre; «decide» sin nadie libre = no deja agendar; «elige» con el closer no libre = avisa y deja; las citas de GHL no las toca ni las cuenta.
- **Ficha de cada persona (bloque 5):** en Equipo y en Administración → Equipo, la misma; datos y comisión para quien tiene Equipo, el resto (acceso, permisos, horario, GHL y Fathom) solo CEO y directores con Administración; el % de reparto y rotación se ve y se cambia en «Proyecto y reparto»; la marca de prueba, solo el CEO; el email lo cambia el administrador directamente.
- **Reporte (bloque 7):** preguntas editables en Administración → Reportes; del closer, las 3 de las tasas fijas; del caller ninguna; cada reporte guarda las suyas.
- **Onboarding de closers (bloque 7):** sus clientes = a quienes les registró una venta (también la Membresía); los puntos los editan CEO y directores.
- **Links y recursos (bloque 7):** cuadrícula con buscador; en cada producto, dossier encima del link de pago (el dossier se pone también en Programas).
- **Emails (1.0):** Resend desde eternity.llc para enlaces mágicos, cambio de email y avisos de reportes; sin email de bienvenida.
- **Cola del caller (bloque 7):** la prioridad A/B/C no ordena; se quedan los grupos («llamar luego» que ya tocan, nuevos, «no contesta») y dentro, del más nuevo al más viejo.
- **Biblioteca (11 oct):** primera pestaña de KPIs, para director y CEO; datos de los leads de la app (también por CSV y, con GHL, sola); se reparte desde ella; su clasificación es un dato propio de cada lead («Oferta»), calculado para todos y recalculado solo; se ve en la ficha y en el CRM junto a la etiqueta de siempre; cada CSV nuevo pone al día todos los datos.
- **Productos (11 oct):** se llaman Membresía (47 $/mes, mensual sin fin), Grupal (1.997 $), VIP (4.997 $) y DFY (personalizado).
- **Commits:** cada 2 bloques de 1.0 (el 5 va con el 7; el 6, solo, cuando esté Resend).
- **Plan de la nube:** gratuito para empezar · dirección de Vercel (sin dominio propio) · tests de pantallas completas después de publicar.
- **Configurable por el equipo:** columnas del CRM, pasos del onboarding (de clientes y de closers), cuentas y categorías de Finanzas, links y recursos.
- **Landings:** las reglas «qué `source` va a qué pipeline» las configura el equipo en Administración → Entradas (confirmado por Cristian).

**Mías, sin preguntarte (puedes cambiarlas, 2.1)**
- Agendado → Venta: personas, compras desde el día de la agenda, cuenta aunque cierre el closer.
- Si falla guardar el historial de un lead, se apunta en el registro y la acción sigue.
- Al borrar una venta sin cita, el lead vuelve a «Nuevo»; con cita, a «Agendado».
- Un director puede cambiar la comisión del rol CEO.
- KPIs: agendados del caller cuentan aunque se reagenden; % cierre sobre asistencia solo con los que asistieron.
- Racha: hoy solo suma si ya está cumplido; cada día usa su objetivo; hasta 60 días; celebración una vez al día.
- Post-call: la cita cerrada no se reagenda (se mueve su venta); llevar Reserva/Cuotas a «Cerradas» registra el cobro de lo que falta.
- Permisos: «Nuevo cliente» y el onboarding siguen siendo de CEO y director · cobrar vale con «Ventas» o «Agendas» · un caller o closer con «Funnel» va a «Mi Funnel».
- Permisos por pipeline por defecto: origen, Ver para todos · «Callers», Ver para callers y directores · «Closers», Ver para closers y directores.
- Un lead que vuelve a entrar mantiene su primer origen y suma etiquetas y respuestas · sin email se le reconoce por el teléfono (últimas 9 cifras) · en Agendas solo cuentan las ventas de closers · un gasto sin categoría cuenta en el profit · Fathom se sincroniza con el botón.
- Paso G: en vez de pasar los cálculos a la base, se aceleró la carga (era lo lento); las cifras no cambian.
- **1.0:** vista previa antes de repartir · la rotación, por defecto «lo elige quien agenda» y apagada · reparto y rotación reparten por «menos leads o citas para su %» y empiezan de cero al cambiar los % · la rotación cuenta todas las citas agendadas en la app con ella encendida · un closer sin horario no entra en la rotación · al reagendar, si el closer no tiene horario, solo se mira que no choque con otra cita · el tope del reparto cuenta como «sin trabajar» Nuevo, No contesta y Llamar luego · la casilla «Cuenta para comisión» la cambian CEO o director · en la Membresía, la facturación es la del primer mes · a un caller o closer, Programas le enseña «Tus clientes» · los links de producto (pago y dossier) solo https.

---

## 5. Riesgos y avisos
- **Velocidad en la nube:** sin medir (en local, el Funnel con 30.000 leads carga en ~1 s). Si fuese lento, traer los datos con una sola llamada a la base.
- **GHL:** algunas variables y disparadores no están documentados (se prueban en 1.4) · la lista de citas de GHL no pagina: si llegara incompleta, se cancelarían citas buenas · puede que director y CEO tengan que existir como contactos en GHL para recibir avisos (sin verificar) · la API no deja lanzar llamadas desde la app.
- **Llamadas de callers:** solo cuentan las hechas desde GHL (no WhatsApp ni el móvil propio).
- **Post-call «mover todo»:** mover una cita «reagendada» puede contar la misma reunión dos veces en KPIs, Funnel y objetivos; sacar una venta de su columna la borra con cobros, plazos y comisiones (hay confirmación).
- **Citas:** un lead puede tener dos citas vivas a horas distintas (solo se impide la misma hora con el mismo closer).
- **Rotación de closers:** si dos personas agendan justo a la vez, podrían dar el mismo closer a la misma hora (mejora apuntada en 1.2).
- **Onboarding de closers:** si dos closers le venden al mismo cliente, comparten su checklist (va por cliente).
- **`CLAVE_CIFRADO`:** si se pierde, hay que volver a pegar el token de GHL y las claves de Fathom.
- **Clave del webhook en la URL** (tu decisión): puede quedar en registros intermedios; la guía recomienda la cabecera `x-eternity-secreto`.
- **Supabase gratuito** (tu decisión): sin copias de seguridad garantizadas y puede pausarse sin uso (sin verificar los límites exactos).
- **Emails:** sin Resend configurado, los enlaces mágicos y el cambio de email no llegan (Supabase solo envía a las direcciones de su equipo, según su documentación).
- **Seguridad del navegador:** los estilos admiten código en línea (`unsafe-inline`). Riesgo bajo.
- **Diseño glass:** en equipos viejos puede ir algo más lento (sin medir).
- **Para programar:** toda ventana nueva va dentro de `<Portal>` · si el 3100 sirve CSS viejo, borrar `app/.next/dev` (con permiso) y reiniciar · si el login falla, primero `open -a Docker`.

---

## 6. Cómo entrar y dónde está cada cosa

**En local:** abrir Docker Desktop → servidor `eternity-dashboard` → http://localhost:3100 (versión compilada: `npm run build` en `app/` + `eternity-produccion` → http://localhost:3200; ambos en `PROYECTOS/GENERAL/.claude/launch.json`).
**Usuarios de prueba** (todos `@eternity.test`, con la contraseña que pusiste el 10 oct): ceo@, director@ (con Administración), closer1@ (Ana), closer2@, caller1@ (Carla), caller2@, caller3@, caller4@. Además, en Maestria, los perfiles de prueba closer-test@ y caller-test@eternity.llc (contraseña en `scripts/salida/`).
**Datos locales:** Maestria = 1.005 leads reales de la biblioteca (limpios de pruebas el 11 oct, con su oferta), sin ventas, citas ni objetivos · Proyecto Prueba = donde pruebo (3 leads, 1 venta de prueba, cuenta «Todo», categorías y 3 pasos de onboarding de ejemplo).

| Dónde | Qué |
|---|---|
| `app/docs/plan.md` | Este plan |
| `app/docs/plan-historial-10oct.md` · `plan-historial-11oct.md` | Copias históricas del plan (10 oct y 11 oct, antes de quitar lo hecho); no se tocan |
| `app/docs/GUIA-PUBLICAR.md` | Los 10 pasos para publicar |
| `app/docs/GUIA-GHL.md` | Conectar GHL |
| `app/docs/Arreglar-dashboard.md` | La auditoría (36 puntos) |
| `app/` · `app/tests/` · `app/.env.example` | El código, los tests y las variables |
| `app/scripts/` | `preparar-proyecto`, `crear-usuarios`, `limpiar-pruebas` (simulan sin `--confirmar`) y `seed` (solo local) |
