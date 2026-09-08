/**
 * Simulador Channel Manager — importar reserva OTA al store local.
 * TODO: REAL INTEGRATION REQUIRED para APIs Airbnb/Booking/Expedia.
 */

import { createLocalBooking } from "@/lib/booking/create-reservation";
import { getLocalPaymentByCode } from "@/lib/payments/local-store";
import type { ChannelId } from "@/lib/channels/adapter";
import type { MarketingCategory } from "@/lib/catalog/seed";

export type ImportChannelReservationInput = {
  channel: ChannelId | string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
  categoryId?: MarketingCategory;
  price?: number | null;
  externalId?: string;
};

export function importChannelReservation(input: ImportChannelReservationInput) {
  const channel = (input.channel || "airbnb").toLowerCase();
  const guestName =
    input.guestName?.trim() ||
    `Huésped ${channel.charAt(0).toUpperCase()}${channel.slice(1)}`;

  const result = createLocalBooking({
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests ?? 2,
    guestName,
    guestEmail: input.guestEmail,
    guestPhone: input.guestPhone,
    categoryId: input.categoryId ?? "vista",
    price: input.price ?? 180_000,
    source: channel,
    notes: `Import simulado OTA · external=${input.externalId ?? "sim"} · TODO: REAL INTEGRATION REQUIRED`,
    pending: false,
  });

  if (!result.ok) {
    return {
      ok: false as const,
      error: result.error,
      code: result.code,
      note: "STUB import — no se creó reserva",
    };
  }

  result.reservation.channel = channel;
  result.reservation.source = channel;

  const payment =
    result.payment ??
    getLocalPaymentByCode(result.reservation.reservation_code);

  if (!payment) {
    return {
      ok: false as const,
      error: "No se pudo crear payment pending",
      code: "PAYMENT_MISSING",
      note: "STUB import — reserva creada pero sin payment",
    };
  }

  return {
    ok: true as const,
    mode: "local" as const,
    reservation: result.reservation,
    payment,
    note: "STUB — reserva importada al store local. TODO: REAL INTEGRATION REQUIRED",
  };
}
