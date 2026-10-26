-- 1b (Cristian, 26 oct 2026): el país de cada lead, sacado de su teléfono, calculado una vez y guardado.
-- «pais»: código del país (p. ej. «ES», «DO», «PR») o el texto «Sin país» si el teléfono no se reconoce
-- (Cristian, 26 oct). Vacío (null) = todavía sin calcular (lo rellena scripts/rellenar-pais.mjs).
-- «pais_de»: el teléfono del que se sacó el país (Cristian, 26 oct: así la base sabe si el país es de este número).
-- No se usa el «country» que manda GHL en «datos»: es su valor por defecto («US») y el 91 % está mal.
alter table public.leads
  add column pais text,
  add column pais_de text;

-- Nunca queda un país viejo: si el país no salió del teléfono que tiene ahora el lead (cambió el teléfono y no
-- vino el país nuevo, o se escribió a mano en Supabase), se borran los dos y el lead queda «sin calcular».
-- Si la app manda el país nuevo con su «pais_de», se queda (también si es el mismo país que antes).
create or replace function public.lead_pais_del_telefono() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.pais is not null and new.pais_de is distinct from new.telefono then
    new.pais := null;
    new.pais_de := null;
  end if;
  return new;
end $$;
create trigger leads_pais_del_telefono before insert or update of telefono, pais, pais_de on public.leads
  for each row execute function public.lead_pais_del_telefono();

-- P3 · rellenar los leads que ya hay (scripts/rellenar-pais.mjs): un mismo país a una tanda de leads en una sola
-- escritura, cada uno con su propio teléfono como «pais_de» (así no hacen falta 3.345 escrituras). Solo los que siguen
-- sin país y con el mismo teléfono con el que se calculó (si cambió entretanto, se queda sin calcular). Devuelve
-- cuántos cambió. Solo la clave secreta.
create or replace function public.rellenar_pais(p_ids uuid[], p_telefonos text[], p_pais text)
returns integer
language sql
set search_path = public
as $$
  with hechos as (
    update public.leads l set pais = p_pais, pais_de = l.telefono
    from unnest(p_ids, p_telefonos) as u(id, telefono)
    where l.id = u.id and l.telefono = u.telefono and l.pais is null
    returning 1
  )
  select count(*)::integer from hechos
$$;
revoke execute on function public.rellenar_pais(uuid[], text[], text) from public, anon, authenticated;
grant execute on function public.rellenar_pais(uuid[], text[], text) to service_role;
