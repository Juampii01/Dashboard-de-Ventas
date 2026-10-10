# Arreglar · Dashboard Eternity

> Auditoría del código hecha por Claude el 9 oct 2026 (commit `68378a8`). **No se ha cambiado nada del código**: aquí solo se apunta.
> Para cada punto: qué pasa, dónde está (archivo y línea, dentro de `app/src/` salvo que se diga otra cosa), cómo lo sé y cómo se arreglaría.
> Cristian decide qué se arregla y en qué orden.

## Cómo se ha hecho

- **Leído entero:** todo lo que corre en el servidor: sesión y permisos, los 2 webhooks, todas las acciones (leads, closer, ventas, CRM, Administración, Equipo, Programas, Finanzas, Clientes, Fathom, IA, llamadas de GHL, reportes, recursos, login, onboarding), las librerías de cálculo (métricas, finanzas, fechas, GHL, Fathom, IA) y las migraciones de la base de datos.
- **Revisado a trozos (no línea a línea):** los componentes de pantalla (formularios, tableros, ventanas). Comprobé lo que más riesgo tenía: que cada página mire los permisos, que la clave secreta no llegue al navegador, que los tableros deshagan si falla un cambio y que los formularios obliguen los campos clave.
- **Comprobado con datos o con la documentación oficial** cuando se dice. Lo demás sale de leer el código; lo marco como «leído».
- Estado al empezar: 248 tests pasan, tsc y eslint limpios, versión compilada probada en el puerto 3200.

## Resumen

| Prioridad | Cuántos | Qué significa |
|---|---|---|
| 🔴 Antes de publicar | 4 | Rompen algo al publicar o abren un agujero de seguridad |
| 🟠 Cifras o datos mal | 9 | La app enseña o guarda un dato equivocado |
| 🟡 Robustez | 14 | Hoy funciona, pero falla en casos raros o con muchos datos |
| 🟢 Limpieza y detalles | 9 | No afectan al uso |

**Estado (10 oct 2026):** los 36 revisados. 🔴 4 de 4 arreglados (commits `c490247`, `b6f9e42`, `58035f0`, `2ef70be`; pendientes de los 🔴 en `87ab364`; punto 5 en `abe03ff`; puntos 6 a 36 en `4ae7fba`) · 🟠 9 de 9 · 🟡 14 de 14 · 🟢 9 de 9 (los tests de clics del 36 quedan apuntados). **El 32 se quitó después por decisión de Cristian (10 oct 2026, Paso H6).**

---

## 🔴 Antes de publicar

**1. ✅ ARREGLADO (10 oct 2026) · Los archivos de más de 4,5 MB no se podrán subir en Vercel.**
- Cómo quedó (decisión de Cristian: subida directa): el servidor da un enlace firmado y el navegador sube el PDF o el CSV directo a Supabase; la acción recibe solo la ruta. Buckets con tope de 15 MB y de tipo (`recursos`: PDF; `importaciones`: CSV, que se borra después de importarlo). Migración `20261011090000_subida_directa.sql`, `lib/subidas.ts` y `lib/subir-cliente.ts`. CSP: `connect-src` permite la dirección de Supabase. Límite de las acciones: de 20 MB a 4 MB.
- Probado: 3 tests nuevos (subida real con el enlace firmado, rutas inventadas o de otro proyecto rechazadas, archivo de más de 15 MB o de otro tipo rechazado por el bucket) y otros 3 adaptados; el de rutas falla si se quita la comprobación. 251 de 251 tests. En el navegador (Proyecto Prueba): PDF subido y abierto, CSV importado y borrado del bucket. `next build` correcto.
- Las otras dos subidas (CSV del banco en Finanzas y citas del closer) no se tocaron: tienen tope de 5.000 y 2.000 filas, muy por debajo de 4,5 MB.
- Qué pasa: la app deja subir PDF (Links y recursos) y CSV (CRM) de hasta 15 MB, y Next está configurado para 20 MB. Vercel solo acepta peticiones de **4,5 MB**: lo que pase de ahí dará un error 413.
- Dónde: `app/(panel)/recursos/acciones.ts:38`, `app/(panel)/crm/acciones.ts:19`, `app/next.config.ts:43`.
- Cómo lo sé: documentación oficial de Vercel, «Vercel Functions Limits» → *Request body size: 4.5 MB*.
- Arreglo: subir el archivo directamente del navegador a Supabase Storage con un enlace firmado (no pasa por Vercel). La solución corta es bajar el límite a 4 MB con un aviso claro.

