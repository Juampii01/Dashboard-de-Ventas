-- Cristian, 17 oct 2026: leer GHL cada 60 s en vez de cada 30 s, para gastar menos CPU de Vercel (medido ese día:
-- la lectura gastaba ~6 min de CPU al día, ~3 h al mes de las 4 h gratis). Cambia solo la frecuencia de la tarea
-- «leer-ghl» de 20261017120000_leer_ghl_cada_30s.sql; lo que hace es igual. En la base de los tests no existe: nada.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'leer-ghl') then
    -- «* * * * *» = una vez por minuto (pg_cron solo acepta «N seconds» de 1 a 59)
    perform cron.alter_job((select jobid from cron.job where jobname = 'leer-ghl'), schedule := '* * * * *');
  end if;
end $$;
