-- =============================================================================
-- PROMOVER A SUPER ADMIN (hazlo DESPUÉS de crear el usuario en Authentication)
-- =============================================================================
--
-- En Supabase (navegador):
--   1. Menú izquierdo → "SQL Editor".
--   2. Botón "New query" (o pestaña nueva).
--   3. Pega TODO este archivo.
--   4. Cambia solo el correo entre comillas simples (el mismo que creaste en Users).
--   5. Botón verde "Run" (o atajo Cmd/Ctrl + Enter).
--
-- Deberías ver: "Success. No rows returned" o "UPDATE 1".
-- =============================================================================

update public.profiles
set role = 'super_admin'
where email = lower('CAMBIA_ESTO@tu-correo.com');

-- Comprueba que quedó bien (opcional; sustituye el mismo correo):
-- select id, email, role from public.profiles where email = lower('CAMBIA_ESTO@tu-correo.com');
