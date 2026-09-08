-- =============================================================================
-- 025_ops_housekeeping_maintenance.sql — Fase 8
-- =============================================================================

-- Housekeeping status por room (Dirty/Clean/Inspected/Out of service)
alter table public.rooms
  add column if not exists hk_status text not null default 'clean'
    check (hk_status in ('dirty', 'clean', 'inspected', 'in_progress', 'out_of_service'));

create table if not exists public.maintenance_tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  property_id uuid
    references public.org_properties (id) on delete set null,
  room_id uuid references public.rooms (id) on delete set null,
  legacy_property_id uuid references public.properties (id) on delete set null,
  title text not null,
  description text not null default '',
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'blocked', 'resolved', 'cancelled')),
  blocks_availability boolean not null default false,
  block_id uuid references public.availability_blocks (id) on delete set null,
  assigned_to uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists maintenance_tickets_org_idx
  on public.maintenance_tickets (organization_id, status);

drop trigger if exists maintenance_tickets_set_updated_at on public.maintenance_tickets;
create trigger maintenance_tickets_set_updated_at
  before update on public.maintenance_tickets
  for each row execute function public.set_updated_at();

alter table public.maintenance_tickets enable row level security;

drop policy if exists "maintenance_tickets_member_all" on public.maintenance_tickets;
create policy "maintenance_tickets_member_all"
  on public.maintenance_tickets for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.maintenance_tickets to authenticated;

-- Extender cleaning_tasks con hk_status si no existe
alter table public.cleaning_tasks
  add column if not exists hk_status text not null default 'dirty'
    check (hk_status in ('dirty', 'clean', 'inspected', 'in_progress', 'out_of_service'));