**2. ✅ ARREGLADO (10 oct 2026) · Si se abre «Equipo» a callers o closers, pueden crear cuentas de director.**
- Cómo quedó (decisiones de Cristian): accesos solo con tu rol o uno inferior (crear miembro y dar acceso) · solo el CEO y el director cambian comisiones (de rol, de persona y las de cada programa en Programas); el director no la suya ni la de su rol · nadie marca como pagada ni desmarca su propia liquidación · el CEO queda fuera de la regla de «la propia». Las reglas están juntas en `lib/auth.ts` (`exigirPuedeDarRol`, `exigirCambiarComisionRol`, `exigirCambiarComisionPersona`, `exigirNoEsPropia`). Solo cuenta como cambio de comisión si el valor cambia de verdad (un closer puede editar el nombre de un programa o de una persona sin tocar la comisión).
- Probado: 6 tests nuevos (`tests/integracion/arreglo-permisos-equipo.test.ts`, con Equipo, Programas y Finanzas abiertos a directores y closers); 3 fallan si se quitan las reglas. 257 de 257 tests. Las 3 pantallas cargan bien como CEO.
- No probado en pantalla: ver el mensaje de error entrando como director o closer (lo cubren los tests). La pantalla de Equipo sigue enseñando el editor de comisiones a quien no puede usarlo; al guardar sale el aviso.
- Qué pasa: crear una persona con acceso, darle acceso o cambiar comisiones solo pide tener la sección «Equipo». Si el CEO abre Equipo a los callers en Permisos, un caller podría crear una cuenta de **director** (que ve todo lo de los jefes) o subirse su propia comisión. Hoy, por defecto, solo la ve el CEO.
- Dónde: `app/(panel)/equipo/acciones.ts:54` (crearMiembro), `:111` (darAccesoMiembro), `:163` (guardarComisionRol) y actualizarMiembroEquipo.
- Cómo lo sé: leído.
- Arreglo: solo dejar crear accesos con un rol igual o menor que el propio (o solo al CEO o director con Administración) y que nadie pueda cambiar su propia comisión. Revisar lo mismo en Finanzas: que nadie marque como pagada su propia liquidación.

**3. ✅ ARREGLADO (10 oct 2026) · El token de GHL y las claves de Fathom se guardan sin cifrar.**
- Cómo quedó (decisión de Cristian: clave maestra en Vercel, no Vault): AES-256-GCM en `lib/cifrado.ts` con la variable `CLAVE_CIFRADO` (32 bytes en base64), solo en el servidor. Se cifra al guardar (Integraciones y cuentas de Fathom) y se descifra solo al llamar a GHL o Fathom (7 sitios). Un valor sin cifrar o que no se puede descifrar da el aviso «Hay que volver a pegar…». `.env.example` y `GUIA-PUBLICAR.md` (paso 4) explican cómo generar la clave y que hay que guardarla.
- Probado: 4 tests unitarios (ida y vuelta, alterado, otra clave, sin cifrar, sin clave) y 3 de integración adaptados (en la base queda `v1:…` y a GHL/Fathom les llega la clave correcta); 5 fallan si se quita el cifrado. 261 de 261 tests. En el navegador (Proyecto Prueba): la cuenta «Fathom prueba» antigua dio el aviso; al volver a pegar otra clave inventada quedó cifrada y «Probar» llegó a la Fathom real («no acepta la API key»); la clave no aparece en la página. `next build` correcto.
- Qué pasa: no llegan al navegador (comprobado en 15 páginas), pero en la base de datos se leen tal cual. Si alguien accede a la base, las tiene.
- Dónde: columna `proyectos.ghl_token` y tabla `cuentas_fathom.api_key`.
- Cómo lo sé: leído (migraciones `20261010110000` y `20261010170000`).
- Arreglo: guardarlas cifradas (por ejemplo, con Supabase Vault) y descifrarlas solo al llamar a GHL o Fathom.

