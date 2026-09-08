/**
 * Canales / origen de reserva (direct, corporate, referral, OTA stubs…).
 */

export const BOOKING_CHANNELS = [
  "direct",
  "walk_in",
  "corporate",
  "referral",
  "whatsapp",
  "airbnb",
  "booking",
  "expedia",
  "ical",
] as const;

export type BookingChannel = (typeof BOOKING_CHANNELS)[number];

export const BOOKING_CHANNEL_LABELS: Record<BookingChannel, string> = {
  direct: "Directo web",
  walk_in: "Walk-in",
  corporate: "Corporativo",
  referral: "Referido",
  whatsapp: "WhatsApp",
  airbnb: "Airbnb",
  booking: "Booking.com",
  expedia: "Expedia",
  ical: "iCal",
};

export function isBookingChannel(s: string): s is BookingChannel {
  return (BOOKING_CHANNELS as readonly string[]).includes(s);
}

export function normalizeBookingChannel(
  raw?: string | null,
  fallback: BookingChannel = "direct",
): BookingChannel {
  const v = (raw ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  if (isBookingChannel(v)) return v;
  if (v === "website" || v === "web" || v === "lofthouse") return "direct";
  if (v === "corp" || v === "empresa" || v === "b2b") return "corporate";
  if (v === "referred" || v === "referido") return "referral";
  return fallback;
}

export type ChannelMeta = {
  channel: BookingChannel;
  /** Empresa / cuenta corporativa */
  corporate_name?: string;
  /** Quién refiere (comisión stub) */
  referrer_name?: string;
};

export function formatChannelNote(meta: ChannelMeta): string {
  const parts: string[] = [];
  if (meta.channel === "corporate" && meta.corporate_name?.trim()) {
    parts.push(`Corp: ${meta.corporate_name.trim()}`);
  }
  if (meta.channel === "referral" && meta.referrer_name?.trim()) {
    parts.push(`Ref: ${meta.referrer_name.trim()}`);
  }
  return parts.join(" · ");
}
