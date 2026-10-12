# Plan · Dashboard de ventas (app Eternity)

> Al día: 12 oct 2026. Este plan tiene solo **dónde estamos, lo que falta, las decisiones vigentes y los riesgos**. Lo ya hecho, con todo su detalle, está en `plan-historial-10oct.md`, `plan-historial-11oct.md` y en la versión anterior de este plan en git (commit `02aa87f`, con el detalle de Resend y de cómo se conectó GHL). Cómo quedó montado GHL: `GUIA-GHL.md` → «Cómo está montado en Maestria». Los commits: `git log`.

---

## 1. Dónde estamos

- **La app está publicada:** https://dashboard-de-ventas-iota.vercel.app (Vercel Hobby + Supabase gratis + GitHub privado `eternitydevzz/Dashboard-de-ventas`). Cada commit a `main` se publica solo. Cristian ya entra como CEO.
- **Funciona y está comprobado en la nube:**
  - Login, cabeceras de seguridad, subida de CSV y pestaña Biblioteca de KPIs.
  - **Emails con Resend** (enlace mágico y aviso de cada reporte, con el diseño glass).
  - **GHL conectado:** los leads nuevos de la Biblioteca entran solos (workflow 0); las citas de los 3 calendarios entran solas con su hora y su closer (workflows 1-3); el token sincroniza las citas de los 4 closers.
  - **Todo lead con cita de GHL pasa a «Orgánico → Agendados»** (publicado el 12 oct; probado con tests, **sin probar todavía con una cita nueva real**).
- **Datos reales en Maestria (12 oct, contados en la base):** **1.178 leads** (Biblioteca Recursos 1.165 · Webinar 1 8 · Orgánico 5), **todos sin caller** (reparto apagado); **15 citas**, y sus 15 leads en «Orgánico → Agendados».
- **Equipo (12 personas):** CEO «Cris y José» (`info@eternity.llc`); Juan y Junior, directores con Administración; 5 callers (Felipe, Miguel, Hanna, Lucas, Tomás); 4 closers (Andrés, Renzo, Cristian Ortiz y José Gómez); + 2 perfiles de prueba (closer-test y caller-test). **Nadie del equipo ha entrado todavía:** los accesos no se han mandado.
- **Tests:** 449 pasan + 4 de velocidad que se lanzan a mano (suite completa pasada el 12 oct). La app compila; 30 cambios de base de datos.
- **«Terminado»** = el equipo real entra en la app (ordenador o móvil), los leads de GHL llegan solos, los avisos de los reportes llegan, y un caller y un closer trabajan un día real sin problemas.

## 2. Pendiente de que decidas tú

| Qué | Mi propuesta |
|---|---|
| **Un lead en varios pipelines** (4.3): ¿una tarjeta por pipeline o un lead que pertenece a varios? ¿Cómo cuenta en Funnel, KPIs, reparto y comisiones? | Decidirlo antes de subir los leads de otras fuentes y de crear sus workflows. |
| **Leads nuevos de Webinar, Orgánico y DFY:** hoy solo la Biblioteca entra sola. | Un workflow por fuente, como el 0, cuando esté decidido lo de varios pipelines. |
| **Reparto de los 1.178 leads** (todos sin caller). | Antes del día real: % de cada caller y encender el reparto (Administración → Proyecto y reparto), o repartir a mano desde KPIs → Biblioteca. |
| **Avisos de reportes por WhatsApp** (`GUIA-GHL.md`, Parte 2): sin montar; por email ya llegan. | Montarlo solo si lo quieres por WhatsApp. |
| **Ids de GHL de los callers** (para «Llamadas de GHL»). En GHL vi como usuarios a Lucas y Miguel; Felipe, Hanna y Tomás no salían. | Que cada caller tenga usuario en GHL; yo pongo los ids. |
| Pasar Vercel a Pro (el gratis es para uso no comercial, según sus condiciones) | Cuando tengas una tarjeta que funcione. |
| Mis criterios (6.2) | Revisarlos cuando recorras la app. |

## 3. Lo siguiente, en orden

