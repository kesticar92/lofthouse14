-- Migration 008: sistema de permisos granulares por módulo
-- Ejecutar en Supabase → SQL Editor

-- 1. Agregar columnas a profiles
alter table public.profiles
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended')),
  add column if not exists allowed_modules text[] not null default '{}';

-- 2. Usuarios existentes activos (super_admin y admin ya aprobados)
update public.profiles
set
  status = 'active',
  allowed_modules = array['cotizaciones','inventario','reservas','gastos','aseos']
where role in ('super_admin', 'admin');

-- 3. Staff existente activo (quienes ya estaban operando)
update public.profiles
set status = 'active'
where role = 'staff' and status = 'pending';

-- 4. Trigger: nuevos registros quedan pending con módulos vacíos
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, status, allowed_modules)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'staff',
    'pending',
    '{}'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 5. Función helper: usuario activo con rol staff
create or replace function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin', 'admin', 'staff')
      and p.status = 'active'
  );
$$;

grant execute on function public.is_active_staff() to authenticated;

-- 5b. Función helper: admin o super_admin activo
-- IMPORTANTE: usar SECURITY DEFINER para evitar recursión infinita cuando se
-- llama desde una política RLS sobre profiles (la policy se re-evaluaría sobre
-- la subconsulta). Definirla aquí permite reescribir profiles_admin_directory
-- sin EXISTS(SELECT FROM profiles) directo en el USING.
create or replace function public.is_admin_or_super()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin'::public.app_role, 'admin'::public.app_role)
      and p.status = 'active'
  );
$$;

grant execute on function public.is_admin_or_super() to authenticated;

-- 6. Política para que admin/super_admin vean TODOS los perfiles (gestión de usuarios)
-- Usa is_admin_or_super() (SECURITY DEFINER) para evitar recursión infinita.
drop policy if exists "profiles_admin_directory" on public.profiles;
create policy "profiles_admin_directory"
  on public.profiles for select
  using (public.is_admin_or_super());

-- 7. Política UPDATE: super_admin puede actualizar cualquier perfil
--    (role, status, allowed_modules, full_name)
drop policy if exists "profiles_update_super" on public.profiles;
create policy "profiles_update_super"
  on public.profiles for update
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- 8. Índice para búsquedas por status
create index if not exists profiles_status_idx on public.profiles (status);
create index if not exists profiles_role_idx on public.profiles (role);
