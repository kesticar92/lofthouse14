import { apiHandler, ApiHandlerError } from "@/lib/api/handler";
import { inventarioFotoIdParamSchema } from "@/features/inventarios/schemas";
import { FOTO_BUCKET_NAME } from "@/features/inventarios/server";

export const DELETE = apiHandler({
  module: "inventario",
  params: inventarioFotoIdParamSchema,
  handler: async ({ ctx, params }) => {
    const { data: foto, error: errSel } = await ctx.supabase
      .from("inventario_revision_fotos")
      .select("id, item_id, storage_path")
      .eq("id", params.fotoId)
      .maybeSingle();
    if (errSel) throw new ApiHandlerError(errSel.message, { status: 500 });
    if (!foto) throw new ApiHandlerError("Foto no encontrada", { status: 404 });
    if (foto.item_id !== params.itemId) {
      throw new ApiHandlerError("La foto no pertenece a ese item", {
        status: 400,
      });
    }

    const { error: errDel } = await ctx.supabase
      .from("inventario_revision_fotos")
      .delete()
      .eq("id", params.fotoId);
    if (errDel) throw new ApiHandlerError(errDel.message, { status: 500 });

    // Best-effort: borrar también el objeto en Storage
    await ctx.supabase.storage
      .from(FOTO_BUCKET_NAME)
      .remove([foto.storage_path]);

    return { id: params.fotoId, deleted: true };
  },
});
