"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarRange, Users } from "lucide-react";
import { StayDateRangePicker } from "@/components/ui/stay-date-range-picker";
import { trackBeginCheckout } from "@/lib/analytics";
import { cn } from "@/lib/cn";

/**
 * Bloque protagonista de configuración: fechas + huéspedes.
 * Envía al flujo guiado en /reservas con los parámetros elegidos.
 */
export function ReservationConfig({ className }: { className?: string }) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const ready = Boolean(checkIn && checkOut);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!ready) return;
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guests),
    });
    trackBeginCheckout({
      check_in: checkIn,
      guests,
    });
    router.push(`/reservas?${params.toString()}`);
  }

  return (
    <section
      id="configurar-reserva"
      aria-labelledby="configurar-reserva-title"
      className={cn(
        "relative z-20 -mt-6 scroll-mt-24 px-3 pb-10 sm:-mt-10 sm:px-6 sm:pb-14 md:px-10",
        className,
      )}
    >
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[1.75rem] border border-black/10 bg-[#f7f5f1] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)] dark:border-white/10 dark:bg-zinc-950 dark:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)]">
        <div className="border-b border-black/5 bg-zinc-900 px-5 py-5 text-white dark:border-white/10 sm:px-8 sm:py-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">
            Paso 1 · Configura tu estadía
          </p>
          <h2
            id="configurar-reserva-title"
            className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-wide sm:text-3xl md:text-4xl"
          >
            Elige fechas y huéspedes
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            Selecciona entrada, salida y cuántas personas vienen. Con eso
            abrimos el flujo de reserva: disponibilidad, extras y confirmación.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="grid gap-5 p-5 sm:gap-6 sm:p-8 lg:grid-cols-[1.4fr_0.7fr_auto] lg:items-end"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
              <CalendarRange className="size-5 text-amber-600" aria-hidden />
              <span className="text-sm font-bold uppercase tracking-wider">
                Fechas de estadía
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Entrada desde 15:00 · Salida hasta 11:00
            </p>
            <StayDateRangePicker
              checkIn={checkIn}
              checkOut={checkOut}
              onChange={(from, to) => {
                setCheckIn(from);
                setCheckOut(to);
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
              <Users className="size-5 text-amber-600" aria-hidden />
              <span className="text-sm font-bold uppercase tracking-wider">
                Huéspedes
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Capacidad por loft según unidad
            </p>
            <label className="flex h-[4.5rem] items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white px-4 dark:border-white/10 dark:bg-zinc-900">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                ¿Cuántas personas?
              </span>
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="cursor-pointer rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-base font-bold text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "persona" : "personas"}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-col gap-2 lg:min-w-[14rem]">
            <button
              type="submit"
              disabled={!ready}
              className={cn(
                "inline-flex h-14 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-extrabold uppercase tracking-wide text-white transition active:scale-[0.99] sm:h-16 sm:text-base",
                ready
                  ? "bg-amber-600 shadow-[0_14px_30px_-12px_rgba(217,119,6,0.9)] hover:bg-amber-700"
                  : "cursor-not-allowed bg-zinc-300 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400",
              )}
            >
              Continuar reserva
              <ArrowRight className="size-5" aria-hidden />
            </button>
            <p className="text-center text-[11px] leading-snug text-zinc-500 dark:text-zinc-400 lg:text-left">
              {ready
                ? "Siguiente: disponibilidad, extras y confirmación"
                : "Completa las fechas para continuar el flujo"}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
