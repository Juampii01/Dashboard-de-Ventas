import { redirect } from "next/navigation";

// 26 oct 2026 (Cristian): el Funnel es una pestaña de KPIs. Esta dirección se queda para los enlaces guardados y lleva
// allí con los mismos filtros (periodo, fechas, vendedor y producto).
export default async function FunnelPage({ searchParams }: PageProps<"/funnel">) {
  const sp = await searchParams;
  const p = new URLSearchParams({ vista: "funnel" });
  for (const k of ["periodo", "desde", "hasta", "vendedor", "producto"]) if (typeof sp[k] === "string") p.set(k, sp[k] as string);
  redirect(`/kpis?${p.toString()}`);
}
