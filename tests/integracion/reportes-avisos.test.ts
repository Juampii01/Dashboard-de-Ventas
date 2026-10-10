// Reporte de fin de día y aviso a GHL. En lugar de GHL se usa un servidor local
// que hace de «webhook» y guarda lo que recibe, para ver exactamente qué se envía.
import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { crearEscenario, borrarEscenario, como, db, formulario, type Escenario } from "../apoyo/escenario";
import { enviarReporte } from "@/app/(panel)/reportes/acciones";

let e: Escenario;
let servidor: Server;
const recibidos: Record<string, unknown>[] = [];

beforeAll(async () => {
  e = await crearEscenario();
  servidor = createServer((req, res) => {
    let cuerpo = "";
    req.on("data", (c) => (cuerpo += c));
    req.on("end", () => {
      recibidos.push(JSON.parse(cuerpo));
      res.writeHead(200).end("ok");
    });
  });
  await new Promise<void>((r) => servidor.listen(0, "127.0.0.1", () => r()));
  const { port } = servidor.address() as { port: number };
  await db.from("perfiles").update({ whatsapp: "+34600000000" }).eq("id", e.p.director.id);
  await db.from("proyectos").update({ aviso_webhook_url: `http://127.0.0.1:${port}/aviso` }).eq("id", e.proyecto.id);
  e.proyecto.aviso_webhook_url = `http://127.0.0.1:${port}/aviso`;
});
afterAll(async () => {
  servidor?.close();
  if (e) await borrarEscenario(e);
});

const closerFd = () =>
  formulario({
    fecha: "2026-10-08",
    llamadas_realizadas: "8",
    llamadas_agendadas: "6",
    no_responden: "1",
    no_show: "1",
    ventas: "2",
    puntos_mejora: "Cerrar antes",
    inconvenientes: "Ninguno",
  });

describe("Reporte de fin de día", () => {
  it("el closer envía su reporte: se guarda y el aviso lleva destinatarios, respuestas y tasas", async () => {
    como(e, e.p.closerA);
    const r = await enviarReporte(null, closerFd());
    expect(r?.ok).toMatch(/director ya tiene el aviso/);
    const { data } = await db.from("reportes").select("rol, fecha, respuestas").eq("perfil_id", e.p.closerA.id).single();
    expect(data).toMatchObject({ rol: "closer", fecha: "2026-10-08" });
    expect(data!.respuestas).toMatchObject({ llamadas_realizadas: 8, ventas: 2, puntos_mejora: "Cerrar antes" });

    const aviso = recibidos.at(-1)!;
    expect(aviso).toMatchObject({ tipo: "reporte_fin_de_dia", persona: e.p.closerA.nombre, rol: "closer", tasa_agendamiento: "75\u00a0%", tasa_cierre: "33\u00a0%" });
    const destinatarios = aviso.destinatarios as { email: string; whatsapp: string | null }[];
    // Solo CEO y directores del proyecto + (arreglo 34) todos los CEO activos aunque no sean miembros
    const { data: ceos } = await db.from("perfiles").select("email").eq("rol", "ceo").eq("activo", true);
    const esperados = [...new Set([e.p.ceo.email, e.p.director.email, e.p.directorAdmin.email, ...(ceos ?? []).map((c) => c.email)])].sort();
    expect(destinatarios.map((d) => d.email).sort()).toEqual(esperados);
    const ceoDeFuera = (ceos ?? []).find((c) => c.email !== e.p.ceo.email);
    if (ceoDeFuera) expect(destinatarios.some((d) => d.email === ceoDeFuera.email)).toBe(true); // no es miembro y le llega
    expect(destinatarios.find((d) => d.email === e.p.director.email)?.whatsapp).toBe("+34600000000");
  });
  it("arreglo 27: el mismo día otra vez sustituye al anterior y no repite el aviso", async () => {
    como(e, e.p.closerA);
    const avisosAntes = recibidos.length;
    const fd = closerFd();
    fd.set("ventas", "3");
    const r = await enviarReporte(null, fd);
    expect(r?.ok).toMatch(/Reporte actualizado/);
    const { data } = await db.from("reportes").select("respuestas").eq("perfil_id", e.p.closerA.id).eq("fecha", "2026-10-08");
    expect(data).toHaveLength(1);
    expect(data![0].respuestas).toMatchObject({ ventas: 3 });
    expect(recibidos.length).toBe(avisosAntes);
  });
  it("faltan respuestas o la fecha es futura: no se guarda", async () => {
    como(e, e.p.closerA);
    const sinTexto = closerFd();
    sinTexto.set("inconvenientes", "");
    expect((await enviarReporte(null, sinTexto))?.error).toMatch(/Responde/);
    const futuro = closerFd();
    futuro.set("fecha", "2099-01-01");
    expect((await enviarReporte(null, futuro))?.error).toMatch(/Fecha no válida/);
  });
  it("si el webhook de avisos falla, el reporte se guarda igual y lo dice", async () => {
    await db.from("proyectos").update({ aviso_webhook_url: "http://127.0.0.1:1/no-existe" }).eq("id", e.proyecto.id);
    e.proyecto.aviso_webhook_url = "http://127.0.0.1:1/no-existe";
    como(e, e.p.callerA);
    const fd = formulario({ llamadas: "40", no_responden: "20", agendas: "3", whatsapps: "10", seguimientos: "4", inconvenientes: "Ninguno", mejoras: "x", otros: "x" });
    const r = await enviarReporte(null, fd);
    expect(r?.ok).toMatch(/Reporte guardado. \(Aviso no enviado/);
    expect((await db.from("reportes").select("id").eq("perfil_id", e.p.callerA.id)).data).toHaveLength(1);
  });
});
