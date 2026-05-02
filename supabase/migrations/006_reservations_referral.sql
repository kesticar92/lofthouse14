-- Distinción directa vs referido + datos para contabilizar comisiones.
-- "manual" queda obsoleto como origen (equivale a directa).

alter table public.reservations
  add column if not exists referrer_name text not null default '',
  add column if not exists commission_amount numeric(12, 2);

comment on column public.reservations.referrer_name is
  'Persona o canal que refirió la reserva (cuando source = referral)';
comment on column public.reservations.commission_amount is
  'Monto estimado de comisión a pagar al referidor (COP u otra moneda según uso interno)';

update public.reservations
set source = 'direct'
where lower(trim(source)) = 'manual';

alter table public.reservations alter column source set default 'direct';