**4. ✅ ARREGLADO (10 oct 2026) · El límite de intentos (login y webhooks) no es exacto en Vercel.** *(ya estaba en el plan, Paso 0.4)*
- Cómo quedó: tabla `limite_intentos` y funciones `limite_dentro`, `limite_bloqueado` y `limite_anotar` (migración `20261011100000_limite_intentos.sql`), con bloqueo por clave para que dos peticiones a la vez no se cuelen. Solo las puede usar el servidor (permisos quitados a la clave pública). Mismos límites que antes. Si la base no responde, se deja pasar y se registra el error.
- Fallo mío encontrado al probar: usé `now()` (hora de inicio de la transacción) y, con 20 peticiones a la vez, a veces pasaban 6 en vez de 5. Corregido con la hora real (`clock_timestamp()`): 8 de 8 repeticiones bien.
- Corrección posterior (10 oct 2026, commit `4ae7fba`): el test de la ventana usaba horas de 1970 y la limpieza ocasional de la base (intentos de más de 1 día) a veces los borraba a mitad del test → fallo al azar. Ahora usa horas recientes (6 de 6 bien). La app no tenía el fallo.
- Probado: 4 tests (ventana, login, 20 a la vez → exactamente 5, la clave pública no puede usar ni la tabla ni las funciones); cada archivo de test empieza con la cuenta a cero. 263 de 263 dos veces seguidas. Contra el servidor local: 30 × 401 y luego 429.
- Qué pasa: vive en la memoria de cada servidor; en Vercel cada copia cuenta por separado, así que el límite real puede ser mayor.
- Dónde: `lib/limite.ts`.
- Arreglo: guardar los intentos en la base de datos.

---

## 🟠 Cifras o datos mal

**5. ✅ ARREGLADO (10 oct 2026) · El cash del Funnel no resta las devoluciones.**
- Cómo quedó: el Funnel resta las devoluciones cuya fecha cae en el periodo, con la misma regla que Finanzas y Agendas (respeta los filtros de vendedor y producto). La facturación no cambia. Texto de «cómo se calcula» actualizado.
- Probado: test nuevo (resta la del periodo, no la de otro mes, filtro por producto, y el mes de la devolución); falla si se quita la resta. 265 de 265. En el navegador (Proyecto Prueba): el Funnel pasa de 2000 € a **1700 €**, igual que Finanzas.
- Qué pasa: Agendas y Finanzas sí las restan; el Funnel no. El director ve dos cifras distintas del mismo dinero.
- Dónde: `lib/metricas.ts:74`.
- Cómo lo sé: **comprobado con datos** de «Proyecto Prueba» (hay una devolución de 300 €): el Funnel dice 2000 € y Finanzas, 1700 €.
- Arreglo: restar las devoluciones del periodo, igual que en `lib/finanzas.ts`.

**6. ✅ ARREGLADO (10 oct 2026) · «Agendado → Venta» puede salir al 100 % o más sin serlo.**
- Cómo quedó (decisión de Cristian: «de las agendas del periodo»): de las personas que agendaron en el periodo, cuántas compraron desde el día en que agendaron (aunque sea más tarde). Se cuentan personas, no citas, así que nunca pasa del 100 %. Se compara por días en la zona del proyecto (una venta con fecha puesta a mano se guarda a las 12:00). Las ventas no se filtran por vendedor (en la vista del caller cuenta la venta que cierra el closer); sí por producto. Texto de ayuda actualizado.
- Ojo: la cifra de un mes pasado puede subir si alguien que agendó ese mes compra más tarde (aceptado por Cristian).
- Probado: test nuevo con 6 casos (venta sin cita, venta anterior a la agenda, mismo día 12:00 frente a 15:00, compra al mes siguiente, filtro de producto, vista del caller); falla con la fórmula antigua y si se compara por hora exacta. 266 de 266. En el navegador (Proyecto Prueba): de **100 % a 50 %** (la venta de «Cliente Prueba» no tuvo cita).
- Qué pasa: cuenta todas las ventas, también las que no vienen de una cita (el low ticket del caller, «Nuevo cliente»).
- Dónde: `lib/metricas.ts:105`.
- Cómo lo sé: **comprobado**: en «Proyecto Prueba» sale 100 %.
- Arreglo: contar solo las ventas de leads que tuvieron una cita.

