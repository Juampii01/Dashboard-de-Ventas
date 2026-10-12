-- Fase 4 (Cristian, 12 oct 2026): «todo lead con cita de GHL va a Orgánico → Agendados» deja de depender del nombre.
-- El proyecto guarda qué columna recibe esos leads (se elige en el CRM, en el «⋯» de la columna). Si se borra la
-- columna, queda vacío y no se mueve nada.
alter table public.proyectos add column etapa_citas_ghl uuid references public.etapas (id) on delete set null;

-- La de hoy: «Orgánico» → «Agendados» (por su nombre, una sola vez)
update public.proyectos pr set etapa_citas_ghl = (
  select e.id from public.etapas e join public.pipelines p on p.id = e.pipeline_id
  where p.proyecto_id = pr.id and p.tipo = 'normal' and lower(p.nombre) = 'orgánico' and lower(trim(e.nombre)) = 'agendados'
  limit 1
);
