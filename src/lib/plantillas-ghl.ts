// Cuerpos JSON para pegar en GHL (acción «Custom Webhook», Event = CUSTOM, «Raw Body»).
// Las variables {{contact.*}} vienen de la documentación oficial de GHL.
// Las marcadas con «ELIGE_EN_GHL» hay que escogerlas con el selector de variables de GHL,
// porque su nombre exacto no está documentado (fecha de la cita, usuario asignado, etapa).

export const PLANTILLAS_GHL = [
  {
    clave: "lead_nuevo",
    titulo: "1 · Lead nuevo o formulario enviado",
    disparador: "Form Submitted (o Contact Created)",
    cuerpo: `{
  "tipo": "lead_nuevo",
  "contact_id": "{{contact.id}}",
  "first_name": "{{contact.first_name}}",
  "last_name": "{{contact.last_name}}",
  "email": "{{contact.email}}",
  "phone": "{{contact.phone}}",
  "tags": "{{contact.tag}}",
  "pipeline": "1. Biblioteca Recursos",
  "customData": {
    "¿En qué situación estás hoy?": "ELIGE_EN_GHL: campo de esa pregunta",
    "¿Cuándo quieres empezar?": "ELIGE_EN_GHL: campo de esa pregunta"
  }
}`,
  },
  {
    clave: "cita_agendada",
    titulo: "2 · Cita agendada en el calendario",
    disparador: "Customer Booked Appointment (o Appointment Status)",
    cuerpo: `{
  "tipo": "cita_agendada",
  "contact_id": "{{contact.id}}",
  "email": "{{contact.email}}",
  "first_name": "{{contact.first_name}}",
  "phone": "{{contact.phone}}",
  "fecha": "ELIGE_EN_GHL: fecha y hora de inicio de la cita",
  "closer_email": "ELIGE_EN_GHL: email del usuario asignado a la cita"
}`,
  },
  {
    clave: "cambio_etapa",
    titulo: "3 · Cambio de etapa (solo si hace falta)",
    disparador: "Pipeline Stage Changed",
    cuerpo: `{
  "tipo": "cambio_etapa",
  "contact_id": "{{contact.id}}",
  "email": "{{contact.email}}",
  "pipeline": "ELIGE_EN_GHL: nombre del pipeline",
  "etapa": "ELIGE_EN_GHL: nombre de la etapa"
}`,
  },
] as const;

export const CABECERA_SECRETO = "x-eternity-secreto";
