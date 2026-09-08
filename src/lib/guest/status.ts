/** Etiquetas y helpers de estado para experiencia huésped. */

export type GuestReservationStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "no_show"
  | string;

export type GuestPaymentStatus =
  | "unpaid"
  | "pending"
  | "partial"
  | "paid"
  | "refunded"
  | "failed"
  | string;

export function guestStatusLabel(status?: string | null): string {
  switch ((status ?? "").toLowerCase()) {
    case "pending":
      return "Pendiente de confirmación";
    case "confirmed":
      return "Confirmada";
    case "checked_in":
      return "En casa (check-in hecho)";
    case "checked_out":
      return "Finalizada";
    case "cancelled":
      return "Cancelada";
    case "no_show":
      return "No show";
    default:
      return status?.trim() || "Sin estado";
  }
}

export function guestPaymentLabel(status?: string | null): string {
  switch ((status ?? "").toLowerCase()) {
    case "unpaid":
      return "Saldo pendiente";
    case "pending":
      return "Pago en proceso";
    case "pending_deposit":
      return "Depósito pendiente";
    case "deposit_paid":
      return "Depósito pagado";
    case "partial":
      return "Pago parcial";
    case "paid":
      return "Pagado";
    case "refunded":
      return "Reembolsado";
    case "failed":
      return "Pago fallido";
    case "cancelled":
    case "cancelled_with_fee":
      return "Cancelado";
    default:
      return status?.trim() || "Sin info de pago";
  }
}

export function guestStatusTone(
  status?: string | null,
): "neutral" | "ok" | "warn" | "bad" {
  switch ((status ?? "").toLowerCase()) {
    case "confirmed":
    case "checked_in":
    case "checked_out":
    case "paid":
    case "deposit_paid":
      return "ok";
    case "pending":
    case "pending_deposit":
    case "unpaid":
    case "partial":
      return "warn";
    case "cancelled":
    case "cancelled_with_fee":
    case "no_show":
    case "failed":
      return "bad";
    default:
      return "neutral";
  }
}

export function nightsBetween(checkIn?: string, checkOut?: string): number {
  if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
  const a = Date.parse(`${checkIn}T12:00:00Z`);
  const b = Date.parse(`${checkOut}T12:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}
