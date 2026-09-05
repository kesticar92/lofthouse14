-- Restringe ejecución RPC vía PostgREST para rol anon (advisors Supabase).
-- Las políticas RLS siguen invocando estas funciones internamente; no dependen del RPC público.

revoke execute on function public.regenerate_all_cleaning_tasks() from anon;
revoke execute on function public.regenerate_cleaning_tasks_for_reservation(uuid) from anon;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.set_updated_at() from anon;

revoke execute on function public.is_active_staff() from anon;
revoke execute on function public.is_admin_or_super() from anon;
revoke execute on function public.is_cleaning_supervisor() from anon;
revoke execute on function public.is_staff_user() from anon;
revoke execute on function public.is_super_admin() from anon;
