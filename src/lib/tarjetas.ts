import "server-only";
import { db, escribir } from "@/lib/datos";

// Fase 4: tarjetas de un lead en pipelines que no son el suyo principal (tabla `tarjetas_extra`).
// Si la base todavía no tiene la tabla (migración sin aplicar), todo esto no hace nada y la app sigue como antes.
export type TarjetaExtra = { lead_id: string; pipeline_id: string; etapa_id: string | null };

const sinTabla = (e: { code?: string; message?: string } | null) => !!e && (e.code === "42P01" || e.code === "PGRST205" || /tarjetas_extra/.test(e.message ?? ""));

export async function tarjetasDelPipeline(pipelineId: string): Promise<TarjetaExtra[]> {
  const fuera: TarjetaExtra[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await db().from("tarjetas_extra").select("lead_id, pipeline_id, etapa_id").eq("pipeline_id", pipelineId).order("id").range(desde, desde + 999);
    if (error) {
      if (sinTabla(error)) return [];
      throw new Error(`Error leyendo tarjetas: ${error.message}`);
    }
    fuera.push(...(data ?? []));
    if (!data || data.length < 1000) return fuera;
  }
}

export async function contarTarjetas(pipelineIds: string[]): Promise<Record<string, number>> {
  const r: Record<string, number> = {};
  await Promise.all(
    pipelineIds.map(async (id) => {
      const { count, error } = await db().from("tarjetas_extra").select("id", { count: "exact", head: true }).eq("pipeline_id", id);
      r[id] = error ? 0 : count ?? 0;
    })
  );
  return r;
}

export async function tarjetaDe(leadId: string, pipelineId: string): Promise<TarjetaExtra | null> {
  const { data, error } = await db().from("tarjetas_extra").select("lead_id, pipeline_id, etapa_id").eq("lead_id", leadId).eq("pipeline_id", pipelineId).maybeSingle();
  if (error) return null;
  return data;
}

// Crea las tarjetas que falten (una por lead y pipeline; si ya existe, no la toca)
export async function anadirTarjetas(proyectoId: string, filas: { lead_id: string; pipeline_id: string; etapa_id: string | null }[]) {
  if (!filas.length) return 0;
  let creadas = 0;
  for (let i = 0; i < filas.length; i += 500) {
    const { data, error } = await db()
      .from("tarjetas_extra")
      .upsert(filas.slice(i, i + 500).map((f) => ({ ...f, proyecto_id: proyectoId })), { onConflict: "lead_id,pipeline_id", ignoreDuplicates: true })
      .select("id");
    if (error) {
      if (sinTabla(error)) return 0;
      throw new Error(`Error creando tarjetas: ${error.message}`);
    }
    creadas += data?.length ?? 0;
  }
  return creadas;
}

export async function moverTarjeta(leadId: string, pipelineId: string, etapaId: string) {
  await escribir(db().from("tarjetas_extra").update({ etapa_id: etapaId }).eq("lead_id", leadId).eq("pipeline_id", pipelineId), "tarjetas_extra");
}

// Si el pipeline principal de unos leads pasa a ser `pipelineId`, sus tarjetas extra en él sobran
export async function quitarTarjetas(leadIds: string[], pipelineId: string) {
  if (!leadIds.length) return;
  const { error } = await db().from("tarjetas_extra").delete().in("lead_id", leadIds).eq("pipeline_id", pipelineId);
  if (error && !sinTabla(error)) throw new Error(`Error quitando tarjetas: ${error.message}`);
}
