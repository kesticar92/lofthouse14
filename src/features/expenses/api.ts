// =============================================================================
// Cliente del feature Gastos. Rutas bajo envelope `{ ok, data }` vía apiHandler
// o helpers apiOk/apiErr; `apiClient` devuelve solo `data`.
// =============================================================================

import { apiClient } from "@/lib/api/client";
import type { ExpenseFileRow, ExpenseListRow } from "./types";

export type CreateExpenseInput = {
  amount: number;
  expense_date: string;
  vendor_name: string;
  category: string;
  description: string;
  notes: string;
  currency?: string;
  payment_method?: string;
  responsible?: string;
};

export type ExpenseDetailResponse = {
  expense: ExpenseListRow;
  files: ExpenseFileRow[];
};

export async function listExpenses(limit = 60): Promise<ExpenseListRow[]> {
  const capped = Math.min(100, Math.max(1, limit));
  const j = await apiClient<{ expenses?: ExpenseListRow[] }>(
    `/api/admin/expenses?limit=${capped}`,
  );
  return j.expenses ?? [];
}

export async function getExpense(id: string): Promise<ExpenseDetailResponse> {
  return apiClient<ExpenseDetailResponse>(`/api/admin/expenses/${id}`);
}

export async function createExpense(
  input: CreateExpenseInput,
): Promise<{ expense: ExpenseListRow }> {
  return apiClient(`/api/admin/expenses`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function uploadExpenseFiles(
  expenseId: string,
  files: File[],
): Promise<{ files: ExpenseFileRow[] }> {
  const fd = new FormData();
  for (const f of files) fd.append("files", f);
  return apiClient(`/api/admin/expenses/${expenseId}/files`, {
    method: "POST",
    body: fd,
  });
}

export async function retryExpenseDriveBackup(
  fileId: string,
): Promise<{ retried: true }> {
  return apiClient(
    `/api/admin/expenses/files/${fileId}/retry-drive`,
    { method: "POST" },
  );
}

/** Elimina el gasto y sus archivos en Storage. */
export async function removeExpense(id: string): Promise<void> {
  await apiClient(`/api/admin/expenses/${id}`, { method: "DELETE" });
}

export type SyncGastosSheetResponse = {
  ok: boolean;
  appended: boolean;
  skipped: string | null;
  error: string | null;
};

export async function syncExpenseGastosSheet(
  expenseId: string,
): Promise<SyncGastosSheetResponse> {
  return apiClient(`/api/admin/expenses/${expenseId}/sync-gastos-sheet`, {
    method: "POST",
  });
}
