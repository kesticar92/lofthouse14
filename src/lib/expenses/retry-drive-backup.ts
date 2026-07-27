import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ensureExpenseDriveFolderPath,
  isGoogleDriveConfigured,
  uploadBufferToGoogleDrive,
} from "@/lib/expenses/google-drive-backup";
import { sanitizeExpenseFilename } from "@/lib/expenses/upload-expense-file";

export async function retryDriveBackupForExpenseFile(
  admin: SupabaseClient,
  fileId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data: row, error: fErr } = await admin
    .from("expense_files")
    .select(
      "id, storage_path, original_filename, mime_type, expense_id, drive_retry_count, expenses(expense_date)",
    )
    .eq("id", fileId)
    .maybeSingle();
  if (fErr || !row) {
    return { ok: false, error: fErr?.message ?? "Archivo no encontrado" };
  }

  const emb = row as {
    expenses?: { expense_date?: string } | { expense_date?: string }[];
  };
  const expRel = Array.isArray(emb.expenses) ? emb.expenses[0] : emb.expenses;
  const expenseDate = expRel?.expense_date ?? "";
  if (!expenseDate) {
    return { ok: false, error: "Sin fecha de gasto" };
  }

  const { data: blob, error: dlErr } = await admin.storage
    .from("expenses")
    .download(row.storage_path);
  if (dlErr || !blob) {
    return { ok: false, error: dlErr?.message ?? "No se pudo leer desde Storage" };
  }
  const buffer = Buffer.from(await blob.arrayBuffer());

  const prevRetries =
    (row as { drive_retry_count?: number }).drive_retry_count ?? 0;

  if (!isGoogleDriveConfigured()) {
    await admin
      .from("expense_files")
      .update({
        drive_backup_status: "failed",
        drive_last_error:
          "Google Drive no configurado (variables de entorno).",
        drive_retry_count: prevRetries + 1,
      })
      .eq("id", fileId);
    return { ok: false, error: "Drive no configurado" };
  }

  try {
    const expenseId = row.expense_id as string;
    const folderId = await ensureExpenseDriveFolderPath(
      expenseDate,
      expenseId,
    );
    const name = sanitizeExpenseFilename(
      (row.original_filename as string) || "archivo",
    );
    const mime = (row.mime_type as string) || "application/octet-stream";
    const up = await uploadBufferToGoogleDrive({
      parentFolderId: folderId,
      filename: name,
      mimeType: mime,
      buffer,
    });

    const signedTtl = 60 * 60 * 24 * 7;
    const { data: signData } = await admin.storage
      .from("expenses")
      .createSignedUrl(row.storage_path as string, signedTtl);

    await admin
      .from("expense_files")
      .update({
        drive_file_id: up.fileId,
        drive_url: up.webViewLink,
        drive_backup_status: "success",
        drive_last_error: null,
        supabase_url: signData?.signedUrl ?? null,
      })
      .eq("id", fileId);

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin
      .from("expense_files")
      .update({
        drive_backup_status: "failed",
        drive_last_error: msg,
        drive_retry_count: prevRetries + 1,
      })
      .eq("id", fileId);
    return { ok: false, error: msg };
  }
}