**7. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · El Ranking calcula el cash de otra forma.**
- Cómo quedó: una sola función `cashNeto` (al vender + cuotas del periodo − devoluciones del periodo) para el Funnel y el Ranking. Test: cuota de una venta del mes anterior y devolución; falla con la fórmula antigua.
- Qué pasa: para cada closer solo cuenta lo cobrado el día de la venta: sin cuotas posteriores y sin restar devoluciones. Es una tercera cifra de cash.
- Dónde: `lib/metricas.ts` (calcularVendedores).
- Arreglo: usar la misma cuenta que Finanzas.

**8. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Al registrar una venta, no se cierra una cita en «confirmación pendiente».**
- Cómo quedó: la venta busca la cita abierta con la lista común `ABIERTAS` + «seguimiento». Test en `arreglos-auditoria.test.ts` (falla sin el arreglo).
- Qué pasa: la venta busca la cita abierta solo entre «pendiente», «confirmada» y «seguimiento»; falta «confirmación pendiente» (el estado nuevo de V2-2). Si la cita está así: la cita no pasa a «cerrada», la venta no se apunta al closer de la cita y se pierden sus estrellas.
- Dónde: `app/(panel)/leads/acciones.ts:131`.
- Cómo lo sé: leído; el resto de la app sí tiene ese estado (`lib/llamadas.ts:3`).
- Arreglo: añadir el estado a la lista (mejor, usar la lista común `ABIERTAS`).

**9. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Agendar como jefe o closer borra las estrellas que puso el caller.**
- Cómo quedó: solo se actualizan las estrellas del lead si vienen. Test (falla sin el arreglo).
- Qué pasa: para un jefe o un closer las estrellas son opcionales; si no las pone, se guarda «sin estrellas» encima de las que había puesto el caller en el lead.
- Dónde: `app/(panel)/leads/acciones.ts:94`.
- Cómo lo sé: leído.
- Arreglo: solo actualizar las estrellas del lead si vienen.

**10. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Si alguien se va a mitad de mes, no cobra la comisión de ese mes.**
- Cómo quedó: `conBajas` en `lib/datos.ts` añade a quien ya no está pero vendió o agendó (con «(baja)» en el nombre); las liquidaciones lo usan. Test: closer que vende, se desactiva y se quita del proyecto → cobra su 10 % (falla sin el arreglo).
- Qué pasa: las liquidaciones solo tienen en cuenta a las personas activas que siguen en el proyecto. Si un closer o un caller se desactiva o se quita del proyecto, sus comisiones ya ganadas desaparecen de la liquidación.
- Dónde: `app/(panel)/finanzas/acciones.ts:224` (usa `equipo()`).
- Cómo lo sé: leído (`lib/datos.ts`, `equipo()` filtra por «activo»).
- Arreglo: calcular con todas las personas que vendieron o agendaron ese mes, aunque ya no estén.

**11. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Cuando alguien se va, sus métricas desaparecen del histórico.**
- Cómo quedó: Funnel, Ranking y Agendas usan `conBajas`; en el Ranking y la comparativa de Agendas, quien está de baja solo sale en los periodos en que hizo algo. Test (falla sin el arreglo).
- Qué pasa: es lo mismo que el punto 10, pero en las comparativas de Agendas y en el Funnel por persona: las cifras de meses pasados cambian.
- Dónde: `lib/agendas-datos.ts`, `lib/metricas.ts`.
- Arreglo: el mismo que el 10.

**12. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · «Cuentas por cobrar» del Resumen no cuadra con «Pagos pendientes».**
- Cómo quedó: `totalPorCobrar` (plazos por vencer y vencidos, sin «no paga» ni lo cobrado, con deudores) en el Resumen; es el mismo cálculo que «Total por cobrar» de Pagos pendientes. Textos del Resumen y de la Guía financiera actualizados. Test (falla con la fórmula antigua).
- Qué pasa: el Resumen suma lo que falta de todas las ventas, también las marcadas «no paga» y las devueltas; Pagos pendientes sí las separa.
- Dónde: `lib/finanzas.ts:65`.
- Arreglo: usar los plazos (vencimientos) y su estado, como en Pagos pendientes.

