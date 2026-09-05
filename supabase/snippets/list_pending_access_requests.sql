-- Ver solicitudes de acceso aún sin aprobar (perfiles staff en pending).
-- Ejecutar en Supabase SQL Editor. En el panel: /admin/usuarios → filtro «Pendientes».

select id, email, full_name, role, status, created_at
from public.profiles
where status = 'pending'
order by created_at desc;
