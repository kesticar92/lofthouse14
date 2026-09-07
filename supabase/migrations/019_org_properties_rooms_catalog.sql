-- =============================================================================
-- 019_org_properties_rooms_catalog.sql
-- -----------------------------------------------------------------------------
-- Fase 1 foundation: Property (edificio) + RoomType + Room.
--   * org_properties  → entidad SaaS "Property" (evita choque con properties PMS)
--   * room_types      → Vista / Atrio / Cielo (marketing_category)
--   * rooms           → LOFT 01–14 (+ bodega 04) con link legacy_property_id
-- Seed: Property LOFTHOUSE 14 bajo org LOFTHOUSE.
-- Fase 2 migrará/renombrará properties PMS → rooms de forma definitiva.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- org_properties (edificio / hotel)
-- ---------------------------------------------------------------------------
create table if not exists public.org_properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  name text not null,
  slug text not null,
  timezone text not null default 'America/Bogota',
  address text not null default '',
  city text not null default 'Cali',
  country text not null default 'CO',
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint org_properties_org_slug_unique unique (organization_id, slug),
  constraint org_properties_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  )
);

create index if not exists org_properties_organization_idx
  on public.org_properties (organization_id);

drop trigger if exists org_properties_set_updated_at on public.org_properties;
create trigger org_properties_set_updated_at
  before update on public.org_properties
  for each row execute function public.set_updated_at();

alter table public.org_properties enable row level security;

drop policy if exists "org_properties_member_all" on public.org_properties;
create policy "org_properties_member_all"
  on public.org_properties for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.org_properties to authenticated;

-- ---------------------------------------------------------------------------
-- room_types
-- ---------------------------------------------------------------------------
create table if not exists public.room_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  property_id uuid not null
    references public.org_properties (id) on delete cascade,
  code text not null,
  name text not null,
  marketing_category text not null
    check (marketing_category in ('vista', 'atrio', 'cielo')),
  short_label text not null default '',
  tagline text not null default '',
  max_guests int not null default 5 check (max_guests > 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint room_types_property_code_unique unique (property_id, code)
);

create index if not exists room_types_organization_idx
  on public.room_types (organization_id);

create index if not exists room_types_property_idx
  on public.room_types (property_id);

drop trigger if exists room_types_set_updated_at on public.room_types;
create trigger room_types_set_updated_at
  before update on public.room_types
  for each row execute function public.set_updated_at();

alter table public.room_types enable row level security;

drop policy if exists "room_types_member_all" on public.room_types;
create policy "room_types_member_all"
  on public.room_types for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.room_types to authenticated;

-- ---------------------------------------------------------------------------
-- rooms (unidades físicas canónicas)
-- ---------------------------------------------------------------------------
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  property_id uuid not null
    references public.org_properties (id) on delete cascade,
  room_type_id uuid
    references public.room_types (id) on delete set null,
  code text not null,
  unit_number int,
  name text not null,
  max_guests int not null default 5 check (max_guests > 0),
  status text not null default 'active'
    check (status in ('active', 'inactive', 'maintenance', 'storage')),
  -- Bridge hacia public.properties (PMS loft) hasta Fase 2
  legacy_property_id uuid
    references public.properties (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rooms_property_code_unique unique (property_id, code)
);

create index if not exists rooms_organization_idx
  on public.rooms (organization_id);

create index if not exists rooms_property_idx
  on public.rooms (property_id);

create index if not exists rooms_room_type_idx
  on public.rooms (room_type_id);

create unique index if not exists rooms_legacy_property_uidx
  on public.rooms (legacy_property_id)
  where legacy_property_id is not null;

drop trigger if exists rooms_set_updated_at on public.rooms;
create trigger rooms_set_updated_at
  before update on public.rooms
  for each row execute function public.set_updated_at();

alter table public.rooms enable row level security;

drop policy if exists "rooms_member_all" on public.rooms;
create policy "rooms_member_all"
  on public.rooms for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update, delete on public.rooms to authenticated;

-- ---------------------------------------------------------------------------
-- Seed: Property LOFTHOUSE 14
-- ---------------------------------------------------------------------------
insert into public.org_properties (
  id,
  organization_id,
  name,
  slug,
  timezone,
  address,
  city,
  country,
  status
)
values (
  '22222222-2222-4222-8222-222222222222'::uuid,
  '11111111-1111-4111-8111-111111111111'::uuid,
  'LOFTHOUSE 14',
  'lofthouse-14',
  'America/Bogota',
  'Miraflores, Cali',
  'Cali',
  'CO',
  'active'
)
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  updated_at = now();

