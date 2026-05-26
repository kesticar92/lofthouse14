import { z } from "zod";

import { ApiHandlerError, apiHandler } from "@/lib/api/handler";

const listQuerySchema = z.object({
  limit: z.string().optional(),
});

const createBodySchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().optional(),
  category: z.string().optional(),
  vendor_name: z.string().optional(),
  description: z.string().optional(),
  expense_date: z.string(),
  notes: z.string().optional(),
  payment_method: z.string().optional(),
  responsible: z.string().optional(),
});

export const GET = apiHandler({
  auth: "staff",
  module: "gastos",
  query: listQuerySchema,
  handler: async ({ ctx, query }) => {
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? "40") || 40));

    const { data, error } = await ctx.supabase
      .from("expenses")
      .select(
        "*, expense_files(id, drive_backup_status, drive_url, original_filename)",
      )
      .order("expense_date", { ascending: false })
      .limit(limit);
    if (error) {
      throw new ApiHandlerError(error.message, { status: 500 });
    }
    return { expenses: data ?? [] };
  },
});

export const POST = apiHandler({
  auth: "staff",
  module: "gastos",
  body: createBodySchema,
  handler: async ({ ctx, body }) => {
    const expense_date = body.expense_date.trim();
    if (!expense_date) {
      throw new ApiHandlerError("Falta expense_date", { status: 400 });
    }

    const row = {
      amount: body.amount,
      currency: (body.currency ?? "COP").trim() || "COP",
      category: body.category?.trim() ?? "",
      vendor_name: body.vendor_name?.trim() ?? "",
      description: body.description?.trim() ?? "",
      expense_date,
      notes: body.notes?.trim() ?? "",
      payment_method: body.payment_method?.trim() || "Transferencia ACH",
      responsible: body.responsible?.trim() || "LOFTHOUSE",
      created_by: ctx.user.id,
    };

    const { data, error } = await ctx.supabase
      .from("expenses")
      .insert(row)
      .select("*")
      .maybeSingle();
    if (error) {
      throw new ApiHandlerError(error.message, { status: 500 });
    }
    return { expense: data };
  },
});
