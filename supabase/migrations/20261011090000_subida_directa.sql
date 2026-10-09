-- Arreglo 1 de la auditoría: Vercel no acepta peticiones de más de 4,5 MB.
-- Los archivos van del navegador directos a Supabase con un enlace firmado que crea el servidor;
-- los buckets ponen el tope de tamaño y de tipo (el servidor lo vuelve a comprobar después).

update storage.buckets
set file_size_limit = 15728640, allowed_mime_types = array['application/pdf']
where id = 'recursos';

-- CSV de leads del CRM: se suben aquí, el servidor los lee y los borra al terminar.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('importaciones', 'importaciones', false, 15728640, array['text/csv'])
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
