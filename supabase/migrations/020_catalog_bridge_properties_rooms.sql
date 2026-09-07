-- =============================================================================
-- 020_catalog_bridge_properties_rooms.sql
-- -----------------------------------------------------------------------------
-- Fase 2 — Catálogo: puente bidireccional PMS `properties` ↔ `rooms`.
--   * properties.room_id → rooms (canónico)
--   * backfill rooms.legacy_property_id + properties.room_id
--   * vista v_catalog_rooms (admin / reporting)
-- No renombra ni borra `properties` (PMS sigue usándolas hasta fases PMS).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Reverse bridge: properties.room_id
-- ---------------------------------------------------------------------------
alter table public.properties
  add column if not exists room_id uuid
    references public.rooms (id) on delete set null;

create unique index if not exists properties_room_id_uidx
  on public.properties (room_id)
  where room_id is not null;

create index if not exists properties_room_id_idx
  on public.properties (room_id);

comment on column public.properties.room_id is
  'Fase 2: unidad canónica en public.rooms. Dual-read con rooms.legacy_property_id.';

-- ---------------------------------------------------------------------------
-- Backfill rooms.legacy_property_id (por nombre / número de loft)
-- ---------------------------------------------------------------------------
update public.rooms r
set
  legacy_property_id = lp.id,
  updated_at = now()
from lateral (
  select p.id
  from public.properties p
  where p.organization_id = r.organization_id
    and (
      p.name = r.name
      or (
        r.unit_number is not null
        and p.name = 'Loft ' || r.unit_number::text
      )
      or (
        r.unit_number = 4
        and p.name ilike 'Loft 4%'
      )
    )
  order by p.created_at
  limit 1
) lp
where r.legacy_property_id is null
  and lp.id is not null;

-- ---------------------------------------------------------------------------
-- Backfill properties.room_id desde rooms.legacy_property_id
-- ---------------------------------------------------------------------------
update public.properties p
set room_id = r.id
from public.rooms r
where r.legacy_property_id = p.id
  and (p.room_id is distinct from r.id);

-- ---------------------------------------------------------------------------
-- Vista de catálogo (org property + room type + room + bridge PMS)
-- ---------------------------------------------------------------------------
create or replace view public.v_catalog_rooms
with (security_invoker = true)
as
select
  r.id as room_id,
  r.organization_id,
  r.property_id as org_property_id,
  op.name as org_property_name,
  op.slug as org_property_slug,
  r.room_type_id,
  rt.code as room_type_code,
  rt.name as room_type_name,
  rt.marketing_category,
  rt.short_label as room_type_short_label,
  r.code as room_code,
  r.unit_number,
  r.name as room_name,
  r.max_guests,
  r.status as room_status,
  r.legacy_property_id,
  p.name as legacy_property_name,
  p.ical_token as legacy_ical_token,
  r.created_at,
  r.updated_at
from public.rooms r
join public.org_properties op on op.id = r.property_id
left join public.room_types rt on rt.id = r.room_type_id
left join public.properties p on p.id = r.legacy_property_id;

comment on view public.v_catalog_rooms is
  'Fase 2: catálogo unificado rooms + room_types + bridge PMS properties.';

grant select on public.v_catalog_rooms to authenticated;
