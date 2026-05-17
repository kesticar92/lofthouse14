import { z } from "zod";

import { ApiHandlerError, apiHandler } from "@/lib/api/handler";
import { syncIcalSource } from "@/lib/pms/ical-sync";

const paramsSchema = z.object({
  id: z.string().min(1),
});

export const POST = apiHandler({
  module: "reservas",
  params: paramsSchema,
  handler: async ({ params, ctx }) => {
    const { data: src, error: selErr } = await ctx.supabase
      .from("ical_sources")
      .select("id, property_id, url")
      .eq("id", params.id)
      .maybeSingle();
    if (selErr) throw new ApiHandlerError(selErr.message, { status: 500 });
    if (!src) {
      throw new ApiHandlerError("Fuente no encontrada", {
        status: 404,
        code: "NOT_FOUND",
      });
    }
    return syncIcalSource(ctx.supabase, src.id, src.property_id, src.url);
  },
});
