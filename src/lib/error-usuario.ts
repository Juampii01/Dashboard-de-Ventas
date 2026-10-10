// Errores pensados para que los lea el usuario («No tienes permiso», «Pon un nombre»…).
// En su propio archivo, sin dependencias, para poder usarlo también en código que llega al navegador
// (lib/formato.ts). lib/resultado.ts lo vuelve a exportar: es la misma clase en toda la app.
export class ErrorUsuario extends Error {}
