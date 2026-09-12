import { site } from "@/lib/site";
import { formatCOP } from "@/lib/pricing";
import { nightsBetween } from "@/lib/guest/status";

export const WA_RESERVATION_STORAGE_KEY = "lofthouse_wa_reservation_message_v1";

export type WhatsAppReservationPayload = {
  reservationCode?: string | null;
  guestName?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  guests?: number | null;
  lofts?: number | null;
  price?: number | null;
  extras?: Array<{
    id?: string | null;
    label?: string | null;
    amountCop?: number | null;
  }> | null;
  channel?: string | null;
  corporateName?: string | null;
  referrerName?: string | null;
  notes?: string | null;
  tripType?: string | null;
  categoryLabel?: string | null;
  depositPct?: number | null;
  couponCode?: string | null;
  couponDiscount?: number | null;
  stayBreakdown?: string | null;
};

function channelLabel(channel?: string | null) {
  switch ((channel ?? "").toLowerCase()) {
    case "corporate":
    case "corp":
      return "Corporativo / empresa";
    case "referral":
    case "referrer":
      return "Referido";
    case "whatsapp":
      return "WhatsApp";
    case "direct":
    case "":
      return "Directo (web)";
    default:
      return channel;
  }
}

/** Mensaje completo de reserva para WhatsApp (wizard + confirmación). */
export function buildReservationWhatsAppMessage(
  payload: WhatsAppReservationPayload,
): string {
  const nights =
    payload.checkIn && payload.checkOut
      ? nightsBetween(payload.checkIn, payload.checkOut)
      : 0;
  const extras = (payload.extras ?? []).filter(
    (e) => e && (e.label || e.id),
  );
  const extraLines = extras.map((e) => {
    const label = e.label || e.id || "Extra";
    if (e.amountCop != null && e.amountCop > 0) {
      return `• ${label}: ${formatCOP(e.amountCop)}`;
    }
    return `• ${label}: me interesa / a confirmar`;
  });
  const depositAmount =
    payload.price != null &&
    payload.depositPct != null &&
    payload.depositPct > 0
      ? Math.round((payload.price * payload.depositPct) / 100)
      : null;

  const lines = [
    payload.reservationCode
      ? `Hola ${site.name}, confirmo mi reserva ${payload.reservationCode}:`
      : `Hola ${site.name}, quiero reservar:`,
    payload.guestName?.trim() ? `Nombre: ${payload.guestName.trim()}` : "",
    payload.reservationCode && !payload.guestName
      ? `Código reserva: ${payload.reservationCode}`
      : "",
    payload.tripType ? `Tipo de viaje: ${payload.tripType}` : "",
    payload.categoryLabel
      ? `Preferencia de loft: ${payload.categoryLabel}`
      : "",
    payload.checkIn && payload.checkOut
      ? `Fechas: ${payload.checkIn} → ${payload.checkOut}${
          nights > 0
            ? ` (${nights} noche${nights === 1 ? "" : "s"})`
            : ""
        }`
      : "",
    `Check-in: ${site.checkIn} · Check-out: ${site.checkOut}`,
    payload.guests != null
      ? `Huéspedes: ${payload.guests}${
          payload.lofts != null ? ` · Lofts: ${payload.lofts}` : ""
        }`
      : payload.lofts != null
        ? `Lofts: ${payload.lofts}`
        : "",
    `Dirección: ${site.addressLine}, ${site.neighborhood}, ${site.city}`,
    payload.channel ? `Canal: ${channelLabel(payload.channel)}` : "",
    payload.corporateName?.trim()
      ? `Empresa: ${payload.corporateName.trim()}`
      : "",
    payload.referrerName?.trim()
      ? `Referido por: ${payload.referrerName.trim()}`
      : "",
    extraLines.length
      ? `\nExtras:\n${extraLines.join("\n")}`
      : "\nExtras: ninguno",
    payload.price != null
      ? `\nTotal estimado (web): ${formatCOP(payload.price)}`
      : "",
    depositAmount != null
      ? `Anticipo sugerido (${payload.depositPct}%): ${formatCOP(depositAmount)}`
      : "",
    payload.couponDiscount &&
    payload.couponDiscount > 0 &&
    payload.couponCode
      ? `Cupón ${payload.couponCode.trim().toUpperCase()}: −${formatCOP(payload.couponDiscount)}`
      : "",
    payload.stayBreakdown ? `(${payload.stayBreakdown})` : "",
    payload.notes?.trim() ? `Notas: ${payload.notes.trim()}` : "",
    "",
    "Confirmo que la tarifa final y descuentos de grupo o larga estadía se cierran por WhatsApp.",
  ];

  return lines.filter(Boolean).join("\n");
}

export function stashWhatsAppReservationMessage(message: string) {
  try {
    sessionStorage.setItem(WA_RESERVATION_STORAGE_KEY, message);
  } catch {
    /* ignore */
  }
}

export function takeWhatsAppReservationMessage(): string | null {
  try {
    const msg = sessionStorage.getItem(WA_RESERVATION_STORAGE_KEY);
    if (msg) sessionStorage.removeItem(WA_RESERVATION_STORAGE_KEY);
    return msg;
  } catch {
    return null;
  }
}
