"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Users } from "lucide-react";
import { trackBeginCheckout } from "@/lib/analytics";
import { cn } from "@/lib/cn";

export function StickyBookingBar() {
  const [visible, setVisible] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    trackBeginCheckout({
      guests: Number(guests) || 2,
    });
    document.getElementById("reservas")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-[#f2f0eb]/95 px-3 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md transition-transform duration-300 dark:border-white/10 dark:bg-zinc-950/95 md:bottom-auto md:top-20 md:border-b md:border-t-0 md:shadow-lg",
        visible ? "translate-y-0" : "translate-y-full md:-translate-y-[140%]",
      )}
    >
      <form
        onSubmit={onSubmit}
        className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-end sm:gap-3"
      >
        <label className="flex flex-1 flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" /> Entrada
          </span>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
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
            onChange={(e) => setCheckOut(e.target.value)}
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
          Buscar
        </button>
        <Link
          href="/#reservas"
          onClick={() => trackBeginCheckout()}
          className="hidden rounded-full border border-zinc-400 px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-zinc-700 dark:border-zinc-600 dark:text-zinc-200 lg:inline-flex lg:items-center"
        >
          Configurar
        </Link>
      </form>
    </div>
  );
}
