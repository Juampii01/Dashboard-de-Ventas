-- Plan GHL, fase 3 (Cristian, 16 oct 2026): leer las citas de GHL cada 30 s, sin workflows.
-- El programador de Supabase (pg_cron) llama a la app (pg_net) en /api/ghl/leer/<proyecto> con la clave del proyecto
-- (la misma del webhook, en la cabecera x-eternity-secreto). Solo los proyectos con calendarios elegidos y GHL conectado.
-- Vercel Hobby no deja tareas de menos de un día; Supabase admite «30 seconds» desde Postgres 15.1.1.61 (aquí, 17).
-- Si en 2 días la memoria de Vercel va a pasar del 50 % del mes, se cambia a «60 seconds» (plan-GHL.md, fase 6).

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Solo en la base de la nube (la de Maestria): en la de los tests de GitHub no se programa nada,
-- para que no llame a la app publicada.
do $$
begin
  if exists (select 1 from public.proyectos where ghl_location_id = 'ZGWJLBH58RJtl2iGhykp') then
    perform cron.schedule(
      'leer-ghl',
      '30 seconds',
      $job$
        select net.http_post(
          url := 'https://dashboard.eternity.llc/api/ghl/leer/' || p.id,
          headers := jsonb_build_object('Content-Type', 'application/json', 'x-eternity-secreto', p.webhook_secreto),
          body := '{}'::jsonb,
          timeout_milliseconds := 60000
        )
        from public.proyectos p
        where cardinality(p.ghl_calendarios) > 0 and p.ghl_token is not null
      $job$
    );
    -- El historial del programador crece 2.880 filas al día: se guarda solo lo de los 2 últimos días
    perform cron.schedule(
      'limpiar-historial-cron',
      '17 4 * * *',
      $job$ delete from cron.job_run_details where end_time < now() - interval '2 days' $job$
    );
  end if;
end $$;
