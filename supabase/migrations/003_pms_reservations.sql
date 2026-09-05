-- PMS: propiedades, reservas, bloqueos, fuentes iCal (Airbnb lectura).
-- Requiere 001_profiles_audit.sql (app_role, profiles).

-- Staff del panel (evita recursión RLS; misma idea que is_super_admin).
create or replace function public.is_staff_user()
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
      and p.role in (
        'super_admin'::public.app_role,
        'admin'::public.app_role,
        'staff'::public.app_role
      )
  );
$$;

grant execute on function public.is_staff_user() to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------------
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ical_token text not null default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists properties_ical_token_uidx
  on public.properties (ical_token);

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

alter table public.properties enable row level security;

drop policy if exists "properties_staff_all" on public.properties;
create policy "properties_staff_all"
  on public.properties for all
  using (public.is_staff_user())
  with check (public.is_staff_user());

-- ---------------------------------------------------------------------------
-- reservations (check_out = día de salida exclusivo, al estilo iCal DATE)
-- ---------------------------------------------------------------------------
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  source text not null default 'manual',
  external_id text,
  guest_name text not null default '',
  guest_phone text not null default '',
  check_in date not null,
  check_out date not null,
  guests int not null default 1,
  price numeric(12, 2),
  status text not null default 'confirmed',
  notes text not null default '',
  ical_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reservations_dates_ok check (check_out > check_in),
  constraint reservations_guests_ok check (guests > 0),
  constraint reservations_status_ok check (
    status in ('confirmed', 'blocked', 'cancelled')
  )
);

create index if not exists reservations_property_dates_idx
  on public.reservations (property_id, check_in);

create index if not exists reservations_property_checkout_idx
  on public.reservations (property_id, check_out);

create unique index if not exists reservations_property_external_uidx
  on public.reservations (property_id, external_id)
  where external_id is not null and btrim(external_id) <> '';

drop trigger if exists reservations_set_updated_at on public.reservations;
create trigger reservations_set_updated_at
  before update on public.reservations
  for each row execute function public.set_updated_at();

alter table public.reservations enable row level security;

drop policy if exists "reservations_staff_all" on public.reservations;
create policy "reservations_staff_all"
  on public.reservations for all
  using (public.is_staff_user())
  with check (public.is_staff_user());

-- ---------------------------------------------------------------------------
-- availability_blocks (end_date exclusivo, coherente con reservas)
-- ---------------------------------------------------------------------------
create table if not exists public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text not null default '',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint availability_blocks_range_ok check (end_date > start_date)
);

create index if not exists availability_blocks_property_idx
  on public.availability_blocks (property_id, start_date);

alter table public.availability_blocks enable row level security;

drop policy if exists "availability_blocks_staff_all" on public.availability_blocks;
create policy "availability_blocks_staff_all"
  on public.availability_blocks for all
  using (public.is_staff_user())
  with check (public.is_staff_user());

-- ---------------------------------------------------------------------------
-- ical_sources
-- ---------------------------------------------------------------------------
create table if not exists public.ical_sources (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  url text not null,
  last_sync timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ical_sources_property_idx
  on public.ical_sources (property_id);

drop trigger if exists ical_sources_set_updated_at on public.ical_sources;
create trigger ical_sources_set_updated_at
  before update on public.ical_sources
  for each row execute function public.set_updated_at();

alter table public.ical_sources enable row level security;

drop policy if exists "ical_sources_staff_all" on public.ical_sources;
create policy "ical_sources_staff_all"
  on public.ical_sources for all
  using (public.is_staff_user())
  with check (public.is_staff_user());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.properties to authenticated;
grant select, insert, update, delete on public.reservations to authenticated;
grant select, insert, update, delete on public.availability_blocks to authenticated;
grant select, insert, update, delete on public.ical_sources to authenticated;

-- Semilla: una propiedad LOFTHOUSE 14 si la tabla está vacía.
insert into public.properties (name)
select 'LOFTHOUSE 14'
where not exists (select 1 from public.properties limit 1);
