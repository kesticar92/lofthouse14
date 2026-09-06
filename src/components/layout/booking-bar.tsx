"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { StayDateRangePicker } from "@/components/ui/stay-date-range-picker";
import { trackBeginCheckout } from "@/lib/analytics";
import { cn } from "@/lib/cn";

type BookingBarProps = {
  className?: string;
  /** Compacto para ir dentro del header fijo. */
  variant?: "default" | "header";
};

export function BookingBar({
  className,
  variant = "default",
}: BookingBarProps) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const isHeader = variant === "header";

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

  return (
    <form
      onSubmit={onSubmit}
      aria-label="Configurar reserva"
      className={cn(
        "grid w-full gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end",
        isHeader
          ? "rounded-2xl border border-black/10 bg-white/95 p-2 shadow-md backdrop-blur dark:border-white/10 dark:bg-zinc-900/95 md:gap-3 md:p-2.5"
          : "mx-auto max-w-5xl rounded-2xl border border-black/10 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-white/10 dark:bg-zinc-900/95 md:p-4",
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
      <label className="flex flex-col gap-1 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500 md:text-[11px]">
        Huéspedes
        <select
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className={cn(
            "rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white",
            isHeader ? "h-10 md:h-11" : "h-12",
          )}
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
        className={cn(
          "rounded-xl bg-amber-600 text-sm font-bold uppercase tracking-wide text-white shadow-sm hover:bg-amber-700",
          isHeader ? "h-10 px-5 md:h-11 md:px-6" : "h-12 px-6",
        )}
      >
        Reservar
      </button>
    </form>
  );
}
