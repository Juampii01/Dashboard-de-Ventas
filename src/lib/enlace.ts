// A dónde lleva un enlace de entrar (Fase 1, Cristian 12 oct 2026). Solo destinos fijos: nunca una dirección
// que venga en el enlace, para que nadie pueda usarlo para mandar a otra web.
// «perfil» = accesos y «pide un enlace»: quien no ha hecho el onboarding acaba en él (y allí crea su contraseña);
// quien ya lo hizo llega a «Mi perfil» con el aviso para cambiarla.
export function destinoTrasEnlace(siguiente: string | null | undefined): string {
  return siguiente === "perfil" ? "/perfil?bienvenida=1" : "/";
}

// Lo que dura el enlace: lo fija Supabase («Email OTP Expiration», 24 h desde el 12 oct). Solo es el texto.
export const DURA_ENLACE = "24 horas";
