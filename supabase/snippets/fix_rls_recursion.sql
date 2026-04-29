-- Ejecuta este parche en Supabase SQL Editor si ves 500 al consultar `profiles`.
-- Síntoma típico: RLS recursion / policy loop.

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
  );
$$;

grant execute on function public.is_super_admin() to authenticated;

drop policy if exists "profiles_select_super" on public.profiles;
create policy "profiles_select_super"
  on public.profiles for select
  using (public.is_super_admin());

drop policy if exists "profiles_update_super" on public.profiles;
create policy "profiles_update_super"
  on public.profiles for update
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "audit_select_super" on public.audit_logs;
create policy "audit_select_super"
  on public.audit_logs for select
  using (public.is_super_admin());
