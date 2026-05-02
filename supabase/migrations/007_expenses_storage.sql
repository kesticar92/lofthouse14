-- Gastos + adjuntos en Storage; backup Google Drive vía backend (API).

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  amount numeric(14, 2) not null,
  currency text not null default 'COP',
  category text not null default '',
  vendor_name text not null default '',
  description text not null default '',
  expense_date date not null,
  notes text not null default '',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expenses_amount_ok check (amount >= 0)
);

create index if not exists expenses_date_idx
  on public.expenses (expense_date desc);

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

alter table public.expenses enable row level security;

drop policy if exists "expenses_staff_all" on public.expenses;
create policy "expenses_staff_all"
  on public.expenses for all
  using (public.is_staff_user())
  with check (public.is_staff_user());

create table if not exists public.expense_files (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses (id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null default 'application/octet-stream',
  file_size bigint not null default 0,
  supabase_url text,
  drive_file_id text,
  drive_url text,
  drive_backup_status text not null default 'pending'
    constraint expense_files_drive_status_ok
      check (drive_backup_status in ('pending', 'success', 'failed')),
  drive_last_error text,
  drive_retry_count int not null default 0,
  created_at timestamptz not null default now(),
  constraint expense_files_storage_path_nonempty check (btrim(storage_path) <> '')
);

create index if not exists expense_files_expense_idx
  on public.expense_files (expense_id);

create index if not exists expense_files_drive_retry_idx
  on public.expense_files (drive_backup_status, created_at)
  where drive_backup_status in ('failed', 'pending');

alter table public.expense_files enable row level security;

drop policy if exists "expense_files_staff_all" on public.expense_files;
create policy "expense_files_staff_all"
  on public.expense_files for all
  using (public.is_staff_user())
  with check (public.is_staff_user());

grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update, delete on public.expense_files to authenticated;

-- ---------------------------------------------------------------------------
-- Bucket Storage (privado; URLs firmadas desde la API)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('expenses', 'expenses', false, 52428800, null)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

drop policy if exists "expenses_objects_staff_select" on storage.objects;
create policy "expenses_objects_staff_select"
  on storage.objects for select to authenticated
  using (bucket_id = 'expenses' and public.is_staff_user());

drop policy if exists "expenses_objects_staff_insert" on storage.objects;
create policy "expenses_objects_staff_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'expenses' and public.is_staff_user());

drop policy if exists "expenses_objects_staff_update" on storage.objects;
create policy "expenses_objects_staff_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'expenses' and public.is_staff_user())
  with check (bucket_id = 'expenses' and public.is_staff_user());

drop policy if exists "expenses_objects_staff_delete" on storage.objects;
create policy "expenses_objects_staff_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'expenses' and public.is_staff_user());
