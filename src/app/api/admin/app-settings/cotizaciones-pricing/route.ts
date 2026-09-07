import { ApiHandlerError, apiHandler } from "@/lib/api/handler";
import { parseCotizacionesPricing } from "@/lib/cotizaciones-pricing";
import { pricingConfigSchema } from "@/features/cotizaciones/schemas";

const APP_SETTINGS_KEY = "cotizaciones_pricing";

const patchBodySchema = pricingConfigSchema.partial();

export const GET = apiHandler({
  module: "cotizaciones",
  handler: async ({ ctx }) => {
    if (!ctx.organizationId) {
      throw new ApiHandlerError("Sin organización activa", {
        status: 403,
        code: "FORBIDDEN_NO_ORG",
      });
    }
    const { data, error } = await ctx.supabase
      .from("app_settings")
      .select("value")
      .eq("organization_id", ctx.organizationId)
      .eq("key", APP_SETTINGS_KEY)
      .maybeSingle();
    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    return { pricing: parseCotizacionesPricing(data?.value) };
  },
});

export const PATCH = apiHandler({
  module: "cotizaciones",
  body: patchBodySchema,
  handler: async ({ body, ctx }) => {
    if (!ctx.organizationId) {
      throw new ApiHandlerError("Sin organización activa", {
        status: 403,
        code: "FORBIDDEN_NO_ORG",
      });
    }
    const { data: profile } = await ctx.supabase
      .from("profiles")
      .select("role")
      .eq("id", ctx.user.id)
      .maybeSingle();
    if (profile?.role !== "super_admin" && profile?.role !== "admin") {
      throw new ApiHandlerError("Prohibido", {
        status: 403,
        code: "FORBIDDEN",
      });
    }

    const current = parseCotizacionesPricing(
      (
        await ctx.supabase
          .from("app_settings")
          .select("value")
          .eq("organization_id", ctx.organizationId)
          .eq("key", APP_SETTINGS_KEY)
          .maybeSingle()
      ).data?.value,
    );

    const merged = { ...current, ...body };

    const { error } = await ctx.supabase.from("app_settings").upsert(
      {
        organization_id: ctx.organizationId,
        key: APP_SETTINGS_KEY,
        value: merged,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,key" },
    );
    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    return { pricing: merged };
  },
});
