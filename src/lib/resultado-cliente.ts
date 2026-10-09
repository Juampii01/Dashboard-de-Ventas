// En el navegador: convierte el { error } que devuelve una acción en un error normal,
// para que los botones muestren el mensaje y deshagan lo que movieron en pantalla.
export async function exigirOk<T>(promesa: Promise<T>): Promise<Exclude<T, { error: string }>> {
  const r = await promesa;
  if (typeof r === "object" && r !== null && "error" in r && typeof (r as { error: unknown }).error === "string") {
    throw new Error((r as { error: string }).error);
  }
  return r as Exclude<T, { error: string }>;
}
