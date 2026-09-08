"use client";

import Link from "next/link";
import { site, waLink } from "@/lib/site";
import { formatCOP } from "@/lib/pricing";
import {
  guestPaymentLabel,
  guestStatusLabel,
  guestStatusTone,
  nightsBetween,
} from "@/lib/guest/status";
import { cn } from "@/lib/cn";

export type GuestReservationView = {
  reservation_code?: string;
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  price?: number | null;
  status?: string;
  payment_status?: string;
  extras?: Array<{ id?: string; label?: string; amountCop?: number }>;
};

const toneClass = {
  ok: "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
  warn: "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100",
  bad: "border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-100",
  neutral: "border-zinc-300 bg-zinc-50 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100",
} as const;

export function ReservationPanel({
  reservation,
  mode,
  checkInDone,
}: {
  reservation: GuestReservationView;
  mode?: string;
  checkInDone?: boolean;
}) {
  const code = reservation.reservation_code ?? "";
  const nights = nightsBetween(reservation.check_in, reservation.check_out);
  const extrasTotal = (reservation.extras ?? []).reduce(
    (acc, e) => acc + (e.amountCop ?? 0),
    0,
  );
  const total =
    reservation.price != null ? reservation.price + extrasTotal : null;

  const waMsg = [
    `Hola ${site.name}, necesito ayuda con mi reserva ${code}:`,
    `Nombre: ${reservation.guest_name ?? ""}`,
    `Fechas: ${reservation.check_in} → ${reservation.check_out}`,
  ].join("\n");

  return (
    <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
      <div className="flex flex-wrap gap-2">
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold",
            toneClass[guestStatusTone(reservation.status)],
          )}
        >
          {guestStatusLabel(reservation.status)}
        </span>
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold",
            toneClass[guestStatusTone(reservation.payment_status)],
          )}
        >
          {guestPaymentLabel(reservation.payment_status)}
        </span>
        {checkInDone ? (
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-900 dark:text-emerald-100">
            Check-in digital listo
          </span>
        ) : null}
      </div>

      <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
        <p>
          Código{" "}
          <strong className="font-mono text-lg text-zinc-900 dark:text-white">
            {code}
          </strong>
        </p>
        <p>Huésped: {reservation.guest_name || "—"}</p>
        <p>
          Fechas: {reservation.check_in} → {reservation.check_out}
          {nights > 0 ? ` · ${nights} noche${nights === 1 ? "" : "s"}` : ""}
        </p>
        <p>Huéspedes: {reservation.guests ?? "—"}</p>
        {reservation.guest_phone ? (
          <p className="text-xs text-zinc-500">Tel: {reservation.guest_phone}</p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Resumen de precio
        </p>
        {total != null ? (
          <p className="mt-2 font-display text-3xl tracking-wide text-zinc-900 dark:text-white">
            {formatCOP(total)}
          </p>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">Total por confirmar</p>
        )}
        {extrasTotal > 0 ? (
          <p className="mt-1 text-xs text-zinc-500">
            Incluye extras {formatCOP(extrasTotal)}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-zinc-500">
          {guestPaymentLabel(reservation.payment_status)} · pago real vía Wompi u
          otra pasarela pendiente de integración.
        </p>
      </div>

      {mode === "local" ? (
        <p className="rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          Modo local/mock — la reserva vive en memoria del servidor hasta aplicar
          migraciones Supabase.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-1">
        {!checkInDone && reservation.status !== "cancelled" ? (
          <Link
            href={`/check-in/${encodeURIComponent(code)}`}
            className="rounded-full bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900"
          >
            Check-in digital
          </Link>
        ) : null}
        <a
          href={waLink(waMsg)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-emerald-700/40 bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white"
        >
          WhatsApp ayuda
        </a>
        <Link
          href="/ayuda"
          className="rounded-full border border-zinc-300 px-4 py-2.5 text-xs font-semibold dark:border-zinc-600"
        >
          Centro de ayuda
        </Link>
        <Link
          href="/mi-reserva"
          className="rounded-full border border-zinc-300 px-4 py-2.5 text-xs font-semibold dark:border-zinc-600"
        >
          Otra reserva
        </Link>
      </div>
    </div>
  );
}
