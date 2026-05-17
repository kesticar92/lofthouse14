import { z } from "zod";

import { ApiHandlerError, apiHandler } from "@/lib/api/handler";
import {
  DEFAULT_CLEANING_PRICING,
  parseCleaningPricing,
} from "@/lib/pms/cleaning-pricing";

const patchBodySchema = z.object({
  base_cop: z.number().optional(),
  guest_threshold: z.number().int().optional(),
  extra_per_guest_cop: z.number().optional(),
});

export const GET = apiHandler({
  module: "aseos",
  handler: async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("app_settings")
      .select("value")
      .eq("key", "cleaning_pricing")
      .maybeSingle();
    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    return { pricing: parseCleaningPricing(data?.value) };
  },
});

export const PATCH = apiHandler({
  module: "aseos",
  body: patchBodySchema,
  handler: async ({ body, ctx }) => {
    const { data: profile } = await ctx.supabase
      .from("profiles")
      .select("role")
      .eq("id", ctx.user.id)
      .maybeSingle();
    if (profile?.role !== "super_admin" && profile?.role !== "admin") {
      throw new ApiHandlerError("Prohibido", { status: 403, code: "FORBIDDEN" });
    }

    const merged = {
      ...DEFAULT_CLEANING_PRICING,
      ...parseCleaningPricing(
        (
          await ctx.supabase
            .from("app_settings")
            .select("value")
            .eq("key", "cleaning_pricing")
            .maybeSingle()
        ).data?.value,
      ),
      ...(body.base_cop !== undefined ? { base_cop: body.base_cop } : {}),
      ...(body.guest_threshold !== undefined
        ? { guest_threshold: body.guest_threshold }
        : {}),
      ...(body.extra_per_guest_cop !== undefined
        ? { extra_per_guest_cop: body.extra_per_guest_cop }
        : {}),
    };

    const { error } = await ctx.supabase.from("app_settings").upsert(
      {
        key: "cleaning_pricing",
        value: merged,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    return { pricing: merged };
  },
});
