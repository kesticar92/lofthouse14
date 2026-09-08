"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { site, waLink } from "@/lib/site";
import { formatCOP } from "@/lib/pricing";
import {
  ReservationPanel,
  type GuestReservationView,
} from "@/components/guest/reservation-panel";
import { GuestBottomNav } from "@/components/guest/guest-bottom-nav";
import { readCheckInLocalBrowser } from "@/lib/guest/check-in-store";

function ConfirmacionInner() {
  const params = useParams<{ code: string }>();
  const search = useSearchParams();
  const code = decodeURIComponent(params.code ?? "").toUpperCase();
  const [reservation, setReservation] = useState<GuestReservationView | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<string>("");
  const [checkInDone, setCheckInDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [res, ciRes] = await Promise.all([
          fetch(`/api/public/booking/${encodeURIComponent(code)}`),
          fetch(
            `/api/public/booking/${encodeURIComponent(code)}/check-in`,
          ).catch(() => null),
        ]);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "No encontrada");
          return;
        }
        setReservation(data.reservation);
        setMode(data.mode ?? "");

        let serverCi = false;
        if (ciRes?.ok) {
          const ciData = await ciRes.json().catch(() => ({}));
          serverCi = Boolean(ciData.check_in);
        }
        const localCi = readCheckInLocalBrowser(code);
        setCheckInDone(Boolean(localCi || serverCi));

        if (search.get("wa") === "1" && data.reservation) {
          const r = data.reservation as GuestReservationView;
          const lines = [
            `Hola ${site.name}, confirmo mi reserva ${r.reservation_code}:`,
            `Nombre: ${r.guest_name ?? ""}`,
            `Fechas: ${r.check_in} → ${r.check_out}`,
            `Huéspedes: ${r.guests ?? ""}`,
            r.price != null ? `Total estimado: ${formatCOP(r.price)}` : "",
          ].filter(Boolean);
          window.open(waLink(lines.join("\n")), "_blank", "noopener");
        }
      } catch {
        if (!cancelled) setError("Error de red");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, search]);

  return (
    <>
      <main className="mx-auto min-h-[70vh] max-w-lg px-4 py-16 pb-28 md:pb-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {site.name}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-zinc-900 dark:text-zinc-100">
          Tu reserva
        </h1>
        {error ? (
          <p className="mt-6 text-sm text-red-700">{error}</p>
        ) : !reservation ? (
          <p className="mt-6 text-sm text-zinc-600">Cargando reserva…</p>
        ) : (
          <div className="mt-8">
            <ReservationPanel
              reservation={reservation}
              mode={mode}
              checkInDone={checkInDone}
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
        <main className="mx-auto max-w-lg px-4 py-16 text-sm">Cargando…</main>
      }
    >
      <ConfirmacionInner />
    </Suspense>
  );
}
