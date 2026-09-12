"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { site, waLink } from "@/lib/site";
import { formatCOP } from "@/lib/pricing";
import {
  guestPaymentLabel,
  guestStatusLabel,
  guestStatusTone,
  nightsBetween,
} from "@/lib/guest/status";
import { cn } from "@/lib/cn";
import { t, type Locale } from "@/lib/i18n/dictionary";

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
  lofts?: number;
  property_ids?: string[];
  is_walk_in?: boolean;
  channel?: string;
  corporate_name?: string | null;
  referrer_name?: string | null;
  notes?: string | null;
};

export type GuestPaymentView = {
  status?: string;
  amount?: number;
  amount_paid?: number;
  deposit_amount?: number;
  deposit_percent?: number;
  balance?:
    | number
    | {
        total?: number;
        paid?: number;
        due?: number;
        deposit?: number;
        deposit_due?: number;
        balance_after_deposit?: number;
      };
  provider?: string;
};

export type GuestInvoiceDraft = {
  id?: string;
  status?: string;
  total?: number;
  tax_estimate?: number;
  message?: string;
  provider?: string;
};

export type GuestDisplayPrice = {
  cop?: string;
  usd?: string;
  eur?: string;
  disclaimer?: string;
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
  payment,
  invoiceDraft,
  displayPrice,
  locale = "es",
  onPaymentUpdated,
}: {
  reservation: GuestReservationView;
  mode?: string;
  checkInDone?: boolean;
  payment?: GuestPaymentView | null;
  invoiceDraft?: GuestInvoiceDraft | null;
  displayPrice?: GuestDisplayPrice | null;
  locale?: Locale;
  onPaymentUpdated?: () => void;
}) {
  const code = reservation.reservation_code ?? "";
  const nights = nightsBetween(reservation.check_in, reservation.check_out);
  const extrasTotal = (reservation.extras ?? []).reduce(
    (acc, e) => acc + (e.amountCop ?? 0),
    0,
  );
  /** `price` es total de estadía (alojamiento + extras cotizados). */
  const total = reservation.price != null ? reservation.price : null;

  const [payBusy, setPayBusy] = useState(false);
  const [payMsg, setPayMsg] = useState<string | null>(null);
  const [payErr, setPayErr] = useState<string | null>(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [localPaymentStatus, setLocalPaymentStatus] = useState(
    reservation.payment_status,
  );
  const stayOnly =
    total != null ? Math.max(0, total - extrasTotal) : null;
  const loftCount =
    reservation.lofts ?? reservation.property_ids?.length ?? 1;
  const extrasLines = reservation.extras ?? [];
  const hasBreakdown =
    total != null &&
    (stayOnly != null || extrasLines.length > 0 || extrasTotal > 0);

  const balObj =
    payment?.balance && typeof payment.balance === "object"
      ? payment.balance
      : null;
  const depositAmount =
    payment?.deposit_amount ?? balObj?.deposit ?? null;
  const depositDue = balObj?.deposit_due ?? null;
  const balanceDue =
    balObj?.due ??
    (typeof payment?.balance === "number" ? payment.balance : null);

  const paid =
    localPaymentStatus === "paid" ||
    payment?.status === "paid" ||
    (typeof payment?.balance === "number" &&
      payment.balance <= 0 &&
      payment.status === "paid");
  const depositPaid =
    paid ||
    localPaymentStatus === "deposit_paid" ||
    payment?.status === "deposit_paid" ||
    (depositDue != null && depositDue <= 0 && (payment?.amount_paid ?? 0) > 0);

  const waMsg = [
    `Hola ${site.name}, necesito ayuda con mi reserva ${code}:`,
    `Nombre: ${reservation.guest_name ?? ""}`,
    `Fechas: ${reservation.check_in} → ${reservation.check_out}`,
  ].join("\n");

  async function simulatePay(kind: "deposit" | "balance" | "full") {
    setPayBusy(true);
    setPayErr(null);
    setPayMsg(null);
    try {
      const res = await fetch(
        `/api/public/booking/${encodeURIComponent(code)}/pay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ simulate: true, kind }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPayErr((data as { error?: string }).error ?? `Error ${res.status}`);
        return;
      }
      const nextStatus =
        (data as { reservation?: { payment_status?: string } }).reservation
          ?.payment_status ??
        (data as { payment?: { status?: string } }).payment?.status ??
        (kind === "deposit" ? "deposit_paid" : "paid");
      setLocalPaymentStatus(nextStatus);
      setPayMsg(
        (data as { note?: string }).note ??
          "Pago mock registrado. No es un cargo real.",
      );
      onPaymentUpdated?.();
    } catch {
      setPayErr("Error de red al simular pago");
    } finally {
      setPayBusy(false);
    }
  }

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
            toneClass[guestStatusTone(localPaymentStatus ?? payment?.status)],
          )}
        >
          {guestPaymentLabel(localPaymentStatus ?? payment?.status)}
        </span>
        {checkInDone ? (
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-900 dark:text-emerald-100">
            Check-in digital listo
          </span>
        ) : null}
        {reservation.is_walk_in ? (
          <span className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold dark:border-zinc-600">
            Walk-in
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
        {(reservation.lofts ?? reservation.property_ids?.length ?? 0) > 1 ? (
          <p>
            Unidades:{" "}
            {reservation.lofts ?? reservation.property_ids?.length} lofts
            (grupo)
          </p>
        ) : null}
        {reservation.guest_phone ? (
          <p className="text-xs text-zinc-500">Tel: {reservation.guest_phone}</p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {t("guest.paymentSummary", locale)}
        </p>
        {total != null ? (
          <p className="mt-2 font-display text-3xl tracking-wide text-zinc-900 dark:text-white">
            {displayPrice?.cop ?? formatCOP(total)}
          </p>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">
            {t("guest.totalPending", locale)}
          </p>
        )}
        {displayPrice?.usd || displayPrice?.eur ? (
          <p className="mt-1 text-xs text-zinc-500">
            {displayPrice.usd ? `≈ ${displayPrice.usd}` : ""}
            {displayPrice.usd && displayPrice.eur ? " · " : ""}
            {displayPrice.eur ? `≈ ${displayPrice.eur}` : ""}
          </p>
        ) : null}
        {displayPrice?.disclaimer ? (
          <p className="mt-1 text-[10px] leading-snug text-zinc-400">
            {displayPrice.disclaimer}
          </p>
        ) : null}
        {extrasTotal > 0 ? (
          <p className="mt-1 text-xs text-zinc-500">
            Incluye extras {formatCOP(extrasTotal)}
          </p>
        ) : null}
        {hasBreakdown ? (
          <div className="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setBreakdownOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold text-zinc-800 dark:text-zinc-100"
              aria-expanded={breakdownOpen}
            >
              <span>{breakdownOpen ? "Ocultar desglose" : "Ver desglose"}</span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-zinc-500 transition-transform",
                  breakdownOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
            {breakdownOpen ? (
              <ul className="space-y-2 border-t border-zinc-200 px-3 py-2.5 text-xs dark:border-zinc-700">
                {stayOnly != null && stayOnly > 0 ? (
                  <li className="flex justify-between gap-3">
                    <span className="min-w-0 leading-snug">
                      Alojamiento
                      {nights > 0
                        ? ` · ${nights} noche${nights === 1 ? "" : "s"}`
                        : ""}
                      {loftCount > 1
                        ? ` · ${loftCount} loft${loftCount === 1 ? "" : "s"}`
                        : ""}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {formatCOP(stayOnly)}
                    </span>
                  </li>
                ) : null}
                {extrasLines.map((e, i) => (
                  <li
                    key={`${e.id ?? e.label ?? "extra"}-${i}`}
                    className="flex justify-between gap-3"
                  >
                    <span className="min-w-0 leading-snug">
                      {e.label ?? e.id ?? "Extra"}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {e.amountCop != null && e.amountCop > 0
                        ? formatCOP(e.amountCop)
                        : "Consultar"}
                    </span>
                  </li>
                ))}
                {total != null ? (
                  <li className="flex justify-between gap-3 border-t border-zinc-200 pt-2 font-semibold text-zinc-900 dark:border-zinc-700 dark:text-white">
                    <span>Total</span>
                    <span className="tabular-nums">{formatCOP(total)}</span>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
        ) : null}
        <p className="mt-2 text-[11px] text-zinc-500">
          Políticas de cancelación y normas:{" "}
          <Link
            href="/politicas"
            className="font-semibold text-amber-900 underline underline-offset-2 dark:text-amber-300"
          >
            /politicas
          </Link>
        </p>
        {depositAmount != null && depositAmount > 0 ? (
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            {t("guest.depositLabel", locale)}
            {payment?.deposit_percent
              ? ` (${payment.deposit_percent}%)`
              : ""}
            : {formatCOP(depositAmount)}
            {depositPaid && !paid ? " · pagado" : ""}
          </p>
        ) : null}
        {balanceDue != null && !paid ? (
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {t("guest.balanceDue", locale)}: {formatCOP(balanceDue)}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-zinc-500">
          {guestPaymentLabel(localPaymentStatus ?? payment?.status)} · pago real
          vía Wompi pendiente de integración.
        </p>
        {!paid && reservation.status !== "cancelled" ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {!depositPaid ? (
              <button
                type="button"
                disabled={payBusy}
                onClick={() => void simulatePay("deposit")}
                className="rounded-full bg-amber-900 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-amber-500 dark:text-zinc-950"
              >
                {payBusy ? "…" : t("cta.payDeposit", locale)}
              </button>
            ) : (
              <button
                type="button"
                disabled={payBusy}
                onClick={() => void simulatePay("balance")}
                className="rounded-full bg-amber-900 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-amber-500 dark:text-zinc-950"
              >
                {payBusy ? "…" : t("cta.payBalance", locale)}
              </button>
            )}
            <button
              type="button"
              disabled={payBusy}
              onClick={() => void simulatePay("full")}
              className="rounded-full border border-zinc-300 px-4 py-2.5 text-xs font-semibold disabled:opacity-50 dark:border-zinc-600"
            >
              {payBusy ? "…" : t("cta.payMock", locale)}
            </button>
          </div>
        ) : null}
        {payMsg ? (
          <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-200">
            {payMsg}
          </p>
        ) : null}
        {payErr ? <p className="mt-2 text-xs text-red-700">{payErr}</p> : null}
      </div>

      {invoiceDraft ? (
        <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {t("guest.invoiceDraft", locale)}
          </p>
          <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {invoiceDraft.status ?? "draft"} ·{" "}
            {invoiceDraft.total != null
              ? formatCOP(invoiceDraft.total)
              : "—"}
          </p>
          {invoiceDraft.tax_estimate != null ? (
            <p className="text-xs text-zinc-500">
              IVA estimado {formatCOP(invoiceDraft.tax_estimate)}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-zinc-500">
            {invoiceDraft.message ??
              "Borrador e-factura (stub DIAN). No es documento fiscal válido."}
          </p>
        </div>
      ) : null}

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
            {t("cta.checkIn", locale)}
          </Link>
        ) : null}
        <a
          href={waLink(waMsg)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-emerald-700/40 bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white"
        >
          {t("cta.whatsappHelp", locale)}
        </a>
        <Link
          href={`/mensajes`}
          className="rounded-full border border-zinc-300 px-4 py-2.5 text-xs font-semibold dark:border-zinc-600"
        >
          {t("cta.messages", locale)}
        </Link>
        <Link
          href="/ayuda"
          className="rounded-full border border-zinc-300 px-4 py-2.5 text-xs font-semibold dark:border-zinc-600"
        >
          {t("cta.helpCenter", locale)}
        </Link>
        <Link
          href="/mi-reserva"
          className="rounded-full border border-zinc-300 px-4 py-2.5 text-xs font-semibold dark:border-zinc-600"
        >
          {t("cta.anotherReservation", locale)}
        </Link>
      </div>
    </div>
  );
}
