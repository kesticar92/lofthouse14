"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { site, waLink } from "@/lib/site";
import {
  buildReservationWhatsAppMessage,
  takeWhatsAppReservationMessage,
} from "@/lib/whatsapp-reservation-message";
import { formatCOP } from "@/lib/pricing";
import {
  ReservationPanel,
  type GuestDisplayPrice,
  type GuestInvoiceDraft,
  type GuestPaymentView,
  type GuestReservationView,
} from "@/components/guest/reservation-panel";
import { GuestBottomNav } from "@/components/guest/guest-bottom-nav";
import { readCheckInLocalBrowser } from "@/lib/guest/check-in-store";
import { t } from "@/lib/i18n/dictionary";

function ConfirmacionInner() {
  const params = useParams<{ code: string }>();
  const search = useSearchParams();
  const code = decodeURIComponent(params.code ?? "").toUpperCase();
  const [reservation, setReservation] = useState<GuestReservationView | null>(
    null,
  );
  const [payment, setPayment] = useState<GuestPaymentView | null>(null);
  const [invoiceDraft, setInvoiceDraft] = useState<GuestInvoiceDraft | null>(
    null,
  );
  const [displayPrice, setDisplayPrice] = useState<GuestDisplayPrice | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<string>("");
  const [checkInDone, setCheckInDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, ciRes] = await Promise.all([
        fetch(`/api/public/booking/${encodeURIComponent(code)}`),
        fetch(
          `/api/public/booking/${encodeURIComponent(code)}/check-in`,
        ).catch(() => null),
      ]);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "No encontrada");
        setReservation(null);
        return;
      }
      setReservation(
        (data as { reservation: GuestReservationView }).reservation,
      );
      setPayment(
        ((data as { payment?: GuestPaymentView }).payment as GuestPaymentView) ??
          null,
      );
      setInvoiceDraft(
        ((data as { invoice_draft?: GuestInvoiceDraft }).invoice_draft as GuestInvoiceDraft) ??
          null,
      );
      setDisplayPrice(
        ((data as { display_price?: GuestDisplayPrice }).display_price as GuestDisplayPrice) ??
          null,
      );
      setMode((data as { mode?: string }).mode ?? "");

      let serverCi = false;
      if (ciRes?.ok) {
        const ciData = await ciRes.json().catch(() => ({}));
        serverCi = Boolean((ciData as { check_in?: unknown }).check_in);
      }
      const localCi = readCheckInLocalBrowser(code);
      setCheckInDone(Boolean(localCi || serverCi));

      if (search.get("wa") === "1" && (data as { reservation?: GuestReservationView }).reservation) {
        const r = (data as { reservation: GuestReservationView }).reservation;
        const stashed = takeWhatsAppReservationMessage();
        const message =
          stashed ??
          buildReservationWhatsAppMessage({
            reservationCode: r.reservation_code,
            guestName: r.guest_name,
            checkIn: r.check_in,
            checkOut: r.check_out,
            guests: r.guests,
            lofts: r.lofts ?? r.property_ids?.length,
            price: r.price,
            extras: (r.extras ?? []).map((e) => {
              const anyE = e as {
                id?: string;
                label?: string;
                amountCop?: number;
                amount_cop?: number;
                amount?: number;
              };
              return {
                id: anyE.id,
                label: anyE.label ?? anyE.id,
                amountCop: anyE.amountCop ?? anyE.amount_cop ?? anyE.amount,
              };
            }),
            channel: r.channel,
            corporateName: r.corporate_name,
            referrerName: r.referrer_name,
            notes: r.notes,
          });
        window.open(waLink(message), "_blank", "noopener");
      }
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }, [code, search]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <main className="mx-auto min-h-[70vh] max-w-lg px-4 py-16 pb-28 md:pb-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {site.name}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-zinc-900 dark:text-zinc-100">
          {t("guest.yourReservation")}
        </h1>
        {error ? (
          <div className="mt-6 space-y-3">
            <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-100">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="text-sm font-semibold underline"
            >
              Reintentar
            </button>
          </div>
        ) : loading || !reservation ? (
          <div className="mt-6 animate-pulse space-y-3">
            <div className="h-8 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-28 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-24 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
            <p className="text-sm text-zinc-600">{t("guest.loading")}</p>
          </div>
        ) : (
          <div className="mt-8">
            <ReservationPanel
              reservation={reservation}
              mode={mode}
              checkInDone={checkInDone}
              payment={payment}
              invoiceDraft={invoiceDraft}
              displayPrice={displayPrice}
              onPaymentUpdated={() => void load()}
            />
          </div>
        )}
      </main>
      <GuestBottomNav />
    </>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-4 py-16">
          <p className="text-sm text-zinc-600">{t("guest.loading")}</p>
        </main>
      }
    >
      <ConfirmacionInner />
    </Suspense>
  );
}
