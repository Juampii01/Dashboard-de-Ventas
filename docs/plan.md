# Plan · Dashboard de ventas (app Eternity)

> Al día: 12 oct 2026. Lo ya hecho, con detalle, está en `plan-historial-10oct.md`, `plan-historial-11oct.md`, la guía `GUIA-GHL.md` («Cómo está montado en Maestria») y en git (`git log`).

**Índice:** 1. Dónde estamos · 2. Checklist de Claude · 3. Checklist de Cristian · 4. Decisiones vigentes · 5. Riesgos · 6. Dónde está cada cosa

---

## 1. Dónde estamos

- **App publicada:** https://dashboard-de-ventas-iota.vercel.app. Cada commit a `main` se publica solo.
- **Funciona en la nube:** login, emails (Resend), subida de CSV, leads de la Biblioteca que entran solos y citas de los 4 calendarios de GHL que entran solas (las que tienen cita van a «Orgánico → Agendados»).
- **Datos de Maestria:** 1.192 leads, **todos sin caller**; 16 citas reales; 0 datos de prueba.
- **Equipo:** 12 personas creadas (CEO, 2 directores, 5 callers, 4 closers). **Nadie ha entrado todavía.**
- **Falta para terminar:** repartir los leads, mandar los accesos y un día real con un caller y un closer.
- **«Terminado»** = el equipo real entra en la app (ordenador o móvil), los leads de GHL llegan solos, los avisos de los reportes llegan, y un caller y un closer trabajan un día real sin problemas.

---

## 2. Checklist de Claude

### Ahora, en orden

1. [ ] **Comprobaciones de la nube**
   - [ ] Medir la velocidad con los ~1.200 leads (en local, 30.000 leads cargan en ~1 s). Si va lenta, se arregla.
   - [ ] Subir un PDF.
   - [ ] Probar el límite de intentos de login.
   - [ ] Consola del navegador sin errores.
   - [ ] Región de las funciones de Vercel junto a Supabase (Washington, iad1): Settings → Functions.
   - [ ] Repasar contigo «Comprobar al terminar» de `GUIA-PUBLICAR.md` y las marcas «⚠ comprobar» de las guías.
   - [ ] Que GHL manda todas las citas (su lista no va por páginas): repasarlo cuando haya muchas más. La primera vez cuadró.
2. [ ] **Arreglos pequeños**
   - [ ] El test de Orgánico de `ghl-calendario.test.ts` solo pasa con su archivo entero: que ponga él mismo el token.
   - [ ] Quitar `calcularVendedores` (sin uso; solo lo usan 3 tests).
   - [ ] Venta de prueba vieja en Proyecto Prueba (local), a nombre del CEO: borrarla o pasarla a Ana, si me dices.

### Cuando decidas o me des lo necesario

3. [ ] **Un lead en varios pipelines** (lo pediste el 12 oct). Hoy un lead está en un solo pipeline: del CSV de Webinar 1 solo entraron 8 nuevos (100 siguen en Biblioteca). Antes hay que decidir contigo:
   - ¿Una tarjeta por pipeline o un solo lead en varios?
   - ¿Cómo cuenta en Funnel, KPIs, reparto y comisiones?
   - ¿Qué pasa al llamarla o venderle desde un pipeline?
   - ¿La subida debe respetar la etapa de GHL?
4. [ ] **Workflows de lead nuevo** de Webinar, Orgánico y DFY (después del 3).
5. [ ] **Llamadas de GHL:** poner el id de GHL de cada caller (y de Juan y Junior si llaman) y probar «Traer llamadas de GHL» con una llamada real.
6. [ ] **Avisos de reportes por WhatsApp** (si los quieres; por email ya llegan).
7. [ ] **Claves reales** de Fathom, Claude y Deepgram: probar análisis, coach y puntuación, y medir el gasto los primeros días (calculado ~0,05-0,08 $ por llamada de 1 hora, sin medir).
8. [ ] Landings directas: una entrada por landing en Administración → Entradas.

### Después

