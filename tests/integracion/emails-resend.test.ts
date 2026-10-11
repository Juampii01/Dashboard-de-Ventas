// Bloque 6 (Cristian, 11 oct 2026): emails con Resend. En lugar de Resend se usa un servidor local que guarda lo
// que recibe (nunca se manda un email de verdad). Cubre: el envío (cabeceras, remitente, destinatarios), el aviso
// de reporte por email a CEO y directores, y el enlace mágico que manda un administrador desde la ficha.
import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { borrarEscenario, como, crearEscenario, falla, formulario, ok, type Escenario } from "../apoyo/escenario";
import { enviarEmail } from "@/lib/email";
import { enviarReporte } from "@/app/(panel)/reportes/acciones";
import { enviarEnlaceMagico } from "@/app/(panel)/admin/acciones";

let e: Escenario;
let servidor: Server;
const recibidos: { auth: string; cuerpo: Record<string, unknown> }[] = [];
const antes = { url: process.env.RESEND_API_URL, clave: process.env.RESEND_API_KEY };

beforeAll(async () => {
  e = await crearEscenario();
  servidor = createServer((req, res) => {
    let cuerpo = "";
    req.on("data", (c) => (cuerpo += c));
    req.on("end", () => {
      recibidos.push({ auth: String(req.headers.authorization ?? ""), cuerpo: JSON.parse(cuerpo) });
      res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ id: "email-falso" }));
    });
  });
  await new Promise<void>((r) => servidor.listen(0, "127.0.0.1", () => r()));
  const { port } = servidor.address() as { port: number };
  process.env.RESEND_API_URL = `http://127.0.0.1:${port}`;
  process.env.RESEND_API_KEY = "re_prueba_falsa";
});
afterAll(async () => {
  servidor?.close();
  process.env.RESEND_API_URL = antes.url;
  process.env.RESEND_API_KEY = antes.clave;
  if (e) await borrarEscenario(e);
});

describe("Enviar un email con Resend", () => {
  it("manda la clave, el remitente de Eternity, los destinatarios, el asunto y el texto", async () => {
    const r = await enviarEmail({ para: ["a@x.test"], asunto: "Hola", texto: "Prueba" });
    expect(r).toEqual({ enviado: true, motivo: "" });
    const ultimo = recibidos.at(-1)!;
    expect(ultimo.auth).toBe("Bearer re_prueba_falsa");
    expect(ultimo.cuerpo).toMatchObject({ from: "Eternity <no-reply@eternity.llc>", to: ["a@x.test"], subject: "Hola", text: "Prueba" });
  });

  it("sin clave de Resend no envía nada y lo dice", async () => {
    const clave = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    const n = recibidos.length;
    try {
      expect(await enviarEmail({ para: ["a@x.test"], asunto: "Hola", texto: "Prueba" })).toEqual({ enviado: false, motivo: "Falta RESEND_API_KEY" });
    } finally {
      process.env.RESEND_API_KEY = clave;
    }
    expect(recibidos.length).toBe(n);
  });
});

describe("Aviso del reporte por email", () => {
  it("al enviar un reporte, el CEO y los directores reciben un email con el texto del reporte", async () => {
    como(e, e.p.closerA);
    const n = recibidos.length;
    const r = await enviarReporte(
      null,
      formulario({ fecha: "2026-10-08", llamadas_realizadas: "8", llamadas_agendadas: "6", no_responden: "1", no_show: "1", ventas: "2", puntos_mejora: "Cerrar antes", inconvenientes: "Ninguno" })
    );
    expect(r?.ok).toMatch(/aviso/);
    const email = recibidos.slice(n).find((x) => String(x.cuerpo.subject).includes("Reporte"))!;
    expect(email).toBeDefined();
    const para = email.cuerpo.to as string[];
    expect(para).toEqual(expect.arrayContaining([e.p.ceo.email, e.p.director.email, e.p.directorAdmin.email]));
    expect(para).not.toContain(e.p.closerA.email);
    expect(String(email.cuerpo.text)).toContain(e.p.closerA.nombre);
  });
});

describe("Enlace mágico", () => {
  it("solo un administrador lo manda; el email lleva un enlace a /auth/confirm con el token", async () => {
    como(e, e.p.closerA);
    await falla(enviarEnlaceMagico(e.p.callerA.id));
    como(e, e.p.ceo);
    const n = recibidos.length;
    await ok(enviarEnlaceMagico(e.p.callerA.id));
    const email = recibidos.slice(n)[0];
    expect(email.cuerpo.to).toEqual([e.p.callerA.email]);
    expect(String(email.cuerpo.text)).toMatch(/\/auth\/confirm\?token_hash=[^&\s]+&type=magiclink/);
  });

  it("a alguien de otro proyecto no se le manda", async () => {
    como(e, e.p.ceo);
    await falla(enviarEnlaceMagico(crypto.randomUUID()), /no está en este proyecto/);
  });
});
