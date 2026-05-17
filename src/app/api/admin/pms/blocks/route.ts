import { z } from "zod";

import { ApiHandlerError, apiHandler } from "@/lib/api/handler";
import { inclusiveRangeToExclusiveEnd } from "@/lib/pms/gaps";
import {
  findReservationConflicts,
  findBlockConflicts,
} from "@/lib/pms/conflicts";

const bodySchema = z.object({
  property_id: z.string().min(1),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  end_inclusive: z.boolean().optional(),
  reason: z.string().optional(),
});

export const POST = apiHandler({
  module: "reservas",
  body: bodySchema,
  handler: async ({ body, ctx }) => {
    const endAlreadyExclusive = body.end_inclusive === false;
    const { start_date, end_date } = endAlreadyExclusive
      ? { start_date: body.start_date, end_date: body.end_date }
      : inclusiveRangeToExclusiveEnd(body.start_date, body.end_date);
    if (end_date <= start_date) {
      throw new ApiHandlerError(
        "El rango de bloqueo debe tener al menos un día.",
        { status: 400, code: "BAD_REQUEST" },
      );
    }

    const resHits = await findReservationConflicts(
      ctx.supabase,
      body.property_id,
      start_date,
      end_date,
    );
    if (resHits.length > 0) {
      throw new ApiHandlerError(
        "No se puede bloquear: hay reservas activas en esas fechas.",
        { status: 409, code: "CONFLICT" },
      );
    }
    const blkHits = await findBlockConflicts(
      ctx.supabase,
      body.property_id,
      start_date,
      end_date,
    );
    if (blkHits.length > 0) {
      throw new ApiHandlerError(
        "Ya existe un bloqueo que se solapa con el rango.",
        { status: 409, code: "CONFLICT" },
      );
    }

    const { data, error } = await ctx.supabase
      .from("availability_blocks")
      .insert({
        property_id: body.property_id,
        start_date,
        end_date,
        reason: body.reason?.trim() ?? "",
        created_by: ctx.user.id,
      })
      .select("*")
      .maybeSingle();
    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    return { block: data };
  },
});
