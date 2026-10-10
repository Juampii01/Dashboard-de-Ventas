# Plan · Dashboard de ventas (app Eternity)

> Creado: 9 oct 2026 · Limpiado y reordenado: 10 oct 2026, noche · Al día: 11 oct 2026 (tras los bloques 1 y 2). El detalle de todo lo hecho hasta el 10 oct (pruebas, fórmulas, respuestas de cada ronda) está en `plan-historial-10oct.md`; la auditoría, en `Arreglar-dashboard.md`; lo hecho después, en el historial de git.

---

## 0. Dónde estamos (léelo primero al retomar)

La app está **terminada en local y probada** (v1, v2, los 36 arreglos de la auditoría, el Paso H, el Paso 0 y, de 1.0, «Antes de todo», el Bloque A y los bloques 1 y 2), **sin publicar**. Bloques 1 + 2 con su commit (11 oct). **No se publica hasta que esté todo** (Cristian, 11 oct).

**Lo siguiente:** que Cristian vea los bloques 1 y 2 (se hicieron seguidos, con su permiso). Después, el Bloque 3 (rotación de closers) y el 4, juntos en el siguiente commit. Luego la pasada de pruebas en pantalla (1.1). Tu revisión completa (2.1) puede ir en paralelo.

**«Terminado»** = el equipo real entra en la app publicada (ordenador o móvil), los leads de GHL llegan solos, los avisos de los reportes llegan y un caller y un closer trabajan un día real sin problemas.

---

## 1. Lo que me falta a mí (Claude), en orden

### 1.0 Nuevo antes de publicar (pedido por Cristian el 10 oct 2026, noche)
**Cómo se trabaja:** un bloque cada vez y en este orden (cada uno se apoya en el anterior). Cada bloque termina con: tests (que fallen si se rompe la regla), `next build`, prueba en pantalla en Proyecto Prueba (datos «PRUEBA» borrados al terminar), plan y guías al día, y **te lo enseño antes de pasar al siguiente**. **Commit cada 2 bloques** (Cristian, 11 oct): «Antes de todo» + A · 1 + 2 · 3 + 4 · 5 + 6 · 7.

**Lo que ya existe (comprobado en el código el 10 oct):** horario de los callers con un solo tramo por día (`miembros_proyecto.horario`, V2-11) · reparto al entrar «a mano / rotativo / por horarios» (`proyectos.modo_reparto`) · comisión por persona, producto y rol, de venta y de agenda (`lib/comisiones.ts`), y liquidaciones del mes sobre lo cobrado (`lib/finanzas.ts`) · cambiar contraseña desde Administración · usuario y calendario de GHL de cada persona (`miembros_proyecto.ghl_user_id` / `ghl_calendar_id`, en Integraciones) · cuentas de Fathom por closer · pasos de onboarding de clientes (los edita el CEO) · avisos de reportes por el workflow de GHL · link de pago por producto · la cola ordena por prioridad A/B/C. **No existe:** una página «Mi perfil» · envío de emails propio (sin servidor de correo, Supabase solo manda emails a las direcciones del equipo de Supabase, según su documentación).

