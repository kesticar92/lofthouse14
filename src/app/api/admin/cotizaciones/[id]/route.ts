import { apiHandler, ApiHandlerError } from "@/lib/api/handler";
import {
  cotizacionIdParamSchema,
  cotizacionUpdateSchema,
} from "@/features/cotizaciones/schemas";
import { rowToCotizacion } from "@/features/cotizaciones/types";
import type { TablesUpdate } from "@/types/database.types";

export const GET = apiHandler({
  module: "cotizaciones",
  params: cotizacionIdParamSchema,
  handler: async ({ ctx, params }) => {
    const { data, error } = await ctx.supabase
      .from("cotizaciones")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    if (!data) throw new ApiHandlerError("No encontrada", { status: 404 });
    return rowToCotizacion(data);
  },
});

export const PATCH = apiHandler({
  module: "cotizaciones",
  params: cotizacionIdParamSchema,
  body: cotizacionUpdateSchema,
  handler: async ({ ctx, params, body }) => {
    const update: TablesUpdate<"cotizaciones"> = {
      ...body,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await ctx.supabase
      .from("cotizaciones")
      .update(update)
      .eq("id", params.id)
      .select("*")
      .single();
    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    return rowToCotizacion(data);
  },
});

export const DELETE = apiHandler({
  module: "cotizaciones",
  params: cotizacionIdParamSchema,
  handler: async ({ ctx, params }) => {
    if (ctx.profile.role !== "super_admin" && ctx.profile.role !== "admin") {
      throw new ApiHandlerError(
        "Solo admin/super_admin pueden eliminar cotizaciones",
        { status: 403 },
      );
    }
    const { error } = await ctx.supabase
      .from("cotizaciones")
      .delete()
      .eq("id", params.id);
    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    return { id: params.id, deleted: true };
  },
});