-- Room types → Vista / Atrio / Cielo
insert into public.room_types (
  id,
  organization_id,
  property_id,
  code,
  name,
  marketing_category,
  short_label,
  tagline,
  max_guests,
  sort_order
)
values
  (
    '33333333-3333-4333-8333-333333333301'::uuid,
    '11111111-1111-4111-8111-111111111111'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid,
    'vista',
    'Loft Vista',
    'vista',
    'Vista',
    'Ventana exterior · luz de barrio',
    5,
    1
  ),
  (
    '33333333-3333-4333-8333-333333333302'::uuid,
    '11111111-1111-4111-8111-111111111111'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid,
    'atrio',
    'Loft Atrio',
    'atrio',
    'Atrio',
    'Ventana interior · patio del conjunto',
    5,
    2
  ),
  (
    '33333333-3333-4333-8333-333333333303'::uuid,
    '11111111-1111-4111-8111-111111111111'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid,
    'cielo',
    'Loft Cielo',
    'cielo',
    'Cielo',
    'Loft cerrado · intimidad total',
    5,
    3
  )
on conflict (id) do update
set
  name = excluded.name,
  marketing_category = excluded.marketing_category,
  short_label = excluded.short_label,
  tagline = excluded.tagline,
  updated_at = now();

-- Rooms LOFT 01–14 (04 = bodega / storage)
with room_seed (
  unit_number,
  code,
  name,
  marketing_category,
  max_guests,
  status
) as (
  values
    (1,  'LOFT 01', 'Loft 1',  'vista', 5, 'active'),
    (2,  'LOFT 02', 'Loft 2',  'cielo', 5, 'active'),
    (3,  'LOFT 03', 'Loft 3',  'cielo', 5, 'active'),
    (4,  'LOFT 04', 'Loft 4 — Bodega', null::text, 0, 'storage'),
    (5,  'LOFT 05', 'Loft 5',  'atrio', 3, 'active'),
    (6,  'LOFT 06', 'Loft 6',  'cielo', 5, 'active'),
    (7,  'LOFT 07', 'Loft 7',  'atrio', 5, 'active'),
    (8,  'LOFT 08', 'Loft 8',  'atrio', 5, 'active'),
    (9,  'LOFT 09', 'Loft 9',  'cielo', 5, 'active'),
    (10, 'LOFT 10', 'Loft 10', 'cielo', 5, 'active'),
    (11, 'LOFT 11', 'Loft 11', 'cielo', 5, 'active'),
    (12, 'LOFT 12', 'Loft 12', 'cielo', 5, 'active'),
    (13, 'LOFT 13', 'Loft 13', 'cielo', 5, 'active'),
    (14, 'LOFT 14', 'Loft 14', 'vista', 5, 'active')
)
insert into public.rooms (
  organization_id,
  property_id,
  room_type_id,
  code,
  unit_number,
  name,
  max_guests,
  status,
  legacy_property_id
)
select
  '11111111-1111-4111-8111-111111111111'::uuid,
  '22222222-2222-4222-8222-222222222222'::uuid,
  rt.id,
  s.code,
  s.unit_number,
  s.name,
  case when s.status = 'storage' then 1 else s.max_guests end,
  s.status,
  lp.id
from room_seed s
left join public.room_types rt
  on rt.property_id = '22222222-2222-4222-8222-222222222222'::uuid
 and rt.marketing_category = s.marketing_category
left join lateral (
  select p.id
  from public.properties p
  where p.organization_id = '11111111-1111-4111-8111-111111111111'::uuid
    and (
      p.name = s.name
      or p.name = 'Loft ' || s.unit_number::text
      or (
        s.unit_number = 4
        and p.name ilike 'Loft 4%'
      )
    )
  order by p.created_at
  limit 1
) lp on true
on conflict (property_id, code) do update
set
  name = excluded.name,
  room_type_id = excluded.room_type_id,
  max_guests = excluded.max_guests,
  status = excluded.status,
  legacy_property_id = coalesce(
    excluded.legacy_property_id,
    public.rooms.legacy_property_id
  ),
  updated_at = now();

-- Asegurar que el listing "casa completa" y filas PMS tienen organization_id
-- (ya NOT NULL tras 018); sin acción extra.

comment on table public.org_properties is
  'Property SaaS (edificio/hotel). Seed: LOFTHOUSE 14. '
  'No confundir con public.properties (unidades PMS legacy).';
comment on table public.room_types is
  'Tipos de habitación mapeables a marketing Vista/Atrio/Cielo.';
comment on table public.rooms is
  'Unidades físicas LOFT 01–14. legacy_property_id → properties PMS.';
