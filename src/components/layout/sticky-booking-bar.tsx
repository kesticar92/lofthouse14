"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, Users } from "lucide-react";
import { trackBeginCheckout } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import {
  STICKY_BOOKING_VISIBLE_EVENT,
  saveStayDraft,
} from "@/lib/stay-draft";

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Banner fijo de reserva solo en escritorio (bajo el header).
 * En móvil la selección de fechas vive en HeroBookingCard.
 */
export function StickyBookingBar() {
  const [hiddenByReservas, setHiddenByReservas] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [error, setError] = useState("");

  useEffect(() => {
    const el = document.getElementById("reservas");
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setHiddenByReservas(Boolean(entry?.isIntersecting)),
      { root: null, threshold: 0.08, rootMargin: "15% 0px 15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const show = !hiddenByReservas;

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(STICKY_BOOKING_VISIBLE_EVENT, {
        detail: { visible: show },
      }),
    );
  }, [show]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!checkIn || !checkOut) {
      setError("Elige entrada y salida para reservar.");
      return;
    }
    if (checkOut <= checkIn) {
      setError("La salida debe ser después de la entrada.");
      return;
    }
    const guestCount = Math.min(63, Math.max(1, Number(guests) || 2));
    trackBeginCheckout({ guests: guestCount });
    saveStayDraft({
      checkIn,
      checkOut,
      guests: guestCount,
      step: 1,
    });
    document.getElementById("reservas")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-14 z-40 hidden border-b border-black/10 bg-[#f2f0eb]/96 shadow-lg backdrop-blur-md transition-[transform,opacity] duration-300 dark:border-white/10 dark:bg-zinc-950/96 md:block lg:top-16",
        show
          ? "translate-y-0 opacity-100"
          : "pointer-events-none invisible -translate-y-2 opacity-0",
      )}
      aria-hidden={!show}
    >
      {show ? (
        <form
          onSubmit={onSubmit}
          className="relative mx-auto flex max-w-6xl flex-row items-end gap-3 px-4 py-2.5 md:px-6"
        >
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> Entrada
            </span>
            <input
              type="date"
              value={checkIn}
              min={todayISO()}
              onChange={(e) => {
                setCheckIn(e.target.value);
                setError("");
              }}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-[#f2f0eb]"
            />
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> Salida
            </span>
            <input
              type="date"
              value={checkOut}
              min={checkIn || todayISO()}
              onChange={(e) => {
                setCheckOut(e.target.value);
                setError("");
              }}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-[#f2f0eb]"
            />
          </label>
          <label className="flex w-24 flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> Huéspedes
            </span>
            <input
              type="number"
              min={1}
              max={63}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-[#f2f0eb]"
            />
          </label>
          <button
            type="submit"
            className="shrink-0 rounded-full bg-zinc-900 px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-zinc-800 dark:bg-amber-600 dark:hover:bg-amber-500"
          >
            Reservar
          </button>
          {error ? (
            <p
              className="absolute bottom-1 left-4 text-[11px] font-medium text-red-600 dark:text-red-400 md:left-6"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
