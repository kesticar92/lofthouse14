import type { SupabaseClient } from "@supabase/supabase-js";

import {
  appendGastoRowToSheet,
  isGastosSheetConfigured,
} from "@/lib/expenses/google-sheets-gastos";

function buildDescripcion(vendorName: string, description: string): string {
  const v = vendorName.trim();
  const d = description.trim();
  if (v && d) return `${v} — ${d}`;
  return v || d || "";
}

/**
 * Inserta una fila en GASTOS (Google Sheets) una sola vez por gasto.
 * Si Sheets no está configurado, no hace nada (ok).
 */
export async function syncExpenseToGastosSheet(
  supabase: SupabaseClient,
  expenseId: string,
): Promise<{ ok: boolean; skipped?: string; error?: string }> {
  if (!isGastosSheetConfigured()) {
    return { ok: true, skipped: "sheet_not_configured" };
  }

  const { data: exp, error: eErr } = await supabase
    .from("expenses")
    .select(
      "id, expense_date, category, description, vendor_name, amount, payment_method, responsible, gastos_sheet_synced_at",
    )
    .eq("id", expenseId)
    .maybeSingle();

  if (eErr) {
    return { ok: false, error: eErr.message };
  }
  if (!exp) {
    return { ok: false, error: "Gasto no encontrado" };
  }

  if (exp.gastos_sheet_synced_at) {
    return { ok: true, skipped: "already_synced" };
  }

  const { data: files, error: fErr } = await supabase
    .from("expense_files")
    .select("drive_url")
    .eq("expense_id", expenseId)
    .order("created_at", { ascending: true });

  if (fErr) {
    return { ok: false, error: fErr.message };
  }

  const facturaUrls = (files ?? [])
    .map((r) => r.drive_url as string | null)
    .filter((u): u is string => Boolean(u?.trim()));

  try {
    await appendGastoRowToSheet({
      expenseDateISO: String(exp.expense_date),
      category: String(exp.category ?? ""),
      description: buildDescripcion(
        String(exp.vendor_name ?? ""),
        String(exp.description ?? ""),
      ),
      responsible: String(exp.responsible ?? "LOFTHOUSE"),
      amount: Number(exp.amount),
      paymentMethod: String(exp.payment_method ?? "Transferencia ACH"),
      facturaUrls,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase
      .from("expenses")
      .update({
        gastos_sheet_last_error: msg.slice(0, 2000),
        updated_at: new Date().toISOString(),
      })
      .eq("id", expenseId);
    return { ok: false, error: msg };
  }

  const { error: upErr } = await supabase
    .from("expenses")
    .update({
      gastos_sheet_synced_at: new Date().toISOString(),
      gastos_sheet_last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", expenseId);

  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  return { ok: true };
}