9. [ ] **Cerrar moviendo la tarjeta:** al soltar en «Cerrados» se abre «Registrar venta»; al guardar queda cerrada en todo y cuenta en Funnel, Ventas y comisiones; si se cancela, vuelve a su sitio. Solo closers, directores y CEO.
10. [ ] **Cambiar la zona horaria del proyecto** (solo Nueva York o Madrid). Los horarios guardan la hora del reloj y hay que convertirlos; ojo, entre Nueva York y Madrid no siempre hay 6 h (unas semanas, 5 h). 39 archivos usan la zona.
11. [ ] **Probar con GHL real lo que solo está simulado:** «Link enviado» → reserva → la cita llega a nombre del caller con sus estrellas; lead por teléfono; cita sin id sin duplicar; closer que no es del proyecto; reagendar en la app una cita de GHL; avisos al CEO aunque no sea miembro; un segundo reporte del día no repite el aviso.
12. [ ] **Tests en GitHub en vez de Docker** (no es para ahora; **máximo 10 minutos**). En cada commit de código, GitHub pasa los ~450 tests y marca ✅ o ❌. Cuenta gratis y repositorio privado = 2.000 minutos al mes (comprobado); no hace falta ningún secreto; ~5-6 min por pasada (sin medir). Después, desinstalas Docker.
13. [ ] Actualizar la herramienta de Supabase de mi Mac (2.90 → 2.120) cuando ejecutes `brew trust supabase/tap`.

**Cómo trabajo en cada paso:** tests que fallen si se rompe la regla, la app compila, prueba en pantalla en la app publicada (proyecto «Test»), plan y guías al día, te lo enseño y commit. **Sin Docker** (12 oct): hasta el punto 12 solo paso los 178 tests unitarios. **Yo no pego claves ni contraseñas, no creo cuentas y no borro datos en GHL:** eso lo haces tú.

---

## 3. Checklist de Cristian

### Urgente

1. [ ] **Pagar Google Workspace antes del 2 nov 2026.** Si no, `info@eternity.llc` deja de recibir correo, y con él los avisos y enlaces de la app.
2. [ ] **Guardar la clave de Resend** (`re_…`) en tu gestor: no está en ningún archivo y Resend no la vuelve a enseñar.
3. [ ] **Guardar en tu gestor** lo de `scripts/salida/contraseñas.md` (contraseña de la base y `CLAVE_CIFRADO`) y la secret de `.env.produccion`. Si `CLAVE_CIFRADO` se pierde, hay que volver a pegar el token de GHL y las claves de Fathom.

### Antes del día real

4. [ ] **Repartir los leads** (con los directores): % de cada caller en Administración → Proyecto y reparto y encender el reparto automático, o repartir a mano desde KPIs → Biblioteca («Repartir leads»).
5. [ ] **Mandar a cada persona su acceso por WhatsApp** (dirección, email y contraseña) y después **borrar los 4 archivos** de contraseñas de `scripts/salida/`: `usuarios-creados-2026-10-11-13-38` (equipo y CEO), `…-10-11-13-46` (perfiles de prueba), `…-10-12-02-36` (Cristian y José closers) y `…-10-10-22-30` (perfiles de prueba del 10 oct).
6. [ ] **Usuarios de GHL para los callers** que no lo tienen (Felipe, Hanna y Tomás no salían; Lucas y Miguel sí).
7. [ ] **Decidir:**
   - [ ] Un lead en varios pipelines (punto 3 de Claude).
   - [ ] Workflows de las otras fuentes (propuesta: uno por fuente, como el de la Biblioteca).
   - [ ] Avisos de reportes por WhatsApp (sí o no).
8. [ ] Subir los CSV de las otras fuentes (DFY…) cuando esté decidido lo de varios pipelines.
9. [ ] Que el equipo ponga en la app: objetivos y lanzamientos, contexto del negocio para la IA, links de pago y de dossier, recursos, horarios, comisiones y permisos.
10. [ ] **Organizar el día real** con un caller y un closer.

### Cuando puedas

11. [ ] Recorrer la app con calma (arrastrar tarjetas con tu ratón y mirarla en el móvil) y revisar mis criterios (4.2).
12. [ ] Poner las claves de Fathom, Claude y Deepgram (en Vercel o en la app).
13. [ ] Pasar Vercel a Pro (el plan gratis es para uso no comercial, según sus condiciones).
14. [ ] Ejecutar `brew trust supabase/tap` en tu terminal.
15. [ ] Saber que GHL avisa «Payment method is missing»: sin saldo no funcionan las acciones premium (no las usamos).

---

## 4. Decisiones vigentes

