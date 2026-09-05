"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { StayDateRangePicker } from "@/components/ui/stay-date-range-picker";
import { trackBeginCheckout } from "@/lib/analytics";
import { cn } from "@/lib/cn";

export function BookingBar({ className }: { className?: string }) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

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
      className={cn(
        "mx-auto grid w-full max-w-5xl gap-3 rounded-2xl border border-black/10 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-white/10 dark:bg-zinc-900/95 sm:grid-cols-[1fr_auto_auto] sm:items-end md:p-4",
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
        Ver disponibilidad
      </button>
    </form>
  );
}

export function StickyBookingBar() {
  return (
    <div className="sticky top-[4.25rem] z-40 border-b border-black/5 bg-[#f2f0eb]/90 px-3 py-3 backdrop-blur-md dark:border-white/5 dark:bg-zinc-950/90 md:px-8">
      <BookingBar />
    </div>
  );
}