**Investigado:** Salesforce no trae reparto por turnos de serie (se hace con reglas o herramientas aparte: por turno, con peso y con tope por persona). GHL ([ayuda oficial](https://help.gohighlevel.com/support/solutions/articles/155000001716)): horario semanal con varios tramos por día, horarios por fecha que mandan sobre el semanal, duración de la cita, intervalo, descanso tras cada cita, aviso mínimo y máximo de citas por día; en sus calendarios con rotación se elige si la persona la elige quien reserva o la asigna la rotación. **No confirmado** que GHL reparta con % por persona: se hace con % como pidió Cristian. Resend con Supabase ([guía de Resend](https://resend.com/docs/send-with-supabase-smtp)): servidor `smtp.resend.com`, puerto 465, usuario `resend`, la clave de Resend como contraseña y un dominio verificado.

#### Antes de todo · «Llamadas de GHL» oculta y 2 perfiles de prueba ✅ (11 oct, sin commit: va con el bloque A)
Motivo: las llamadas de GHL aún no están configuradas; esos 2 perfiles sirven para probarlas sin que el equipo las vea.
- [x] Ocultar la sección **«Llamadas de GHL»** (sección `grabadas` de Permisos) a **todos los callers y closers**: se quita de lo que callers y closers tienen **por defecto** en el código (`DEFECTO` en `lib/permisos-constantes.ts`), así vale también en la nube; el CEO o un director con Administración puede volver a abrirla en Permisos.
- [x] Crear 2 perfiles de prueba que **sí** la ven (permiso por persona): **closer-test@eternity.llc** (closer) y **caller-test@eternity.llc** (caller), con la contraseña que dio Cristian (guardada solo en `scripts/salida/`, fuera de git; no se escribe en el plan). `crear-usuarios` aprende 2 columnas más: `password` (contraseña fija) y `prueba` (si). Se crean en local para probar y en la nube al publicar, junto al equipo.
- [x] Que esos 2 perfiles **no interfieran en el equipo** (Cristian, 11 oct): marca «perfil de prueba» (`perfiles.es_prueba`, migración ya aplicada en local) → **fuera de cifras** (Ranking, KPIs, Funnel, Ventas, Agendas, Finanzas y el objetivo del equipo: no cuentan sus llamadas, citas ni ventas), **fuera del reparto y de la rotación**, **fuera de liquidaciones** y **ocultos en Equipo** y en los filtros de persona. Ellos sí pueden entrar, usar la app y verse entre ellos (el caller de prueba puede agendar al closer de prueba). La marca se puede poner y quitar en la ficha de la persona (bloque 5).
- [x] Tests: con la marca, sus llamadas y ventas no cambian ninguna cifra del equipo y nunca les toca un lead del reparto; sin la marca, sí.
- Cristian (11 oct): **no se publica hasta que esté todo**; se trabaja ya, en orden.
- La «Grabaciones» de Agendas (Fathom) es otra cosa y no se toca.

- **Hecho y comprobado (11 oct):** `perfiles.es_prueba` · `equipo()` deja fuera a los perfiles de prueba (y los incluye cuando quien mira es uno de ellos) · Funnel, KPIs, Ranking, Agendas, Ventas y Finanzas no cuentan sus llamadas, citas, ventas ni cobros · no entran en el organigrama ni en Liquidaciones · «Llamadas de GHL» fuera de lo de siempre de callers y closers · `crear-usuarios` con `password` y `prueba` (da el permiso de «Llamadas de GHL»). Creados en local closer-test y caller-test (en `scripts/salida/prueba.csv`). Test nuevo `perfiles-prueba.test.ts` (5; fallan 3 si se quita el filtro). **348 tests pasan.** Navegador: caller-test ve «Mis llamadas grabadas»; Carla no; el CEO sí; el organigrama no enseña a los de prueba.

#### Bloque A · «Biblioteca» en KPIs + «Repartir leads» ✅ (11 oct)
Pedido: *«En la sección KPIs, lo primero que veamos sea esta vista; que se pueda actualizar con un CSV; esto nos permitirá hacer el primer reparto de leads manual hasta que conectemos GHL; aunque GHL esté conectado, que siempre se actualice (por lo menos en este proyecto). Llámala "Biblioteca"».* Modelo: `Proyecto dashboard/vista-ventas.html` («Biblioteca de recursos 10 de octubre», 1.005 personas).
- **Qué tiene la vista (leída entera):** resumen (cuántos dejaron datos, % que puede invertir ya, % «caliente» = ingresos + invertir + empezar) · ¿quiénes son? (situación, experiencia con AI) · ¿qué quieren? (objetivo a 90 días, cuándo empezar) · ¿pueden invertir? · ¿cuánto tiempo tienen? (con el aviso «el programa pide mínimo 4 h al día») · ¿de dónde son? (por prefijo de teléfono) · escalera de ofertas (Membresía 47 $/mes, Grupal 1.997 $, VIP 4.997 $, DFY a medida, con cuántos encajan en cada una) · tabla de todos los leads con filtros por oferta, buscador, columnas ordenables (invertir, tiempo y cuándo empezar ordenados de más a menos listo) y ficha al hacer clic.
- **Las respuestas** de los leads de la app son **las mismas palabras** que las de la vista (comprobado pregunta a pregunta en la base): la regla y las cifras se calculan tal cual.
- **Cifras del resumen** (comprobadas con los datos del archivo): «caliente» = objetivo «Llegar a $5,000 al mes» o «Cerrar mi primer cliente en USA» + invertir «Sí, ahora» + empezar «Ya mismo» o «Este mes» → **180 (17,9 %)** · «busca ingresos» = esos 2 objetivos → **47,8 %** · «más de 10 h» = «10 a 20 h» + «Más de 20 h» → **19,2 %** · DFY que invierten ya → **29** · país = por el prefijo del teléfono (+1 EE. UU./Canadá, +34 España, +54 Argentina, +57 Colombia, +58 Venezuela, +52 México, +56 Chile, +51 Perú… y «Otro» para el resto).
- **Qué leads entran y cómo se leen sus respuestas** (⚠ hueco encontrado al revisar, 11 oct): los leads llegan por 3 sitios y cada uno nombra distinto lo mismo:
  - **CSV de GHL:** etiqueta «biblioteca recursos» y preguntas con su texto completo («¿En qué situación estás hoy?», «¿Qué experiencia tienes con IA?», «¿Qué quieres lograr en los próximos 90 días?», «¿Cuánto tiempo por semana le puedes dedicar?», «Si encuentras el programa correcto, ¿estás en condiciones de invertir en tu formación?», «¿Cuándo quieres empezar?») — comprobado en la base.
  - **Landing directa** (envío real del 9 oct en `tests/apoyo/envios.ts`): `source: recursos`, etiqueta «recursos-ia» y preguntas `quiz_situacion`, `quiz_experiencia_ia`, `quiz_objetivo_90_dias`, `quiz_tiempo_semanal`, `quiz_inversion`, `quiz_inicio`, que la app guarda como «Situación», «Experiencia ia», «Objetivo 90 días», «Tiempo semanal», «Inversión», «Inicio». **Las respuestas sí son las mismas palabras.**
  - **Workflow de GHL:** las preguntas se llaman como las escriba quien monte el workflow (`customData`).
  - Por eso: entra en la Biblioteca quien tenga la etiqueta «biblioteca recursos» **o** «recursos-ia», **o** `source` «recursos», **o** esté en el pipeline «Biblioteca Recursos»; y cada pregunta se reconoce **por cualquiera de sus nombres** (el del CSV o el de la landing). En `GUIA-GHL.md` se dirá el texto exacto que hay que poner en `customData` para que también cuadre.
- **Regla de la clasificación** (sacada de los datos del archivo y comprobada: coincide en las **1.005 de 1.005**): **VIP** = puede invertir «Sí, ahora» + empezar «Ya mismo» o «Este mes» + tiene negocio o agencia, o ya automatiza o ya vendió servicios de AI · **Empresas (DFY)** = «Tengo un negocio» + objetivo «Automatizar mi negocio» · los dos → **VIP + Empresas** · puede invertir ya y no encaja en esos → **Grupal** · el resto → **Membresía**.
- **Decisiones de Cristian (11 oct):** los datos salen **de los leads de la app** (los 893 de Maestria ya traen las 6 preguntas y la etiqueta «biblioteca recursos», comprobado en la base); «Actualizar con CSV» usa la subida de leads que ya existe; con GHL conectado se suma sola · la ven **director y CEO**, como **primera pestaña de KPIs** · **se reparte desde aquí** (filtrar, p. ej. VIP sin caller, y «Repartir leads») · la clasificación se ve **en la Biblioteca, en la ficha del lead y en las tarjetas del CRM**, pero **no ordena la cola** (sigue «los más nuevos primero»).
- [x] Pestaña **«Biblioteca»** primera en KPIs, con todo lo de la vista adaptado al diseño de la app (claro y oscuro, móvil).
- [x] Botón **«Actualizar con CSV»** en la Biblioteca (la misma subida del CRM: nuevos y actualizados, sin duplicar).
- [x] **La clasificación como dato propio de cada lead** («Oferta»: VIP + Empresas, VIP, Empresas, Grupal, Membresía) (Cristian, 11 oct): se calcula para **todos** los leads con sus respuestas, se guarda, se recalcula sola cuando cambian sus respuestas (CSV, landing o GHL), se puede filtrar y se ve en la Biblioteca, en la ficha y en las tarjetas del CRM **junto a la etiqueta de siempre** (la respuesta de «invertir» y la A/B/C: Cristian quiere las dos). No se mezcla con las etiquetas de GHL.
- [x] **Al subir un CSV nuevo se ponen al día todos los datos** (Cristian, 11 oct): cada lead que ya existe recibe sus respuestas nuevas, que **sustituyen a las de la misma pregunta aunque venga con otro nombre** (hoy solo se sustituyen si el texto es idéntico: con los 3 orígenes se quedarían duplicadas; se guardan con un nombre único por pregunta) · se recalcula su «Oferta» · al terminar, un resumen: «X nuevos · Y actualizados · Z cambian de oferta». Lo mismo cuando entran por la landing o por GHL.
- [x] **«Repartir leads» manual** (lo del bloque 2: sin asignar o reasignar; equitativo, aleatorio, fijo por persona, con tope; vista previa) desde la Biblioteca y desde el CRM. El reparto **automático** al entrar se queda en el bloque 2 (necesita los horarios del bloque 1).
- [x] ⚠ **Datos personales:** `vista-ventas.html` tiene nombre, email y teléfono reales de 1.005 personas y está **fuera de git** (se queda así). Para los tests se guarda **solo** las 6 respuestas, el prefijo del teléfono y la oferta esperada de cada persona, **sin nombres, emails ni teléfonos**.
- [x] Tests: la regla con los 1.005 casos (sin datos de contacto; los 1.005 tienen que salir igual), los 3 orígenes (CSV, landing y GHL) reconocidos igual, las cifras del resumen frente a las del archivo con los mismos datos (180, 47,8 %, 19,2 %, 29, países), y el reparto (equitativo, aleatorio, fijo y con tope; reasignar; nunca a perfiles de prueba).
- [x] **Datos reales** (Cristian, 11 oct: «esos son los datos reales, usa esos»): sacar las 1.005 personas de `vista-ventas.html` a un CSV y subirlo a **Maestria en local** (permiso dado): los nuevos se añaden y los 893 que ya están se ponen al día (por email o teléfono, sin duplicar). La Biblioteca tiene que dar las mismas cifras que el archivo. La nube empieza limpia y ahí se sube al publicar.
- [x] **Productos con los nombres de la vista** (Cristian, 11 oct): Low ticket → **Membresía** (47 $, la vende el caller) · Mentoría grupal → **Grupal** (1.997 $) · Mentoría VIP → **VIP** (4.997 $) · Servicios para empresas (DFY) → **DFY** (precio personalizado), con la descripción de la vista (6 meses, llamadas…), en la base local y en `proyecto-base.json`. Cada escalón de la escalera de ofertas sale de su producto de Programas (nombre y precio).
- [x] **Membresía mensual sin fin** (Cristian, 11 oct): nuevo modo de pago «mensual» en Programas; al venderla queda un cobro de 47 $ pendiente **cada mes** en Finanzas → Pagos pendientes hasta que se marque **baja**; cuenta en comisiones como cualquier cobro.
  - ⚠ Encontrado al revisar: hoy, al vender, el lead del pipeline «Orgánico» se mueve a la columna «Low ticket», «Grupal» o «VIP» **mirando si el nombre del producto contiene «low», «vip» o «grupal»** (`leads/acciones.ts`). Con «Membresía» dejaría de funcionar. Arreglo: la columna con **el mismo nombre que el producto**, y renombrar la columna «Low ticket» de Orgánico a «Membresía».
- **Hecho y comprobado (11 oct):** `lib/oferta.ts` (regla y nombre único de las 6 preguntas, venga de CSV, landing o GHL) · `leads.oferta` (migración `20261013120000_biblioteca_oferta.sql`, que trae también la membresía mensual) · el guardado de leads normaliza las preguntas, recalcula la oferta y cuenta «cambian de oferta» · `lib/biblioteca.ts` + `biblioteca-datos.ts` (cifras y carga; al abrir, pone al día las ofertas que falten) · pestaña **Biblioteca** primera en KPIs (resumen, ¿quiénes son?, ¿qué quieren?, invertir, tiempo, países, escalera y tabla con chips, buscador, orden, ficha, «Actualizar con CSV» y «Repartir») · `lib/reparto.ts` + `crm/reparto.ts` + `components/repartir-leads.tsx` (vista previa; también en el CRM) · oferta en tarjetas del CRM y ficha · productos renombrados (Membresía mensual, Grupal, VIP, DFY) y columna «Membresía» en Orgánico; al vender, el lead va a la columna con el nombre del producto · membresía: modo «Cada mes» en Programas y en la venta, un cobro pendiente cada mes, «Dar de baja» en Ventas.
- **Datos reales en Maestria local:** limpiados los restos de pruebas (121 líneas de historial, 100 callers de prueba quitados) y subidas por la pantalla las 1.005 personas (112 nuevas + 893 al día, sin duplicar): ofertas **627 / 242 / 71 / 40 / 25, iguales que la vista**.
- **Tests:** `biblioteca.test.ts` (8: las 1.005 ofertas, los 3 nombres de preguntas, todas las cifras de la vista), `reparto` (5 + 5), `membresia` (3 + 2). Rotas a propósito la regla y el reparto: sus tests fallan. **371 tests pasan**, `next build` correcto.
- **Navegador (CEO, Maestria):** Biblioteca con 1.005, 34 % (342), 17,9 % (180) y la escalera igual que la vista; «Repartir VIP» con vista previa (10 de 71; arreglado un fallo: abría con «Todas»); ficha; oferta en CRM y ficha; móvil sin desbordes; 0 errores de consola. **No se repartió nada de verdad en Maestria** (solo vista previa; el reparto real está probado en tests).
- Criterio de Claude: en la membresía, la facturación es la del primer mes; los meses siguientes entran como cobros (cash).
- ⚠ No probado en pantalla: «Dar de baja» y el modo «Cada mes» en Programas (sí en tests).

#### Bloque 1 · Horario y disponibilidad (como GHL) + «Mi perfil» ✅ (11 oct)
- **Decisiones de Cristian (11 oct):** el horario se pone en **la hora del proyecto** y al lado se ve **la hora de quien mira** (la de su ordenador o móvil, no por IP: así no se manda la IP a nadie) · cada caller y closer cambia **el suyo** (en el onboarding y en «Mi perfil»); un administrador, el de cualquiera; la zona del proyecto solo se elige al crearlo · **duración, descanso, aviso mínimo y máximo por día los pone solo el administrador** (por defecto 30 min, 0, 0 y sin máximo) · los días sueltos **como GHL** (libre o con otro horario) · el horario es **obligatorio** en el onboarding de callers y closers (los días de descanso, opcionales) · el caller tiene 3 botones rápidos: **Mañana 9-13, Tarde 14-18, Todo el día 9-18**, de lunes a viernes, y luego lo ajusta como quiera · «Mi perfil» también **cambia la contraseña** (el email, en el bloque 6).
- [x] **Horario semanal con varios tramos por día** (los huecos son los descansos) y **días o fechas sueltas** (vacaciones, festivos, descansos) que mandan sobre el semanal. Para callers y closers. El horario de un tramo que ya tienen los callers se pasa al nuevo formato sin perderlo.
- [x] **Ajustes de los closers** (como un calendario de GHL): duración de la llamada (**por defecto 30 min**, el valor general en Administración), **descanso tras cada llamada**, aviso mínimo para agendar y máximo de llamadas por día. Los pone el administrador por proyecto y cada closer puede tener los suyos.
- [x] **Página «Mi perfil»** para todos: nombre, teléfono, WhatsApp y **su horario**. Para callers y closers, el horario es también **un paso del onboarding** (ya existe el onboarding con nombre, email, teléfono y WhatsApp).
- [x] «Libre a una hora» = está en su horario + no tiene otra cita (con su duración y su descanso) + respeta aviso mínimo y máximo por día. Se usa en el bloque 3.
- **Hecho y comprobado (11 oct):** `lib/horarios.ts` (tramos por día, días sueltos, botones rápidos, lee el formato viejo) · `lib/disponibilidad.ts` (`libreA`: horario + otras citas con duración y descanso + aviso + máximo; las canceladas y reagendadas no ocupan) y `lib/agenda-libre.ts` (`closerLibreA`, con las citas de la base; mira las citas del closer en todos sus proyectos) · migración `20261014090000_horarios_calendario.sql` (pasa los horarios viejos; un turno que pasaba de medianoche se parte en dos; en local no había ninguno guardado) · `components/editor-horario.tsx` (el mismo editor en onboarding, «Mi perfil» y Administración) · página `/perfil` (se abre tocando tu nombre, abajo a la izquierda) · Administración → Proyecto y reparto: «Horarios del equipo» (Editar de cada uno, y los ajustes propios de cada closer) y «Llamadas de los closers (para todos)».
- **Tests:** `horarios.test.ts` (9) y `horario-perfil.test.ts` (6). Rotos a propósito el descanso y los días sueltos: fallan 2 cada vez.
- **Navegador (11 oct):** Carla hizo el onboarding con «Mañana», un 2.º tramo el lunes y el 25 dic libre (guardado tal cual; al lado sale su hora de Madrid, 15:00-19:00); en «Mi perfil» cambió a «Tarde» y se guardó; el CEO ve los horarios de todos y le puso a Ana un máximo de 4 llamadas al día y lo quitó; sin desbordes en móvil (375 px). Todo devuelto como estaba.
- ⚠ No probado en pantalla: cambiar la contraseña desde «Mi perfil» (sí en tests) y el editor de horario en un móvil de verdad.
- Detalle: la hora de quien mira se calcula con la fecha de hoy; en las 1-2 semanas al año en que EE. UU. y Europa cambian la hora en días distintos, la de la semana puede salir 1 h distinta (la de los días sueltos sale bien).

#### Bloque 2 · Reparto automático de leads entre callers ✅ (11 oct)
- [x] El botón «Repartir leads» manual pasa al bloque A (se necesita ya para el primer reparto). Recordatorio de cómo es: **sin asignar** (filtrando por pipeline, columna, evento u oferta) o **reasignar** los de una o varias personas; entre los callers que marques; **equitativo** (N por turnos), **aleatorio** (N al azar), **fijo por persona** (N a cada uno) y **con tope** (nadie pasa de X leads sin trabajar: nuevos + no contesta + llamar luego); con vista previa «Carla 20 · Diego 20…».
- [x] **Reparto automático al entrar** (GHL, landings, CSV) en Administración → Proyecto y reparto: **apagado por defecto**; encendido = **% por caller** (todos empiezan al 0 %) y la opción «solo a quien esté en su horario» (bloque 1). Sustituye a «a mano / rotativo / por horarios» de hoy.
- [x] Cada reparto y reasignación queda en el historial del lead.
- **Decisiones de Cristian (11 oct):** los % **suman 100** (la app avisa si no) · con «solo a quien esté en su horario», si no hay nadie en su horario **se reparte igual** entre todos los que tienen % · sustituye a «a mano / rotativo / por horarios» (apagado = a mano).
- **Cómo reparte (criterio de Claude):** cada lead va a quien tenga menos leads para su % (con 50/30/20, 10 leads salen 5, 3 y 2); al cambiar los %, la cuenta empieza de cero; la base bloquea mientras decide, así dos leads a la vez no se reparten mal. Los perfiles de prueba y los inactivos nunca entran; un caller al 0 % no recibe nada.
- **Hecho y comprobado (11 oct):** migración `20261014100000_reparto_porcentaje.sql` (`reparto_auto`, `reparto_solo_horario`, `reparto_pct`, `reparto_cuenta` y la función `repartir_por_pct`; quita `modo_reparto`, `rotacion_indice` y `avanzar_rotacion`; los 2 proyectos locales estaban «a mano», así que quedan apagados) · `repartoAutomatico` en `lib/leads.ts` (GHL, landings y CSV con «Repartir») con su línea en el historial · Administración → «Reparto automático de leads (callers)» con su % por caller, «A partes iguales» y la suma a la vista · `limpiar-pruebas` pone la cuenta a cero.
- **Tests:** `reparto-auto.test.ts` (7) y puestos al día los del reparto viejo (`funciones`, `arreglos-auditoria`, `v2-11`, `perfiles-prueba`). Rotos a propósito: «solo en horario» (fallan 2) y «apagado» (falla 1). Lo del 0 % está a la vez en el código y en la base: quitarlo solo del código no lo rompe.
- **Navegador (11 oct, CEO, Maestria):** encender con todo al 0 % da el aviso «suman 0»; «A partes iguales» pone 25 % a cada uno y se guarda (Caller Test fuera). Devuelto a apagado y 0 %.

#### Bloque 3 · Rotación de closers
- [ ] En Administración: **% por closer** (todos al 0 % = apagada) y **cómo se elige el closer al agendar**: «lo elige quien agenda» (por defecto, como hoy), «lo propone la rotación (se puede cambiar)» o «lo decide la rotación».
- [ ] Toca el closer con más % pendiente según su peso; si **no está libre** a esa hora (bloque 1), salta al siguiente; si ninguno lo está, avisa y deja elegir.
- [ ] En todos los sitios donde se agenda: cola del caller, CRM («Agendados»), Crear llamada, ficha del lead y Post-call (reagendar). Con «lo decide la rotación», el servidor pone el closer aunque se intente otro.

#### Bloque 4 · Comisiones por tramos
- [ ] **Tramos por rol** (editables en Equipo): callers 0-9.999 € → 3 % · 10.000-24.999 € → 3,5 % · 25.000-49.999 € → 4 % · 50.000-74.999 € → 4,5 % · 75.000-99.999 € → 5 % · desde 100.000 € → 5,5 %. Closers: 7 % en todos los tramos (el equipo los define luego).
- [ ] **Cómo se calcula** (Cristian, 10 oct): cada mes se suma la facturación de sus ventas del mes (caller: las ventas cerradas de los leads que agendó + su low ticket; closer: lo que vendió) · el % del tramo alcanzado se aplica a **toda** esa facturación · se reinicia cada mes · se paga sobre lo cobrado · **lo que se cobra después (cuotas) va con el % del mes en que se hizo la venta**.
- [ ] **Interruptor por persona** en su ficha: «manda su % propio» o «mandan los tramos» (Cristian: que se pueda elegir con un botón quién manda).
- [ ] Liquidaciones de Finanzas con los tramos (y el tramo alcanzado a la vista).

#### Bloque 5 · Ficha completa de cada persona (Empresa → Equipo)
- [ ] Clic en una persona → ventana con todo: la marca «perfil de prueba» · datos (nombre, email, teléfono, WhatsApp, área, puesto) · rol, Administración y permisos de secciones y de pipelines · **comisiones** (su %, el interruptor del bloque 4, por producto) · **reparto y rotación** (su %) · **horario y ajustes de calendario** (bloque 1) · **calendario y usuario de GHL** y **cuenta de Fathom** · **cambiar contraseña** · **cambiar email** (lo cambia el administrador directamente) · **enviar enlace mágico** (bloque 6). La usan **el CEO y los directores con Administración**. Las personas sin acceso a la app (solo en el organigrama) tienen la parte de datos y comisión.

#### Bloque 6 · Emails con Resend
- [ ] Clave `RESEND_API_KEY` en el servidor y envío de emails de la app (avisos de los reportes por email; el WhatsApp sigue por el workflow de GHL).
- [ ] Supabase con Resend como servidor de correo (enlaces mágicos y cambios de email), remitente @eternity.llc. Sin email de bienvenida: los accesos se los manda Cristian por WhatsApp.
- [ ] Guía paso a paso en `GUIA-PUBLICAR.md` (crear la cuenta, verificar eternity.llc con sus registros DNS, poner la clave en Vercel y en Supabase). En local no se pueden enviar emails reales: se prueba con un envío falso en los tests y con la cuenta real al publicar. **Necesita de Cris:** la cuenta de Resend, su clave y quien añada los registros DNS de eternity.llc.

#### Bloque 7 · Reporte, onboarding de closers, recursos y cola
- [ ] **Preguntas del reporte editables** en Administración (por defecto, las de hoy). Las 3 que usan las tasas del closer (llamadas realizadas, agendadas y ventas) se pueden renombrar pero no borrar. Los reportes ya enviados guardan sus preguntas tal cual.
- [ ] **Onboarding de los closers:** en el menú del closer, «Onboarding» con **sus clientes cerrados** y una checklist por cliente (Onboarding enviado · Acceso dado · Seguimiento hecho · Llamada de bienvenida), que marca él; los puntos los edita el equipo. Director y CEO ven los de todos. Aparte del onboarding de clientes que ya existe (100 % configurable).
- [ ] **Links y recursos con diseño nuevo** (hoy «se ve muy Windows XP») y un **link de dossier** encima del link de pago en cada producto (los pone el equipo).
- [ ] **Cola del caller sin prioridad:** los más nuevos primero (la A/B/C se sigue calculando pero no ordena).
- [ ] «DFY» (antes «Servicios para empresas») con precio personalizado y editable en Programas: comprobar que ya va (y que se pueden añadir más productos así).

**Documentos que hay que poner al día con cada bloque** (para que no se queden viejos):
- «Antes de todo»: `GUIA-GHL.md` Parte 4 (la sección «Llamadas de GHL» solo la ven jefes y los 2 perfiles de prueba) · `GUIA-PUBLICAR.md` paso 6 (los 2 perfiles de prueba y las columnas `password` y `prueba`).
- Bloque A: `GUIA-GHL.md` Workflow 1 (texto exacto de las 6 preguntas en `customData` y la etiqueta) · `GUIA-PUBLICAR.md` paso 7 (subir el CSV de la Biblioteca) y lista final · `proyecto-base.json` (nombres y descripciones de productos, columna «Membresía» en Orgánico).
- Bloques 1-3: `GUIA-GHL.md` Workflow 1 («si el reparto está en rotativo…» cambia por el reparto con %) y Workflow 2 (rotación de closers).
- Bloque 4 y Membresía mensual: `GUIA-PUBLICAR.md` lista final (Finanzas: la membresía deja un cobro cada mes).
- Bloque 6: `.env.example` (`RESEND_API_KEY`) · `GUIA-PUBLICAR.md` (paso de Resend, variable en Vercel, «Si algo falla») · `GUIA-GHL.md` Parte 2 (el email del aviso sale por Resend; el workflow solo para WhatsApp).
- Siempre: el número de tests, migraciones y tablas en el plan y en `GUIA-PUBLICAR.md`, y mis notas de memoria. `plan-historial-10oct.md` y `Arreglar-dashboard.md` son históricos: no se tocan.

**Criterios míos en 1.0 (puedes cambiarlos):** el tope cuenta como «sin trabajar» los leads en Nuevo, No contesta y Llamar luego · la rotación de closers por defecto «lo elige quien agenda» y apagada · vista previa antes de repartir · el cambio de email lo hace el administrador sin pedir confirmación al usuario · las 3 preguntas de las tasas no se borran.

### 1.1 Antes de tu revisión: probar en pantalla lo que solo está en tests
- [ ] CRM → «Callers»: soltar una tarjeta en «Agendados», «Llamar luego», «No interesa» y «Cerrados» (se abre su ventana). (Permiso dado por Cristian el 10 oct: Carla un rato en Proyecto Prueba con datos «PRUEBA», borrados al terminar.)
- [ ] CRM → llave de permisos: cambiar un permiso desde la ventana y ver que la persona deja de ver el pipeline (lo devuelvo como estaba).
- [ ] Un director **sin** Administración (columnas bloqueadas, sin llave, sin Permisos). (Permiso dado: quitarla un rato y devolverla.)
- [ ] Permisos «lo suyo» en pantalla: caller con Clientes, Ventas y KPIs · closer con «Mis leads» · Programas solo mirar.
- [ ] Objetivos: crear y borrar un lanzamiento, quitar un objetivo, el diario con días marcados, el avance del director, la racha con días cumplidos y la celebración.
- [ ] CRM: crear un pipeline y sus columnas de verdad (solo probado con tests).
- [ ] Clientes: marcar un paso de onboarding y guardar un caso de éxito.
- [ ] Administración: usuarios de GHL con callers dentro (solo se han visto vacíos). Los horarios se prueban en el bloque 1.
- [ ] Finanzas: importar un CSV del banco, transferir entre cuentas, gastos programados, pagar una liquidación.
- [ ] `preparar-proyecto` sobre una base vacía (que crea Maestria con «Callers» y «Closers»).
- [ ] Ver la pantalla «Algo ha fallado» con un error de verdad.
- [ ] Detalle: al crear una entrada de landing, el formulario se queda con el nombre escrito (se podría crear dos veces).

### 1.2 Después de tu revisión
- [ ] Arreglar lo que encuentres (lo apunto aquí y tú decides qué va antes de publicar).
- [ ] Cambiar los criterios míos que no te gusten (lista en la sección 4).

### 1.3 Publicar (sigo `GUIA-PUBLICAR.md`)
- [ ] Actualizar la Supabase CLI de la 2.90 a la 2.120. **Necesita de Cris:** ejecutar `brew trust supabase/tap` (ajuste de seguridad del Mac).
- [ ] Subir el código a GitHub (repositorio privado). **Necesita de Cris:** la cuenta de GitHub creada.
- [ ] Crear las tablas en la nube (`supabase db push`: las 22 migraciones de hoy + las de 1.0). **Necesita de Cris:** el proyecto de Supabase creado, con «Allow new users to sign up» desactivado.
- [ ] Configurar Vercel: carpeta `app`, `NEXT_PUBLIC_SUPABASE_URL` **antes** del primer despliegue, las 3 variables de Supabase, `CLAVE_CIFRADO`, las 2 de IA y `RESEND_API_KEY`. **Necesita de Cris:** la cuenta de Vercel y guardar `CLAVE_CIFRADO` en su gestor de contraseñas.
- [ ] Resend: verificar eternity.llc (los registros DNS pueden tardar en propagarse: hacerlo al principio), poner Resend como servidor de correo de Supabase y probar un enlace mágico y un aviso de reporte reales. **Necesita de Cris:** cuenta de Resend y quien añada los DNS.
- [ ] `preparar-proyecto --confirmar` (Maestria con sus pipelines y productos).
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
- [x] «Pepi» y «Test» (personas de prueba sin acceso del organigrama de Maestria): **borradas** con permiso de Cristian (10 oct).
- [ ] (Opcional) Limpiar la copia local: en Maestria quedan **100 leads asignados a callers de prueba, 10 con estado de prueba y 121 líneas de historial** de las pruebas del 9-10 oct (sin ventas ni citas). Con `limpiar-pruebas --confirmar`, añadiéndole antes una copia de seguridad. No hace falta para publicar (la nube empieza limpia). (Permiso dado por Cristian el 10 oct: se hace.)

---

## 2. Lo que necesito de ti (Cris), en orden

### 2.1 Ahora
- [x] Permisos de 1.1 y limpiar Maestria local: **dados** (10 oct, noche).
- [ ] **Revisión completa de la app** (v1 + v2 + arreglos + Paso H + Paso 0), empezando por la pasada de punta a punta (CSV → caller → agenda → venta → Funnel), que aún no has visto. Usuarios de prueba en la sección 6.
- [x] Preguntas del reporte: **se quedan las de hoy**, pero editables en Administración (1.0).
- [ ] Con tu ratón: arrastrar en el CRM (también «Callers» y «Closers»), en Agendas → Pre-call y en Post-call (yo solo puedo simularlo).
- [ ] Mirar el diseño en tu móvil (misma wifi, la IP del Mac en vez de `localhost`).
- [ ] Revisar mis criterios (sección 4) y decirme cuáles cambio.
- [x] Tests de pantallas completas: **después de publicar** (10 oct).

### 2.2 Para publicar
- [ ] Crear la cuenta de Resend y conseguir a alguien con acceso al DNS de eternity.llc (cuanto antes: la verificación puede tardar).
- [ ] Ejecutar `brew trust supabase/tap` en tu terminal.
- [ ] Crear las cuentas de GitHub, Supabase y Vercel (te guío paso a paso).
- [ ] Guardar `CLAVE_CIFRADO` en tu gestor de contraseñas cuando la generemos.
- [x] Plan: **los gratuitos para empezar** (10 oct). Riesgo: sin copias de seguridad garantizadas y posible pausa por inactividad (sección 5).
- [x] Dirección: **la gratuita de Vercel** (sin dominio propio por ahora).

### 2.3 Datos que tienes que pasarme
- [x] Equipo (10 oct): CEO «Cris y José» (una cuenta, info@eternity.llc) · directores con Administración: Juan y Junior · callers: Felipe Gaspar Fernández, Miguel Angel Toledo, Hanna Marlene Moya Gutierrez, Lucas Gonzalez Diaz y Tomás Ponce · closers: Andrés Ugalde Brenes y Renzo Iván Quiroga (emails y teléfonos en `scripts/salida/equipo.csv`).
- [x] DFY (antes «Servicios para empresas»): precio personalizado, editable (1.0).
- [x] Landings: las reglas de Administración → Entradas (qué `source` va a qué pipeline) las configura el equipo (confirmado por Cristian).
- [x] Prioridad A/B/C: no ordena la cola (1.0). La clasificación de la Biblioteca (VIP, Grupal…) se ve en la ficha y el CRM, sin ordenar la cola.
- [x] Columnas: valen las de ahora (personalizables en el CRM). Links de pago y de dossier: los pone el equipo más tarde.
- [ ] CSV de contactos exportado de GHL: **al final** (Cristian).
- [x] Reparto y rotación: todo a 0 %; lo configuran los directores.
- [x] Comisiones: por tramos (1.0).
- [ ] Contexto del negocio para la IA: lo añade el equipo más tarde en Programas.
- [x] Onboarding, cuentas y categorías de Finanzas: configurables por el equipo (1.0 para el de los closers).
- [ ] Recursos (links, PDF, guiones): los pone el equipo.
- [ ] Las claves de GHL, Fathom, Claude y Deepgram: **al final del todo**, las pones tú a mano.
- [ ] La clave de Resend (bloque 6 y 1.3).

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
| 1.0 Bloques 1 y 2 (horario como GHL, «Mi perfil», disponibilidad de closers, reparto automático con %) | (commit de hoy) |

**Comprobado el 11 oct (tras los bloques 1 y 2):** 390 tests pasan (4 de rendimiento se saltan, como siempre) · tsc y eslint limpios · `next build` correcto · `npm audit` de producción 0 · 26 migraciones (11 oct: `horarios_calendario` y `reparto_porcentaje`) · 42 tablas, todas con RLS · nada subido a la nube.

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
- **Comisiones (1.0):** tramos mensuales sobre toda la facturación del mes; cuotas posteriores con el % del mes de la venta; interruptor por persona para que mande su % propio o los tramos.
- **Emails (1.0):** Resend desde eternity.llc para enlaces mágicos, cambio de email y avisos de reportes; sin email de bienvenida.
- **Cola del caller:** los leads más nuevos primero; la prioridad A/B/C no ordena.
- **Biblioteca (11 oct):** primera pestaña de KPIs, para director y CEO; datos de los leads de la app (también por CSV y, con GHL, sola); se reparte desde ella; su clasificación es un dato propio de cada lead («Oferta»), calculado para todos y recalculado solo; se ve en la ficha y en el CRM junto a la etiqueta de siempre; cada CSV nuevo pone al día todos los datos.
- **Productos (11 oct):** se llaman Membresía (47 $/mes, mensual sin fin), Grupal (1.997 $), VIP (4.997 $) y DFY (personalizado).
- **Commits:** cada 2 bloques de 1.0.
- **Plan de la nube:** gratuito para empezar · dirección de Vercel (sin dominio propio) · tests de pantallas completas después de publicar.
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

---

## 5. Riesgos y avisos
- **Velocidad en la nube:** sin medir (en local, el Funnel con 30.000 leads carga en ~1 s). Si fuese lento, traer los datos con una sola llamada a la base.
- **GHL:** algunas variables y disparadores no están documentados (se prueban en 1.4) · la lista de citas de GHL no pagina: si llegara incompleta, se cancelarían citas buenas · puede que director y CEO tengan que existir como contactos en GHL para recibir avisos (sin verificar) · la API no deja lanzar llamadas desde la app.
- **Llamadas de callers:** solo cuentan las hechas desde GHL (no WhatsApp ni el móvil propio).
- **Post-call «mover todo»:** mover una cita «reagendada» puede contar la misma reunión dos veces en KPIs, Funnel y objetivos; sacar una venta de su columna la borra con cobros, plazos y comisiones (hay confirmación).
- **Citas:** un lead puede tener dos citas vivas a horas distintas (solo se impide la misma hora con el mismo closer).
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
**Usuarios de prueba** (todos `@eternity.test`, con la contraseña que pusiste el 10 oct): ceo@, director@ (con Administración), closer1@, closer2@, caller1@, caller2@, caller3@, caller4@.
**Datos locales:** Maestria = 1.005 leads reales de la biblioteca (limpios de pruebas el 11 oct, con su oferta), sin ventas, citas ni objetivos · Proyecto Prueba = donde pruebo (3 leads, 1 venta de prueba, cuenta «Todo», categorías y 3 pasos de onboarding de ejemplo).

| Dónde | Qué |
|---|---|
| `app/docs/plan.md` | Este plan |
| `app/docs/plan-historial-10oct.md` | El plan completo de antes de compactar |
| `app/docs/GUIA-PUBLICAR.md` | Los 10 pasos para publicar |
| `app/docs/GUIA-GHL.md` | Conectar GHL |
| `app/docs/Arreglar-dashboard.md` | La auditoría (36 puntos) |
| `app/` · `app/tests/` · `app/.env.example` | El código, los tests y las variables |
| `app/scripts/` | `preparar-proyecto`, `crear-usuarios`, `limpiar-pruebas` (simulan sin `--confirmar`) y `seed` (solo local) |