### 4.1 Tuyas
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
| Zona horaria | La cambia un administrador; solo Nueva York o Madrid. Al cambiarla, los horarios de cada persona se convierten para que sigan a la misma hora real; lo ya guardado por día se queda como está. (Por hacer: checklist de Claude, 10.) |
| Horario | En la hora del proyecto, con la del aparato al lado. Obligatorio en el onboarding de callers y closers; cada uno cambia el suyo en «Mi perfil» y un administrador, el de cualquiera. |
| Llamadas de closers | Duración (30 min por defecto), descanso, aviso mínimo y máximo al día: solo el administrador, generales o por closer (para las citas a mano). |
| Comisiones | Tramos mensuales en dólares, editables en Administración, sobre toda la facturación del mes; las cuotas, con el % del mes de la venta; se paga sobre lo cobrado. Callers y closers por tramos; CEO y directores con su % propio; interruptor por persona. Las devoluciones no descuentan lo pagado y siguen contando para su tramo. La Membresía no paga comisión ni suma para el tramo (casilla por producto). |
| Ficha de cada persona | La misma en Equipo y en Administración. Datos y comisión para quien tiene Equipo; el resto, solo CEO y directores con Administración. La marca de prueba, solo el CEO; el email lo cambia el administrador directamente. |
| Reporte | Preguntas editables en Administración; del closer, las 3 de las tasas son fijas. Cada reporte guarda sus preguntas. |
| Onboarding de closers | Sus clientes = a quienes les registró una venta. Los puntos los editan el CEO y los directores. |
| Cola del caller | La prioridad A/B/C no ordena; primero los «llamar luego» y «link enviado» que ya tocan, luego nuevos, luego «no contesta», y dentro, del más nuevo al más viejo. |
| Emails | (11 oct) La app manda ella misma los emails con Resend, desde `Eternity <no-reply@eternity.llc>` (dominio raíz, decisión de Cristian): el aviso de cada reporte (al CEO y a los directores) y el enlace mágico que un administrador manda desde la ficha (caduca en 1 h, un solo uso). No se toca el correo de Supabase. El cambio de email lo hace un administrador directamente (no manda email). Sin email de bienvenida: los accesos van por WhatsApp. |
| GHL (12 oct) | Workflows de la app en la carpeta «1. Dashboard ventas», numerados, **siempre publicados** y con un Wait de 999 días al final. Acción **Webhook normal** (no «Custom webhook», que es premium). Primero leads y después agendas. Calendarios: «#2 Callers» y «#3 Closers» = Andrés y Renzo; «#1 Maestria founders» y «#1 Llamada de Descubrimiento» = Cristian y José (dos calendarios distintos, workflows 3 y 4). **Todo lead con cita de GHL va a «Orgánico → Agendados»** (publicado el 12 oct). El link de agenda de los callers lleva a «#1 Maestria founders». Los leads se suben con CSV (lo hace Cristian). |
| Leads en varios pipelines (12 oct) | Cristian quiere que un lead pueda estar en varios pipelines para ver los números de cada fuente (por diseñar: checklist de Claude, 3). |
| Lo configura el equipo | Qué `source` de cada landing va a qué pipeline (Administración → Entradas), las columnas del CRM, los pasos de los dos onboardings, las cuentas y categorías de Finanzas, el link de agenda, y los links y recursos. |
| Docker (12 oct) | **No se vuelve a usar Docker.** Los tests de integración irán en GitHub (checklist de Claude, 12), cuando toque. |
| Commits | Por bloques. En este repositorio van firmados por `eternitydevzz` (si no, Vercel Hobby bloquea la publicación). |

### 4.2 Mis criterios (puedes cambiarlos)
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
- Un lead que vuelve a entrar mantiene su primer origen y suma etiquetas y respuestas; sin email se le reconoce por el teléfono (últimas 9 cifras). ⚠ **Cristian quiere cambiarlo** (12 oct): que pueda estar en varios pipelines (checklist de Claude, 3).
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

## 5. Riesgos y avisos

**Pueden hacer daño el primer día:**
- **Citas de GHL:** su lista no va por páginas; si llegara incompleta, la app cancelaría citas buenas (checklist de Claude, 1; la primera sincronización cuadró). Los workflows de citas están publicados: si alguno se despublica, ningún caller suma agendas de ese calendario.
- **Leads sin caller:** los ~1.200 están sin repartir y el reparto automático está apagado: hasta que se reparta, los callers no tienen cola.
- **Solo la Biblioteca entra sola:** un lead nuevo de Webinar, Orgánico o DFY no llega a la app hasta que se cree su workflow o se suba un CSV.
- **Velocidad en la nube:** sin medir con datos (checklist de Claude, 1).
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

## 6. Cómo entrar y dónde está cada cosa

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
- **Docker:** ya no se usa (Cristian, 12 oct). El servidor local (3100/3200) y los tests de integración lo necesitaban; ahora se prueba en la app publicada (proyecto «Test») y los tests de integración irán en GitHub (checklist de Claude, 12).
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
