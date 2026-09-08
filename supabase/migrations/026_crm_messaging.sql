-- =============================================================================
-- 026_crm_messaging.sql — Fase 9: CRM + templates + automations stubs
-- =============================================================================

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text not null default '',
  notes text not null default '',
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guests_org_idx on public.guests (organization_id);
create index if not exists guests_email_idx on public.guests (organization_id, email)
  where email <> '';
create index if not exists guests_phone_idx on public.guests (organization_id, phone)
  where phone <> '';

drop trigger if exists guests_set_updated_at on public.guests;
create trigger guests_set_updated_at
  before update on public.guests
  for each row execute function public.set_updated_at();

alter table public.guests enable row level security;

drop policy if exists "guests_member_all" on public.guests;
create policy "guests_member_all"
  on public.guests for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.guests to authenticated;

-- FK reservations.guest_id ahora que existe guests
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reservations_guest_id_fkey'
  ) then
    alter table public.reservations
      add constraint reservations_guest_id_fkey
      foreign key (guest_id) references public.guests (id) on delete set null;
  end if;
end $$;

create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  code text not null,
  channel text not null default 'whatsapp'
    check (channel in ('whatsapp', 'email', 'sms', 'push')),
  name text not null,
  subject text not null default '',
  body text not null,
  variables text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint message_templates_org_code_unique unique (organization_id, code)
);

drop trigger if exists message_templates_set_updated_at on public.message_templates;
create trigger message_templates_set_updated_at
  before update on public.message_templates
  for each row execute function public.set_updated_at();

alter table public.message_templates enable row level security;

drop policy if exists "message_templates_member_all" on public.message_templates;
create policy "message_templates_member_all"
  on public.message_templates for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.message_templates to authenticated;

create table if not exists public.automation_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'stub'
    check (status in ('stub', 'queued', 'sent', 'failed', 'skipped')),
  message text not null default 'TODO: REAL INTEGRATION REQUIRED',
  created_at timestamptz not null default now()
);

create index if not exists automation_events_org_idx
  on public.automation_events (organization_id, created_at desc);

alter table public.automation_events enable row level security;

drop policy if exists "automation_events_member_select" on public.automation_events;
create policy "automation_events_member_select"
  on public.automation_events for select
  to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists "automation_events_member_insert" on public.automation_events;
create policy "automation_events_member_insert"
  on public.automation_events for insert
  to authenticated
  with check (public.is_org_member(organization_id));

grant select, insert on public.automation_events to authenticated;

-- Seed templates
insert into public.message_templates (
  organization_id, code, channel, name, subject, body, variables
) values
(
  '11111111-1111-4111-8111-111111111111'::uuid,
  'booking_confirmation',
  'whatsapp',
  'Confirmación de reserva',
  '',
  'Hola {{guest_name}}, tu reserva {{reservation_code}} en LOFTHOUSE 14 está confirmada: {{check_in}} → {{check_out}}. Total estimado: {{total}}.',
  array['guest_name','reservation_code','check_in','check_out','total']
),
(
  '11111111-1111-4111-8111-111111111111'::uuid,
  'pre_arrival',
  'whatsapp',
  'Pre-llegada',
  '',
  'Hola {{guest_name}}, te esperamos mañana ({{check_in}}). Código: {{reservation_code}}.',
  array['guest_name','check_in','reservation_code']
)
on conflict (organization_id, code) do nothing;
