import { z } from "zod";

import { ApiHandlerError, apiHandler } from "@/lib/api/handler";
import type { TablesUpdate } from "@/types/database.types";

const paramsSchema = z.object({
  id: z.string().min(1),
});

const patchBodySchema = z.object({
  status: z.enum(["pending", "in_progress", "done"]).optional(),
  assigned_to: z.string().nullable().optional(),
  notes: z.string().optional(),
  cleaning_price: z.number().nullable().optional(),
  bed_setup_notes: z.string().optional(),
});

export const PATCH = apiHandler({
  module: "aseos",
  params: paramsSchema,
  body: patchBodySchema,
  handler: async ({ params, body, ctx }) => {
    const { supabase, user } = ctx;

    const { data: cur, error: curErr } = await supabase
      .from("cleaning_tasks")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    if (curErr) throw new ApiHandlerError(curErr.message, { status: 500 });
    if (!cur) {
      throw new ApiHandlerError("Tarea no encontrada", {
        status: 404,
        code: "NOT_FOUND",
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const isSuper =
      profile?.role === "super_admin" || profile?.role === "admin";

    const patch: TablesUpdate<"cleaning_tasks"> = {};
    if (body.status !== undefined) patch.status = body.status;
    if (body.notes !== undefined) patch.notes = body.notes;
    if (body.bed_setup_notes !== undefined) {
      patch.bed_setup_notes = body.bed_setup_notes;
    }
    if (body.cleaning_price !== undefined) {
      if (!isSuper) {
        throw new ApiHandlerError("Prohibido: solo supervisor edita precio", {
          status: 403,
          code: "FORBIDDEN",
        });
      }
      patch.cleaning_price = body.cleaning_price;
    }
    if (body.assigned_to !== undefined) {
      if (!isSuper) {
        throw new ApiHandlerError(
          "Prohibido: solo supervisor asigna personal",
          {
            status: 403,
            code: "FORBIDDEN",
          },
        );
      }
      patch.assigned_to = body.assigned_to;
    }

    if (Object.keys(patch).length === 0) {
      throw new ApiHandlerError("Sin cambios", {
        status: 400,
        code: "BAD_REQUEST",
      });
    }

    const { data, error } = await supabase
      .from("cleaning_tasks")
      .update(patch)
      .eq("id", params.id)
      .select("*")
      .maybeSingle();
    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    return { task: data };
  },
});
