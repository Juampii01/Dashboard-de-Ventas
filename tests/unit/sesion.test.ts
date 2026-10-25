// 25 oct 2026 (Cristian): con la base caída salía «Tu usuario está desactivado». Ahora: base sin respuesta → «sin-conexion»;
// perfil que no existe o desactivado → «sin-acceso». La base se simula: cada tabla devuelve lo que diga `respuesta`.
import { beforeEach, describe, expect, it, vi } from "vitest";

type Resp = { data: unknown; error: { message: string; code?: string } | null };
let respuesta: Record<string, Resp>;

// tests/apoyo/setup.ts simula la sesión para todos los tests: aquí se prueba la de verdad
vi.unmock("@/lib/sesion");
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("@/lib/supabase/server", () => ({ createSessionClient: async () => ({}) }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (tabla: string) => {
      const q = { select: () => q, eq: () => q, order: () => q, single: () => q, then: (r: (v: Resp) => unknown) => Promise.resolve(respuesta[tabla]).then(r) };
      return q;
    },
  }),
}));

const { sesionDe } = await import("@/lib/sesion");
const caida = { data: null, error: { message: "upstream connect error" } };
const proyecto = { id: "p1", nombre: "Maestria" };

beforeEach(() => {
  respuesta = {
    perfiles: { data: { id: "u1", rol: "caller", activo: true }, error: null },
    proyectos: { data: [proyecto], error: null },
    miembros_proyecto: { data: [{ proyectos: proyecto }], error: null },
  };
});

describe("sesionDe: mensajes al entrar", () => {
  it("todo bien: devuelve el perfil y su proyecto", async () => {
    expect(await sesionDe("u1")).toMatchObject({ perfil: { id: "u1" }, proyecto });
  });
  it("la base no responde al leer el perfil: «sin-conexion», no «desactivado»", async () => {
    respuesta.perfiles = caida;
    await expect(sesionDe("u1")).rejects.toThrow("REDIRECT /login?error=sin-conexion");
  });
  it("la base no responde al leer los proyectos: «sin-conexion», no «sin proyecto»", async () => {
    respuesta.miembros_proyecto = caida;
    await expect(sesionDe("u1")).rejects.toThrow("REDIRECT /login?error=sin-conexion");
  });
  it("el perfil no existe: «sin-acceso»", async () => {
    respuesta.perfiles = { data: null, error: { message: "0 rows", code: "PGRST116" } };
    await expect(sesionDe("u1")).rejects.toThrow("REDIRECT /login?error=sin-acceso");
  });
  it("desactivado de verdad: «sin-acceso»", async () => {
    respuesta.perfiles = { data: { id: "u1", rol: "caller", activo: false }, error: null };
    await expect(sesionDe("u1")).rejects.toThrow("REDIRECT /login?error=sin-acceso");
  });
});
