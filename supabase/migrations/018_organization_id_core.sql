-- =============================================================================
-- 018_organization_id_core.sql
-- -----------------------------------------------------------------------------
-- Fase 1: añade organization_id a tablas operativas core + RLS por tenant.
-- Seed org: 11111111-1111-4111-8111-111111111111 (LOFTHOUSE).
-- Requiere 017_organizations_multitenant.sql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: backfill + NOT NULL + index + replace staff-wide policy
-- ---------------------------------------------------------------------------

-- properties (unidades PMS legacy; siguen siendo lofts hasta Fase 2)
alter table public.properties
  add column if not exists organization_id uuid
    references public.organizations (id) on delete restrict;

update public.properties
set organization_id = '11111111-1111-4111-8111-111111111111'::uuid
where organization_id is null;

alter table public.properties
  alter column organization_id set not null;

create index if not exists properties_organization_idx
  on public.properties (organization_id);

drop policy if exists "properties_staff_all" on public.properties;
create policy "properties_org_member_all"
  on public.properties for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- reservations
alter table public.reservations
  add column if not exists organization_id uuid
    references public.organizations (id) on delete restrict;

update public.reservations r
set organization_id = p.organization_id
from public.properties p
where r.property_id = p.id
  and r.organization_id is null;

update public.reservations
set organization_id = '11111111-1111-4111-8111-111111111111'::uuid
where organization_id is null;

alter table public.reservations
  alter column organization_id set not null;

create index if not exists reservations_organization_idx
  on public.reservations (organization_id);

drop policy if exists "reservations_staff_all" on public.reservations;
create policy "reservations_org_member_all"
  on public.reservations for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- availability_blocks
alter table public.availability_blocks
  add column if not exists organization_id uuid
    references public.organizations (id) on delete restrict;

update public.availability_blocks b
set organization_id = p.organization_id
from public.properties p
where b.property_id = p.id
  and b.organization_id is null;

update public.availability_blocks
set organization_id = '11111111-1111-4111-8111-111111111111'::uuid
where organization_id is null;

alter table public.availability_blocks
  alter column organization_id set not null;

create index if not exists availability_blocks_organization_idx
  on public.availability_blocks (organization_id);

drop policy if exists "availability_blocks_staff_all" on public.availability_blocks;
create policy "availability_blocks_org_member_all"
  on public.availability_blocks for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- ical_sources
alter table public.ical_sources
  add column if not exists organization_id uuid
    references public.organizations (id) on delete restrict;

update public.ical_sources s
set organization_id = p.organization_id
from public.properties p
where s.property_id = p.id
  and s.organization_id is null;

update public.ical_sources
set organization_id = '11111111-1111-4111-8111-111111111111'::uuid
where organization_id is null;

alter table public.ical_sources
  alter column organization_id set not null;

create index if not exists ical_sources_organization_idx
  on public.ical_sources (organization_id);

drop policy if exists "ical_sources_staff_all" on public.ical_sources;
create policy "ical_sources_org_member_all"
  on public.ical_sources for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- cleaning_tasks
alter table public.cleaning_tasks
  add column if not exists organization_id uuid
    references public.organizations (id) on delete restrict;

update public.cleaning_tasks t
set organization_id = p.organization_id
from public.properties p
where t.property_id = p.id
  and t.organization_id is null;

update public.cleaning_tasks
set organization_id = '11111111-1111-4111-8111-111111111111'::uuid
where organization_id is null;

alter table public.cleaning_tasks
  alter column organization_id set not null;

create index if not exists cleaning_tasks_organization_idx
  on public.cleaning_tasks (organization_id);

drop policy if exists "cleaning_tasks_select" on public.cleaning_tasks;
drop policy if exists "cleaning_tasks_insert" on public.cleaning_tasks;
drop policy if exists "cleaning_tasks_update" on public.cleaning_tasks;
drop policy if exists "cleaning_tasks_delete" on public.cleaning_tasks;
drop policy if exists "cleaning_tasks_org_member_all" on public.cleaning_tasks;

create policy "cleaning_tasks_org_member_all"
  on public.cleaning_tasks for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- notifications (scope por org; el dueño sigue siendo user_id)
alter table public.notifications
  add column if not exists organization_id uuid
    references public.organizations (id) on delete restrict;

update public.notifications
set organization_id = '11111111-1111-4111-8111-111111111111'::uuid
where organization_id is null;

alter table public.notifications
  alter column organization_id set not null;

create index if not exists notifications_organization_idx
  on public.notifications (organization_id);

drop policy if exists "notifications_own_select" on public.notifications;
create policy "notifications_own_select"
  on public.notifications for select
  to authenticated
  using (
    user_id = auth.uid()
    and public.is_org_member(organization_id)
  );

