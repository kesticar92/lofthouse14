import { z } from "zod";

import { ApiHandlerError, apiHandler } from "@/lib/api/handler";

const paramsSchema = z.object({
  id: z.string().min(1),
});

const bodySchema = z.object({
  read: z.boolean().optional(),
});

export const PATCH = apiHandler({
  params: paramsSchema,
  body: bodySchema,
  handler: async ({ params, body, ctx }) => {
    const { error } = await ctx.supabase
      .from("notifications")
      .update({ read: body.read ?? true })
      .eq("id", params.id)
      .eq("user_id", ctx.user.id);
    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    return { updated: true };
  },
});
