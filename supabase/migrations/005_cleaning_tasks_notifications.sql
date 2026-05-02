-- Tareas operativas (limpieza / preparación), notificaciones panel, tarifas aseo.
-- Requiere 001 (profiles, app_role) y 003 PMS (properties, reservations).

-- ---------------------------------------------------------------------------
-- Política: admin y super_admin pueden listar perfiles (asignación de tareas).
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_admin_directory" on public.profiles;
create policy "profiles_admin_directory"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles me
      where me.id = auth.uid()
        and me.role in ('admin'::public.app_role, 'super_admin'::public.app_role)
    )
  );

-- ---------------------------------------------------------------------------
-- Supervisor limpieza (admin / super_admin) — antes de políticas que lo usan.
-- ---------------------------------------------------------------------------
create or replace function public.is_cleaning_supervisor()
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
      and p.role in ('super_admin'::public.app_role, 'admin'::public.app_role)
  );
$$;

grant execute on function public.is_cleaning_supervisor() to authenticated;

-- ---------------------------------------------------------------------------
-- app_settings (precios aseo por defecto)
-- ---------------------------------------------------------------------------
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values (
  'cleaning_pricing',
  '{"base_cop": 50000, "guest_threshold": 4, "extra_per_guest_cop": 10000}'::jsonb
)
on conflict (key) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_supervisor" on public.app_settings;
drop policy if exists "app_settings_read_staff" on public.app_settings;
drop policy if exists "app_settings_write_supervisor" on public.app_settings;

create policy "app_settings_read_staff"
  on public.app_settings for select
  to authenticated
  using (public.is_staff_user());

create policy "app_settings_write_supervisor"
  on public.app_settings for insert
  to authenticated
  with check (public.is_cleaning_supervisor());

create policy "app_settings_update_supervisor"
  on public.app_settings for update
  to authenticated
  using (public.is_cleaning_supervisor())
  with check (public.is_cleaning_supervisor());

grant select, insert, update on public.app_settings to authenticated;

-- ---------------------------------------------------------------------------
-- cleaning_tasks
-- ---------------------------------------------------------------------------
create table if not exists public.cleaning_tasks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  reservation_id uuid references public.reservations (id) on delete cascade,
  task_date date not null,
  type text not null,
  status text not null default 'pending',
  assigned_to uuid references public.profiles (id) on delete set null,
  guests int not null default 1,
  source text not null default '',
  guest_name text not null default '',
  check_in date,
  check_out date,
  notes text not null default '',
  bed_setup_notes text not null default '',
  cleaning_price numeric(12, 2),
  estimated_time_label text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cleaning_tasks_type_ok check (
    type in ('cleaning', 'preparation', 'manual')
  ),
  constraint cleaning_tasks_status_ok check (
    status in ('pending', 'in_progress', 'done')
  ),
  constraint cleaning_tasks_guests_ok check (guests > 0)
);

create unique index if not exists cleaning_tasks_reservation_day_type_uidx
  on public.cleaning_tasks (reservation_id, task_date, type)
  where reservation_id is not null;

create index if not exists cleaning_tasks_task_date_idx
  on public.cleaning_tasks (task_date);

create index if not exists cleaning_tasks_prop_date_idx
  on public.cleaning_tasks (property_id, task_date);

create index if not exists cleaning_tasks_assigned_idx
  on public.cleaning_tasks (assigned_to)
  where assigned_to is not null;

drop trigger if exists cleaning_tasks_set_updated_at on public.cleaning_tasks;
create trigger cleaning_tasks_set_updated_at
  before update on public.cleaning_tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- notifications (panel)
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where read = false;

alter table public.notifications enable row level security;

drop policy if exists "notifications_own_select" on public.notifications;
create policy "notifications_own_select"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications_own_update" on public.notifications;
create policy "notifications_own_update"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Inserción vía service role (API servidor) o función definida más abajo.

-- ---------------------------------------------------------------------------
-- Regenerar tareas derivadas de una reserva (sin duplicados; borra y recrea).
-- ---------------------------------------------------------------------------
create or replace function public.regenerate_cleaning_tasks_for_reservation(p_reservation_id uuid)
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
  where key = 'cleaning_pricing';

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

grant execute on function public.regenerate_cleaning_tasks_for_reservation(uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Limpieza global (cron): quita huérfanas / no confirmadas y regenera.
-- ---------------------------------------------------------------------------
create or replace function public.regenerate_all_cleaning_tasks()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  delete from public.cleaning_tasks
  where reservation_id is not null
    and reservation_id in (
      select id
      from public.reservations
      where status is distinct from 'confirmed'
    );

  for rec in
    select id
    from public.reservations
    where status = 'confirmed'
  loop
    perform public.regenerate_cleaning_tasks_for_reservation(rec.id);
  end loop;
end;
$$;

grant execute on function public.regenerate_all_cleaning_tasks() to authenticated;
grant execute on function public.regenerate_cleaning_tasks_for_reservation(uuid)
  to service_role;
grant execute on function public.regenerate_all_cleaning_tasks() to service_role;

-- ---------------------------------------------------------------------------
-- RLS cleaning_tasks
-- ---------------------------------------------------------------------------
alter table public.cleaning_tasks enable row level security;

drop policy if exists "cleaning_tasks_select" on public.cleaning_tasks;
create policy "cleaning_tasks_select"
  on public.cleaning_tasks for select
  to authenticated
  using (
    public.is_cleaning_supervisor()
    or assigned_to = auth.uid()
  );

drop policy if exists "cleaning_tasks_insert" on public.cleaning_tasks;
create policy "cleaning_tasks_insert"
  on public.cleaning_tasks for insert
  to authenticated
  with check (
    public.is_staff_user()
    and type = 'manual'
    and reservation_id is null
  );

drop policy if exists "cleaning_tasks_update" on public.cleaning_tasks;
create policy "cleaning_tasks_update"
  on public.cleaning_tasks for update
  to authenticated
  using (
    public.is_cleaning_supervisor()
    or assigned_to = auth.uid()
  )
  with check (
    public.is_cleaning_supervisor()
    or assigned_to = auth.uid()
  );

drop policy if exists "cleaning_tasks_delete" on public.cleaning_tasks;
create policy "cleaning_tasks_delete"
  on public.cleaning_tasks for delete
  to authenticated
  using (public.is_cleaning_supervisor());

grant select, insert, update, delete on public.cleaning_tasks to authenticated;

-- Supervisor puede asignar: UPDATE asigna assigned_to — cubierto si es supervisor.

grant select, insert, update, delete on public.notifications to authenticated;
