-- =============================================================================
-- 012_inventario_revisiones.sql
-- -----------------------------------------------------------------------------
-- Modelo "revisión" para el módulo de Inventario:
--   * `inventario_revisiones`        — cabecera (loft, persona, fecha)
--   * `inventario_revision_items`    — detalle por ítem dentro de la revisión
--   * `inventario_revision_fotos`    — fotos de evidencia de un ítem
--
-- Las fotos se suben al bucket Storage `inventario-fotos` y la fila guarda
-- únicamente `storage_path`. RLS limita lectura/escritura a staff activo.
--
-- IMPORTANTE: este archivo NO toca la tabla `inventario_items` introducida
-- en 009 (no la usábamos). Si en el futuro se quiere mantener un
-- "catálogo maestro de items por loft" se puede llenar a partir de las
-- revisiones más recientes, pero queda fuera del alcance de esta migración.
-- =============================================================================

begin;

-- ------ Tabla cabecera ------------------------------------------------------
create table if not exists public.inventario_revisiones (
  id uuid primary key default gen_random_uuid(),
  loft_id text not null,
  persona text not null default '',
  fecha date not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inventario_revisiones_loft_idx
  on public.inventario_revisiones (loft_id);
create index if not exists inventario_revisiones_fecha_idx
  on public.inventario_revisiones (fecha desc);

alter table public.inventario_revisiones enable row level security;

drop policy if exists "inv_rev_staff_select" on public.inventario_revisiones;
create policy "inv_rev_staff_select"
  on public.inventario_revisiones for select
  using (public.is_active_staff());

drop policy if exists "inv_rev_staff_insert" on public.inventario_revisiones;
create policy "inv_rev_staff_insert"
  on public.inventario_revisiones for insert
  with check (public.is_active_staff());

drop policy if exists "inv_rev_staff_update" on public.inventario_revisiones;
create policy "inv_rev_staff_update"
  on public.inventario_revisiones for update
  using (public.is_active_staff());

drop policy if exists "inv_rev_super_delete" on public.inventario_revisiones;
create policy "inv_rev_super_delete"
  on public.inventario_revisiones for delete
  using (public.is_super_admin() or public.is_admin_or_super());

grant select, insert, update on public.inventario_revisiones to authenticated;

-- ------ Tabla detalle items -------------------------------------------------
create table if not exists public.inventario_revision_items (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references public.inventario_revisiones (id) on delete cascade,
  orden integer not null default 0,
  zona text not null,
  item text not null,
  estado text not null default 'OK',
  funciona text not null default 'Sí',
  detalles text not null default '',
  requiere_atencion boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists inventario_revision_items_rev_idx
  on public.inventario_revision_items (revision_id, orden);

alter table public.inventario_revision_items enable row level security;

drop policy if exists "inv_rev_items_staff_select" on public.inventario_revision_items;
create policy "inv_rev_items_staff_select"
  on public.inventario_revision_items for select
  using (public.is_active_staff());

drop policy if exists "inv_rev_items_staff_insert" on public.inventario_revision_items;
create policy "inv_rev_items_staff_insert"
  on public.inventario_revision_items for insert
  with check (public.is_active_staff());

drop policy if exists "inv_rev_items_staff_update" on public.inventario_revision_items;
create policy "inv_rev_items_staff_update"
  on public.inventario_revision_items for update
  using (public.is_active_staff());

drop policy if exists "inv_rev_items_staff_delete" on public.inventario_revision_items;
create policy "inv_rev_items_staff_delete"
  on public.inventario_revision_items for delete
  using (public.is_active_staff());

grant select, insert, update, delete on public.inventario_revision_items to authenticated;

-- ------ Tabla fotos de evidencia -------------------------------------------
create table if not exists public.inventario_revision_fotos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventario_revision_items (id) on delete cascade,
  storage_path text not null,
  caption text not null default '',
  file_size integer not null default 0,
  mime_type text not null default 'image/jpeg',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists inventario_revision_fotos_item_idx
  on public.inventario_revision_fotos (item_id);

alter table public.inventario_revision_fotos enable row level security;

drop policy if exists "inv_rev_fotos_staff_select" on public.inventario_revision_fotos;
create policy "inv_rev_fotos_staff_select"
  on public.inventario_revision_fotos for select
  using (public.is_active_staff());

drop policy if exists "inv_rev_fotos_staff_insert" on public.inventario_revision_fotos;
create policy "inv_rev_fotos_staff_insert"
  on public.inventario_revision_fotos for insert
  with check (public.is_active_staff());

drop policy if exists "inv_rev_fotos_staff_delete" on public.inventario_revision_fotos;
create policy "inv_rev_fotos_staff_delete"
  on public.inventario_revision_fotos for delete
  using (public.is_active_staff());

grant select, insert, delete on public.inventario_revision_fotos to authenticated;

-- ------ Bucket de Storage para las fotos -----------------------------------
-- Privado (no público). Los clientes acceden vía URLs firmadas generadas en
-- las APIs admin.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('inventario-fotos', 'inventario-fotos', false, 5 * 1024 * 1024,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Políticas Storage: solo staff activo puede leer/escribir/eliminar.
drop policy if exists "inv_fotos_staff_select" on storage.objects;
create policy "inv_fotos_staff_select"
  on storage.objects for select
  using (bucket_id = 'inventario-fotos' and public.is_active_staff());

drop policy if exists "inv_fotos_staff_insert" on storage.objects;
create policy "inv_fotos_staff_insert"
  on storage.objects for insert
  with check (bucket_id = 'inventario-fotos' and public.is_active_staff());

drop policy if exists "inv_fotos_staff_delete" on storage.objects;
create policy "inv_fotos_staff_delete"
  on storage.objects for delete
  using (bucket_id = 'inventario-fotos' and public.is_active_staff());

-- ------ Trigger updated_at -------------------------------------------------
create or replace function public.touch_inventario_revisiones_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_inventario_revisiones_updated_at on public.inventario_revisiones;
create trigger trg_inventario_revisiones_updated_at
  before update on public.inventario_revisiones
  for each row execute function public.touch_inventario_revisiones_updated_at();

commit;
