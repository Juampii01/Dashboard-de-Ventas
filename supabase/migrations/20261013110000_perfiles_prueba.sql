-- 1.0 «Antes de todo» (Cristian, 11 oct 2026): perfiles de prueba (closer-test y caller-test) que pueden entrar
-- y usar la app, pero no cuentan en las cifras, el reparto, la rotación ni las liquidaciones, ni salen en Equipo.
alter table public.perfiles add column es_prueba boolean not null default false;
