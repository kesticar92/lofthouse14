-- Columnas para alinear con GASTOS.xlsx (Google Sheets) y auditoría de sync.

alter table public.expenses
  add column if not exists payment_method text not null default 'Transferencia ACH';

alter table public.expenses
  add column if not exists responsible text not null default 'LOFTHOUSE';

alter table public.expenses
  add column if not exists gastos_sheet_synced_at timestamptz null;

alter table public.expenses
  add column if not exists gastos_sheet_last_error text null;

comment on column public.expenses.payment_method is 'Método de pago (columna en GASTOS.xlsx).';
comment on column public.expenses.responsible is 'Responsable / cuenta (columna en GASTOS.xlsx).';
comment on column public.expenses.gastos_sheet_synced_at is 'Última vez que se añadió fila en Google Sheets.';
comment on column public.expenses.gastos_sheet_last_error is 'Error al sincronizar con Sheets (si aplica).';
