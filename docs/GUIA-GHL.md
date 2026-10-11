# Guía · Conectar GoHighLevel con Eternity

> Escrita el 9 oct 2026 y puesta al día el 11 oct 2026 (reparto con %, rotación de closers, reporte editable, ficha de cada persona) a partir de la documentación oficial de GHL ([Workflow Action - Custom webhook](https://help.gohighlevel.com/support/solutions/articles/155000003305-workflow-action-webhook)).
> **⚠ comprobar** = cosas que la documentación de GHL no detalla (nombres exactos de algunas variables y disparadores); se eligen en GHL con el selector y se prueban con un lead de prueba.
> Solo funciona **con la app publicada**: GHL no puede llegar a tu ordenador.

---

## Cómo funciona (en 2 líneas)

1. **GHL → Eternity:** cuando pasa algo en GHL (entra un lead, se agenda una cita…), un workflow manda los datos a la app.
2. **Eternity → GHL:** cuando alguien envía su reporte de fin de día, la app manda los datos a GHL y un workflow avisa por email y WhatsApp al director y al CEO.

Todo lo que necesitas copiar está en la app: **Administración → Integraciones GHL** (URL, clave y los 3 cuerpos JSON con botón «Copiar»).

**Desde la v2 hay además:**
3. **Landings → Eternity directo** (Parte 3): cada landing manda su formulario a su propia dirección de la app, sin pasar por un workflow.
4. **Eternity pregunta a GHL por API** (Parte 4): el calendario de cada closer y las llamadas grabadas. Para eso hace falta un **token de integración privada**.

---

## Parte 1 · GHL → Eternity (3 workflows)

### Configuración común de la acción «Custom Webhook»

En cada workflow, añade la acción **Custom Webhook** con:

| Campo | Valor |
|---|---|
| Event | **CUSTOM** |
| Method | **POST** |
| URL | La de Administración → Integraciones («Copiar URL») |
| Authorization | **No auth** |
| Headers | Nombre `x-eternity-secreto` · Valor: la clave («Copiar clave») |
| Content-Type | `application/json` |
| Raw Body | El JSON del workflow (abajo) |

Por qué la clave va en la cabecera y no en la URL: la propia documentación de GHL recomienda no poner secretos en la dirección.

### Workflow 1 · Lead nuevo

- **Disparador:** «Form Submitted» del formulario de la opt-in (o «Contact Created»). ⚠ comprobar cuál usáis hoy.
- **Raw Body:** el JSON «1 · Lead nuevo» de la app.
- Cambia `"pipeline"` por el pipeline donde debe entrar (tiene que llamarse igual que en la app: `Webinar 1`, `Biblioteca Recursos`, `Orgánico` o `DFY AI Services`).
- En `customData` pon **una línea por pregunta del formulario**: a la izquierda el texto de la pregunta (tal cual quieres verlo en la ficha) y a la derecha la variable de ese campo (icono de etiqueta → campo personalizado). Son las respuestas que verán callers y closers.
- **Formulario de la biblioteca** (para que la pestaña KPIs → Biblioteca y la «Oferta» de cada lead salgan bien): usa **exactamente** estos 6 textos a la izquierda (la app también entiende «Situación», «Inversión»… y los campos `quiz_situacion`…, pero así es seguro):
  - `¿En qué situación estás hoy?`
  - `¿Qué experiencia tienes con IA?`
  - `¿Qué quieres lograr en los próximos 90 días?`
  - `¿Cuánto tiempo por semana le puedes dedicar?`
  - `Si encuentras el programa correcto, ¿estás en condiciones de invertir en tu formación?`
  - `¿Cuándo quieres empezar?`
  - Y en `tags` que vaya la etiqueta **«biblioteca recursos»** (o que el pipeline sea «Biblioteca Recursos»).
- Si el **reparto automático** está encendido (Administración → Proyecto y reparto, con el % de cada caller), el lead se asigna solo a un caller según su %; con «solo a quien esté en su horario», entre los que están en su horario en ese momento (si no hay nadie, igual entre todos los que tienen %). Apagado: se reparte a mano o con «Repartir leads».

### Workflow 2 · Cita agendada

- **Disparador:** «Customer Booked Appointment» (o «Appointment Status» = confirmada) del calendario de los closers. ⚠ comprobar.
- **Raw Body:** el JSON «2 · Cita agendada».
- `fecha`: elige con el selector la **fecha y hora de inicio de la cita**. ⚠ comprobar que la variable incluye la hora y la zona; si la cita aparece a otra hora en la app, avísame.
- `closer_email`: elige el **email del usuario asignado a la cita**. Tiene que ser el mismo email con el que el closer entra en la app **y el closer tiene que estar añadido a este proyecto**; si no, la cita llega sin closer y la asigna el director.
- **Cómo encuentra la app al lead de la cita:** por el Contact Id de GHL; si no, por el email; si no trae email, por el **teléfono** (últimas 9 cifras, así «+34 600 111 222» y «600 111 222» son el mismo). Si no existe, lo crea. Si la cita no trae ninguno de los tres, sale en «Últimos eventos» con el error «no viene email, teléfono ni contacto de GHL».
- **No se duplican citas:** si GHL reenvía la misma cita, se actualiza la que ya existe (por su id de GHL; y si no trae id, por el mismo lead a la misma hora).
- **Rotación de closers:** las citas que llegan de GHL traen ya su closer (el que asignó el calendario de GHL): la rotación de la app (Administración → Proyecto y reparto) **no las cambia ni las cuenta**. La rotación de la app vale para las citas que se agendan **dentro de la app** (cola del caller, CRM, Crear llamada y ficha del lead). Si usáis también la rotación del calendario de GHL, poned los mismos % en los dos sitios.

### Workflow 3 · Cambio de etapa (solo si hace falta)

La app es el CRM principal, así que **normalmente no hace falta**. Úsalo solo si alguien sigue moviendo oportunidades en GHL.

- **Disparador:** «Pipeline Stage Changed». ⚠ comprobar.
- **Raw Body:** el JSON «3 · Cambio de etapa».
- `pipeline` y `etapa`: elige con el selector el nombre del pipeline y de la etapa. Tienen que llamarse **igual** que en la app; si no existe esa columna, el evento sale con error en «Últimos eventos» y no se mueve nada. Solo vale para los pipelines de origen (Webinar 1, Biblioteca…): «Callers» y «Closers» se mueven solos por el resultado de la llamada y el estado de la cita.

### Probar cada workflow

1. En GHL, «Test Workflow» con un contacto de prueba (o crea uno).
2. En la app: **Administración → Integraciones → Últimos eventos**:
   - **OK** → llegó y se procesó.
   - **Error** → el mensaje dice qué falta (por ejemplo «La cita no trae fecha»).
   - No aparece nada → revisa la URL y la clave; GHL mostrará el código de respuesta en «Execution Logs» (`401` = clave mal puesta).
3. Busca el lead en el CRM y abre su ficha: deben salir sus respuestas del formulario.

---

## Parte 2 · Eternity → GHL (avisos de los reportes)

1. En GHL, crea un workflow con el disparador **«Inbound Webhook»**. GHL te dará una URL.
2. En la app: **Administración → Proyecto y reparto → «Webhook de avisos»** → pega esa URL → Guardar.
3. Envía un reporte de prueba desde la app (como caller o closer). GHL necesita recibir uno para saber qué campos llegan.
4. En el workflow de GHL añade las acciones de aviso:
   - **Email** y **WhatsApp** (o «Internal Notification») al director y al CEO. ⚠ comprobar el nombre de la acción en tu cuenta.
   - En el cuerpo del mensaje usa el campo **`texto`**: es el reporte entero ya redactado, listo para leer.
5. Envía otro reporte y comprueba que llega el aviso.

**Un reporte por persona y día:** si alguien manda el reporte del mismo día dos veces, el segundo sustituye al primero y **el aviso no se repite**. Para probar el aviso otra vez, usa otra persona u otro día.

**Lo que manda la app en cada reporte:**

| Campo | Qué es |
|---|---|
| `tipo` | `reporte_fin_de_dia` |
| `texto` | El reporte completo en texto (lo más fácil de usar) |
| `persona`, `rol`, `fecha` | Quién, si es caller o closer, y de qué día |
| `respuestas` | Lista de preguntas y respuestas (las preguntas de ahora: se cambian en Administración → Reportes) |
| `tasa_agendamiento`, `tasa_cierre` | Solo en reportes de closer |
| `destinatarios` | Nombre, email y WhatsApp de los directores del proyecto y del CEO (al CEO le llega siempre, aunque no esté añadido al proyecto) |
| `proyecto`, `enviado_en` | Proyecto y hora de envío |

**Importante (no verificado):** hasta donde sé, para mandar un email o WhatsApp desde un workflow, el destinatario tiene que existir como contacto en GHL. Por si acaso, da de alta al director y al CEO como contactos de la cuenta de Maestria. ⚠ comprobar.

---

## Si cambias la clave

Administración → Integraciones → «Nueva clave». Después hay que poner la clave nueva en la cabecera de **los 3 workflows**; hasta entonces, GHL recibirá `401` y no entrará nada. (La app también acepta la clave en la URL, `?secreto=…`, por decisión de Cristian; la cabecera es más segura y es lo recomendado.)

---

## Parte 3 · (v2) Landings → Eternity directo

1. En la app: **Administración → Entradas (landings) → Nueva entrada**: nombre (por ejemplo «Opt-in masterclass»), pipeline y columna donde entran los leads.
2. Copia su **dirección** y pégala en la landing como destino del formulario (el mismo JSON que hoy manda a GHL). Cada landing tiene la suya; si alguien la ve, pulsa «Nueva dirección» y cámbiala en la landing.
3. La app **guarda todo lo que llega** (también UTM, `source`, `event`, `quiz_*`) y lo enseña en la ficha del lead.
4. **Reglas** (opcional): «si el campo X es Y → este pipeline, esta columna y esta etiqueta». Se eligen los campos de los envíos que ya han llegado.
5. Debajo se ven los últimos envíos, con su estado y el JSON entero, para comprobar que todo entra.

## Parte 4 · (v2) Token de GHL: calendario de cada closer y llamadas

### El token

1. En GHL (subcuenta de Maestria): **Ajustes → Private Integrations → crear** ⚠ comprobar el nombre exacto del menú.
2. Permisos (comprobados en la especificación oficial de GHL):
   - `calendars/events.readonly` → citas de los closers.
   - `contacts.readonly` → datos del contacto de cada cita.
   - `conversations/message.readonly` → llamadas, grabaciones y transcripciones.
3. En la app: **Administración → Integraciones → Calendario de GHL** → pega el token y el **id de la subcuenta** (Location ID) → Guardar → **Probar conexión**. El token solo se escribe: no se vuelve a enseñar.

### Calendario de cada closer

En la misma pantalla (o en la ficha de cada closer → «GHL y Fathom»), para cada closer: el **id de su calendario** de GHL o su **id de usuario** de GHL. En **Agendas → Llamadas** el botón «Sincronizar GHL» trae sus citas (de hace 30 días a dentro de 60), y también lo hace sola al abrir Agendas si han pasado más de 10 minutos. Las citas que no encuentran su lead salen en «Hay N sin unir → Revisar». Mientras una cita está abierta, la hora y el closer de GHL mandan; una vez terminada en la app (cerrada, no show, perdida…), GHL ya no la cambia. Si se registra una venta antes de la hora de la cita, la cita se cierra con la hora de ese momento.

**Citas borradas en GHL:** si una cita de un closer desaparece de su calendario de GHL (se borró), al sincronizar pasa a **«cancelada»** en la app. Solo se hace con las citas que siguen abiertas (lo que ya registró el closer no se toca), dentro del rango que se consulta y si GHL respondió bien. Cada cancelación queda en el historial del lead y sale en el aviso de la sincronización. ⚠ comprobar con GHL real: según la especificación oficial, la lista de citas no se reparte en páginas; si con GHL real llegara incompleta, se cancelarían citas buenas.

### Llamadas grabadas

1. En **Integraciones → Llamadas de GHL: quién es quién** (o en la ficha de cada persona: pestaña «GHL y Fathom» para callers y closers, «GHL» para directores), pon el **id de usuario de GHL** de cada caller (y de cada director que llame). Los closers lo tienen arriba si usan usuario.
2. En **Ventas → Llamadas de GHL** (desde el 11 oct la ven el CEO, los directores y los 2 perfiles de prueba, closer-test y caller-test; a callers y closers se les abre en Administración → Permisos cuando esté listo), pulsa **«Traer llamadas de GHL»**: trae todas las llamadas **contestadas de más de 1 minuto** (decisión de Cristian), las transcribe (con la transcripción de GHL si la hay; si no, con Deepgram) y Claude las analiza.
3. **Limitación:** la API de GHL **no deja lanzar llamadas** desde la app; se sigue llamando desde GHL.
4. ⚠ comprobar con la primera llamada real que la transcripción de GHL llega bien (la especificación describe cada frase, pero no del todo cómo vienen juntas; la app acepta las dos formas posibles).

Fuente: [especificación oficial de la API de GHL](https://github.com/GoHighLevel/highlevel-api-docs) (`apps/calendars.json`, `apps/contacts.json`, `apps/conversations.json`).

