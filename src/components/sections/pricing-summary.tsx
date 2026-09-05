"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass-panel";
import { pricingAdditionalNotes } from "@/lib/pricing-additional";
import { site } from "@/lib/site";

function formatCop(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function PricingSummary() {
  return (
    <section
      id="tarifas"
      className="scroll-mt-28 border-y border-zinc-200/80 bg-zinc-50 px-4 py-16 dark:border-zinc-800 dark:bg-zinc-950/80 md:px-20 md:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800 dark:text-amber-500">
            Tarifas transparentes
          </p>
          <h2 className="mt-2 font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-5xl">
            Precios claros por loft
          </h2>
          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300">
            Referencia desde temporada baja. La cotización final depende de
            fechas, demanda y número de huéspedes.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          <GlassPanel className="md:col-span-1 flex flex-col justify-center text-center md:text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Desde
            </p>
            <p className="mt-2 font-display text-4xl text-amber-600">
              {formatCop(site.priceFromCop)}
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Por noche · 2 personas · por loft
            </p>
          </GlassPanel>

          <GlassPanel className="md:col-span-2 space-y-3">
            <p className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-[#f2f0eb]">
              Cargos adicionales (por loft)
            </p>
            <ul className="space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
              {pricingAdditionalNotes.map((note) => (
                <li key={note} className="flex gap-2">
                  <span className="text-amber-600">·</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
            <p className="pt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Check-in {site.checkIn.toLowerCase()} · Check-out{" "}
              {site.checkOut.toLowerCase()}
            </p>
          </GlassPanel>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="#lofts"
            className="inline-flex rounded-full border border-zinc-300 px-8 py-3 text-sm font-bold text-zinc-800 hover:bg-white dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Ver tipos de loft
          </Link>
          <Link
            href="#reservas"
            className="inline-flex rounded-full bg-zinc-900 px-8 py-3 text-sm font-bold text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            Calcular mi reserva
          </Link>
        </div>
      </div>
    </section>
  );
}