drop policy if exists "notifications_own_update" on public.notifications;
create policy "notifications_own_update"
  on public.notifications for update
  to authenticated
  using (
    user_id = auth.uid()
    and public.is_org_member(organization_id)
  )
  with check (
    user_id = auth.uid()
    and public.is_org_member(organization_id)
  );

-- expenses
alter table public.expenses
  add column if not exists organization_id uuid
    references public.organizations (id) on delete restrict;

update public.expenses
set organization_id = '11111111-1111-4111-8111-111111111111'::uuid
where organization_id is null;

alter table public.expenses
  alter column organization_id set not null;

create index if not exists expenses_organization_idx
  on public.expenses (organization_id);

drop policy if exists "expenses_staff_all" on public.expenses;
create policy "expenses_org_member_all"
  on public.expenses for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- cotizaciones
alter table public.cotizaciones
  add column if not exists organization_id uuid
    references public.organizations (id) on delete restrict;

update public.cotizaciones
set organization_id = '11111111-1111-4111-8111-111111111111'::uuid
where organization_id is null;

alter table public.cotizaciones
  alter column organization_id set not null;

create index if not exists cotizaciones_organization_idx
  on public.cotizaciones (organization_id);

drop policy if exists "cotizaciones_staff_select" on public.cotizaciones;
drop policy if exists "cotizaciones_staff_insert" on public.cotizaciones;
drop policy if exists "cotizaciones_staff_update" on public.cotizaciones;

create policy "cotizaciones_org_select"
  on public.cotizaciones for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "cotizaciones_org_insert"
  on public.cotizaciones for insert
  to authenticated
  with check (
    public.is_org_member(organization_id)
    and created_by = auth.uid()
  );

create policy "cotizaciones_org_update"
  on public.cotizaciones for update
  to authenticated
  using (public.is_org_member(organization_id));

-- inventario_items
alter table public.inventario_items
  add column if not exists organization_id uuid
    references public.organizations (id) on delete restrict;

update public.inventario_items
set organization_id = '11111111-1111-4111-8111-111111111111'::uuid
where organization_id is null;

alter table public.inventario_items
  alter column organization_id set not null;

create index if not exists inventario_items_organization_idx
  on public.inventario_items (organization_id);

drop policy if exists "inventario_staff_select" on public.inventario_items;
drop policy if exists "inventario_staff_insert" on public.inventario_items;
drop policy if exists "inventario_staff_update" on public.inventario_items;

create policy "inventario_items_org_select"
  on public.inventario_items for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "inventario_items_org_insert"
  on public.inventario_items for insert
  to authenticated
  with check (public.is_org_member(organization_id));

create policy "inventario_items_org_update"
  on public.inventario_items for update
  to authenticated
  using (public.is_org_member(organization_id));

-- inventario_revisiones
alter table public.inventario_revisiones
  add column if not exists organization_id uuid
    references public.organizations (id) on delete restrict;

update public.inventario_revisiones
set organization_id = '11111111-1111-4111-8111-111111111111'::uuid
where organization_id is null;

alter table public.inventario_revisiones
  alter column organization_id set not null;

create index if not exists inventario_revisiones_organization_idx
  on public.inventario_revisiones (organization_id);

drop policy if exists "inv_rev_staff_select" on public.inventario_revisiones;
drop policy if exists "inv_rev_staff_insert" on public.inventario_revisiones;
drop policy if exists "inv_rev_staff_update" on public.inventario_revisiones;

create policy "inv_rev_org_select"
  on public.inventario_revisiones for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "inv_rev_org_insert"
  on public.inventario_revisiones for insert
  to authenticated
  with check (public.is_org_member(organization_id));

create policy "inv_rev_org_update"
  on public.inventario_revisiones for update
  to authenticated
  using (public.is_org_member(organization_id));

-- guest_reviews (opcional org; escritura service role)
alter table public.guest_reviews
  add column if not exists organization_id uuid
    references public.organizations (id) on delete set null;

update public.guest_reviews
set organization_id = '11111111-1111-4111-8111-111111111111'::uuid
where organization_id is null;

create index if not exists guest_reviews_organization_idx
  on public.guest_reviews (organization_id);

-- ---------------------------------------------------------------------------
-- app_settings: scoped por (organization_id, key)
-- ---------------------------------------------------------------------------
alter table public.app_settings
  add column if not exists organization_id uuid
    references public.organizations (id) on delete cascade;

update public.app_settings
set organization_id = '11111111-1111-4111-8111-111111111111'::uuid
where organization_id is null;

alter table public.app_settings
  alter column organization_id set not null;

-- Sustituir PK solo-key por (organization_id, key)
alter table public.app_settings drop constraint if exists app_settings_pkey;
alter table public.app_settings
  add constraint app_settings_pkey primary key (organization_id, key);