**13. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · El cobro siempre se apunta con la fecha de hoy.**
- Cómo quedó: campo «Fecha del cobro (vacía = hoy)»; no se acepta futura ni anterior a la venta; se guarda a las 12:00 del proyecto. También se comprueba el método (arreglo 29). Test (falla si no se guarda la fecha).
- Qué pasa: no se puede poner la fecha real del cobro (por ejemplo, una transferencia que llegó ayer). El cash y las comisiones pueden caer en el mes equivocado si se apunta tarde.
- Dónde: `app/(panel)/ventas/acciones.ts:19`.
- Arreglo: añadir el campo «Fecha del cobro» (por defecto, hoy).

---

## 🟡 Robustez (casos raros o con muchos datos)

**14. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Las lecturas largas de la base no tienen un orden fijo.**
- Cómo quedó: las 41 lecturas con `todas()` ordenan por `id` (o su columna única) antes de paginar. Test que revisa el código (`orden-paginado.test.ts`) y falla si una lectura no ordena.
- Qué pasa: la base devuelve como mucho 1000 filas cada vez y la app las pide de 1000 en 1000. Unas 30 de esas lecturas no fijan un orden, y sin orden la base no garantiza que las páginas no se repitan o se salten filas. Afectará cuando haya más de 1000 leads, citas o ventas (Maestria tiene 896 leads).
- Dónde: `lib/datos.ts:8` (`todas`) y las 30 llamadas (Funnel, Finanzas, Agendas, Clientes, Cualificación…).
- Cómo lo sé: leído.
- Arreglo: añadir `.order("id")` a cada lectura (o hacer que `todas` lo exija).

**15. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Cada envío de una landing lee todos los leads del proyecto.**
- Cómo quedó: con 50 leads o menos (webhook, landing, sincronización de GHL) se busca solo por contacto de GHL, email o teléfono; columna calculada `telefono_clave` (últimas 9 cifras, misma regla que la app) con índice (migración `20261011110000_robustez.sql`). El CSV grande sigue leyendo todos de una vez. Test.
- Qué pasa: para buscar duplicados se leen todos los leads cada vez. Con 900 va rápido; con 20.000, cada envío lee 20.000 filas.
- Dónde: `lib/leads.ts:45` (guardarLeads). Pasa igual en la sincronización de GHL (`lib/ghl-sync.ts`) por cada contacto nuevo.
- Arreglo: buscar solo por ese email, teléfono o contacto.

**16. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Dos envíos del mismo email a la vez dan error.**
- Cómo quedó: si el lote choca con «un email/contacto por proyecto», se inserta de uno en uno y el que choca se actualiza. Test con 3 envíos a la vez (falla sin el arreglo).
- Qué pasa: los dos ven «no existe» y el segundo choca con la regla de «un email por proyecto»: el webhook responde 500, aunque el lead sí queda guardado por el primero. En un CSV, un choque así hace fallar el lote entero de 500.
- Dónde: `lib/leads.ts`.
- Arreglo: guardar con «insertar o actualizar» (upsert) en vez de insertar a ciegas.

**17. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · El reparto rotativo no es seguro si entran leads a la vez.**
- Cómo quedó: función `avanzar_rotacion` que lee y avanza el turno en un solo paso. Test: 9 leads a la vez entre 3 callers → 3 cada uno (falla sin el arreglo).
- Qué pasa: lee el turno y lo suma en dos pasos, así que dos leads a la vez pueden ir al mismo caller. En la base ya existe una función que lo hace en un solo paso (`siguiente_caller`), pero **no se usa**.
- Dónde: `lib/leads.ts:18`; la función, en `supabase/migrations/20261009102643_esquema.sql`.
- Arreglo: usar esa función, adaptándola a los horarios.

**18. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Webhook de GHL: cómo se busca el lead.**
- Cómo quedó: búsqueda con `.eq` por contacto, email y teléfono (`telefono_clave`); sin ninguno de los tres, error claro «no viene email, teléfono ni contacto de GHL». Test.
- Qué pasa: el email se pega dentro del filtro de búsqueda (una coma o un paréntesis lo rompería). Sin email y sin id de contacto, crea el lead y luego no lo encuentra, y la cita falla con «No se pudo identificar el lead». Tampoco busca por teléfono.
- Dónde: `app/api/webhooks/ghl/[proyectoId]/route.ts:44`.
- Arreglo: buscar con filtros normales (`.eq`), no pegando texto, y añadir el teléfono.

