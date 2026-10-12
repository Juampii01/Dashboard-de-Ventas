-- Fase 4 (Cristian, 12 oct 2026): la misma persona en varios pipelines, como en GHL (una tarjeta por pipeline).
-- El lead sigue teniendo su pipeline y columna principales (`leads.pipeline_id` / `etapa_id`: lo que usan los
-- botones, las citas, los webhooks y las cifras). Aquí van sus tarjetas en OTROS pipelines de origen: aparecen
-- en el CRM de ese pipeline y se mueven arrastrando. En Funnel, KPIs y comisiones sigue contando una persona.
create table public.tarjetas_extra (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  pipeline_id uuid not null references public.pipelines (id) on delete cascade,
  etapa_id uuid references public.etapas (id) on delete set null,
  creado_en timestamptz not null default now(),
  unique (lead_id, pipeline_id)
);
create index tarjetas_extra_pipeline_idx on public.tarjetas_extra (pipeline_id, etapa_id);
-- Solo la usa el servidor (con la clave de servicio): sin políticas, nadie más la lee
alter table public.tarjetas_extra enable row level security;
