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
 * Atajo flotante: las fechas/personas alimentan el configurador de #reservas.
 * Se oculta cuando ese bloque ya está a la vista para no duplicar el formulario.
 */
export function StickyBookingBar() {
  const [visible, setVisible] = useState(false);
  const [hiddenByReservas, setHiddenByReservas] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [error, setError] = useState("");

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 360);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = document.getElementById("reservas");
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setHiddenByReservas(Boolean(entry?.isIntersecting));
      },
      // Se oculta al acercarse a #reservas para no duplicar el selector de fechas.
      { root: null, threshold: 0.05, rootMargin: "20% 0px 20% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const show = visible && !hiddenByReservas;

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
      setError("Elige entrada y salida para cotizar tu estadía.");
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
        "fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-[#f2f0eb]/95 px-3 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md transition-transform duration-300 dark:border-white/10 dark:bg-zinc-950/95 md:bottom-auto md:top-20 md:border-b md:border-t-0 md:shadow-lg",
        show ? "translate-y-0" : "translate-y-full md:-translate-y-[140%]",
      )}
      aria-hidden={!show}
    >
      <form
        onSubmit={onSubmit}
        className="mx-auto flex max-w-5xl flex-col gap-2"
      >
        <p className="text-[11px] font-medium leading-snug text-zinc-600 dark:text-zinc-400">
          Elige tus fechas aquí para{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            cotizar la estadía
          </span>{" "}
          en el configurador (precio estimado y WhatsApp).
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
          <label className="flex flex-1 flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
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
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-[#f2f0eb]"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
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
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-[#f2f0eb]"
            />
          </label>
          <label className="flex w-full flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 sm:w-28">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> Personas
            </span>
            <input
              type="number"
              min={1}
              max={63}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-[#f2f0eb]"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-6 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-zinc-800 dark:bg-amber-600 dark:hover:bg-amber-500"
          >
            Cotizar
          </button>
        </div>
        {error ? (
          <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