create index if not exists app_settings_organization_idx
  on public.app_settings (organization_id);

drop policy if exists "app_settings_read_staff" on public.app_settings;
drop policy if exists "app_settings_write_supervisor" on public.app_settings;
drop policy if exists "app_settings_update_supervisor" on public.app_settings;
drop policy if exists "app_settings_supervisor" on public.app_settings;

create policy "app_settings_org_read"
  on public.app_settings for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "app_settings_org_insert"
  on public.app_settings for insert
  to authenticated
  with check (
    public.is_org_member(organization_id)
    and public.is_cleaning_supervisor()
  );

create policy "app_settings_org_update"
  on public.app_settings for update
  to authenticated
  using (
    public.is_org_member(organization_id)
    and public.is_cleaning_supervisor()
  )
  with check (
    public.is_org_member(organization_id)
    and public.is_cleaning_supervisor()
  );

comment on column public.properties.organization_id is
  'Tenant. Las filas actuales son unidades PMS (lofts); el edificio canónico está en org_properties (019).';

-- ---------------------------------------------------------------------------
-- Patch: regenerar cleaning_tasks con organization_id + settings scoped
-- ---------------------------------------------------------------------------
create or replace function public.regenerate_cleaning_tasks_for_reservation(
  p_reservation_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  pricing jsonb;
  base_c numeric;
  th int;
  extra_c numeric;
  price numeric;
  g int;
  prep_notes text;
begin
  delete from public.cleaning_tasks
  where reservation_id = p_reservation_id;

  select * into r
  from public.reservations
  where id = p_reservation_id;

  if not found then
    return;
  end if;

  if r.status is distinct from 'confirmed' then
    return;
  end if;

  select value into pricing
  from public.app_settings
  where key = 'cleaning_pricing'
    and organization_id = r.organization_id;

  if pricing is null then
    select value into pricing
    from public.app_settings
    where key = 'cleaning_pricing'
    limit 1;
  end if;

  base_c := coalesce((pricing ->> 'base_cop')::numeric, 50000);
  th := coalesce((pricing ->> 'guest_threshold')::int, 4);
  extra_c := coalesce((pricing ->> 'extra_per_guest_cop')::numeric, 10000);
  g := r.guests;
  price := base_c + case
    when g > th then (g - th) * extra_c
    else 0::numeric
  end;

  prep_notes := case
    when coalesce(trim(r.notes), '') <> '' then
      'Camas / preparación: ' || trim(r.notes)
    else
      'Preparación estándar; revisar camas según ' || g::text || ' huéspedes.'
  end;

  insert into public.cleaning_tasks (
    organization_id,
    property_id,
    reservation_id,
    task_date,
    type,
    status,
    guests,
    source,
    guest_name,
    check_in,
    check_out,
    notes,
    bed_setup_notes,
    cleaning_price,
    estimated_time_label
  )
  values (
    r.organization_id,
    r.property_id,
    r.id,
    r.check_in,
    'preparation',
    'pending',
    r.guests,
    coalesce(r.source, ''),
    coalesce(r.guest_name, ''),
    r.check_in,
    r.check_out,
    coalesce(r.notes, ''),
    prep_notes,
    price,
    'Check-in · entrada típica 15:00'
  );

  insert into public.cleaning_tasks (
    organization_id,
    property_id,
    reservation_id,
    task_date,
    type,
    status,
    guests,
    source,
    guest_name,
    check_in,
    check_out,
    notes,
    bed_setup_notes,
    cleaning_price,
    estimated_time_label
  )
  values (
    r.organization_id,
    r.property_id,
    r.id,
    r.check_out,
    'cleaning',
    'pending',
    r.guests,
    coalesce(r.source, ''),
    coalesce(r.guest_name, ''),
    r.check_in,
    r.check_out,
    coalesce(r.notes, ''),
    '',
    price,
    'Check-out · salida típica 11:00'
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Patch: handle_new_user notifica con organization_id (seed LOFTHOUSE)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := '11111111-1111-4111-8111-111111111111'::uuid;
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

  begin
    insert into public.notifications (organization_id, user_id, title, message)
    select
      v_org,
      p.id,
      'Nueva solicitud de acceso al panel',
      format(
        E'%s · %s\n\nAbre «Usuarios» y filtra por «Pendientes» para aprobar.',
        coalesce(new.email, '(sin correo)'),
        coalesce(
          nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
          '(sin nombre)'
        )
      )
    from public.profiles p
    where p.role in ('super_admin'::public.app_role, 'admin'::public.app_role)
      and p.status = 'active';
  exception
    when others then
      null;
  end;

  return new;
end;
$$;
