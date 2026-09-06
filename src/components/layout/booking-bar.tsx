"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { StayDateRangePicker } from "@/components/ui/stay-date-range-picker";
import { trackBeginCheckout } from "@/lib/analytics";
import { cn } from "@/lib/cn";

/** Altura aproximada del header fijo (top sticky del buscador). */
const HEADER_STICKY_TOP = "4.25rem";
const HEADER_STICKY_PX = 68;

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

/**
 * Un solo buscador: arranca visualmente dentro del hero (margen negativa)
 * y se pega bajo el header al hacer scroll. No duplicar en el hero.
 */
export function StickyBookingBar() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const update = () => {
      const top = el.getBoundingClientRect().top;
      setStuck(top <= HEADER_STICKY_PX + 1);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{ top: HEADER_STICKY_TOP }}
      className={cn(
        "sticky z-40 -mt-24 px-3 transition-[background-color,border-color,box-shadow,padding] duration-200 md:-mt-28 md:px-8",
        stuck
          ? "border-b border-black/5 bg-[#f2f0eb]/95 py-3 shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-zinc-950/95"
          : "border-b border-transparent bg-transparent py-0",
      )}
    >
      <BookingBar className={stuck ? undefined : "shadow-2xl"} />
    </div>
  );
}
