import { randomBytes } from "crypto";
import { z } from "zod";

import { ApiHandlerError, apiHandler } from "@/lib/api/handler";
import type { TablesUpdate } from "@/types/database.types";

const patchBodySchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  regenerate_ical_token: z.boolean().optional(),
});

const postBodySchema = z.object({
  name: z.string().min(1),
});

const deleteQuerySchema = z.object({
  id: z.string().min(1),
});

export const GET = apiHandler({
  module: "reservas",
  handler: async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("properties")
      .select("id, name, ical_token, created_at, updated_at")
      .order("name");
    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    return { properties: data ?? [] };
  },
});

export const POST = apiHandler({
  module: "reservas",
  body: postBodySchema,
  handler: async ({ body, ctx }) => {
    if (ctx.profile.role !== "super_admin" && ctx.profile.role !== "admin") {
      throw new ApiHandlerError("Solo admin puede crear propiedades", {
        status: 403,
        code: "FORBIDDEN",
      });
    }
    const token = randomBytes(24).toString("hex");
    const { data, error } = await ctx.supabase
      .from("properties")
      .insert({ name: body.name.trim(), ical_token: token })
      .select("id, name, ical_token, created_at, updated_at")
      .maybeSingle();
    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    return { property: data };
  },
});

export const PATCH = apiHandler({
  module: "reservas",
  body: patchBodySchema,
  handler: async ({ body, ctx }) => {
    if (ctx.profile.role !== "super_admin" && ctx.profile.role !== "admin") {
      throw new ApiHandlerError("Solo admin puede editar propiedades", {
        status: 403,
        code: "FORBIDDEN",
      });
    }

    const updates: TablesUpdate<"properties"> = {
      updated_at: new Date().toISOString(),
    };
    if (body.regenerate_ical_token) {
      updates.ical_token = randomBytes(24).toString("hex");
    }
    if (body.name?.trim()) updates.name = body.name.trim();

    const { data, error } = await ctx.supabase
      .from("properties")
      .update(updates)
      .eq("id", body.id)
      .select("id, name, ical_token, updated_at")
      .maybeSingle();
    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    return { property: data };
  },
});

export const DELETE = apiHandler({
  module: "reservas",
  query: deleteQuerySchema,
  handler: async ({ query, ctx }) => {
    if (ctx.profile.role !== "super_admin") {
      throw new ApiHandlerError("Solo super_admin puede eliminar propiedades", {
        status: 403,
        code: "FORBIDDEN",
      });
    }
    const { error } = await ctx.supabase
      .from("properties")
      .delete()
      .eq("id", query.id);
    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    return { deleted: true };
  },
});
