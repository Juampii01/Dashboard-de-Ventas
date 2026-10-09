-- V2-6 (arreglo): la cuenta «por defecto» se podía crear dos veces si se abrían dos páginas a la vez.
-- Se queda la más antigua de cada proyecto (lo que apuntaba a la repetida pasa a ella) y ya no puede haber dos.
with orden as (
  select id, proyecto_id, row_number() over (partition by proyecto_id order by creado_en, id) as n
  from public.cuentas where por_defecto
), buena as (
  select proyecto_id, id from orden where n = 1
), repetidas as (
  select o.id, b.id as buena_id from orden o join buena b using (proyecto_id) where o.n > 1
)
update public.movimientos m set cuenta_id = r.buena_id from repetidas r where m.cuenta_id = r.id;

with orden as (
  select id, proyecto_id, row_number() over (partition by proyecto_id order by creado_en, id) as n
  from public.cuentas where por_defecto
), buena as (
  select proyecto_id, id from orden where n = 1
), repetidas as (
  select o.id, b.id as buena_id from orden o join buena b using (proyecto_id) where o.n > 1
)
update public.movimientos m set cuenta_destino_id = r.buena_id from repetidas r where m.cuenta_destino_id = r.id;

with orden as (
  select id, proyecto_id, row_number() over (partition by proyecto_id order by creado_en, id) as n
  from public.cuentas where por_defecto
), buena as (
  select proyecto_id, id from orden where n = 1
), repetidas as (
  select o.id, b.id as buena_id from orden o join buena b using (proyecto_id) where o.n > 1
)
update public.egresos_programados e set cuenta_id = r.buena_id from repetidas r where e.cuenta_id = r.id;

delete from public.cuentas c
using (select id, row_number() over (partition by proyecto_id order by creado_en, id) as n from public.cuentas where por_defecto) o
where c.id = o.id and o.n > 1;

create unique index cuentas_una_por_defecto on public.cuentas (proyecto_id) where por_defecto;