**19. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Webhook de GHL: citas sin id se duplican.**
- Cómo quedó: sin id de GHL se busca una cita del mismo lead a la misma hora antes de crear otra. Test (falla sin el arreglo).
- Qué pasa: si GHL manda la cita sin su id, cada reenvío crea otra cita.
- Dónde: `app/api/webhooks/ghl/[proyectoId]/route.ts:106`.
- Arreglo: si no hay id, buscar una cita del mismo lead a la misma hora antes de crear otra.

**20. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Webhook de GHL: el closer se busca en toda la base.**
- Cómo quedó: el closer se busca solo entre los miembros del proyecto. Test (falla sin el arreglo).
- Qué pasa: busca por email entre todos los closers de todos los proyectos, no solo los de este.
- Dónde: `app/api/webhooks/ghl/[proyectoId]/route.ts:101`.
- Arreglo: limitar la búsqueda a los miembros del proyecto.

**21. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Una cita borrada en GHL se queda «pendiente» en la app.**
- Cómo quedó: si la consulta a GHL de un closer va bien, sus citas abiertas de GHL dentro del rango consultado que ya no vienen pasan a «cancelada», con nota en el historial del lead; sale en el aviso y en el último resultado. Lo que ya registró el closer y lo de fuera del rango no se toca. Según la especificación oficial (`apps/calendars.json`), `GET /calendars/events` no pagina. ⚠ No probado con GHL real. Las citas de hace más de 30 días siguen sin actualizarse (rango sin cambiar, para no gastar peticiones). Test (falla sin el arreglo).
- Qué pasa: la sincronización no se entera de que se ha borrado. Además, las citas de hace más de 30 días ya no se actualizan.
- Dónde: `lib/ghl-sync.ts`.
- Arreglo: marcar como «cancelada» la cita que deja de venir dentro del rango que se pregunta.

**22. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Muchas escrituras en la base no comprueban si han fallado.**
- Cómo quedó: ayudante `escribir()` en `lib/datos.ts`; 88 escrituras de las acciones y los webhooks (todas las de una línea + 3 de varias líneas: columnas de pipeline/proyecto nuevo y cita al reagendar) cortan con error si fallan. El historial (`registrarActividad` y la nota de asignaciones) es secundario: si falla, se registra en el servidor y la acción sigue. Las sincronizaciones en segundo plano (GHL, Fathom, IA) no se tocaron: ya recogen su error por llamada. Test de `escribir` con un fallo real de la base; 280 tests pasan tras el cambio.
- Qué pasa: si una falla, la acción dice «Guardado» y se queda a medias. Por ejemplo, al agendar: si falla crear la cita, el lead pasa igualmente a «agendado».
- Dónde: varias acciones (agendarCita, importarCitas, registrarCobro, `registrarActividad` en `lib/datos.ts`…).
- Arreglo: comprobar el error de cada escritura importante y avisar.

**23. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Al quitar a alguien del proyecto, sus leads se quedan sin dueño.**
- Cómo quedó (decisión de Cristian): sus leads de ese proyecto quedan sin caller/closer y el aviso dice cuántos («repártelos desde el CRM»). Test.
- Qué pasa: siguen asignados a esa persona; nadie los ve en su cola y el reparto no los recoloca.
- Dónde: `app/(panel)/admin/acciones.ts:157`.
- Arreglo: al quitarla, dejar sus leads sin asignar (o repartirlos) y avisar de cuántos son.

**24. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Cambiar el rol o desactivar a alguien afecta a todos sus proyectos.**
- Cómo quedó (decisión de Cristian): solo el CEO cambia el rol o activa/desactiva (afecta a todos los proyectos); el director con Administración puede quitar a la persona de su proyecto. En pantalla, al director se le ocultan el selector de rol y «Desactivar». Test (falla sin el arreglo).
- Qué pasa: el perfil es uno solo para toda la app. Un director con Administración en el proyecto A puede desactivar a alguien que también trabaja en el B. **Decidir si es lo que se quiere.**
- Dónde: `app/(panel)/admin/acciones.ts:46`.

**25. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Importar citas.**
- Cómo quedó: el teléfono se compara con `telefonoClave` (últimas 9 cifras) y no se crea una cita si ya hay otra del mismo lead, closer y hora (la fila se explica: «esa cita ya existe…»). Test (falla sin el arreglo).
- Qué pasa: por teléfono compara todas las cifras, no las últimas 9 como el resto de la app desde V2-12. Importar el mismo CSV dos veces duplica las citas.
- Dónde: `app/(panel)/closer/acciones.ts:110`.
- Arreglo: usar `telefonoClave` y no crear una cita si ya hay otra igual (mismo lead, closer y hora).

