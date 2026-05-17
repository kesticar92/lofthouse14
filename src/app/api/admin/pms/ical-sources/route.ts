import { z } from "zod";

import { ApiHandlerError, apiHandler } from "@/lib/api/handler";
import { syncIcalSource } from "@/lib/pms/ical-sync";

const getQuerySchema = z.object({
  property_id: z.string().optional(),
});

const postBodySchema = z.object({
  property_id: z.string().min(1),
  url: z.string().min(1),
  sync_now: z.boolean().optional(),
});

export const GET = apiHandler({
  module: "reservas",
  query: getQuerySchema,
  handler: async ({ query, ctx }) => {
    const propertyId = query.property_id?.trim();
    let q = ctx.supabase
      .from("ical_sources")
      .select("id, property_id, url, last_sync, created_at, updated_at")
      .order("created_at");
    if (propertyId) q = q.eq("property_id", propertyId);
    const { data, error } = await q;
    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    return { sources: data ?? [] };
  },
});

export const POST = apiHandler({
  module: "reservas",
  body: postBodySchema,
  handler: async ({ body, ctx }) => {
    try {
      new URL(body.url);
    } catch {
      throw new ApiHandlerError("URL iCal inválida", {
        status: 400,
        code: "BAD_REQUEST",
      });
    }

    const { data: ins, error: insErr } = await ctx.supabase
      .from("ical_sources")
      .insert({ property_id: body.property_id, url: body.url })
      .select("*")
      .maybeSingle();
    if (insErr || !ins?.id) {
      throw new ApiHandlerError(insErr?.message ?? "No se pudo crear la fuente", {
        status: 500,
      });
    }

    let sync: { ok: boolean; message: string; upserted: number } | null = null;
    if (body.sync_now) {
      sync = await syncIcalSource(
        ctx.supabase,
        ins.id,
        body.property_id,
        body.url,
      );
    }

    const { data: row } = await ctx.supabase
      .from("ical_sources")
      .select("*")
      .eq("id", ins.id)
      .maybeSingle();

    return { source: row, sync };
  },
});
