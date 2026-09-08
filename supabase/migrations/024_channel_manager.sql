-- =============================================================================
-- 024_channel_manager.sql — Fase 7: channel manager arquitectura
-- =============================================================================

create table if not exists public.channel_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  property_id uuid
    references public.org_properties (id) on delete cascade,
  channel text not null
    check (channel in ('airbnb', 'booking', 'expedia', 'direct', 'ical')),
  status text not null default 'stub'
    check (status in ('stub', 'connected', 'error', 'disabled')),
  external_account_id text not null default '',
  config jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint channel_connections_org_channel_unique unique (organization_id, channel)
);

drop trigger if exists channel_connections_set_updated_at on public.channel_connections;
create trigger channel_connections_set_updated_at
  before update on public.channel_connections
  for each row execute function public.set_updated_at();

alter table public.channel_connections enable row level security;

drop policy if exists "channel_connections_member_all" on public.channel_connections;
create policy "channel_connections_member_all"
  on public.channel_connections for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.channel_connections to authenticated;

create table if not exists public.channel_sync_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  channel text not null,
  direction text not null default 'inbound'
    check (direction in ('inbound', 'outbound', 'bidirectional')),
  event_type text not null default 'sync',
  idempotency_key text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'simulated'
    check (status in ('simulated', 'accepted', 'rejected', 'error')),
  message text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists channel_sync_logs_org_idx
  on public.channel_sync_logs (organization_id, created_at desc);

create unique index if not exists channel_sync_logs_idempotency_uidx
  on public.channel_sync_logs (organization_id, channel, idempotency_key)
  where idempotency_key is not null and btrim(idempotency_key) <> '';

alter table public.channel_sync_logs enable row level security;

drop policy if exists "channel_sync_logs_member_select" on public.channel_sync_logs;
create policy "channel_sync_logs_member_select"
  on public.channel_sync_logs for select
  to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists "channel_sync_logs_member_insert" on public.channel_sync_logs;
create policy "channel_sync_logs_member_insert"
  on public.channel_sync_logs for insert
  to authenticated
  with check (public.is_org_member(organization_id));

grant select, insert on public.channel_sync_logs to authenticated;
grant select, insert on public.channel_sync_logs to service_role;

-- Seed stubs
insert into public.channel_connections (organization_id, property_id, channel, status)
values
  ('11111111-1111-4111-8111-111111111111'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 'airbnb', 'stub'),
  ('11111111-1111-4111-8111-111111111111'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 'booking', 'stub'),
  ('11111111-1111-4111-8111-111111111111'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 'expedia', 'stub'),
  ('11111111-1111-4111-8111-111111111111'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 'direct', 'connected')
on conflict (organization_id, channel) do nothing;

comment on table public.channel_connections is
  'TODO: REAL INTEGRATION REQUIRED — OTA APIs (Airbnb/Booking/Expedia).';
