"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { site } from "@/lib/site";
import { GuestBottomNav } from "@/components/guest/guest-bottom-nav";
import { t } from "@/lib/i18n/dictionary";

export default function MiReservaPage() {
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  return (
    <>
      <main className="mx-auto min-h-[70vh] max-w-lg px-4 py-16 pb-28 md:pb-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {site.name}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          {t("guest.myReservationTitle")}
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
          {t("guest.myReservationHint")}
        </p>
        <form
          className="mt-8 flex flex-col gap-3 sm:flex-row"
          onSubmit={async (e) => {
            e.preventDefault();
            const c = code.trim().toUpperCase();
            if (!c) {
              setErr(t("guest.codeRequired"));
              return;
            }
            setErr(null);
            setBusy(true);
            try {
              const res = await fetch(
                `/api/public/booking/${encodeURIComponent(c)}`,
              );
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setErr(
                  (data as { error?: string }).error ??
                    "No encontramos esa reserva",
                );
                return;
              }
              router.push(`/confirmacion/${encodeURIComponent(c)}`);
            } catch {
              setErr("Error de red — reintenta");
            } finally {
              setBusy(false);
            }
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("guest.codePlaceholder")}
            autoComplete="off"
            disabled={busy}
            className="flex-1 rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm dark:border-zinc-600 dark:bg-zinc-900"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          >
            {busy ? "…" : t("cta.seeReservation")}
          </button>
        </form>
        {err ? (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-100">
            {err}
          </p>
        ) : null}

        <div className="mt-10 space-y-3 rounded-2xl border border-zinc-200 bg-white/60 p-4 text-sm dark:border-zinc-700 dark:bg-zinc-900/40">
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">
            ¿Qué puedes hacer aquí?
          </p>
          <ul className="list-inside list-disc space-y-1 text-zinc-600 dark:text-zinc-300">
            <li>Consultar estado y fechas</li>
            <li>Ver resumen de precio, mock de pago y factura borrador</li>
            <li>Check-in digital (datos + términos + llegada)</li>
            <li>Contactar por WhatsApp si necesitas ayuda</li>
          </ul>
          <Link
            href="/reservar"
            className="mt-2 inline-block text-sm font-semibold text-amber-900 underline dark:text-amber-300"
          >
            {t("cta.newBooking")}
          </Link>
        </div>

        <Link
          href="/"
          className="mt-8 inline-block text-sm text-zinc-500 underline"
        >
          Volver al inicio
        </Link>
      </main>
      <GuestBottomNav />
    </>
  );
}
