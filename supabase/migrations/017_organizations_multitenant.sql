-- =============================================================================
-- 017_organizations_multitenant.sql
-- -----------------------------------------------------------------------------
-- Fase 1: cimientos multi-tenant.
--   * organizations (tenant)
--   * org_members (membership + rol de org)
--   * helpers RLS: is_org_member / user_org_ids
--   * seed Organization LOFTHOUSE
--   * backfill memberships desde profiles staff activos
--
-- No toca el website público. Requiere 001 + 008 (profiles, app_role, status).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'org_member_role') then
    create type public.org_member_role as enum (
      'org_admin',
      'property_admin',
      'staff'
    );
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  status text not null default 'active'
    check (status in ('active', 'suspended')),
  modules_enabled text[] not null default array[
    'cotizaciones',
    'inventario',
    'reservas',
    'gastos',
    'aseos',
    'usuarios'
  ],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  )
);

create unique index if not exists organizations_slug_uidx
  on public.organizations (slug);

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;

-- ---------------------------------------------------------------------------
-- org_members
-- ---------------------------------------------------------------------------
create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  user_id uuid not null
    references auth.users (id) on delete cascade,
  role public.org_member_role not null default 'staff',
  allowed_modules text[] not null default '{}',
  status text not null default 'active'
    check (status in ('pending', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint org_members_user_org_unique unique (organization_id, user_id)
);

create index if not exists org_members_user_idx
  on public.org_members (user_id);

create index if not exists org_members_org_idx
  on public.org_members (organization_id);

drop trigger if exists org_members_set_updated_at on public.org_members;
create trigger org_members_set_updated_at
  before update on public.org_members
  for each row execute function public.set_updated_at();

alter table public.org_members enable row level security;

-- ---------------------------------------------------------------------------
-- Helpers RLS (SECURITY DEFINER — evitar recursión)
-- ---------------------------------------------------------------------------
create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_super_admin()
    or exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id = p_organization_id
        and m.status = 'active'
    );
$$;

grant execute on function public.is_org_member(uuid) to authenticated;

create or replace function public.user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.organization_id
  from public.org_members m
  where m.user_id = auth.uid()
    and m.status = 'active';
$$;

grant execute on function public.user_org_ids() to authenticated;

create or replace function public.is_org_admin(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_super_admin()
    or exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id = p_organization_id
        and m.status = 'active'
        and m.role in (
          'org_admin'::public.org_member_role,
          'property_admin'::public.org_member_role
        )
    );
$$;

grant execute on function public.is_org_admin(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS organizations / org_members
-- ---------------------------------------------------------------------------
drop policy if exists "organizations_select_member" on public.organizations;
create policy "organizations_select_member"
  on public.organizations for select
  to authenticated
  using (
    public.is_super_admin()
    or id in (select public.user_org_ids())
  );

drop policy if exists "organizations_update_admin" on public.organizations;
create policy "organizations_update_admin"
  on public.organizations for update
  to authenticated
  using (public.is_org_admin(id))
  with check (public.is_org_admin(id));

drop policy if exists "org_members_select_member" on public.org_members;
create policy "org_members_select_member"
  on public.org_members for select
  to authenticated
  using (
    public.is_super_admin()
    or user_id = auth.uid()
    or public.is_org_admin(organization_id)
  );

drop policy if exists "org_members_admin_write" on public.org_members;
create policy "org_members_admin_write"
  on public.org_members for all
  to authenticated
  using (public.is_org_admin(organization_id) or public.is_super_admin())
  with check (public.is_org_admin(organization_id) or public.is_super_admin());

grant select on public.organizations to authenticated;
grant select, insert, update, delete on public.org_members to authenticated;

-- ---------------------------------------------------------------------------
-- Seed: Organization LOFTHOUSE (UUID fijo para docs / env)
-- ---------------------------------------------------------------------------
insert into public.organizations (id, name, slug, status)
values (
  '11111111-1111-4111-8111-111111111111'::uuid,
  'LOFTHOUSE',
  'lofthouse',
  'active'
)
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  status = excluded.status,
  updated_at = now();

-- Backfill: staff activo → org_members LOFTHOUSE
insert into public.org_members (
  organization_id,
  user_id,
  role,
  allowed_modules,
  status
)
select
  '11111111-1111-4111-8111-111111111111'::uuid,
  p.id,
  case
    when p.role = 'super_admin'::public.app_role then 'org_admin'::public.org_member_role
    when p.role = 'admin'::public.app_role then 'property_admin'::public.org_member_role
    else 'staff'::public.org_member_role
  end,
  coalesce(p.allowed_modules, '{}'::text[]),
  case
    when p.status in ('pending', 'active', 'suspended') then p.status
    else 'active'
  end
from public.profiles p
where p.role in (
  'super_admin'::public.app_role,
  'admin'::public.app_role,
  'staff'::public.app_role
)
on conflict (organization_id, user_id) do nothing;

comment on table public.organizations is
  'Tenant SaaS. Seed Fase 1: LOFTHOUSE (slug=lofthouse).';
comment on table public.org_members is
  'Membership usuario↔org. Roles: org_admin | property_admin | staff. '
  'profiles.role (super_admin|admin|staff) sigue siendo el gate del panel.';
comment on function public.is_org_member(uuid) is
  'True si super_admin de plataforma o membership activa en la org.';
