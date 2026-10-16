# Plan · Canales de las citas (GHL solo por API)

> Creado el 16 oct 2026. **Objetivo:** que cada cita que entra diga **de qué calendario y de qué canal viene** (Callers, YouTube, IG, Email, Biblioteca, Webinar, DFY o Directo), con etiqueta y filtro en la app. Las citas se leen **solo con la API de GHL** (sin workflows de citas). El plan general sigue en `plan.md`.

**Índice:** 1. Dónde estamos · 2. Decisiones · 3. Fases · 4. Riesgos · 5. Datos comprobados

---

## 1. Dónde estamos (16 oct, comprobado)

- **App publicada:** versión `64faa3b` (13 oct, 20:39). GitHub igual (más una línea en blanco del README). El PR #1 de Juampi está deshecho (PR #2).
- **Vercel:** después del rollback de Juampi, según su documento, **no publica solo** los commits nuevos hasta reactivarlo (no comprobado en el panel).
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
| Vercel | Cristian reactiva la publicación automática antes del primer cambio. |
| Workflows de citas | Se despublican **al final**, después de la prueba real (lo hace Cristian). |
| Del trabajo de Juampi | Se aprovecha la idea de su commit `a1fa7d8` (columnas, etiqueta, recuperar citas viejas), con el canal sacado del UTM. Su revisión del webhook no entra. |

**Pendiente de aclarar antes de la fase 1:**
- [ ] Qué pipelines «0. Agendas …» faltan: ¿Email, Biblioteca, Webinar y DFY? ¿«Directo» va a «0. Agendas Orgánico»? ¿Se crean también en GHL?
- [ ] `/agenda-yt` y `/agenda-ig`: GHL **no deja** redirigirlas mientras las páginas existan («This domain and path combination already exists»). ¿Las borra Cristian (como la de callers) y entonces pongo la redirección a `?utm_source=yt` / `ig`?
- [ ] La errata `utm_source=bibliotec`: la busca Cristian en GHL.

## 3. Fases (en este orden; cada una se comprueba antes de pasar a la siguiente)

**Fase 0 · Preparar (Cristian y Claude)**
- [ ] Cristian: reactivar la publicación automática en Vercel (Overview → *re-enable auto-assigning custom domains*).
- [x] Claude (16 oct): Mac al día con GitHub (`git pull --rebase`); el commit del plan del 13 oct, listo para subir.
- [x] Claude (16 oct): ids de GHL puestos en la app. Felipe `gu2tq13mouhgmdLVW1eH` (9 citas) y Cintia `fRvLW0KO59z9R2vY0XSc` (6 citas). Sacados cruzando `assignedUserId` de la API con `closer_email` de los avisos de la misma cita; el método se validó con el id de Cristian, que ya estaba puesto y coincide.
- [x] Claude (16 oct): «Link agenda» de Maestria cambiado de `/agenda-callers` a `https://codigomaestria.com/agenda?utm_source=callers`.
- [ ] Redirecciones `/agenda-yt` y `/agenda-ig`: bloqueadas por GHL mientras existan las páginas (ver pendientes). No se guardó nada.
- [ ] Cristian / José: cambiar en anuncios, bios y mensajes los links al formato nuevo (lista en el punto 5).

**Fase 1 · Base de datos (la migración la lanza Cristian)**
- [ ] Citas: `canal`, `ghl_calendario` y `origen_url` (la página desde la que reservó).
- [ ] Proyecto: los calendarios de GHL que lee la app (se eligen en Administración → Integraciones).

**Fase 2 · Leer las citas por API (Claude)**
- [ ] La sincronización lee **por calendario**, no por closer.
- [ ] El canal sale del UTM o de la página (`lastAttributionSource` del contacto) y se guarda en la cita la primera vez que se ve.
- [ ] El closer, por su usuario de GHL (`assignedUserId`).
- [ ] Antes de dar una cita por cancelada, se comprueba que de verdad no está (para que una lista incompleta de GHL no cancele citas buenas).
- [ ] Un lead «vendido» no vuelve a «agendado».
- [ ] Tests.

**Fase 3 · Que se lea sola cada 30 s (Claude)**
- [ ] Programador de Supabase → dirección protegida de la app. El botón «Sincronizar» se queda.
- [ ] Aviso visible: «Última lectura de GHL: hace X».

**Fase 4 · Verlo en la app (Claude)**
- [ ] Etiqueta del canal en la cita y en el lead (Llamadas, tablero de Closers, popup del lead).
- [ ] Cada cita a «Agendan» del pipeline de su canal y al general.
- [ ] Filtro por canal en Agendas, en el CRM y en KPIs.

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
