-- =============================================================================
-- VERIFICAR ACCESO AL PANEL /admin (Auth + profiles + mismo proyecto)
-- =============================================================================
--
-- Dónde: Supabase Dashboard → SQL Editor → New query → pega este archivo → Run.
--
-- 1. Sustituye las CUATRO ocurrencias de CAMBIA_ESTO@tu-correo.com por tu correo
--    real (el mismo que usas en /admin/login). Usa minúsculas si tu login es así.
-- 2. Ejecuta todo el script de una vez.
-- 3. Interpretación:
--    - Bloque A: debe devolver 1 fila (usuario en Authentication).
--    - Bloque B: debe devolver 1 fila con role super_admin|admin|staff y status active.
--    - Bloque C: diagnostico debe ser 'ok'. Si ves ids distintos, corrige datos.
--    - Si A/B/C están bien pero la web en producción falla: revisa que en el
--      hosting NEXT_PUBLIC_SUPABASE_URL sea de ESTE proyecto (Settings → API).
--
-- Si al consultar profiles desde la app ves error 500 / RLS, prueba antes el
-- snippet: supabase/snippets/fix_rls_recursion.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- A) Usuario en Authentication
-- ---------------------------------------------------------------------------
select id, email, email_confirmed_at is not null as email_confirmado
from auth.users
where email = lower('CAMBIA_ESTO@tu-correo.com');

-- ---------------------------------------------------------------------------
-- B) Perfil en public.profiles
-- ---------------------------------------------------------------------------
select id, email, role, status, allowed_modules
from public.profiles
where email = lower('CAMBIA_ESTO@tu-correo.com');

-- ---------------------------------------------------------------------------
-- C) Alineación id Auth ↔ profiles (diagnostico = 'ok' es lo esperado)
-- ---------------------------------------------------------------------------
select
  u.id as auth_user_id,
  p.id as profile_id,
  case
    when u.id is null then 'falta fila en auth.users'
    when p.id is null then 'falta fila en public.profiles'
    when u.id = p.id then 'ok'
    else 'ERROR: ids distintos — el panel lee profiles por id de Auth'
  end as diagnostico,
  p.role,
  p.status
from auth.users u
full outer join public.profiles p on p.id = u.id
where u.email = lower('CAMBIA_ESTO@tu-correo.com')
   or p.email = lower('CAMBIA_ESTO@tu-correo.com');

-- ---------------------------------------------------------------------------
-- D) Políticas SELECT sobre profiles (solo lectura; referencia)
-- ---------------------------------------------------------------------------
select polname as policy_name, polcmd as cmd
from pg_policy pol
join pg_class rel on rel.oid = pol.polrelid
join pg_namespace nsp on nsp.oid = rel.relnamespace
where nsp.nspname = 'public'
  and rel.relname = 'profiles'
order by polname;
