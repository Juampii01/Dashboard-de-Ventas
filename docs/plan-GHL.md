# Plan · Canales de las citas (GHL solo por API)

> Creado el 16 oct 2026. **Objetivo:** que cada cita que entra diga **de qué calendario y de qué canal viene** (Callers, YouTube, IG, Email, Biblioteca, Webinar, DFY o Directo), con etiqueta y filtro en la app. Las citas se leen **solo con la API de GHL** (sin workflows de citas). El plan general sigue en `plan.md`.

**Índice:** 1. Dónde estamos · 2. Decisiones · 3. Fases · 4. Riesgos · 5. Datos comprobados · 6. Leads por API (16-17 oct) · 7. Espejo de «2. Webinar 1» (17 oct)

---

## 1. Dónde estamos (16 oct, comprobado)

- **App publicada:** versión `64faa3b` (13 oct, 20:39). GitHub igual (más una línea en blanco del README). El PR #1 de Juampi está deshecho (PR #2).
- **Vercel:** el rollback de Juampi lo dejó sin publicar solo (comprobado el 16 oct: un commit nuevo quedó «Ready» sin llegar al dominio). **Reactivado el 16 oct** (fase 0).
- **Base:** las 2 migraciones del PR #1 **no están aplicadas** (las columnas `ghl_calendario` y `canal` no existen: error 42703).
- **GHL:** José juntó todo en **un calendario, «0. Calendar Principal»** (id `X7qpsbS2ChORZkwO4O3f`, el antiguo «#3 Closers»). Siguen activos «#2 Callers - Maestria» (`GwExej8dLssPn2lprUzf`) y «#1 Maestria founders» (`eYQg0BzILAvnzdwLNXGQ`), y los personales de Cintia y Felipe.
- **Lo que falla hoy:** las 15 citas desde el 13 oct entraron por el workflow «2. AP - Cita General» y **todas salen como «Orgánico»**. Los workflows «3. Cita IG» y «4. Cita YT» apuntan a calendarios que ya no existen. El canal solo está en el UTM / la página de agenda, y la app no lo guarda.
- **La API sirve:** probado en solo lectura, la API devuelve las mismas 15 citas, y cada contacto trae `lastAttributionSource` (página y UTM).

## 2. Decisiones (Cristian, 16 oct)

| Tema | Decisión |
|---|---|
| Cómo entran las citas | **Solo API**, sin workflows de citas. Lectura **cada 30 s** con el programador de Supabase; si en 2 días la memoria de Vercel va a pasar del 50 % del mes, se baja a cada 60 s. |
| Links de agenda | **Todo se mide por UTM**, también YouTube: `/agenda?utm_source=X` con X = `callers`, `yt`, `ig`, `email`, `biblioteca`, `webinar`, `dfy`; sin UTM = «Directo». La app reconoce también las páginas viejas (`/agenda-yt`, `/agenda-ig`) por si queda algún link. |
| Etiquetas | **Solo en la app** (en GHL ya están hechas). |
| Pipelines | Pipeline nuevo **«0. Agendas General»** con **todas** las citas, que se separan por etiqueta y filtro. Además, cada cita **duplicada** en «Agendan» del pipeline de su canal. Los 4 que ya hay (YT, Orgánico, IG, Callers) se quedan como están, y se añaden los que falten (pendiente de confirmar cuáles). |
| Página `/agenda-callers` | Borrada por Cristian (16 oct): ahora redirige a `/optin`. Los callers usan `/agenda?utm_source=callers` (calendario principal). |
| Calendarios que lee la app | «0. Calendar Principal», «#2 Callers» y «#1 Maestria founders». |
| Sin UTM | Canal «Directo». |
| «Link agenda» de la app | Pasa a `https://codigomaestria.com/agenda?utm_source=callers`. |
| Lead ya «vendido» que reserva otra llamada | Sigue «vendido»; la cita se crea igual. |
| Citas que ya hay | Las 15 desde el 13 oct recuperan su canal (está guardado); las 21 anteriores quedan «sin canal». |
| Ids de GHL de Felipe y Cintia | Los lee Claude en GHL (solo leer) y los pone en la app. |
| Vercel | Publicación automática reactivada por Claude (16 oct, pedido de Cristian). |
| Workflows de citas | Se despublican **al final**, después de la prueba real (lo hace Cristian). |
| Del trabajo de Juampi | Se aprovecha la idea de su commit `a1fa7d8` (columnas, etiqueta, recuperar citas viejas), con el canal sacado del UTM. Su revisión del webhook no entra. |

**Pipelines nuevos (Cristian, 16 oct), solo en la app:** «0. Agendas General» (todas las citas, con filtro por canal), «0. Agendas Email», «0. Agendas Biblioteca», «0. Agendas Webinar» y «0. Agendas DFY», con las mismas columnas que los otros «0. Agendas». «Directo» (sin UTM) va a «0. Agendas Orgánico».

**Pendiente:**
- [ ] La errata `utm_source=bibliotec`: la busca Cristian en GHL.

## 3. Fases (en este orden; cada una se comprueba antes de pasar a la siguiente)

**Fase 0 · Preparar (Cristian y Claude)**
- [x] Claude (16 oct, con el visto bueno de Cristian): publicación automática de Vercel reactivada con `vercel promote` del despliegue de `d1f93cf` (mismo código que `64faa3b`, solo cambian documentos). Comprobado: el dominio sirve ese despliegue, `/login` responde 200 en los dos dominios, `autoAssignCustomDomains: true` y `lastRollbackTarget: null`.
- [x] Claude (16 oct): Mac al día con GitHub (`git pull --rebase`); el commit del plan del 13 oct, listo para subir.
- [x] Claude (16 oct): ids de GHL puestos en la app. Felipe `gu2tq13mouhgmdLVW1eH` (9 citas) y Cintia `fRvLW0KO59z9R2vY0XSc` (6 citas). Sacados cruzando `assignedUserId` de la API con `closer_email` de los avisos de la misma cita; el método se validó con el id de Cristian, que ya estaba puesto y coincide.
- [x] Claude (16 oct): «Link agenda» de Maestria cambiado de `/agenda-callers` a `https://codigomaestria.com/agenda?utm_source=callers`.
- [x] `/agenda-yt` y `/agenda-ig` (Cristian, 16 oct): **se quedan como están**, sin redirección (GHL no la deja poner mientras existan). La app las reconoce por la página como YouTube e Instagram, además de `?utm_source=yt` / `ig`.
- [ ] Cristian / José: cambiar en anuncios, bios y mensajes los links al formato nuevo (lista en el punto 5).

**Fase 1 · Base de datos (la migración la lanza Cristian)**
- [x] Escrita (`supabase/migrations/20261017110000_citas_canal.sql`, commit `bf84e8c`): citas con `canal`, `ghl_calendario` y `origen_url`; proyecto con `ghl_calendarios` (ya con los 3 ids de Maestria).
- [x] Cristian la lanzó (16 oct) y lo comprobé en la base.

**Fase 2 · Leer las citas por API (Claude)**
- [x] La sincronización lee **por calendario** (`0297209`); sin calendarios elegidos, por closer como antes.
- [x] El canal sale del UTM o de la página (`lastAttributionSource` del contacto, `src/lib/canal.ts`); UTM desconocido = «otro» (Cristian, 16 oct). La página se guarda sin datos personales (solo ruta y `utm_*`). Una cita de los 2 últimos días sin canal lo gana en la siguiente lectura.
- [x] El closer, por su usuario de GHL (`assignedUserId`).
- [x] Antes de cancelar una cita que no viene, se pregunta a GHL una a una (como mucho 25 por lectura); si una lectura falla, no se cancela nada.
- [x] Un lead «vendido» no vuelve a «agendado».
- [x] Permiso `calendars.readonly` añadido en GHL a «App Eternity (dashboard)» (Claude, 16 oct; mismo token): ya sale el nombre del calendario.
- [x] Tests: 230 unitarios y los de integración en GitHub, en verde.
- [x] **Prueba con datos reales (16 oct, 19:32):** 37 citas; 25 con su calendario («0. Calendar Principal» 15, «#1 Maestria founders» 10); canal en las 7 recientes (yt 2, directo 3, biblioteca 1 —la errata «bibliotec»—, email 1); 0 sin closer (antes 1). Una cita pasó a «cancelada» porque en GHL está cancelada (comprobado).
- [x] **Fallo encontrado y arreglado (`d41da64`):** el «confirmed» de GHL (lo lleva toda reserva del widget) pasó 3 citas de «Confirmación pendiente» a «Confirmada». Ahora no la pisa (sí una cancelación o un no show). Las 3 devueltas a mano y comprobado con otra lectura: 0 cambios.

**Fase 3 · Que se lea sola cada 30 s (Claude)**
- [x] Dirección `/api/ghl/leer/[proyecto]` (`2194fb0`, `1aaf3be`): misma clave que el webhook (cabecera `x-eternity-secreto`), no pasa por el login, como mucho una lectura cada 25 s. Comprobado en la web: sin clave 401; con clave 200; dos seguidas, la segunda «saltada».
- [x] **Fallo encontrado y arreglado:** la primera versión tardaba 4-11 s por lectura (demasiada memoria de Vercel cada 30 s). Optimizada (`02bdadc`, `e250551`): calendarios a la vez, citas en una sola consulta, nombres solo si hacen falta, canal solo en citas de los últimos 15 min. Medido en la web: 1,3-3,2 s (desde España, con la red incluida).
- [x] Migración del programador escrita (`supabase/migrations/20261017120000_leer_ghl_cada_30s.sql`): pg_cron + pg_net cada 30 s, solo en la base de la nube; limpieza diaria del historial.
- [x] Cristian la lanzó (16 oct, ~20:19). Comprobado: en 100 s, 4 lecturas a 30 s exactos (18:20:09, 18:20:38, 18:21:08, 18:21:38 UTC), sin errores; en Agendas sale «Última lectura de GHL: hace 15 s».
- [x] Agendas: «Última lectura de GHL: hace X» junto al botón (en rojo si pasan de 5 min). El botón «Sincronizar GHL» se queda.

**Fase 4 · Verlo en la app (Claude)**
- [x] 5 pipelines nuevos creados en Maestria (16 oct, solo en la app): «0. Agendas General», «Email», «Biblioteca», «Webinar» y «DFY», con las 8 columnas de «0. Agendas Orgánico», detrás de «0. Agendas Callers».
- [x] Cada cita nueva va a «Agendan» del pipeline de su canal y a General (`424371d`); «Otro» o sin pipeline, solo General. El lead lleva la etiqueta «Canal: …». Un lead vendido no se mueve, pero lleva su etiqueta.
- [x] Con lectura por API, el aviso de cita del workflow solo se guarda (no manda la cita a «Orgánico» antes de saber el canal).
- [x] «GHL · YouTube» en lugar de «Calendario GHL» en Llamadas y en el tablero de Closers.
- [x] Filtro por canal: Agendas (y su exportación, con columna «Canal»), CRM (desplegable con las etiquetas «Canal: …») y KPIs → Por persona (citas del canal y ventas de esos leads).
- [x] Comprobado en la web (16 oct): Agendas → Lista muestra Directo 3, YouTube 2, Email 1, Biblioteca 1 y «Calendario GHL» 29 (las que aún no tienen canal: fase 5); con canal=yt salen solo las 2 de YouTube. KPIs → Por persona con canal=yt: 2 agendadas. El filtro del CRM sale en cuanto haya leads con etiqueta (fase 5 o la próxima cita).

**Fase 5 · Citas viejas (Claude)**
- [x] (16 oct) Canal recuperado en las 16 citas desde el 13 oct (21:00 UTC): 7 ya lo tenían (fase 2), 8 del aviso guardado del workflow (la página con su UTM al reservar) y 1 de la API de GHL (la del 14 oct 23:20, sin aviso: es la última página del contacto, menos segura). Resultado: Callers 9, Directo 3, YouTube 2, Biblioteca 1, Email 1. Las 21 anteriores, sin canal.
- [x] **Todas las citas** (Cristian: también cerradas, perdidas o canceladas): sus 36 leads tienen tarjeta en «0. Agendas General → Agendan» y en el de su canal (48 tarjetas nuevas: General 36, Callers 8, YT 2, Biblioteca 1, Email 1; los 3 «Directo» ya estaban en Orgánico). No se movió ninguna tarjeta existente. 15 leads con etiqueta «Canal: …». Una segunda pasada no cambia nada.
- [x] Comprobado en la web: CRM → «0. Agendas General» con 36 en «Agendan» y el filtro «Todos los canales / Biblioteca / Callers / Directo / Email / YouTube».

**Fase 5b · GHL igual que la app (Cristian, 16 oct)**
- [x] App: canal «Píldora 1» (`utm_source=p1`, como en GHL) con su pipeline «0. Agendas P1» (`4febbe9`).
- [x] GHL: creados «0. Agendas General», «Email», «Biblioteca», «Webinar» y «DFY» (duplicando «0. Agendas Orgánico»: las 8 columnas). Comprobado con la API.
- [x] GHL: hallazgo. Los 2 workflows de José («2. Agendan llamada», disparador «Customer Booked Appointment» en «0. Calendar Principal», y «2 . WH - FORM AGENDA GENERAL», disparador Inbound Webhook) separan por `utm_source` = youtube, biblioteca, p1, instagram, callers; el resto (email, webinar, dfy, yt, ig, bibliotec) va a «None». Cada rama: oportunidad en su pipeline + ~14 pasos de Email/SMS/Wait. La rama Biblioteca crea la oportunidad en «1. Biblioteca Recursos → Agendado».
- [x] Copia en borrador **«2. Agendan llamada (NUEVO canales)»**, terminada (16 oct, comprobada recargando): Add Tag → oportunidad «0. Agendas General → Agendan» → condición con YT (`yt,youtube`), Biblioteca («0. Agendas Biblioteca → Agendan»), Píldora 1, IG (`ig,instagram`), Callers, DFY, Email y Webinar (cada una con su oportunidad «0. Agendas X → Agendan» y un «Go to» al primer email de «None», renombrado «NONE Email 1») y «None». Sin el campo «Opportunity source» en las oportunidades nuevas. Sin probar: que GHL cree 2 oportunidades (General + canal).
- [x] Copia «2 . WH - FORM AGENDA GENERAL (NUEVO canales)»: YT, IG y Email los hizo Claude; Webinar, DFY, Biblioteca → Form, General → Form y el resto los terminó Cristian (16 oct).
- [x] Copias publicadas y originales despublicadas (Cristian, 16 oct; no comprobado por Claude).

**Fase 6 · Prueba real (juntos)** · *Aplazada por Cristian (16 oct, sin tiempo). Comprobado ese día a las 20:50 UTC: la lectura automática sigue cada 30 s sin errores.*
- [ ] Una reserva por cada link (Callers, YouTube, IG, Email, Biblioteca, Webinar, DFY y sin UTM) y comprobar en la app canal, calendario, closer y pipeline.
- [ ] Medir 2 días el consumo en Vercel → Usage (decide 30 s o 60 s).

**Fase 7 · Quitar los workflows de citas (Cristian, al final)**
- [ ] Despublicar en GHL «1. AP - Cita Callers», «2. AP - Cita General», «3. AP - Cita IG» y «4. AP - Cita YT». «0. AP - Biblioteca» se queda (es de leads, no de citas).
- [ ] Vigilar 2 días y apuntar el resultado en `plan.md`.

## 4. Riesgos

- **Vercel gratis:** si se pasa un límite, Vercel **apaga esa parte hasta 30 días** (no cobra). Consumo estimado a 30 s: peticiones ~9 %, CPU ~1 h de 4 h, memoria **20-40 %** (estimado, sin medir). Hay que medirlo en la fase 6.
- **Si el programador se para** (Supabase en pausa, token de GHL caducado), no entran citas: para eso el aviso de la fase 3.
- **El UTM es el último que tocó el lead:** se guarda en cuanto la app ve la cita, para que no cambie después.
- **Hasta 30 s de espera** en ver una cita nueva.
- **Plan de la agencia en GHL:** no se ve desde la subcuenta. La subcuenta no tiene tarjeta y la API funciona: no hay a qué cobrar.

## 5. Datos comprobados (16 oct)

**Citas desde el 13 oct por canal** (15, de `webhook_eventos`): Callers 8 · YouTube 2 · Email 1 · Biblioteca 1 · sin UTM 3.

**Links nuevos para el equipo** (los 7 abiertos con `curl` el 16 oct: todos cargan «0. Calendar Principal»):

| Canal | Link |
|---|---|
| Callers | `https://codigomaestria.com/agenda?utm_source=callers` |
| YouTube | `https://codigomaestria.com/agenda?utm_source=yt` |
| Instagram | `https://codigomaestria.com/agenda?utm_source=ig` |
| Email | `https://codigomaestria.com/agenda?utm_source=email` |
| Biblioteca | `https://codigomaestria.com/agenda?utm_source=biblioteca` |
| Webinar | `https://codigomaestria.com/agenda?utm_source=webinar` |
| DFY | `https://codigomaestria.com/agenda?utm_source=dfy` |
| Directo | `https://codigomaestria.com/agenda` |

**Links de agenda que había** (abiertos con `curl`, solo lectura):

| Link | Calendario que carga | Nota |
|---|---|---|
| `/agenda` | 0. Calendar Principal | Directo |
| `/agenda?utm_source=callers` | 0. Calendar Principal | **Link nuevo de los callers** |
| `/agenda-callers` | **#2 Callers** (el viejo) | Es el que copia hoy «Link agenda»: se cambia en la fase 0 |
| `/agenda-yt` | 0. Calendar Principal | YouTube (se queda así) |
| `/agenda-ig` | 0. Calendar Principal | Pasa al formato `?utm_source=` |
| `/agenda?utm_source=email` · `biblioteca` · `webinar` · `ig` | 0. Calendar Principal | Formato nuevo |
| `/agenda-webinar` · `/agenda-dfy` | No existen: redirigen a `/optin` | Usar `/agenda?utm_source=webinar` / `dfy` |
| `?utm_source=bibliotec` | — | Llegó así 1 vez: probablemente una errata en algún link |

**Límites oficiales:** GHL 100 peticiones / 10 s y 200.000 / día ([FAQ GHL](https://marketplace.gohighlevel.com/docs/oauth/Faqs)) · Vercel Hobby: 1.000.000 peticiones, 4 h de CPU y 360 GB-hora de memoria al mes; tareas propias de Vercel solo 1 vez al día ([Hobby](https://vercel.com/docs/plans/hobby), [tareas](https://vercel.com/docs/cron-jobs/usage-and-pricing)) · Supabase Cron admite «30 seconds» con Postgres 15.1.1.61 o más nuevo ([Supabase](https://supabase.com/docs/guides/cron/quickstart)).

---

## 6. Leads por API (16-17 oct)

**Qué hace:** en la misma lectura de cada 30 s (`/api/ghl/leer/[proyecto]`, código en `src/lib/ghl-leads.ts`), la app lee de GHL los **contactos** (no las oportunidades) y los mete en su pipeline sin workflows. Citas y leads van por separado: si falla una parte, la otra se lee igual.

**Decisiones de Cristian:**

| Tema | Decisión |
|---|---|
| Qué se lee | Los contactos **nuevos** · los que **ganan una etiqueta** después (p. ej. Biblioteca → Webinar) · los que **cambian sus datos** |
| Etiqueta → pipeline | `biblioteca recursos` → «1. Biblioteca Recursos» · `webinar1` → «2. Webinar 1» · **sin ninguna → «0. Agendas General»** (solo los nuevos) · DFY no tiene etiqueta en GHL (revisadas las 1.622 el 17 oct) |
| Varias etiquetas | Entra en todos: su pipeline es el primero y en los demás tiene su tarjeta 🔗 |
| Columna | Siempre la primera (Biblioteca «Nuevos», Webinar «Optin», General «Form») |
| Lo anterior | Se trae una vez con `scripts/igualar-ghl.mjs` (lo lanza Cristian) |
| Reparto | Como la Entrada: se reparte a los callers si el reparto automático está encendido (el 17 oct, **apagado**) |
| Workflows | Cristian apagó el de la Biblioteca el 16 oct; los leads ya no dependen de ninguno |

**Cómo funciona:**
- **Nuevos:** `POST /contacts/search` con `dateAdded` posterior a `proyectos.ghl_leads_hasta` (menos 2 min de margen); los ya vistos se guardan 3 días en `ghl_oportunidades_vistas` (su `opp_id` es el id del contacto). Como mucho 30 por lectura.
- **Cambiados:** la misma búsqueda con `dateUpdated` de los últimos 30 min. Si ganó una etiqueta de pipeline que no tiene en la app, gana ese pipeline (con nota «Nueva etiqueta en GHL (API)»). Si cambió sus datos, se ponen al día **sin pisar lo de la app** (Cristian, 17 oct): nombre, apellido y teléfono solo si en la app están vacíos; el email solo si faltaba; etiquetas y respuestas se suman (no se borra nada). Solo escribe si hay algo nuevo.
- **Respuestas:** los campos personalizados del contacto con el nombre de su pregunta (`/locations/{id}/customFields`); `utm_*` va al seguimiento. Los de los últimos 10 min se releen por si llegan tarde.
- Permisos: los 7 de solo leer de la integración privada (contactos, oportunidades, calendarios, citas, conversaciones, campos y usuarios) **más «Edit Contacts» (`contacts.write`)**, puesto para el test del 17 oct y que Cristian decidió dejar (la app no lo usa).

**Comprobado con datos reales (16 oct por la noche):** con el workflow apagado entraron por la API el test de Webinar de Cristian y 5 leads de la Biblioteca, con sus respuestas y su oferta; 0 repetidos (8 leads desde las 21:00 UTC). Commits `918df7a` a `1f1e850`. Tests: `tests/integracion/ghl-leads.test.ts` (8) y `tests/unit/ghl-lead.test.ts` (2).

**Test real (17 oct, 01:47-01:54, con el contacto de test de Webinar de Cristian, por la API):** 1) en GHL se le añadió `biblioteca recursos` y se le puso apellido: en menos de 75 s la app le dio su tarjeta 🔗 en «1. Biblioteca Recursos» (con la nota «Nueva etiqueta en GHL (API)») y el mismo apellido que GHL. 2) Riesgo: se cambió el apellido en la app y en GHL solo una etiqueta: la app volvió al de GHL → decidido «no pisar» (`1fc0a73`). 3) Se dejó el contacto como estaba en GHL y en la app (quedan, a propósito, la tarjeta 🔗 y la nota). Visto también: quitar una etiqueta en GHL no la quita en la app.

**Me equivoqué (16 oct):** dije que sin workflow GHL no creaba la oportunidad; la crea ~2 min después del contacto y yo miré antes. La solución por contactos es mejor igualmente: no depende de ningún workflow.

**Pendiente:**
- [ ] Repaso único con `scripts/igualar-ghl.mjs` (los contactos anteriores al 16 oct, 21:09 UTC).
- [x] Visto en real (17 oct): uno que gana una etiqueta · uno que cambia sus datos · el riesgo de pisar (arreglado).
- [ ] Ver con datos reales: un contacto sin etiqueta → General · uno con dos etiquetas al crearse · respuestas que llegan tarde · «no pisar» ya publicado (cubiertos en tests).
- [ ] El test de Webinar quedó en «Form completo» (lo metió la primera versión, que usaba la columna del mismo nombre): moverlo a «Optin» si se quiere.
- [ ] Reparto automático apagado: sin él los leads nuevos no tienen caller.

**Riesgos:**
- ~~GHL puede pisar un cambio hecho en la app~~: confirmado en el test real del 17 oct y arreglado: GHL solo rellena nombre, apellido y teléfono si en la app están vacíos. Lo que sí: un dato que el equipo deje vacío en la app se volverá a rellenar desde GHL.
- **Permiso `contacts.write`:** la app no lo usa; si la clave se filtrara, con él se pueden cambiar contactos de GHL (Cristian decidió dejarlo, 17 oct).
- **Si la lectura se para más de 30 min**, los cambios de ese rato no se ven (los nuevos sí, tienen fecha guardada): lo arregla el repaso.
- Una etiqueta que se quita en GHL no se quita en la app.

---

## 7. Espejo de «2. Webinar 1» (17 oct)

**Por qué:** Cristian cambió en GHL las columnas de Webinar 1 (Regalo 1…7) y entraron leads en «Regalo 1» con solo la etiqueta `regalo 1`: la regla por etiqueta los mandó a General → Form (22) o no los movió (los de Biblioteca).

**Decisiones de Cristian:** el pipeline y la columna los decide la **oportunidad de GHL** (la etiqueta queda de plan B; sin oportunidad ni etiqueta de pipeline, General) · **solo Webinar 1** (en Biblioteca las columnas de GHL no son las de la app) · columnas **como GHL + «Cerrados»** al final (se quitaron Nivel 1-3, vacías) · los que estaban mal en General, a Webinar 1.

**Cómo funciona** (`src/lib/ghl-espejo.ts`, en la lectura de cada 30 s, antes de los contactos): lee las columnas y todas las oportunidades del pipeline en GHL (3 llamadas); crea en la app las columnas que falten, en el orden de GHL (las que solo tiene la app, al final; no borra ninguna); cada oportunidad nueva o que cambió de columna en GHL pone a su lead en esa columna (si no está en la app, lo crea con su contacto y reparto; si su pipeline es otro, le da su tarjeta 🔗). La tabla `ghl_espejo` guarda la última columna de GHL de cada oportunidad: la app **solo mueve cuando cambia en GHL**, así no deshace lo que mueva el equipo (p. ej. a «Cerrados»). Un contacto sin etiqueta de pipeline que ya está en la app no va a General.

**Comprobado con datos reales (17 oct, ~19:05 UTC):** columnas de la app = las de GHL + Cerrados; **149 oportunidades en GHL, las 149 en la app y en la misma columna** (Regalo 1: 33 · Optin: 11 · Form completo: 105), 0 diferencias. 22 que la API había metido en General (sin cita) pasaron a Webinar 1 → Regalo 1. Copia: `scripts/salida/copia-webinar-17oct.json`. Commit `e1e6da9`; tests en `tests/integracion/ghl-espejo.test.ts` (3).

**Pendiente:** ver en real que una oportunidad que GHL mueve (p. ej. a Regalo 2) se mueve en la app · «Kiki» (etiqueta `regalo 1` sin oportunidad: sigue en General) · coste: cada lectura lee todas las oportunidades de Webinar 1 (2 llamadas por cada 100); con muchas, revisar.

