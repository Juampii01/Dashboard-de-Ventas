// Lee importes y porcentajes como se escriben en España (fallo apuntado en V2-5, Cristian: «arreglarlo al final»):
// «4.600» = 4600 · «1.997,50» = 1997,5 · «4600» y «1997.5» siguen valiendo · «12,5» = 12,5 · «0.92» = 0,92.
// Un punto seguido de grupos de 3 cifras es de miles («4.600», «1.250.000»); si no, es decimal («1997.5»).
export function leerNumero(txt: unknown): number {
  let s = String(txt ?? "").trim().replace(/[\s €$]/g, "");
  if (!s) return NaN;
  const negativo = /^[-−]/.test(s);
  s = s.replace(/^[-−+]/, "");
  if (s.includes(",") && s.includes(".")) {
    // El último separador es el decimal; el otro, de miles
    s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (s.includes(",")) {
    if ((s.match(/,/g) ?? []).length > 1) return NaN;
    s = s.replace(",", ".");
  } else if (/^[1-9]\d{0,2}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  if (!/^\d+(\.\d+)?$/.test(s) && !/^\.\d+$/.test(s)) return NaN;
  const n = Number(s);
  return negativo ? -n : n;
}
