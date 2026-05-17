import { z } from "zod";

import { ApiHandlerError, apiHandler } from "@/lib/api/handler";

const querySchema = z.object({
  unread: z.enum(["0", "1"]).optional(),
});

export const GET = apiHandler({
  query: querySchema,
  handler: async ({ query, ctx }) => {
    const unreadOnly = query.unread === "1";
    let q = ctx.supabase
      .from("notifications")
      .select("id, title, message, read, created_at")
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (unreadOnly) q = q.eq("read", false);

    const { data, error } = await q;
    if (error) {
      throw new ApiHandlerError(error.message, { status: 500 });
    }
    return { notifications: data ?? [] };
  },
});

export const PATCH = apiHandler({
  handler: async ({ ctx }) => {
    const { error } = await ctx.supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", ctx.user.id)
      .eq("read", false);
    if (error) {
      throw new ApiHandlerError(error.message, { status: 500 });
    }
    return { updated: true };
  },
});
