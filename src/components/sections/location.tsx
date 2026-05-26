"use client";

import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass-panel";
import { site } from "@/lib/site";

const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(
  site.mapQuery,
)}&hl=es&z=16&output=embed`;

export function Location() {
  return (
    <section id="ubicacion" className="scroll-mt-28 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 1, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="space-y-5"
          >
            <h2 className="font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] sm:text-5xl md:text-6xl">
              EN EL CORAZÓN DE CALI
            </h2>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Barrio Miraflores
            </p>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-lg">
              Una de las zonas más activas y estratégicas de Cali. A pocos pasos
              del Parque del Perro, con acceso a lo que necesitas para vivir,
              trabajar o recuperarte.
            </p>
            <GlassPanel className="space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
              <p className="font-semibold text-zinc-900 dark:text-[#f2f0eb]">
                Dirección
              </p>
              <p>
                {site.addressLine}, {site.neighborhood}, {site.city}
              </p>
              <p className="font-semibold text-zinc-900 dark:text-[#f2f0eb]">
                Menos tiempo en transporte, más tiempo disfrutando.
              </p>
            </GlassPanel>
          </motion.div>

          <motion.div
            initial={{ opacity: 1, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55 }}
            className="relative overflow-hidden rounded-2xl border-2 border-zinc-900 bg-[#efe9dc] shadow-[8px_8px_0_0_#0a0a0a] dark:border-zinc-100 dark:bg-zinc-900 dark:shadow-[8px_8px_0_0_#f2f0eb]"
          >
            <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-md border border-zinc-900/60 bg-[#f2f0eb]/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-800 dark:border-zinc-200/60 dark:bg-zinc-950/80 dark:text-zinc-200">
              {/* iPhone-style pin */}
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 shrink-0 text-[#007AFF]"
                fill="currentColor"
                aria-hidden
              >
                <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
              </svg>
              Cómo llegar
            </div>
            <iframe
              title={`Mapa — ${site.addressLine}`}
              src={mapSrc}
              className="aspect-square w-full min-h-[320px] grayscale-[0.15] contrast-[1.02] saturate-75 dark:grayscale-[0.25] dark:contrast-110 dark:saturate-50 lg:aspect-[5/4]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
