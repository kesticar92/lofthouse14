-- =============================================================================
-- 021_availability_holds.sql — Fase 3: disponibilidad unificada
-- Holds cortos + out_of_service en rooms + reason tipado en blocks
-- =============================================================================

-- rooms: permitir out_of_service (bloquea inventory)
alter table public.rooms drop constraint if exists rooms_status_check;
alter table public.rooms
  add constraint rooms_status_check
  check (status in ('active', 'inactive', 'maintenance', 'storage', 'out_of_service'));

-- availability_blocks: tipificar motivo operativo
alter table public.availability_blocks
  add column if not exists block_type text not null default 'manual'
    check (block_type in ('manual', 'maintenance', 'out_of_service', 'owner', 'other'));

alter table public.availability_blocks
  add column if not exists organization_id uuid
    references public.organizations (id) on delete cascade;

create index if not exists availability_blocks_org_idx
  on public.availability_blocks (organization_id);

-- Holds temporales (wizard / booking engine)
create table if not exists public.availability_holds (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  property_id uuid not null
    references public.properties (id) on delete cascade,
  room_id uuid references public.rooms (id) on delete set null,
  room_type_id uuid references public.room_types (id) on delete set null,
  check_in date not null,
  check_out date not null,
  guests int not null default 1 check (guests > 0),
  session_key text not null default '',
  expires_at timestamptz not null,
  status text not null default 'active'
    check (status in ('active', 'consumed', 'expired', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint availability_holds_dates_ok check (check_out > check_in)
);

create index if not exists availability_holds_property_dates_idx
  on public.availability_holds (property_id, check_in, check_out)
  where status = 'active';

create index if not exists availability_holds_expires_idx
  on public.availability_holds (expires_at)
  where status = 'active';

create index if not exists availability_holds_org_idx
  on public.availability_holds (organization_id);

alter table public.availability_holds enable row level security;

drop policy if exists "availability_holds_member_all" on public.availability_holds;
create policy "availability_holds_member_all"
  on public.availability_holds for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- Lectura pública vía service role / API; anon no escribe holds directos
grant select, insert, update, delete on public.availability_holds to authenticated;
grant select, insert, update on public.availability_holds to service_role;

comment on table public.availability_holds is
  'Holds cortos de inventario (Fase 3). Expiran; no sustituyen reservations.';
