import { lookupLocalBooking } from "@/lib/booking/create-reservation";
import {
  appendGuestMessage,
  getOrCreateThread,
  getThread,
} from "@/lib/guest/messages-store";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { code: raw } = await ctx.params;
  const code = raw?.trim().toUpperCase();
  if (!code) {
    return Response.json({ error: "code requerido" }, { status: 400 });
  }

  const reservation = lookupLocalBooking(code);
  const existing = getThread(code);
  if (!existing && !reservation) {
    return Response.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  const thread = getOrCreateThread(
    code,
    reservation?.guest_name ?? existing?.guest_name ?? "Huésped",
  );
  return Response.json({
    mode: "local_stub",
    thread,
    reservation: reservation
      ? {
          reservation_code: reservation.reservation_code,
          guest_name: reservation.guest_name,
          status: reservation.status,
          check_in: reservation.check_in,
          check_out: reservation.check_out,
        }
      : null,
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const { code: raw } = await ctx.params;
  const code = raw?.trim().toUpperCase();
  if (!code) {
    return Response.json({ error: "code requerido" }, { status: 400 });
  }

  let body: { body?: string } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const text = body.body?.trim() ?? "";
  if (!text) {
    return Response.json({ error: "body requerido" }, { status: 400 });
  }

  const reservation = lookupLocalBooking(code);
  if (!reservation && !getThread(code)) {
    return Response.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  const thread = appendGuestMessage(
    code,
    text,
    reservation?.guest_name,
  );
  return Response.json({ ok: true, thread, mode: "local_stub" });
}
