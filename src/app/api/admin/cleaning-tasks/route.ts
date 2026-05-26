import { z } from "zod";

import { ApiHandlerError, apiHandler } from "@/lib/api/handler";
import {
  computeCleaningPrice,
  parseCleaningPricing,
} from "@/lib/pms/cleaning-pricing";

const getQuerySchema = z.object({
  date: z.string().optional(),
});

const postBodySchema = z.object({
  property_id: z.string().min(1),
  task_date: z.string().min(1),
  notes: z.string().optional(),
  guests: z.coerce.number().int().min(1).optional(),
  assigned_to: z.string().nullable().optional(),
  cleaning_price: z.number().nullable().optional(),
});

export const GET = apiHandler({
  module: "aseos",
  query: getQuerySchema,
  handler: async ({ query, ctx }) => {
    const date = query.date?.trim() ?? new Date().toISOString().slice(0, 10);

    const { data: tasks, error } = await ctx.supabase
      .from("cleaning_tasks")
      .select("*")
      .eq("task_date", date)
      .order("estimated_time_label", { ascending: true });
    if (error) throw new ApiHandlerError(error.message, { status: 500 });

    const ids = [...new Set((tasks ?? []).map((t) => t.property_id))];
    let propNames: Record<string, string> = {};
    if (ids.length > 0) {
      const { data: props } = await ctx.supabase
        .from("properties")
        .select("id,name")
        .in("id", ids);
      propNames = Object.fromEntries((props ?? []).map((p) => [p.id, p.name]));
    }

    const enriched = (tasks ?? []).map((t) => ({
      ...t,
      property_name: propNames[t.property_id] ?? "—",
    }));

    return { tasks: enriched, date };
  },
});

export const POST = apiHandler({
  module: "aseos",
  body: postBodySchema,
  handler: async ({ body, ctx }) => {
    const guests = body.guests ?? 1;

    let price = body.cleaning_price ?? null;
    if (price == null) {
      const { data: row } = await ctx.supabase
        .from("app_settings")
        .select("value")
        .eq("key", "cleaning_pricing")
        .maybeSingle();
      const rules = parseCleaningPricing(row?.value);
      price = computeCleaningPrice(guests, rules);
    }

    const { data, error } = await ctx.supabase
      .from("cleaning_tasks")
      .insert({
        property_id: body.property_id,
        reservation_id: null,
        task_date: body.task_date,
        type: "manual",
        status: "pending",
        guests,
        source: "manual",
        guest_name: "",
        notes: body.notes?.trim() ?? "",
        bed_setup_notes: "",
        cleaning_price: price,
        estimated_time_label: "Tarea manual",
        assigned_to: body.assigned_to?.trim() || null,
      })
      .select("*")
      .maybeSingle();

    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    return { task: data };
  },
});