| # | Qué | Quién |
|---|---|---|
| 1 | **Borrar en GHL las pruebas** (5 citas y 3 contactos, sección 5): si no, la sincronización las vuelve a traer | Cristian |
| 2 | **Probar «Orgánico → Agendados» con una reserva real** (por ejemplo en «#1 Maestria founders») | Los dos |
| 3 | **Arreglos pequeños** (4.1): texto de Integraciones GHL y aviso falso de «localhost» | Claude |
| 4 | **Comprobaciones de la nube** que faltan (4.2) | Claude |
| 5 | **Repartir los leads** entre los callers | Cristian y directores |
| 6 | **Mandar los accesos** por WhatsApp y borrar los 4 CSV de contraseñas | Cristian |
| 7 | **Un lead en varios pipelines** y, después, workflows de las otras fuentes (4.3) | Los dos |
| 8 | Mejoras de después de publicar (4.3): cerrar moviendo a «Cerrados» y zona horaria | Claude |
| 9 | **Día real** con un caller y un closer, y ajustes | Los dos |

---

## 4. Lo que me falta a mí (Claude)

**Cómo trabajo en cada paso:** tests que fallen si se rompe la regla, la app compila, prueba en pantalla en Proyecto Prueba (datos «PRUEBA» borrados al terminar), plan y guías al día, te lo enseño y commit. **Yo no pego claves ni contraseñas ni creo cuentas:** eso lo haces tú (te lo dejo preparado). Docker se enciende solo para los tests de integración y se apaga después.

### 4.1 Arreglos pequeños
- [ ] El texto de Administración → Integraciones GHL sigue explicando el «Custom webhook» (premium) y sus cuerpos JSON: ponerlo como se montó (Webhook normal, Custom data y cabecera `x-eternity-secreto`).
- [ ] Administración → Entradas dice «En local (localhost) las landings no pueden llegar…» aunque la app está publicada.
- [ ] El test de Orgánico de `ghl-calendario.test.ts` solo pasa con su archivo entero (usa el token que pone un test anterior): que lo ponga él mismo.
- [ ] `calcularVendedores` quedó sin uso (solo lo usan 3 tests): quitarlo con sus tests.
- [ ] En Proyecto Prueba (local) queda una venta de prueba del 9 oct a nombre del CEO (Ana sale con «1 cerrada · 0 €»): borrarla o pasarla a Ana si me dices (solo afecta a las pruebas en local).

### 4.2 Comprobaciones de la nube
- [ ] **Medir la velocidad** con los 1.178 leads (en local, el Funnel con 30.000 leads carga en ~1 s). Si va lenta, se arregla.
- [ ] Subir un PDF, límite de intentos de login y consola del navegador sin errores.
- [ ] Región de las funciones de Vercel junto a Supabase (Washington, iad1): comprobar en Settings → Functions.
- [ ] Repasar contigo la lista «Comprobar al terminar» de `GUIA-PUBLICAR.md` y las marcas «⚠ comprobar» de las guías.
- [ ] **Que GHL manda todas las citas** (su lista no va por páginas; si llegara incompleta, la app cancelaría citas buenas). La primera sincronización cuadró (16 desde el 12 oct en la app y en GHL); repasarlo cuando haya muchas más.

### 4.3 GHL y mejoras
- [ ] **Un lead en varios pipelines** (Cristian, 12 oct). Hoy, si el CSV trae a alguien que ya existe (mismo email), se pone al día pero **se queda en su primer pipeline** (criterio de 6.2): del CSV de Webinar 1 solo entraron 8 nuevos; de 107 con etiqueta de webinar, 100 siguen en Biblioteca. **Antes de hacerlo, decidir contigo:** ¿una tarjeta por pipeline o un solo lead en varios? ¿Cómo cuenta en Funnel, KPIs, reparto y comisiones? ¿Qué pasa al llamarla o venderle desde un pipeline? ¿La subida debe respetar la etapa de GHL?
- [ ] Workflows de **lead nuevo de Webinar, Orgánico y DFY** (después de lo anterior).
- [ ] **Llamadas de GHL:** poner el id de GHL de cada caller (y de Juan y Junior si llaman) y probar «Traer llamadas de GHL» con una llamada real.
- [ ] **Avisos por WhatsApp** (si los quieres).
- [ ] Landings directas: una entrada por landing en Administración → Entradas.
- [ ] Probar con GHL real lo que solo se ha simulado: «Link enviado» → reserva → la cita llega a nombre del caller con sus estrellas; lead por teléfono; cita sin id sin duplicar; closer que no es del proyecto; cita borrada en GHL → «cancelada»; reagendar en la app una cita de GHL; avisos al CEO aunque no sea miembro; un segundo reporte del día no repite el aviso.
- [ ] Probar con las claves reales: llamadas de GHL con Deepgram, Fathom y la IA (análisis, coach y puntuación). Medir el gasto real de Claude y Deepgram los primeros días (calculado ~0,05-0,08 $ por llamada de 1 hora, sin medir).
- [ ] **Cerrar moviendo la tarjeta:** al soltar en «Cerrados» de cualquier CRM se abre «Registrar venta»; al guardar queda cerrada en todos (lead, Callers, «Cerradas» de Post-call y la cita) y cuenta en Funnel, Ventas y comisiones; si se cancela, vuelve a su sitio. Solo closers, directores y CEO.
- [ ] **Cambiar la zona horaria del proyecto** (6.1). La zona es `proyectos.zona_horaria` (solo Nueva York y Madrid); las citas guardan el momento exacto; los horarios guardan la hora del reloj (hay que convertirlos); los reportes, solo el día; 39 archivos usan la zona. **Ojo:** entre Nueva York y Madrid no siempre hay 6 h (unas semanas, 5 h) y un horario puede pasar al día siguiente al convertirlo; probar los dos casos.
- [ ] Actualizar la herramienta de Supabase de mi Mac (2.90 → 2.120) cuando ejecutes `brew trust supabase/tap`.

---

## 5. Lo que te toca a ti (Cristian)

### Urgente
- [ ] **Google Workspace:** actualizar el pago **antes del 2 nov 2026** o `info@eternity.llc` deja de recibir correo (y con él los avisos y enlaces de la app).
- [ ] **Borrar en GHL** las 5 citas de prueba (Kiiiriii y PRUEBA Closers del 14 oct; «Test» tst@test.com del 30 sep y 9 oct; «Prueba» info+prueba-lia del 2 oct) y los contactos de prueba (PRUEBA Dashboard `info+prueba@eternity.llc`, PRUEBA Closers `info+prueba2@eternity.llc`, Kiiiriii `kiiir@test.com`). Yo no borro datos para siempre.
- [ ] **Guardar la clave de Resend** (`re_…`) en tu gestor: no está en `contraseñas.md` y Resend no la vuelve a enseñar.
- [ ] Guardar en tu gestor lo de `scripts/salida/contraseñas.md` (contraseña de la base y `CLAVE_CIFRADO`) y la secret de `.env.produccion`. Si `CLAVE_CIFRADO` se pierde, hay que volver a pegar el token de GHL y las claves de Fathom.

### Antes del día real
- [ ] **Repartir los leads** (con los directores): % de cada caller y reparto automático, o a mano desde KPIs → Biblioteca («Repartir leads»).
- [ ] **Mandar a cada persona su acceso por WhatsApp** (dirección, email y contraseña) y después **borrar los 4 archivos** de contraseñas de `scripts/salida/`: `usuarios-creados-2026-10-11-13-38` (equipo y CEO), `…-10-11-13-46` (perfiles de prueba), `…-10-12-02-36` (Cristian y José closers) y `…-10-10-22-30` (perfiles de prueba del 10 oct, sin comprobar si aún valen).
- [ ] **Usuarios de GHL de los callers** (Felipe, Hanna y Tomás no salían) para «Llamadas de GHL».
- [ ] Decidir lo de la sección 2.
- [ ] Subir los CSV de las otras fuentes (DFY…) cuando esté decidido «un lead en varios pipelines».
- [ ] Que el equipo ponga en la app: objetivos y lanzamientos, contexto del negocio para la IA, links de pago y de dossier, recursos, horarios, comisiones y permisos.
- [ ] Organizar el día real con un caller y un closer.

### Cuando puedas
- [ ] Recorrer la app con calma, arrastrar tarjetas con tu ratón y mirarla en el móvil; revisar mis criterios (6.2).
- [ ] Las claves de Fathom, Claude y Deepgram (las pones tú en Vercel o en la app).
- [ ] Pasar Vercel a Pro.
- [ ] Ejecutar `brew trust supabase/tap` en tu terminal (no es urgente).
- [ ] GHL avisa «Payment method is missing»: sin saldo no funcionan las acciones premium (no las usamos).

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
| Zona horaria | La cambia un administrador; solo Nueva York o Madrid. Al cambiarla, los horarios de cada persona se convierten para que sigan a la misma hora real; lo ya guardado por día se queda como está. (Por hacer: 4.3.) |
| Horario | En la hora del proyecto, con la del aparato al lado. Obligatorio en el onboarding de callers y closers; cada uno cambia el suyo en «Mi perfil» y un administrador, el de cualquiera. |
| Llamadas de closers | Duración (30 min por defecto), descanso, aviso mínimo y máximo al día: solo el administrador, generales o por closer (para las citas a mano). |
| Comisiones | Tramos mensuales en dólares, editables en Administración, sobre toda la facturación del mes; las cuotas, con el % del mes de la venta; se paga sobre lo cobrado. Callers y closers por tramos; CEO y directores con su % propio; interruptor por persona. Las devoluciones no descuentan lo pagado y siguen contando para su tramo. La Membresía no paga comisión ni suma para el tramo (casilla por producto). |
| Ficha de cada persona | La misma en Equipo y en Administración. Datos y comisión para quien tiene Equipo; el resto, solo CEO y directores con Administración. La marca de prueba, solo el CEO; el email lo cambia el administrador directamente. |
| Reporte | Preguntas editables en Administración; del closer, las 3 de las tasas son fijas. Cada reporte guarda sus preguntas. |
| Onboarding de closers | Sus clientes = a quienes les registró una venta. Los puntos los editan el CEO y los directores. |
| Cola del caller | La prioridad A/B/C no ordena; primero los «llamar luego» y «link enviado» que ya tocan, luego nuevos, luego «no contesta», y dentro, del más nuevo al más viejo. |
| Emails | (11 oct) La app manda ella misma los emails con Resend, desde `Eternity <no-reply@eternity.llc>` (dominio raíz, decisión de Cristian): el aviso de cada reporte (al CEO y a los directores) y el enlace mágico que un administrador manda desde la ficha (caduca en 1 h, un solo uso). No se toca el correo de Supabase. El cambio de email lo hace un administrador directamente (no manda email). Sin email de bienvenida: los accesos van por WhatsApp. |
| GHL (12 oct) | Workflows de la app en la carpeta «1. Dashboard ventas», numerados, **siempre publicados** y con un Wait de 999 días al final. Acción **Webhook normal** (no «Custom webhook», que es premium). Primero leads y después agendas. Calendarios: «#2 Callers» y «#3 Closers» = Andrés y Renzo; «#1 Maestria founders» = Cristian y José. **Todo lead con cita de GHL va a «Orgánico → Agendados»** (publicado el 12 oct). El link de agenda de los callers lleva a «#1 Maestria founders». Los leads se suben con CSV (lo hace Cristian). |
| Leads en varios pipelines (12 oct) | Cristian quiere que un lead pueda estar en varios pipelines para ver los números de cada fuente (por diseñar, 4.3). |
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
- Un lead que vuelve a entrar mantiene su primer origen y suma etiquetas y respuestas; sin email se le reconoce por el teléfono (últimas 9 cifras). ⚠ **Cristian quiere cambiarlo** (12 oct): que pueda estar en varios pipelines (4.3).
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

## 7. Riesgos y avisos

**Pueden hacer daño el primer día:**
- **Citas de GHL:** su lista no va por páginas; si llegara incompleta, la app cancelaría citas buenas (4.2; la primera sincronización cuadró). Los workflows de citas están publicados: si alguno se despublica, ningún caller suma agendas de ese calendario.
- **Leads sin caller:** los 1.178 están sin repartir y el reparto automático está apagado: hasta que se reparta, los callers no tienen cola.
- **Solo la Biblioteca entra sola:** un lead nuevo de Webinar, Orgánico o DFY no llega a la app hasta que se cree su workflow o se suba un CSV.
- **Velocidad en la nube:** sin medir con datos (4.2).
- **Emails:** funcionan (probado el 11 oct). Dependen de que el correo de Google Workspace siga pagado (aviso: antes del 2 nov 2026).
- **Dominio raíz en Resend** (decisión de Cristian): si algún email de la app se marcara como spam, afectaría también a la reputación del correo normal de @eternity.llc (Google Workspace). Resend recomendaba un subdominio.

**A tener en cuenta:**
- **GHL:** «Custom webhook» es premium y la subcuenta no tiene saldo (aviso «Payment method is missing» en GHL): se usa el Webhook normal. Los workflows solo funcionan **publicados**.
- **Docker** (solo para los tests): el 12 oct se quedó sin responder y hubo que reiniciarlo; si vuelve a pasar, reiniciar Docker Desktop y, si la base local no arranca, `supabase stop` y `supabase start -x …` (sección 8, «Docker y tests»).
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

## 8. Cómo entrar y dónde está cada cosa

- **La app publicada:** https://dashboard-de-ventas-iota.vercel.app (tu acceso: `info@eternity.llc`, contraseña en `scripts/salida/usuarios-creados-2026-10-11-13-38.csv`, fila «Cris y José»).
- **GHL:** subcuenta **Maestria** (Location ID `ZGWJLBH58RJtl2iGhykp`) · workflows en Automation → carpeta **«1. Dashboard ventas»** (0 Biblioteca, 1 Callers, 2 Closers, 3 Founders) · Private Integration **«App Eternity (dashboard)»** · en la app: Administración → **Integraciones GHL** (token, ids de closers, «Últimos eventos») y → **Entradas** («GHL · Biblioteca»).
- **Paneles:** Vercel → proyecto `dashboard-de-ventas` (cuenta `cristianortizmaestria-9940`) · Supabase → proyecto «eternity» (organización «eternitydevzz's Org»; el otro proyecto, «creatuagencia-maestria», no es de esta app) · GitHub → `eternitydevzz/Dashboard-de-ventas`.
- **Claves:** `scripts/salida/contraseñas.md` (contraseña de la base y `CLAVE_CIFRADO`) y `.env.produccion` (secret de Supabase, para los scripts). Ninguno se sube a GitHub.
- **En local:** abrir Docker Desktop → servidor `eternity-dashboard` → http://localhost:3100 (versión compilada: `eternity-produccion` → http://localhost:3200; los dos en `PROYECTOS/GENERAL/.claude/launch.json`). Si el login falla, primero `open -a Docker`; si sale el diseño viejo, borrar `app/.next/dev` (con permiso) y reiniciar.
- **Perfiles de prueba en la nube:** closer-test@ y caller-test@eternity.llc (contraseñas en `scripts/salida/usuarios-creados-2026-10-11-13-46.csv`; no cuentan en cifras). Para probar en la nube sin avisar a nadie: añadirlos al proyecto «Test» y quitarlos al acabar.
- **Para Claude con el navegador:** los clics «por referencia» a veces no llegan a la página (comprobado el 11 oct); pulsar por coordenadas. Las ventanas del navegador (`confirm`) las tiene que aceptar Cristian.
- **Usuarios de prueba en local** (`@eternity.test`, contraseña en `scripts/seed.mjs`): ceo@, director@ (con Administración), closer1@ (Ana), closer2@, caller1@ (Carla), caller2@, caller3@, caller4@.
- **Datos locales (Docker, solo en tu Mac):** Maestria = 1.005 leads de la Biblioteca del 10 oct (copia vieja, no se toca en las pruebas). Proyecto Prueba = donde pruebo. **Los datos reales están en la nube.**
- **Proyecto «Test» en la nube** (de Cristian): solo con el CEO; para probar en la nube sin avisar a los directores. Tiene 2 reportes de prueba de caller-test (se dejan: no cuentan en cifras).
- **Docker y tests:** Docker va apagado (consume mucha RAM; la app publicada no lo necesita). Para los tests: abrir Docker, `supabase start -x studio,postgres-meta,logflare,vector,imgproxy,supavisor` (si dice que ya está arrancado pero la base está parada: `supabase stop` y otra vez `start`), `npx vitest run`, y luego `supabase stop` y cerrar Docker.
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
