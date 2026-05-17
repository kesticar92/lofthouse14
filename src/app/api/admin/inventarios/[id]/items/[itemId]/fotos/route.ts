// Multipart upload: no usa apiHandler (FormData); auth vía requireStaff + enforceStaffModule.
import { randomUUID } from "crypto";
import { enforceStaffModule, requireStaff } from "@/lib/api/require-staff";
import {
  apiBadRequest,
  apiErr,
  apiOk,
  apiValidationError,
} from "@/lib/api/response";
import { signFotos, FOTO_BUCKET_NAME } from "@/features/inventarios/server";
import { logger } from "@/lib/logger";
import type { TablesInsert } from "@/types/database.types";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Subida de una foto de evidencia para un item de inventario.
 * Body: multipart/form-data con campos:
 *   - `file`: File (image/jpeg|png|webp, ≤5 MB)
 *   - `caption`: string opcional
 *
 * Esta route NO usa `apiHandler` porque éste solo soporta JSON; el upload
 * multipart se maneja directamente con FormData.
 */
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string; itemId: string }> },
) {
  const log = logger.child({ module: "inventarios.fotos" });
  try {
    const guard = await requireStaff();
    if (!guard.ok) return guard.response;
    const modDenied = enforceStaffModule(guard.ctx, "inventario");
    if (modDenied) return modDenied;
    const { supabase, user } = guard.ctx;
    const { id, itemId } = await ctx.params;

    if (!isUuid(id) || !isUuid(itemId)) {
      return apiValidationError([{ message: "id/itemId no es UUID" }]);
    }

    // Verifica que el item existe y pertenece a esa revisión
    const { data: item, error: errItem } = await supabase
      .from("inventario_revision_items")
      .select("id, revision_id")
      .eq("id", itemId)
      .maybeSingle();
    if (errItem) return apiErr(errItem.message, { status: 500 });
    if (!item || item.revision_id !== id) {
      return apiBadRequest("El item no pertenece a esa revisión");
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return apiBadRequest("Body multipart inválido");
    }
    const file = form.get("file");
    const caption = String(form.get("caption") ?? "");

    if (!(file instanceof File)) return apiBadRequest("Falta archivo `file`");
    if (file.size === 0) return apiBadRequest("Archivo vacío");
    if (file.size > MAX_BYTES) {
      return apiBadRequest(
        `Archivo demasiado grande (max ${(MAX_BYTES / 1024 / 1024).toFixed(0)} MB)`,
      );
    }
    if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
      return apiBadRequest(
        `Tipo no permitido (${file.type}). Usa JPEG, PNG o WebP.`,
      );
    }

    const ext = extFromMime(file.type) ?? "bin";
    const storagePath = `revisions/${id}/items/${itemId}/${randomUUID()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: errUp } = await supabase.storage
      .from(FOTO_BUCKET_NAME)
      .upload(storagePath, new Uint8Array(arrayBuffer), {
        contentType: file.type,
        upsert: false,
      });
    if (errUp) {
      log.error({ msg: "storage_upload_failed", error: errUp.message });
      return apiErr(errUp.message, { status: 500, code: "STORAGE_UPLOAD" });
    }

    const insert: TablesInsert<"inventario_revision_fotos"> = {
      item_id: itemId,
      storage_path: storagePath,
      caption,
      file_size: file.size,
      mime_type: file.type,
      created_by: user.id,
    };
    const { data: foto, error: errIns } = await supabase
      .from("inventario_revision_fotos")
      .insert(insert)
      .select("*")
      .single();
    if (errIns) {
      // Rollback: borra el archivo subido para no dejar huérfano
      await supabase.storage.from(FOTO_BUCKET_NAME).remove([storagePath]);
      return apiErr(errIns.message, { status: 500 });
    }

    const [signed] = await signFotos(supabase, [foto]);
    return apiOk({ ...foto, url: signed }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    log.error({ msg: "uncaught", error: message });
    return apiErr(message, { status: 500 });
  }
}

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    s,
  );
}

function extFromMime(mime: string): string | null {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return null;
}
