// 13 oct (Cristian): la cita sin «pipeline» va al pipeline donde GHL tiene su oportunidad en «Agendan»
import { describe, expect, it } from "vitest";
import { pipelinesAgendanGhl } from "@/lib/ghl";

const PIPELINES = {
  pipelines: [
    { id: "p-yt", name: "0. Agendas YT", stages: [{ id: "s-yt-form", name: "Form" }, { id: "s-yt-ag", name: "Agendan" }] },
    { id: "p-ig", name: "0. Agendas IG", stages: [{ id: "s-ig-ag", name: "Agendan" }] },
    { id: "p-bib", name: "1. Biblioteca Recursos", stages: [{ id: "s-bib", name: "Registrados" }] },
  ],
};
const falsoFetch = (opps: unknown[]) =>
  (async (url: string) => new Response(JSON.stringify(String(url).includes("/opportunities/pipelines") ? PIPELINES : { opportunities: opps }), { status: 200 })) as unknown as typeof fetch;

describe("pipelinesAgendanGhl", () => {
  it("devuelve los pipelines con la oportunidad en «Agendan», la más reciente primero, e ignora las de otras columnas", async () => {
    const r = await pipelinesAgendanGhl({
      token: "t",
      locationId: "loc",
      contactId: "c1",
      fetchImpl: falsoFetch([
        { pipelineId: "p-bib", pipelineStageId: "s-bib", updatedAt: "2026-10-13T10:00:00Z" },
        { pipelineId: "p-yt", pipelineStageId: "s-yt-ag", updatedAt: "2026-10-12T10:00:00Z" },
        { pipelineId: "p-ig", pipelineStageId: "s-ig-ag", updatedAt: "2026-10-13T09:00:00Z" },
        { pipelineId: "p-yt", pipelineStageId: "s-yt-form", updatedAt: "2026-10-13T11:00:00Z" },
      ]),
    });
    expect(r).toEqual(["0. Agendas IG", "0. Agendas YT"]);
  });
  it("sin oportunidades en «Agendan», nada", async () => {
    expect(await pipelinesAgendanGhl({ token: "t", locationId: "loc", contactId: "c1", fetchImpl: falsoFetch([]) })).toEqual([]);
  });
  it("si GHL falla, avisa con un error (quien la usa lo atrapa y la cita va a la columna de siempre)", async () => {
    const roto = (async () => new Response("", { status: 500 })) as unknown as typeof fetch;
    await expect(pipelinesAgendanGhl({ token: "t", locationId: "loc", contactId: "c1", fetchImpl: roto })).rejects.toThrow(/500/);
  });
});
