// Multipart upload: no usa apiHandler (FormData); auth vía requireStaff + enforceStaffModule.
import { apiBadRequest, apiErr, apiOk } from "@/lib/api/response";
import { enforceStaffModule, requireStaff } from "@/lib/api/require-staff";
import { uploadExpenseFile } from "@/lib/expenses/upload-expense-file";

const MAX_FILES_PER_REQUEST = 12;
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const denied = enforceStaffModule(gate.ctx, "gastos");
  if (denied) return denied;
  const { supabase } = gate.ctx;
  const { id: expenseId } = await ctx.params;
  if (!expenseId) {
    return apiBadRequest("Falta id");
  }

  const { data: exp, error: eErr } = await supabase
    .from("expenses")
    .select("id, expense_date")
    .eq("id", expenseId)
    .maybeSingle();
  if (eErr) {
    return apiErr(eErr.message, { status: 500 });
  }
  if (!exp) {
    return apiErr("Gasto no encontrado", { status: 404, code: "NOT_FOUND" });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return apiBadRequest("FormData inválido");
  }

  const raw = form.getAll("files");
  const files = raw.filter((x): x is File => x instanceof File);
  if (files.length === 0) {
    return apiBadRequest("Adjunta al menos un archivo (campo files)");
  }
  if (files.length > MAX_FILES_PER_REQUEST) {
    return apiBadRequest(`Máximo ${MAX_FILES_PER_REQUEST} archivos por carga.`);
  }

  const created: unknown[] = [];
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return apiErr(`El archivo "${file.name}" supera el máximo de 20 MB.`, {
        status: 413,
        code: "PAYLOAD_TOO_LARGE",
        details: { partial: created },
      });
    }
    const mime = (file.type || "application/octet-stream").toLowerCase();
    if (!ALLOWED_MIME.has(mime)) {
      return apiErr(
        `Tipo no permitido en "${file.name}". Usa JPG, PNG, WEBP, HEIC o PDF.`,
        {
          status: 415,
          code: "UNSUPPORTED_MEDIA_TYPE",
          details: { partial: created },
        },
      );
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const up = await uploadExpenseFile({
      supabase,
      expenseId,
      expenseDateISO: String(exp.expense_date),
      buffer: buf,
      originalFilename: file.name || "archivo",
      mimeType: mime,
    });

    const { data: row, error: insErr } = await supabase
      .from("expense_files")
      .insert({
        expense_id: expenseId,
        storage_path: up.storage_path,
        original_filename: file.name || "archivo",
        mime_type: mime,
        file_size: buf.length,
        supabase_url: up.supabase_url,
        drive_file_id: up.drive_file_id,
        drive_url: up.drive_url,
        drive_backup_status: up.drive_backup_status,
        drive_last_error: up.drive_last_error,
      })
      .select("*")
      .maybeSingle();
    if (insErr) {
      return apiErr(insErr.message, {
        status: 500,
        details: { partial: created },
      });
    }
    if (row) created.push(row);
  }

  return apiOk({ files: created });
}
