import { z } from "zod";

import { isAdminModuleKey } from "@/lib/api/admin-modules";
import { ApiHandlerError, apiHandler } from "@/lib/api/handler";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { TablesUpdate } from "@/types/database.types";

const patchBodySchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pending", "active", "suspended"]).optional(),
  role: z.enum(["super_admin", "admin", "staff"]).optional(),
  allowed_modules: z.array(z.string()).optional(),
  full_name: z.string().optional(),
});

export const GET = apiHandler({
  module: "usuarios",
  handler: async ({ ctx }) => {
    if (ctx.profile.role !== "super_admin" && ctx.profile.role !== "admin") {
      throw new ApiHandlerError("Forbidden", {
        status: 403,
        code: "FORBIDDEN",
      });
    }

    const admin = createServiceRoleClient();
    const { data, error: dbErr } = await admin
      .from("profiles")
      .select(
        "id, email, full_name, role, status, allowed_modules, created_at, updated_at",
      )
      .order("created_at", { ascending: false });

    if (dbErr) throw new ApiHandlerError(dbErr.message, { status: 500 });
    return { users: data ?? [] };
  },
});

export const PATCH = apiHandler({
  module: "usuarios",
  body: patchBodySchema,
  handler: async ({ body, ctx }) => {
    if (ctx.profile.role !== "super_admin") {
      throw new ApiHandlerError(
        "Solo el super_admin puede modificar usuarios",
        {
          status: 403,
          code: "FORBIDDEN",
        },
      );
    }

    if (body.allowed_modules) {
      const invalid = body.allowed_modules.filter((m) => !isAdminModuleKey(m));
      if (invalid.length > 0) {
        throw new ApiHandlerError(`Módulos inválidos: ${invalid.join(", ")}`, {
          status: 400,
          code: "BAD_REQUEST",
        });
      }
    }

    const admin = createServiceRoleClient();
    const updates: TablesUpdate<"profiles"> = {
      updated_at: new Date().toISOString(),
    };
    if (body.status !== undefined) updates.status = body.status;
    if (body.role !== undefined) updates.role = body.role;
    if (body.allowed_modules !== undefined) {
      updates.allowed_modules = body.allowed_modules;
    }
    if (body.full_name !== undefined) updates.full_name = body.full_name;

    const { data, error: dbErr } = await admin
      .from("profiles")
      .update(updates)
      .eq("id", body.id)
      .select("id, email, full_name, role, status, allowed_modules")
      .maybeSingle();

    if (dbErr) throw new ApiHandlerError(dbErr.message, { status: 500 });
    return { user: data };
  },
});
