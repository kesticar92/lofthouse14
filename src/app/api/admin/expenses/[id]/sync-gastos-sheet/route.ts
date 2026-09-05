import { z } from "zod";

import { apiHandler } from "@/lib/api/handler";
import { syncExpenseToGastosSheet } from "@/lib/expenses/sync-expense-gastos-sheet";

const paramsSchema = z.object({
  id: z.string().min(1),
});

export const POST = apiHandler({
  auth: "staff",
  module: "gastos",
  params: paramsSchema,
  handler: async ({ ctx, params }) => {
    const r = await syncExpenseToGastosSheet(ctx.supabase, params.id);
    return {
      ok: r.ok,
      appended: Boolean(r.ok && !r.skipped),
      skipped: r.skipped ?? null,
      error: r.error ?? null,
    };
  },
});
