import { apiHandler, ApiHandlerError } from "@/lib/api/handler";
import {
  inventarioIdParamSchema,
  inventarioRevisionUpdateSchema,
} from "@/features/inventarios/schemas";
import {
  loadRevisionFull,
  FOTO_BUCKET_NAME,
} from "@/features/inventarios/server";
import type { TablesInsert, TablesUpdate } from "@/types/database.types";

export const GET = apiHandler({
  module: "inventario",
  params: inventarioIdParamSchema,
  handler: async ({ ctx, params }) => {
    const full = await loadRevisionFull(ctx.supabase, params.id);
    if (!full) throw new ApiHandlerError("No encontrada", { status: 404 });
    return full;
  },
});

export const PATCH = apiHandler({
  module: "inventario",
  params: inventarioIdParamSchema,
  body: inventarioRevisionUpdateSchema,
  handler: async ({ ctx, params, body }) => {
    // 1. Update header (si hay campos)
    const headerPatch: TablesUpdate<"inventario_revisiones"> = {
      updated_at: new Date().toISOString(),
    };
    if (body.persona !== undefined) headerPatch.persona = body.persona;
    if (body.fecha !== undefined) headerPatch.fecha = body.fecha;
    const { error: errH } = await ctx.supabase
      .from("inventario_revisiones")
      .update(headerPatch)
      .eq("id", params.id);
    if (errH) throw new ApiHandlerError(errH.message, { status: 500 });

    // 2. Si vienen items, reemplazar TODOS (CASCADE limpia fotos huérfanas).
    if (body.items) {
      const { error: errDel } = await ctx.supabase
        .from("inventario_revision_items")
        .delete()
        .eq("revision_id", params.id);
      if (errDel) throw new ApiHandlerError(errDel.message, { status: 500 });

      const itemsToInsert: TablesInsert<"inventario_revision_items">[] =
        body.items.map((it) => ({
          revision_id: params.id,
          orden: it.orden,
          zona: it.zona,
          item: it.item,
          estado: it.estado,
          funciona: it.funciona,
          detalles: it.detalles,
          requiere_atencion: it.requiere_atencion,
        }));
      if (itemsToInsert.length > 0) {
        const { error: errIns } = await ctx.supabase
          .from("inventario_revision_items")
          .insert(itemsToInsert);
        if (errIns) throw new ApiHandlerError(errIns.message, { status: 500 });
      }
    }

    const full = await loadRevisionFull(ctx.supabase, params.id);
    if (!full) throw new ApiHandlerError("No encontrada", { status: 404 });
    return full;
  },
});

export const DELETE = apiHandler({
  module: "inventario",
  params: inventarioIdParamSchema,
  handler: async ({ ctx, params }) => {
    if (ctx.profile.role !== "super_admin" && ctx.profile.role !== "admin") {
      throw new ApiHandlerError(
        "Solo admin/super_admin pueden eliminar revisiones",
        { status: 403 },
      );
    }

    // Antes de borrar la cabecera, recolectamos las storage_path de las fotos
    // para limpiarlas del Storage (la BD las elimina por CASCADE pero los
    // objetos físicos quedarían huérfanos).
    const { data: items } = await ctx.supabase
      .from("inventario_revision_items")
      .select("id")
      .eq("revision_id", params.id);
    const itemIds = (items ?? []).map((i) => i.id);
    if (itemIds.length > 0) {
      const { data: fotos } = await ctx.supabase
        .from("inventario_revision_fotos")
        .select("storage_path")
        .in("item_id", itemIds);
      const paths = (fotos ?? []).map((f) => f.storage_path);
      if (paths.length > 0) {
        await ctx.supabase.storage.from(FOTO_BUCKET_NAME).remove(paths);
      }
    }

    const { error } = await ctx.supabase
      .from("inventario_revisiones")
      .delete()
      .eq("id", params.id);
    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    return { id: params.id, deleted: true };
  },
});
