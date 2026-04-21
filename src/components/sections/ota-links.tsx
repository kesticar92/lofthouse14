"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { site } from "@/lib/site";

export function OtaLinks() {
  return (
    <section id="otas" className="scroll-mt-28 pb-8">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-black/10 bg-white/50 p-6 text-sm text-zinc-700 backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-200"
        >
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">
            Reseñas y disponibilidad en OTAs
          </p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Puedes comparar opiniones en plataformas; la reserva directa suele
            ofrecer mejor flexibilidad.
          </p>
          <div className="mt-4 grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href={site.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-black/10 px-3 py-2 text-center text-xs font-semibold text-zinc-900 transition hover:bg-black/5 dark:border-white/10 dark:text-zinc-50 dark:hover:bg-white/5"
            >
              Booking.com
            </Link>
            {site.airbnbListings.map((url) => (
              <Link
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-black/10 px-3 py-2 text-center text-xs font-medium text-zinc-800 transition hover:bg-black/5 dark:border-white/10 dark:text-zinc-100 dark:hover:bg-white/5"
              >
                {url.split("/").pop()}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
