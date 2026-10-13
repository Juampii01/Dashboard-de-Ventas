-- Fase 7 (plan del 10 oct): «Cerrar moviendo la tarjeta». En los pipelines de origen, la columna «Cerrados» queda
-- unida a «Vendido»: soltar ahí una tarjeta abre «Registrar venta» (si se cancela, vuelve a su sitio). Se puede
-- cambiar en el «⋯» de la columna. Solo donde el pipeline no tenga ya una columna unida a «Vendido».
update public.etapas e set estado_caller = 'vendido'
from public.pipelines p
where p.id = e.pipeline_id and p.tipo = 'normal' and lower(trim(e.nombre)) = 'cerrados' and e.estado_caller is null
  and not exists (select 1 from public.etapas x where x.pipeline_id = e.pipeline_id and x.estado_caller = 'vendido');