**26. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Borrar una venta deja la cita y el lead como si se hubiera vendido.**
- Cómo quedó (decisión de Cristian): si al lead no le queda otra venta, la cita cerrada vuelve a «seguimiento» y el lead pasa a «agendado» (si tiene cita) o a «nuevo» (si no; criterio de Claude). Si ese mes ya hay liquidaciones calculadas, sale un aviso para recalcularlas. Los cobros y plazos se borran con la venta (en cascada, comprobado). Test (falla sin el arreglo).
- Qué pasa: la cita sigue «cerrada» y el lead, «vendido». Las métricas cuentan un cierre sin venta.
- Dónde: `app/(panel)/ventas/acciones.ts:52`.
- Arreglo: al borrar, devolver la cita a «seguimiento» (o preguntar) y avisar de que hay que recalcular las liquidaciones de ese mes.

**27. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · El reporte del mismo día se puede mandar varias veces.**
- Cómo quedó (decisión de Cristian): regla en la base «un reporte por persona y día» (no había repetidos, no se borró nada); el segundo envío sustituye al primero y no repite el aviso a GHL. Test (falla sin el arreglo).
- Qué pasa: se guarda duplicado y el aviso a GHL sale otra vez.
- Dónde: `app/(panel)/reportes/acciones.ts:28`.
- Arreglo: un reporte por persona y día; si ya existe, actualizarlo.

---

## 🟢 Limpieza y detalles

**28. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Con una fecha mal escrita, el usuario ve «Algo ha fallado».**
- Cómo quedó: `localAIso` lanza `ErrorUsuario` (la clase pasa a `lib/error-usuario.ts`, sin dependencias, para poder usarla en `formato.ts`; `resultado.ts` la reexporta). Test (falla sin el arreglo).
- Qué pasa: la función de fechas lanza un error normal, así que no sale el motivo («Fecha no válida»).
- Dónde: `lib/formato.ts:170` (`localAIso`).

**29. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Validaciones que hace la base y no la app.**
- Cómo quedó: la venta comprueba tipo de pago, método, máximo 60 cuotas y que el vendedor elegido sea del proyecto; el CRM solo asigna a callers/closers del proyecto y «Crear lead» comprueba que el pipeline es del proyecto; el cobro comprueba el método. Test.
- Qué pasa: al registrar una venta no se comprueba en la app el tipo de pago ni el método, y el usuario vería el mensaje técnico de la base. Tampoco se comprueba que el «vendedor» elegido sea del proyecto, y el número de cuotas no tiene máximo (999 cuotas crearían 998 plazos). Pasa lo mismo con las asignaciones del CRM y el pipeline de «Crear lead».
- Dónde: `app/(panel)/leads/acciones.ts`, `app/(panel)/crm/acciones.ts`.

**30. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Errores inesperados con texto técnico.**
- Cómo quedó: crearUsuario, guardarProyecto, crearProyecto, importarCsv, enviarReporte y crearRecurso usan `seguro`. Test: un error inesperado en enviarReporte no enseña el detalle y queda en el registro del servidor (no comprobado que el test falle sin el arreglo).
- Qué pasa: algunas acciones antiguas devuelven el mensaje técnico tal cual: crearUsuario, guardarProyecto, crearProyecto, importarCsv, enviarReporte, crearRecurso.
- Arreglo: usar el mismo envoltorio que el resto (`seguro`).

**31. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Se puede marcar una cita como «cerrada» sin venta.**
- Cómo quedó: «cerrada» ya no está entre los estados que se pueden poner a mano (solo al registrar la venta). Test.
- Qué pasa: la acción lo permite. Ninguna pantalla lo ofrece (comprobado), pero se podría hacer llamando directamente a la acción.
- Dónde: `app/(panel)/closer/acciones.ts:11`.
- Arreglo: quitar «cerrada» de los estados permitidos.

