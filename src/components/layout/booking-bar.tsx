"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Users } from "lucide-react";
import { StayDateRangePicker } from "@/components/ui/stay-date-range-picker";
import { trackBeginCheckout } from "@/lib/analytics";
import { cn } from "@/lib/cn";

type BookingBarProps = {
  className?: string;
  /** Inline ultra-compacto para el banner de navegación. */
  variant?: "default" | "banner";
};

export function BookingBar({
  className,
  variant = "default",
}: BookingBarProps) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isBanner = variant === "banner";

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("guests", String(guests));
    trackBeginCheckout({
      check_in: checkIn || "pending",
      guests,
    });
    router.push(`/reservas?${params.toString()}`);
  }

  const dateSummary =
    checkIn && checkOut
      ? `${checkIn.slice(8)}/${checkIn.slice(5, 7)}–${checkOut.slice(8)}/${checkOut.slice(5, 7)}`
      : "Fechas";

  if (isBanner) {
    return (
      <form
        onSubmit={onSubmit}
        aria-label="Configurar reserva"
        className={cn("relative flex min-w-0 flex-1 items-center gap-1", className)}
      >
        {/* Móvil: un solo chip que abre el panel compacto */}
        <div className="relative min-w-0 flex-1 sm:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-9 w-full min-w-0 items-center gap-1.5 rounded-full border border-black/10 bg-zinc-100/90 px-2.5 text-left dark:border-white/10 dark:bg-zinc-800/80"
            aria-expanded={mobileOpen}
          >
            <CalendarDays className="size-3.5 shrink-0 text-amber-600" />
            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-zinc-800 dark:text-zinc-100">
              {dateSummary}
              <span className="text-zinc-400"> · </span>
              {guests} huésp.
            </span>
          </button>
          {mobileOpen ? (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-2xl border border-black/10 bg-white p-3 shadow-2xl dark:border-white/10 dark:bg-zinc-900">
              <StayDateRangePicker
                compact
                checkIn={checkIn}
                checkOut={checkOut}
                onChange={(from, to) => {
                  setCheckIn(from);
                  setCheckOut(to);
                }}
              />
              <label className="mt-2 flex items-center gap-2 rounded-full border border-black/10 bg-zinc-50 px-3 py-2 dark:border-white/10 dark:bg-zinc-800">
                <Users className="size-3.5 opacity-70" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Huéspedes
                </span>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="ml-auto bg-transparent text-sm font-semibold outline-none"
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
                onClick={() => setMobileOpen(false)}
                className="mt-2 h-10 w-full rounded-full bg-amber-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-amber-700"
              >
                Reservar
              </button>
            </div>
          ) : null}
        </div>

        <button
          type="submit"
          className="h-9 shrink-0 rounded-full bg-amber-600 px-3 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-amber-700 active:scale-[0.98] sm:hidden"
        >
          Reservar
        </button>

        {/* Desktop / tablet: todo inline en el banner */}
        <div className="hidden min-w-0 flex-1 items-center gap-1.5 sm:flex">
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
        </div>
      </form>
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
