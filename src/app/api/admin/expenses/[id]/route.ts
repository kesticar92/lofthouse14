import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { ApiHandlerError, apiHandler } from "@/lib/api/handler";
import type { TablesUpdate } from "@/types/database.types";

const SIGNED_TTL = 60 * 60 * 24 * 7;

async function signFileUrl(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("expenses")
    .createSignedUrl(storagePath, SIGNED_TTL);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

const expenseIdParamsSchema = z.object({
  id: z.string().min(1),
});

const expensePatchSchema = z.object({
  amount: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  category: z.string().optional(),
  vendor_name: z.string().optional(),
  description: z.string().optional(),
  expense_date: z.string().optional(),
  notes: z.string().optional(),
  payment_method: z.string().optional(),
  responsible: z.string().optional(),
});

export const GET = apiHandler({
  auth: "staff",
  module: "gastos",
  params: expenseIdParamsSchema,
  handler: async ({ ctx, params }) => {
    const { id } = params;

    const { data: exp, error: eErr } = await ctx.supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (eErr) {
      throw new ApiHandlerError(eErr.message, { status: 500 });
    }
    if (!exp) {
      throw new ApiHandlerError("No encontrado", { status: 404 });
    }

    const { data: files, error: fErr } = await ctx.supabase
      .from("expense_files")
      .select("*")
      .eq("expense_id", id)
      .order("created_at", { ascending: true });
    if (fErr) {
      throw new ApiHandlerError(fErr.message, { status: 500 });
    }

    const withUrls = await Promise.all(
      (files ?? []).map(async (f) => ({
        ...f,
        signed_url: await signFileUrl(ctx.supabase, f.storage_path as string),
      })),
    );

    return { expense: exp, files: withUrls };
  },
});

export const PATCH = apiHandler({
  auth: "staff",
  module: "gastos",
  params: expenseIdParamsSchema,
  body: expensePatchSchema,
  handler: async ({ ctx, params, body }) => {
    const { id } = params;

    const patch: TablesUpdate<"expenses"> = {
      updated_at: new Date().toISOString(),
    };
    if (body.amount !== undefined) patch.amount = body.amount;
    if (body.currency !== undefined) patch.currency = body.currency.trim();
    if (body.category !== undefined) patch.category = body.category.trim();
    if (body.vendor_name !== undefined) {
      patch.vendor_name = body.vendor_name.trim();
    }
    if (body.description !== undefined) {
      patch.description = body.description.trim();
    }
    if (body.expense_date !== undefined) {
      patch.expense_date = body.expense_date.trim();
    }
    if (body.notes !== undefined) patch.notes = body.notes.trim();
    if (body.payment_method !== undefined) {
      patch.payment_method = body.payment_method.trim();
    }
    if (body.responsible !== undefined) {
      patch.responsible = body.responsible.trim();
    }

    const { data, error } = await ctx.supabase
      .from("expenses")
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) {
      throw new ApiHandlerError(error.message, { status: 500 });
    }
    if (!data) {
      throw new ApiHandlerError("No encontrado", { status: 404 });
    }
    return { expense: data };
  },
});

export const DELETE = apiHandler({
  auth: "staff",
  module: "gastos",
  params: expenseIdParamsSchema,
  handler: async ({ ctx, params }) => {
    const { id } = params;

    const { data: files, error: fErr } = await ctx.supabase
      .from("expense_files")
      .select("storage_path")
      .eq("expense_id", id);
    if (fErr) {
      throw new ApiHandlerError(fErr.message, { status: 500 });
    }

    const paths = (files ?? [])
      .map((r) => r.storage_path as string)
      .filter(Boolean);
    if (paths.length > 0) {
      const { error: rmErr } = await ctx.supabase.storage
        .from("expenses")
        .remove(paths);
      if (rmErr) {
        throw new ApiHandlerError(
          `No se pudo borrar archivos: ${rmErr.message}`,
          { status: 500 },
        );
      }
    }

    const { error: dErr } = await ctx.supabase
      .from("expenses")
      .delete()
      .eq("id", id);
    if (dErr) {
      throw new ApiHandlerError(dErr.message, { status: 500 });
    }
    return { ok: true as const };
  },
});
