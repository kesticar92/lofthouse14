import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ensureExpenseDriveFolderPath,
  isGoogleDriveConfigured,
  uploadBufferToGoogleDrive,
} from "@/lib/expenses/google-drive-backup";

export function sanitizeExpenseFilename(name: string): string {
  const base = name.replace(/^.*[/\\]/, "").replace(/\0/g, "");
  const cleaned = base.replace(/[^\p{L}\p{N}._\-()+[\] ]/gu, "_");
  return (cleaned || "archivo").slice(0, 200);
}

/** Construye el nombre del archivo en Drive bajo la carpeta `AAAA-MM`.
 *  Formato: `YYYY-MM-DD_{shortId}_{archivo_saneado}` para que dentro de la
 *  misma carpeta del mes los archivos:
 *    - se ordenen cronológicamente por fecha de gasto,
 *    - sean trazables al gasto en BD (shortId = primeros 8 chars del UUID),
 *    - conserven el nombre original que subió el usuario. */
export function buildDriveFilename(opts: {
  expenseDateISO: string;
  expenseId: string;
  originalFilename: string;
}): string {
  const date = opts.expenseDateISO.slice(0, 10);
  const shortId = opts.expenseId.replace(/-/g, "").slice(0, 8);
  const safe = sanitizeExpenseFilename(opts.originalFilename);
  return `${date}_${shortId}_${safe}`.slice(0, 240);
}

export type UploadExpenseFileResult = {
  storage_path: string;
  supabase_url: string | null;
  drive_file_id: string | null;
  drive_url: string | null;
  drive_backup_status: "pending" | "success" | "failed";
  drive_last_error: string | null;
};

/**
 * 1) Subida a Supabase Storage (ruta `expenses/AAAA/MM/{expense_id}/…`) —
 *    backup interno, ordenado en subcarpetas para facilitar la auditoría.
 * 2) Backup en Google Drive: una sola carpeta `AAAA-MM` plana bajo la raíz
 *    configurada, con filename `YYYY-MM-DD_{shortId}_{archivo}` para que el
 *    equipo pueda revisarlas tal como ya lo hace manualmente. No bloquea si
 *    falla: marca `drive_backup_status = failed` y guarda el motivo para
 *    reintentar luego (cron `/api/cron/expense-drive-retry`).
 */
export async function uploadExpenseFile(opts: {
  supabase: SupabaseClient;
  expenseId: string;
  expenseDateISO: string;
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
}): Promise<UploadExpenseFileResult> {
  const year = opts.expenseDateISO.slice(0, 4);
  const month = opts.expenseDateISO.slice(5, 7);
  const safe = sanitizeExpenseFilename(opts.originalFilename);
  const storagePath = `expenses/${year}/${month}/${opts.expenseId}/${crypto.randomUUID()}_${safe}`;

  const { error: upErr } = await opts.supabase.storage
    .from("expenses")
    .upload(storagePath, opts.buffer, {
      contentType: opts.mimeType || "application/octet-stream",
      upsert: false,
    });
  if (upErr) {
    throw new Error(`Storage: ${upErr.message}`);
  }

  const signedTtl = 60 * 60 * 24 * 7;
  const { data: signData, error: signErr } = await opts.supabase.storage
    .from("expenses")
    .createSignedUrl(storagePath, signedTtl);
  const supabase_url =
    !signErr && signData?.signedUrl ? signData.signedUrl : null;

  if (!isGoogleDriveConfigured()) {
    return {
      storage_path: storagePath,
      supabase_url,
      drive_file_id: null,
      drive_url: null,
      drive_backup_status: "failed",
      drive_last_error:
        "Google Drive no configurado (revisa GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_DRIVE_ROOT_FOLDER_ID).",
    };
  }

  try {
    const folderId = await ensureExpenseDriveFolderPath(opts.expenseDateISO);
    const driveName = buildDriveFilename({
      expenseDateISO: opts.expenseDateISO,
      expenseId: opts.expenseId,
      originalFilename: opts.originalFilename,
    });
    const up = await uploadBufferToGoogleDrive({
      parentFolderId: folderId,
      filename: driveName,
      mimeType: opts.mimeType || "application/octet-stream",
      buffer: opts.buffer,
    });
    return {
      storage_path: storagePath,
      supabase_url,
      drive_file_id: up.fileId,
      drive_url: up.webViewLink,
      drive_backup_status: "success",
      drive_last_error: null,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      storage_path: storagePath,
      supabase_url,
      drive_file_id: null,
      drive_url: null,
      drive_backup_status: "failed",
      drive_last_error: msg,
    };
  }
}
