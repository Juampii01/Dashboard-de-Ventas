// Emails con el aspecto glass de la app (Cristian, 11 oct 2026). Gmail no admite el desenfoque (backdrop-filter),
// así que el vidrio se imita: degradado de fondo, tarjeta blanca translúcida, borde fino y sombra.
import { describe, expect, it } from "vitest";
import { plantillaEmail } from "@/lib/plantilla-email";

describe("Plantilla de email glass", () => {
  it("lleva el logo, el título, las filas y el botón con su enlace", () => {
    const html = plantillaEmail({
      titulo: "Reporte de Ana",
      intro: "Caller · 2026-10-11",
      filas: [["Cuántas llamadas", "5"], ["Inconvenientes", "Ninguno"]],
      boton: { texto: "Abrir la app", url: "https://app.test/reportes" },
      pie: "Aviso automático",
      urlBase: "https://app.test",
    });
    expect(html).toContain('src="https://app.test/marca/eternity.png"');
    expect(html).toContain("Reporte de Ana");
    expect(html).toContain("Cuántas llamadas");
    expect(html).toContain("Ninguno");
    expect(html).toContain('href="https://app.test/reportes"');
    expect(html).toContain("Abrir la app");
    expect(html).toContain("Aviso automático");
    // Imitación del vidrio: tarjeta translúcida con esquinas de 22 px y el granate de Eternity en el botón
    expect(html).toContain("rgba(255,255,255,0.72)");
    expect(html).toContain("border-radius:22px");
    expect(html).toContain("#7b1a22");
    expect(html).not.toContain("backdrop-filter");
  });

  it("escapa lo que escribe el equipo (no se cuela HTML)", () => {
    const html = plantillaEmail({ titulo: "<b>x</b>", filas: [["Mejoras", '<script>alert("1")</script>']], urlBase: "https://app.test" });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;");
  });

  it("respeta los saltos de línea de las respuestas largas", () => {
    const html = plantillaEmail({ titulo: "R", filas: [["Otros", "uno\ndos"]], urlBase: "https://app.test" });
    expect(html).toContain("uno<br>dos");
  });

  it("sin botón ni filas no pinta esos bloques", () => {
    const html = plantillaEmail({ titulo: "Solo título", urlBase: "https://app.test" });
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("<td style=\"padding:10px 14px");
  });

  it("solo acepta enlaces https (o http en local) en el botón", () => {
    const html = plantillaEmail({ titulo: "R", boton: { texto: "Mal", url: "javascript:alert(1)" }, urlBase: "https://app.test" });
    expect(html).not.toContain("javascript:");
  });
});
