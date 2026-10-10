-- Paso H5 (decisiones de Cristian del 10 oct 2026): permisos de todas las secciones, por rol y por persona.
-- La fila de una persona manda sobre la de su rol; sin fila, vale lo de su rol (o lo de siempre).
-- permisos_seccion (por rol) ya existe (V2-8) y ahora guarda también las secciones de siempre.
create table public.permisos_persona (
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  perfil_id uuid not null references public.perfiles (id) on delete cascade,
  seccion text not null,
  permitido boolean not null,
  primary key (proyecto_id, perfil_id, seccion)
);
alter table public.permisos_persona enable row level security;
