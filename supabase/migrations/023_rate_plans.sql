-- =============================================================================
-- 023_rate_plans.sql — Fase 5: pricing unificado (rate plans por room_type)
-- =============================================================================

create table if not exists public.rate_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  property_id uuid not null
    references public.org_properties (id) on delete cascade,
  room_type_id uuid
    references public.room_types (id) on delete cascade,
  code text not null,
  name text not null,
  currency text not null default 'COP',
  tarifa_lj numeric(12, 2) not null default 90000,
  tarifa_vd numeric(12, 2) not null default 100000,
  recargo_huesped numeric(12, 2) not null default 30000,
  is_default boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rate_plans_property_code_unique unique (property_id, code)
);

create index if not exists rate_plans_org_idx on public.rate_plans (organization_id);
create index if not exists rate_plans_room_type_idx on public.rate_plans (room_type_id);

drop trigger if exists rate_plans_set_updated_at on public.rate_plans;
create trigger rate_plans_set_updated_at
  before update on public.rate_plans
  for each row execute function public.set_updated_at();

alter table public.rate_plans enable row level security;

drop policy if exists "rate_plans_member_all" on public.rate_plans;
create policy "rate_plans_member_all"
  on public.rate_plans for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.rate_plans to authenticated;

create table if not exists public.season_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  rate_plan_id uuid not null
    references public.rate_plans (id) on delete cascade,
  name text not null default '',
  start_date date not null,
  end_date date not null,
  multiplier numeric(8, 4) not null default 1.0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint season_rules_dates_ok check (end_date >= start_date)
);

create index if not exists season_rules_plan_idx on public.season_rules (rate_plan_id);

alter table public.season_rules enable row level security;

drop policy if exists "season_rules_member_all" on public.season_rules;
create policy "season_rules_member_all"
  on public.season_rules for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.season_rules to authenticated;

-- Seed default plan LOFTHOUSE (sin room_type = base global property)
insert into public.rate_plans (
  id, organization_id, property_id, room_type_id, code, name,
  tarifa_lj, tarifa_vd, recargo_huesped, is_default, active
)
values (
  '55555555-5555-4555-8555-555555555501'::uuid,
  '11111111-1111-4111-8111-111111111111'::uuid,
  '22222222-2222-4222-8222-222222222222'::uuid,
  null,
  'BASE',
  'Tarifa base LOFTHOUSE',
  90000, 100000, 30000, true, true
)
on conflict (property_id, code) do nothing;
