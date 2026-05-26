import { z } from "zod";

import { ApiHandlerError, apiHandler } from "@/lib/api/handler";
import {
  findReservationConflicts,
  findBlockConflicts,
} from "@/lib/pms/conflicts";
import { regenerateCleaningTasksForReservation } from "@/lib/pms/cleaning-rpc";
import { normalizeReservationSource } from "@/lib/pms/reservation-source";

const paramsSchema = z.object({
  id: z.string().min(1),
});

const patchBodySchema = z.object({
  property_id: z.string().optional(),
  check_in: z.string().optional(),
  check_out: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  guest_name: z.string().optional(),
  guest_phone: z.string().optional(),
  guests: z.coerce.number().int().min(1).optional(),
  price: z.number().nullable().optional(),
  notes: z.string().optional(),
  referrer_name: z.string().optional(),
  commission_amount: z.number().nullable().optional(),
});

export const PATCH = apiHandler({
  module: "reservas",
  params: paramsSchema,
  body: patchBodySchema,
  handler: async ({ params, body, ctx }) => {
    const { supabase } = ctx;

    const { data: cur, error: curErr } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    if (curErr) throw new ApiHandlerError(curErr.message, { status: 500 });
    if (!cur) {
      throw new ApiHandlerError("Reserva no encontrada", {
        status: 404,
        code: "NOT_FOUND",
      });
    }
    if (cur.status === "cancelled") {
      throw new ApiHandlerError(
        "La reserva está cancelada y no se puede editar.",
        { status: 400, code: "BAD_REQUEST" },
      );
    }

    const wantsCalendarChange =
      body.property_id !== undefined ||
      body.check_in !== undefined ||
      body.check_out !== undefined;

    const property_id = (body.property_id ?? cur.property_id).trim();
    const check_in = (body.check_in ?? cur.check_in).trim();
    const check_out = (body.check_out ?? cur.check_out).trim();
    const nextStatus =
      body.status !== undefined ? body.status.trim() : cur.status;

    if (!["confirmed", "blocked", "cancelled"].includes(nextStatus)) {
      throw new ApiHandlerError("status inválido", {
        status: 400,
        code: "BAD_REQUEST",
      });
    }

    const nextSource =
      body.source !== undefined
        ? normalizeReservationSource(body.source)
        : normalizeReservationSource(cur.source);

    const nextGuestName =
      body.guest_name !== undefined ? body.guest_name.trim() : cur.guest_name;
    const nextGuestPhone =
      body.guest_phone !== undefined
        ? body.guest_phone.trim()
        : cur.guest_phone;
    const nextGuests =
      body.guests !== undefined ? Number(body.guests) : cur.guests;
    if (
      body.guests !== undefined &&
      (!Number.isFinite(nextGuests) || nextGuests < 1)
    ) {
      throw new ApiHandlerError("guests inválido", {
        status: 400,
        code: "BAD_REQUEST",
      });
    }
    const nextPrice = body.price !== undefined ? body.price : cur.price;
    const nextNotes = body.notes !== undefined ? body.notes.trim() : cur.notes;

    const nextReferrerRaw =
      body.referrer_name !== undefined
        ? body.referrer_name.trim()
        : ((cur as { referrer_name?: string }).referrer_name ?? "");

    let nextCommission: number | null =
      (cur as { commission_amount?: number | null }).commission_amount ?? null;
    if (body.commission_amount !== undefined) {
      if (body.commission_amount === null) {
        nextCommission = null;
      } else {
        const n = Number(body.commission_amount);
        if (!Number.isFinite(n) || n < 0) {
          throw new ApiHandlerError("commission_amount inválido", {
            status: 400,
            code: "BAD_REQUEST",
          });
        }
        nextCommission = n;
      }
    }

    const effectiveReferrer = nextSource === "referral" ? nextReferrerRaw : "";
    const effectiveCommission =
      nextSource === "referral" ? nextCommission : null;

    if (nextSource === "referral" && !effectiveReferrer) {
      throw new ApiHandlerError(
        "Las reservas referidas requieren el nombre del referidor (quién recibe la comisión).",
        { status: 400, code: "BAD_REQUEST" },
      );
    }

    if (wantsCalendarChange) {
      if (check_out <= check_in) {
        throw new ApiHandlerError(
          "check_out debe ser posterior a check_in (fin exclusivo)",
          { status: 400, code: "BAD_REQUEST" },
        );
      }

      const { data: prop, error: pErr } = await supabase
        .from("properties")
        .select("id")
        .eq("id", property_id)
        .maybeSingle();
      if (pErr || !prop) {
        throw new ApiHandlerError("Propiedad no válida", {
          status: 400,
          code: "BAD_REQUEST",
        });
      }

      const conflicts = await findReservationConflicts(
        supabase,
        property_id,
        check_in,
        check_out,
        params.id,
      );
      if (conflicts.length > 0) {
        throw new ApiHandlerError(
          "Conflicto: ya hay una reserva activa en esas fechas.",
          { status: 409, code: "CONFLICT" },
        );
      }
      const blockHits = await findBlockConflicts(
        supabase,
        property_id,
        check_in,
        check_out,
      );
      if (blockHits.length > 0) {
        throw new ApiHandlerError(
          "Conflicto: las fechas coinciden con un bloqueo.",
          {
            status: 409,
            code: "CONFLICT",
          },
        );
      }
    }

    const { data, error } = await supabase
      .from("reservations")
      .update({
        property_id,
        check_in,
        check_out,
        status: nextStatus,
        source: nextSource,
        guest_name: nextGuestName,
        guest_phone: nextGuestPhone,
        guests: nextGuests,
        price: nextPrice,
        notes: nextNotes,
        referrer_name: effectiveReferrer,
        commission_amount: effectiveCommission,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select("*")
      .maybeSingle();
    if (error) throw new ApiHandlerError(error.message, { status: 500 });

    const { error: rpcErr } = await regenerateCleaningTasksForReservation(
      supabase,
      params.id,
    );
    if (rpcErr) console.error("regenerateCleaningTasksForReservation", rpcErr);

    return { reservation: data };
  },
});
