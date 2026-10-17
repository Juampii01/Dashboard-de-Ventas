-- 17 oct 2026: se quitan las funciones de 20261017160000_biblioteca_filas. Con los datos reales no servían: devolvían
-- más de 1.000 grupos (Supabase corta en 1.000: faltaban personas) y calcular en la base tardaba más (~0,4–0,6 s)
-- que traer los leads (~0,16 s). KPIs → Biblioteca sigue calculando en la app. Ver docs/Mejorar-velocidad.md.
drop function if exists public.biblioteca_filas(uuid);
drop function if exists public.limpio_pregunta(text);
