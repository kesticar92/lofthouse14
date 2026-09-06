import type { Metadata } from "next";
import Link from "next/link";
import { GuidedReservation } from "@/components/sections/guided-reservation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Reservar | ${site.name}`,
  description:
    "Configura tu estadía en Lofthouse 14: fechas, huéspedes, extras y confirmación directa por WhatsApp.",
};

/**
 * Página exclusiva a pantalla completa para el flujo de reserva.
 */
export default function ReservarPage() {
  return (
    <div className="min-h-[100dvh] bg-[#f2f0eb] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-200 bg-[#f2f0eb]/95 px-4 py-3 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 md:px-6">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-wider text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Volver
        </Link>
        <span className="border-y-2 border-zinc-900 px-2 py-0.5 font-display text-sm font-extrabold uppercase tracking-[0.16em] dark:border-zinc-50">
          LOFTHOUSE14
        </span>
        <ThemeToggle />
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 md:py-10">
        <header className="mb-8 max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
            Reserva directa
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold uppercase leading-tight md:text-4xl">
            Configura tu estadía
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300 md:text-base">
            Elige fechas, huéspedes y extras. Al final te llevamos a WhatsApp con
            la cotización lista para confirmar.
          </p>
        </header>

        <GuidedReservation />
      </div>
    </div>
  );
}
