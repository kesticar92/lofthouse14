"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Users, X } from "lucide-react";
import { StayDateRangePicker } from "@/components/ui/stay-date-range-picker";
import { trackBeginCheckout } from "@/lib/analytics";
import { cn } from "@/lib/cn";

type BookingBarProps = {
  className?: string;
  /** Inline compacto para el banner de navegación. */
  variant?: "default" | "banner";
};

export function BookingBar({
  className,
  variant = "default",
}: BookingBarProps) {
  const router = useRouter();
  const titleId = useId();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [sheetOpen, setSheetOpen] = useState(false);
  const isBanner = variant === "banner";

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  function goToCheckout() {
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("guests", String(guests));
    trackBeginCheckout({
      check_in: checkIn || "pending",
      guests,
    });
    setSheetOpen(false);
    router.push(`/reservas?${params.toString()}`);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    goToCheckout();
  }

  const dateReady = Boolean(checkIn && checkOut);
  const dateLabel = dateReady
    ? `${checkIn.slice(8)}/${checkIn.slice(5, 7)} → ${checkOut.slice(8)}/${checkOut.slice(5, 7)}`
    : "Elige tus fechas";

  if (isBanner) {
    return (
      <>
        {/* Móvil: CTA dominante — lleva directo a reservar */}
        <div className={cn("flex min-w-0 flex-1 sm:hidden", className)}>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-amber-600 px-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_6px_20px_-6px_rgba(217,119,6,0.85)] transition hover:bg-amber-700 active:scale-[0.98]"
          >
            <CalendarDays className="size-4 shrink-0 opacity-90" aria-hidden />
            Reservar ahora
          </button>
        </div>

        {/* Desktop / tablet: formulario inline */}
        <form
          onSubmit={onSubmit}
          aria-label="Configurar reserva"
          className={cn(
            "relative hidden min-w-0 flex-1 items-center gap-1.5 sm:flex",
            className,
          )}
        >
          <StayDateRangePicker
            compact
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={(from, to) => {
              setCheckIn(from);
              setCheckOut(to);
            }}
            className="min-w-0 flex-1"
          />
          <label className="relative flex h-10 shrink-0 items-center gap-1 rounded-full border border-black/10 bg-zinc-100/80 px-3 text-zinc-700 dark:border-white/10 dark:bg-zinc-800/70 dark:text-zinc-200">
            <Users className="size-3.5 shrink-0 opacity-70" aria-hidden />
            <span className="sr-only">Huéspedes</span>
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="max-w-[3.25rem] cursor-pointer appearance-none bg-transparent text-sm font-semibold outline-none"
            >
              {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="h-10 shrink-0 rounded-full bg-amber-600 px-5 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-amber-700 active:scale-[0.98]"
          >
            Reservar
          </button>
        </form>

        {/* Sheet móvil: flujo claro hacia la reserva */}
        {sheetOpen ? (
          <div className="fixed inset-0 z-[60] sm:hidden">
            <button
              type="button"
              aria-label="Cerrar"
              className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
              onClick={() => setSheetOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-3xl border border-black/10 bg-[#f7f5f1] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400">
                    Reserva directa
                  </p>
                  <h2
                    id={titleId}
                    className="mt-1 text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white"
                  >
                    ¿Cuándo nos visitas?
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Elige fechas y huéspedes para ver disponibilidad al instante.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 text-zinc-700 dark:border-white/10 dark:text-zinc-200"
                  aria-label="Cerrar panel de reserva"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="rounded-2xl border border-black/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Fechas de estadía
                  </p>
                  <StayDateRangePicker
                    checkIn={checkIn}
                    checkOut={checkOut}
                    onChange={(from, to) => {
                      setCheckIn(from);
                      setCheckOut(to);
                    }}
                  />
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                  <Users className="size-5 text-amber-600" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Huéspedes
                    </span>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="mt-0.5 w-full bg-transparent text-base font-semibold text-zinc-900 outline-none dark:text-white"
                    >
                      {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "persona" : "personas"}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <div className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-zinc-100 dark:bg-zinc-800">
                  <p className="font-semibold">{dateLabel}</p>
                  <p className="mt-0.5 text-zinc-400">
                    {guests} {guests === 1 ? "huésped" : "huéspedes"} · sin
                    comisión OTA
                  </p>
                </div>

                <button
                  type="submit"
                  className="flex h-14 w-full items-center justify-center rounded-2xl bg-amber-600 text-base font-extrabold uppercase tracking-wide text-white shadow-[0_12px_28px_-10px_rgba(217,119,6,0.9)] transition hover:bg-amber-700 active:scale-[0.99]"
                >
                  {dateReady ? "Continuar a reservar" : "Reservar ahora"}
                </button>
                <p className="text-center text-xs text-zinc-500">
                  Respuesta rápida por WhatsApp · check-in autónomo
                </p>
              </form>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      aria-label="Configurar reserva"
      className={cn(
        "mx-auto grid w-full max-w-5xl gap-2 rounded-2xl border border-black/10 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-white/10 dark:bg-zinc-900/95 sm:grid-cols-[1fr_auto_auto] sm:items-end md:gap-3 md:p-4",
        className,
      )}
    >
      <StayDateRangePicker
        checkIn={checkIn}
        checkOut={checkOut}
        onChange={(from, to) => {
          setCheckIn(from);
          setCheckOut(to);
        }}
      />
      <label className="flex flex-col gap-1 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        Huéspedes
        <select
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        >
          {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "persona" : "personas"}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="h-12 rounded-xl bg-amber-600 px-6 text-sm font-bold uppercase tracking-wide text-white shadow-sm hover:bg-amber-700"
      >
        Reservar
      </button>
    </form>
  );
}
