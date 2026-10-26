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
