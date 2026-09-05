-- Ejecutar en Supabase → SQL Editor (todo el bloque de una vez).

-- Rol de aplicación (staff del panel)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('super_admin', 'admin', 'staff');
  end if;
end$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default '',
  role public.app_role not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

-- Perfil automático al registrarse (rol staff por defecto)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'staff'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Si ya existían usuarios sin fila en profiles:
insert into public.profiles (id, email, full_name, role)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', ''), 'staff'::public.app_role
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.audit_logs enable row level security;

-- Evita recursión RLS: no consultamos `profiles` directamente dentro
-- de políticas de `profiles`; usamos función SECURITY DEFINER.
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

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_select_super" on public.profiles;
create policy "profiles_select_super"
  on public.profiles for select
  using (public.is_super_admin());

drop policy if exists "profiles_update_super" on public.profiles;
create policy "profiles_update_super"
  on public.profiles for update
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "audit_insert_self" on public.audit_logs;
create policy "audit_insert_self"
  on public.audit_logs for insert
  with check (actor_id = auth.uid());

drop policy if exists "audit_select_super" on public.audit_logs;
create policy "audit_select_super"
  on public.audit_logs for select
  using (public.is_super_admin());

grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert on public.audit_logs to authenticated;

-- Tras crear tu usuario en Authentication → Users, ejecuta (cambia el email):
-- update public.profiles set role = 'super_admin' where email = 'tu-correo@dominio.com';
