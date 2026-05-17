import { apiHandler, ApiHandlerError } from "@/lib/api/handler";
import {
  cotizacionCreateSchema,
  cotizacionListQuerySchema,
} from "@/features/cotizaciones/schemas";
import { rowToCotizacion } from "@/features/cotizaciones/types";
import type { TablesInsert } from "@/types/database.types";

export const GET = apiHandler({
  module: "cotizaciones",
  query: cotizacionListQuerySchema,
  handler: async ({ ctx, query }) => {
    let q = ctx.supabase
      .from("cotizaciones")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(query.limit);
    if (query.status) q = q.eq("status", query.status);
    const { data, error } = await q;
    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    return (data ?? []).map(rowToCotizacion);
  },
});

export const POST = apiHandler({
  module: "cotizaciones",
  body: cotizacionCreateSchema,
  handler: async ({ ctx, body }) => {
    const insert: TablesInsert<"cotizaciones"> = {
      guest_name: body.guest_name,
      check_in: body.check_in,
      check_out: body.check_out,
      guests: body.guests,
      loft_id: body.loft_id,
      price_per_night: body.price_per_night,
      total: body.total,
      notes: body.notes,
      status: body.status,
      metadata: body.metadata,
      created_by: ctx.user.id,
    };
    const { data, error } = await ctx.supabase
      .from("cotizaciones")
      .insert(insert)
      .select("*")
      .single();
    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    return rowToCotizacion(data);
  },
});
