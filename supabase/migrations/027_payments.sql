-- =============================================================================
-- 027_payments.sql — Fase 10: payments abstraction
-- =============================================================================

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  reservation_id uuid references public.reservations (id) on delete set null,
  provider text not null
    check (provider in ('wompi', 'mercadopago', 'stripe', 'payu', 'manual', 'stub')),
  external_id text,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'COP',
  status text not null default 'stub'
    check (status in (
      'stub', 'created', 'pending', 'authorized', 'paid',
      'failed', 'cancelled', 'refunded'
    )),
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  raw_webhook jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_org_idx on public.payments (organization_id);
create index if not exists payments_reservation_idx on public.payments (reservation_id);

create unique index if not exists payments_idempotency_uidx
  on public.payments (organization_id, provider, idempotency_key)
  where idempotency_key is not null and btrim(idempotency_key) <> '';

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

drop policy if exists "payments_member_all" on public.payments;
create policy "payments_member_all"
  on public.payments for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

grant select, insert, update on public.payments to authenticated;
grant select, insert, update on public.payments to service_role;

comment on table public.payments is
  'TODO: REAL INTEGRATION REQUIRED — Wompi/MercadoPago/Stripe/PayU. Stubs only.';
