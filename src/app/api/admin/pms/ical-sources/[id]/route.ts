import { z } from "zod";

import { ApiHandlerError, apiHandler } from "@/lib/api/handler";

const paramsSchema = z.object({
  id: z.string().min(1),
});

const patchBodySchema = z.object({
  url: z.string().min(1),
});

export const PATCH = apiHandler({
  module: "reservas",
  params: paramsSchema,
  body: patchBodySchema,
  handler: async ({ params, body, ctx }) => {
    try {
      new URL(body.url);
    } catch {
      throw new ApiHandlerError("URL iCal inválida", {
        status: 400,
        code: "BAD_REQUEST",
      });
    }
    const { data, error } = await ctx.supabase
      .from("ical_sources")
      .update({ url: body.url, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select("*")
      .maybeSingle();
    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    if (!data) {
      throw new ApiHandlerError("Fuente no encontrada", {
        status: 404,
        code: "NOT_FOUND",
      });
    }
    return { source: data };
  },
});

export const DELETE = apiHandler({
  module: "reservas",
  params: paramsSchema,
  handler: async ({ params, ctx }) => {
    const { error } = await ctx.supabase
      .from("ical_sources")
      .delete()
      .eq("id", params.id);
    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    return { deleted: true };
  },
});
