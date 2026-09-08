-- =============================================================================
-- 022_booking_engine.sql — Fase 4: booking engine directo
-- Código reserva, guest email, extras JSON, payment_status, room_type link
-- =============================================================================

alter table public.reservations
  add column if not exists reservation_code text;

alter table public.reservations
  add column if not exists guest_email text not null default '';

alter table public.reservations
  add column if not exists guest_id uuid;

alter table public.reservations
  add column if not exists room_id uuid references public.rooms (id) on delete set null;

alter table public.reservations
  add column if not exists room_type_id uuid references public.room_types (id) on delete set null;

alter table public.reservations
  add column if not exists extras jsonb not null default '[]'::jsonb;

alter table public.reservations
  add column if not exists currency text not null default 'COP';

alter table public.reservations
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'partial', 'paid', 'refunded', 'failed'));

alter table public.reservations
  add column if not exists hold_id uuid references public.availability_holds (id) on delete set null;

alter table public.reservations
  add column if not exists channel text not null default 'direct';

-- Ampliar statuses (pending + check-in/out Fase 6)
alter table public.reservations drop constraint if exists reservations_status_ok;
alter table public.reservations
  add constraint reservations_status_ok
  check (status in (
    'pending', 'confirmed', 'blocked', 'cancelled',
    'checked_in', 'checked_out', 'no_show'
  ));

create unique index if not exists reservations_code_uidx
  on public.reservations (reservation_code)
  where reservation_code is not null and btrim(reservation_code) <> '';

create index if not exists reservations_room_type_idx
  on public.reservations (room_type_id);

create index if not exists reservations_guest_email_idx
  on public.reservations (guest_email)
  where guest_email <> '';

comment on column public.reservations.reservation_code is
  'Código público de reserva (ej. LH-XXXXXX). Generado en booking engine.';
