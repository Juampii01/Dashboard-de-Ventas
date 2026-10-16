# Plan · Canales de las citas (GHL solo por API)

> Creado el 16 oct 2026. **Objetivo:** que cada cita que entra diga **de qué calendario y de qué canal viene** (Callers, YouTube, IG, Email, Biblioteca, Webinar, DFY o Directo), con etiqueta y filtro en la app. Las citas se leen **solo con la API de GHL** (sin workflows de citas). El plan general sigue en `plan.md`.

**Índice:** 1. Dónde estamos · 2. Decisiones · 3. Fases · 4. Riesgos · 5. Datos comprobados

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
- [ ] Cristian la lanza (`supabase db push`) y compruebo en la base que están las columnas y los 3 calendarios.

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
- [ ] Recuperar el canal de las 15 citas desde el 13 oct; las 21 anteriores, «sin canal».

**Fase 6 · Prueba real (juntos)**
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
