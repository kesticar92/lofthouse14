import { z } from "zod";

import { ApiHandlerError, apiHandler } from "@/lib/api/handler";
import {
  findReservationConflicts,
  findBlockConflicts,
} from "@/lib/pms/conflicts";
import { regenerateCleaningTasksForReservation } from "@/lib/pms/cleaning-rpc";
import { normalizeReservationSource } from "@/lib/pms/reservation-source";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { notifySupervisorsNewReservation } from "@/lib/pms/panel-notifications";

const getQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  property_id: z.string().optional(),
});

const postBodySchema = z.object({
  property_id: z.string().min(1),
  guest_name: z.string().optional(),
  guest_phone: z.string().optional(),
  check_in: z.string().min(1),
  check_out: z.string().min(1),
  guests: z.coerce.number().int().min(1).optional(),
  price: z.number().nullable().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  referrer_name: z.string().optional(),
  commission_amount: z.number().nullable().optional(),
});

export const GET = apiHandler({
  module: "reservas",
  query: getQuerySchema,
  handler: async ({ query, ctx }) => {
    const from =
      query.from?.trim() ??
      new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const to =
      query.to?.trim() ??
      new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10);
    const propertyId = query.property_id?.trim();

    let q = ctx.supabase
      .from("reservations")
      .select("*")
      .lt("check_in", to)
      .gt("check_out", from)
      .order("check_in");
    if (propertyId) q = q.eq("property_id", propertyId);
    const { data, error } = await q;
    if (error) throw new ApiHandlerError(error.message, { status: 500 });

    let bq = ctx.supabase
      .from("availability_blocks")
      .select("*")
      .lt("start_date", to)
      .gt("end_date", from)
      .order("start_date");
    if (propertyId) bq = bq.eq("property_id", propertyId);
    const { data: blocks, error: bErr } = await bq;
    if (bErr) throw new ApiHandlerError(bErr.message, { status: 500 });

    return { reservations: data ?? [], blocks: blocks ?? [] };
  },
});

export const POST = apiHandler({
  module: "reservas",
  body: postBodySchema,
  handler: async ({ body, ctx }) => {
    const check_in = body.check_in.trim();
    const check_out = body.check_out.trim();
    if (check_out <= check_in) {
      throw new ApiHandlerError(
        "check_out debe ser posterior a check_in (fin exclusivo)",
        { status: 400, code: "BAD_REQUEST" },
      );
    }
    const guests = body.guests ?? 1;
    const source = normalizeReservationSource(body.source);
    const status = (body.status ?? "confirmed").trim() || "confirmed";
    if (!["confirmed", "blocked", "cancelled"].includes(status)) {
      throw new ApiHandlerError("status inválido", {
        status: 400,
        code: "BAD_REQUEST",
      });
    }

    const referrer_name = body.referrer_name?.trim() ?? "";
    let commission_amount: number | null = null;
    if (
      body.commission_amount !== undefined &&
      body.commission_amount !== null
    ) {
      const n = Number(body.commission_amount);
      if (!Number.isFinite(n) || n < 0) {
        throw new ApiHandlerError("commission_amount inválido", {
          status: 400,
          code: "BAD_REQUEST",
        });
      }
      commission_amount = n;
    }

    if (source === "referral" && !referrer_name) {
      throw new ApiHandlerError(
        "Las reservas referidas requieren el nombre del referidor (quién recibe la comisión).",
        { status: 400, code: "BAD_REQUEST" },
      );
    }

    const conflicts = await findReservationConflicts(
      ctx.supabase,
      body.property_id,
      check_in,
      check_out,
    );
    if (conflicts.length > 0) {
      throw new ApiHandlerError(
        "Conflicto: ya hay una reserva activa en esas fechas.",
        { status: 409, code: "CONFLICT" },
      );
    }
    const blockHits = await findBlockConflicts(
      ctx.supabase,
      body.property_id,
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

    const row = {
      property_id: body.property_id,
      source,
      external_id: null as string | null,
      guest_name: body.guest_name?.trim() ?? "",
      guest_phone: body.guest_phone?.trim() ?? "",
      check_in,
      check_out,
      guests,
      price: body.price ?? null,
      status,
      notes: body.notes?.trim() ?? "",
      ical_summary: null as string | null,
      referrer_name: source === "referral" ? referrer_name : "",
      commission_amount: source === "referral" ? commission_amount : null,
    };

    const { data, error } = await ctx.supabase
      .from("reservations")
      .insert(row)
      .select("*")
      .maybeSingle();
    if (error) throw new ApiHandlerError(error.message, { status: 500 });

    if (data?.id) {
      const { error: rpcErr } = await regenerateCleaningTasksForReservation(
        ctx.supabase,
        data.id,
      );
      if (rpcErr)
        console.error("regenerateCleaningTasksForReservation", rpcErr);
      if (data.status === "confirmed") {
        try {
          const admin = createServiceRoleClient();
          const { data: prop } = await admin
            .from("properties")
            .select("name")
            .eq("id", data.property_id)
            .maybeSingle();
          await notifySupervisorsNewReservation(admin, {
            propertyName: prop?.name ?? "Propiedad",
            guestName: data.guest_name ?? "",
            source: data.source ?? "",
            checkIn: data.check_in,
            checkOut: data.check_out,
          });
        } catch {
          /* sin SERVICE_ROLE_KEY */
        }
      }
    }
    return { reservation: data };
  },
});