**32. ↩️ QUITADO por decisión de Cristian (10 oct 2026, Paso H6, sin commit todavía) · Se puede reagendar una cita ya cerrada, cancelada o perdida.**
- Ahora: cualquier cita se reagenda (desde el tablero de Post-call) **menos la cerrada**, que tiene su venta (criterio de Claude). Test del arreglo adaptado a la regla nueva. Riesgo apuntado en el plan (sección 5).
- Cómo quedó: no se reagenda una cita cerrada, cancelada, perdida, que no califica o ya reagendada; el mensaje dice que se cree una llamada nueva. La pantalla ya solo ofrecía «Reagendar» en citas abiertas. Test.
- Dónde: `app/(panel)/closer/acciones.ts:56`.

**33. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Un deudor marcado «cobrado» por error no se puede deshacer.**
- Cómo quedó: columna `vencimientos.movimiento_id` (qué ingreso se creó al cobrarlo); botón «Deshacer» en Pagos pendientes que lo devuelve a «pendiente» y borra ese ingreso. Test (falla sin el arreglo).
- Qué pasa: los botones desaparecen. Si se deshiciera con la acción, el ingreso creado no se borraría y se contaría dos veces.
- Dónde: `app/(panel)/finanzas/acciones.ts:145`.

**34. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Si el CEO no es miembro del proyecto, no recibe los avisos de los reportes.**
- Cómo quedó (decisión de Cristian): los avisos van también a todos los CEO activos aunque no sean miembros del proyecto (sin repetir). El test de destinatarios se actualizó: comprueba que le llega al CEO del seed, que no es miembro del proyecto de prueba.
- Qué pasa: el CEO ve todos los proyectos sin ser miembro, y los avisos solo van a los miembros.
- Dónde: `lib/avisos.ts`.

**35. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`) · Detalles de código.**
- Cómo quedó: una sola función de desfase horario (`offsetMin`) · el link de pago de Programas solo admite https · las notas tienen un máximo de 4.000 caracteres (`notaValida` en 8 acciones; la evaluación manual y la IA ya tenían límite) · la clave en la URL del webhook de GHL **se mantiene** (decisión de Cristian). Test.
- Hay dos funciones casi iguales para el desfase horario en `lib/formato.ts` (`offsetMin` y `offsetMinPublico`).
- Programas pide «https://» en el aviso, pero acepta «http://».
- Las notas no tienen un largo máximo en algunas acciones.
- El webhook de GHL acepta la clave también en la URL (la guía ya dice usar la cabecera).

**36. ✅ ARREGLADO (10 oct 2026, commit `4ae7fba`; los tests de clics quedan apuntados) · Mejoras sin prisa.**
- Cómo quedó (decisión de Cristian): 8 índices nuevos (citas por lead y por closer, ventas por lead y por vendedor, pagos y plazos por venta, leads por closer, grabaciones por cita) · CSP con **nonce** por petición generado en `src/proxy.ts` (`src/lib/csp.ts`): los scripts ya no admiten `unsafe-inline`; los estilos lo mantienen porque el nonce no cubre los atributos `style="…"`. Comprobado en desarrollo y en la versión compilada: la app funciona (la ventana «Nuevo recurso» se abre), el nonce cambia en cada petición y la consola no muestra bloqueos. Test de la política. **No hecho (decisión de Cristian):** tests que hacen clics como una persona.
- Faltan índices en la base para buscar más rápido con muchos datos: citas y ventas por lead, pagos y plazos por venta, citas por closer, leads por closer, grabaciones por cita.
- La política de seguridad del navegador permite scripts en línea (`unsafe-inline`); se podría endurecer con «nonces».
- No hay tests que hagan clics como una persona (los 248 prueban la lógica y los permisos).

---

## Lo que está bien (comprobado)

- Todas las acciones del servidor comprueban sesión y permisos (revisado con un script; las únicas sin comprobación son cambiar el tema, entrar y salir, que no la necesitan).
- Todas las páginas comprueban el rol o el permiso de la sección.
- Ninguna clave llega al navegador; las 37 tablas tienen RLS; el cliente con la clave secreta solo existe en el servidor.
- Los dos webhooks: tamaño máximo, límite de ritmo, clave comparada de forma segura y todo lo que llega queda guardado.
- Fechas y cambios de hora (Madrid y Nueva York): bien.
- A Claude no le llegan emails ni teléfonos (con test).
- Los tableros deshacen el movimiento si falla en el servidor.
