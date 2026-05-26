import { apiHandler, ApiHandlerError } from "@/lib/api/handler";
import {
  inventarioListQuerySchema,
  inventarioRevisionCreateSchema,
} from "@/features/inventarios/schemas";
import {
  listRevisionsWithCounts,
  loadRevisionFull,
} from "@/features/inventarios/server";
import type { TablesInsert } from "@/types/database.types";

export const GET = apiHandler({
  module: "inventario",
  query: inventarioListQuerySchema,
  handler: async ({ ctx, query }) => {
    return await listRevisionsWithCounts(ctx.supabase, query);
  },
});

export const POST = apiHandler({
  module: "inventario",
  body: inventarioRevisionCreateSchema,
  handler: async ({ ctx, body }) => {
    // 1. Crear cabecera
    const insertHeader: TablesInsert<"inventario_revisiones"> = {
      loft_id: body.loft_id,
      persona: body.persona,
      fecha: body.fecha,
      created_by: ctx.user.id,
    };
    const { data: header, error: errH } = await ctx.supabase
      .from("inventario_revisiones")
      .insert(insertHeader)
      .select("*")
      .single();
    if (errH) throw new ApiHandlerError(errH.message, { status: 500 });

    // 2. Crear items en bulk
    const itemsToInsert: TablesInsert<"inventario_revision_items">[] =
      body.items.map((it) => ({
        revision_id: header.id,
        orden: it.orden,
        zona: it.zona,
        item: it.item,
        estado: it.estado,
        funciona: it.funciona,
        detalles: it.detalles,
        requiere_atencion: it.requiere_atencion,
      }));
    const { error: errI } = await ctx.supabase
      .from("inventario_revision_items")
      .insert(itemsToInsert);
    if (errI) {
      // Rollback manual: borrar la cabecera para no dejarla huérfana
      await ctx.supabase
        .from("inventario_revisiones")
        .delete()
        .eq("id", header.id);
      throw new ApiHandlerError(errI.message, { status: 500 });
    }

    const full = await loadRevisionFull(ctx.supabase, header.id);
    if (!full)
      throw new ApiHandlerError("No se pudo cargar la revisión", {
        status: 500,
      });
    return full;
  },
});
