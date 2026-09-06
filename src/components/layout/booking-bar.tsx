"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Users } from "lucide-react";
import { StayDateRangePicker } from "@/components/ui/stay-date-range-picker";
import { trackBeginCheckout } from "@/lib/analytics";
import { cn } from "@/lib/cn";

type BookingBarProps = {
  className?: string;
  /** Inline compacto para el banner de navegación. */
  variant?: "default" | "banner";
};

/**
 * En el banner: acceso rápido.
 * En móvil lleva a #configurar-reserva (sección protagonista).
 * En desktop mantiene fechas + huéspedes inline hacia /reservas.
 */
export function BookingBar({
  className,
  variant = "default",
}: BookingBarProps) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const isBanner = variant === "banner";

  function goToFlow(event?: FormEvent) {
    event?.preventDefault();
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

  if (isBanner) {
    return (
      <>
        {/* Móvil: lleva a la sección protagonista de configuración */}
        <div className={cn("flex min-w-0 flex-1 sm:hidden", className)}>
          <a
            href="#configurar-reserva"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-amber-600 px-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_6px_20px_-6px_rgba(217,119,6,0.85)] transition hover:bg-amber-700 active:scale-[0.98]"
          >
            <CalendarDays className="size-4 shrink-0 opacity-90" aria-hidden />
            Configurar reserva
          </a>
        </div>

        {/* Desktop / tablet: fechas + huéspedes → flujo /reservas */}
        <form
          onSubmit={goToFlow}
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
      </>
    );
  }

  return (
    <form
      onSubmit={goToFlow}
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
