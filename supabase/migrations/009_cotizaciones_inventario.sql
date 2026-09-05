-- Migration 009: tablas para cotizaciones e inventario (migrar desde localStorage)

-- Cotizaciones
create table if not exists public.cotizaciones (
  id bigint generated always as identity primary key,
  created_by uuid references auth.users (id) on delete set null,
  guest_name text not null default '',
  check_in date not null,
  check_out date not null,
  guests integer not null default 1,
  loft_id text not null default '',
  price_per_night numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text not null default '',
  status text not null default 'draft' check (status in ('draft', 'sent', 'confirmed', 'cancelled')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cotizaciones_created_by_idx on public.cotizaciones (created_by);
create index if not exists cotizaciones_created_at_idx on public.cotizaciones (created_at desc);
create index if not exists cotizaciones_status_idx on public.cotizaciones (status);

alter table public.cotizaciones enable row level security;

-- Staff activo puede ver y crear cotizaciones
drop policy if exists "cotizaciones_staff_select" on public.cotizaciones;
create policy "cotizaciones_staff_select"
  on public.cotizaciones for select
  using (public.is_active_staff());

drop policy if exists "cotizaciones_staff_insert" on public.cotizaciones;
create policy "cotizaciones_staff_insert"
  on public.cotizaciones for insert
  with check (public.is_active_staff() and created_by = auth.uid());

drop policy if exists "cotizaciones_staff_update" on public.cotizaciones;
create policy "cotizaciones_staff_update"
  on public.cotizaciones for update
  using (public.is_active_staff());

drop policy if exists "cotizaciones_super_delete" on public.cotizaciones;
create policy "cotizaciones_super_delete"
  on public.cotizaciones for delete
  using (public.is_super_admin());

grant select, insert, update on public.cotizaciones to authenticated;

-- Inventario (items por loft)
create table if not exists public.inventario_items (
  id bigint generated always as identity primary key,
  loft_id text not null,
  nombre text not null,
  cantidad integer not null default 1,
  estado text not null default 'ok' check (estado in ('ok', 'dañado', 'falta', 'por_reponer')),
  notas text not null default '',
  ultima_revision_por uuid references auth.users (id) on delete set null,
  ultima_revision_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inventario_loft_idx on public.inventario_items (loft_id);

alter table public.inventario_items enable row level security;

drop policy if exists "inventario_staff_select" on public.inventario_items;
create policy "inventario_staff_select"
  on public.inventario_items for select
  using (public.is_active_staff());

drop policy if exists "inventario_staff_insert" on public.inventario_items;
create policy "inventario_staff_insert"
  on public.inventario_items for insert
  with check (public.is_active_staff());

drop policy if exists "inventario_staff_update" on public.inventario_items;
create policy "inventario_staff_update"
  on public.inventario_items for update
  using (public.is_active_staff());

drop policy if exists "inventario_super_delete" on public.inventario_items;
create policy "inventario_super_delete"
  on public.inventario_items for delete
  using (public.is_super_admin());

grant select, insert, update on public.inventario_items to authenticated;
