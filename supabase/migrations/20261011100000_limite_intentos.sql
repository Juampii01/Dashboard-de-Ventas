-- Arreglo 4 de la auditoría: el límite de intentos (login y webhooks) vivía en la memoria de cada
-- servidor; en Vercel cada copia contaba por separado. Ahora se cuenta en la base de datos.

create table public.limite_intentos (
  id bigint generated always as identity primary key,
  clave text not null,
  en timestamptz not null default now()
);
create index limite_intentos_clave_en on public.limite_intentos (clave, en);

-- Sin políticas: solo el servidor (clave secreta) puede leerla o escribirla
alter table public.limite_intentos enable row level security;

-- ¿Cuántos intentos de esta clave hay dentro de la ventana?
create or replace function public.limite_contar(p_clave text, p_ventana_ms integer, p_ahora timestamptz)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer from public.limite_intentos
  where clave = p_clave and en > p_ahora - make_interval(secs => p_ventana_ms / 1000.0) and en <= p_ahora;
$$;

-- Webhooks: si cabe, lo apunta y devuelve true; si no, false. En un solo paso: el bloqueo por clave
-- hace que dos peticiones a la vez no puedan colarse las dos con el último hueco.
create or replace function public.limite_dentro(p_clave text, p_maximo integer, p_ventana_ms integer, p_ahora timestamptz default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
  ahora timestamptz;
begin
  perform pg_advisory_xact_lock(hashtext('limite:' || p_clave));
  -- La hora real DESPUÉS del bloqueo (now() es la hora de inicio de la transacción y,
  -- si esta esperó al bloqueo, no contaría el intento que la otra acaba de apuntar)
  ahora := coalesce(p_ahora, clock_timestamp());
  -- Se cuenta y se apunta después del bloqueo, con esa misma hora
  select count(*) into n from public.limite_intentos
  where clave = p_clave and en > ahora - make_interval(secs => p_ventana_ms / 1000.0) and en <= ahora;
  if n >= p_maximo then
    return false;
  end if;
  insert into public.limite_intentos (clave, en) values (p_clave, ahora);
  -- Limpieza de vez en cuando (la ventana más larga es de 15 minutos)
  if random() < 0.02 then
    delete from public.limite_intentos where en < now() - interval '1 day';
  end if;
  return true;
end;
$$;

-- Login: primero se mira si está bloqueado y solo se apunta cuando falla
create or replace function public.limite_bloqueado(p_clave text, p_maximo integer, p_ventana_ms integer, p_ahora timestamptz default null)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.limite_contar(p_clave, p_ventana_ms, coalesce(p_ahora, clock_timestamp())) >= p_maximo;
$$;

create or replace function public.limite_anotar(p_clave text, p_ahora timestamptz default null)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.limite_intentos (clave, en) values (p_clave, coalesce(p_ahora, clock_timestamp()));
$$;

-- Postgres da permiso de ejecutar a todo el mundo por defecto: solo el servidor
revoke execute on function public.limite_contar(text, integer, timestamptz) from public, anon, authenticated;
revoke execute on function public.limite_dentro(text, integer, integer, timestamptz) from public, anon, authenticated;
revoke execute on function public.limite_bloqueado(text, integer, integer, timestamptz) from public, anon, authenticated;
revoke execute on function public.limite_anotar(text, timestamptz) from public, anon, authenticated;
grant execute on function public.limite_contar(text, integer, timestamptz) to service_role;
grant execute on function public.limite_dentro(text, integer, integer, timestamptz) to service_role;
grant execute on function public.limite_bloqueado(text, integer, integer, timestamptz) to service_role;
grant execute on function public.limite_anotar(text, timestamptz) to service_role;
