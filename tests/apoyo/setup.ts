import { vi } from "vitest";

// Variables de Supabase LOCAL
try {
  process.loadEnvFile(".env.local");
} catch {
  // los tests unitarios no necesitan base de datos
}

// La sesión se simula: cada test dice «como quién» actúa
vi.mock("@/lib/sesion", () => ({
  COOKIE_PROYECTO: "eternity_proyecto",
  getSesion: vi.fn(async () => {
    throw new Error("Test sin sesión: llama a como(perfil) antes");
  }),
}));
// Fuera de Next no hay caché que refrescar
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
