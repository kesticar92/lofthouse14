// =============================================================================
// src/features/expenses/types.ts
// -----------------------------------------------------------------------------
// Tipos compartidos del feature de gastos. El cliente HTTP vive en
// `features/expenses/api.ts` (`apiClient` unifica envelope y respuestas legacy).
// =============================================================================

export type ExpenseFileRow = {
  id: string;
  drive_backup_status: string;
  drive_url: string | null;
  original_filename: string;
  mime_type?: string;
  signed_url?: string | null;
  drive_last_error?: string | null;
};

export type ExpenseListRow = {
  id: string;
  amount: number;
  currency: string;
  category: string;
  vendor_name: string;
  description: string;
  expense_date: string;
  notes: string;
  payment_method?: string;
  responsible?: string;
  gastos_sheet_synced_at?: string | null;
  gastos_sheet_last_error?: string | null;
  expense_files?: Pick<
    ExpenseFileRow,
    "id" | "drive_backup_status" | "drive_url" | "original_filename"
  >[];
};
