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
            initial={{ opacity: 0, y: 16 }}
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
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55 }}
            className="overflow-hidden rounded-2xl border border-black/10 shadow-xl dark:border-white/10"
          >
            <iframe
              title={`Mapa — ${site.addressLine}`}
              src={mapSrc}
              className="aspect-square w-full min-h-[320px] bg-zinc-100 dark:bg-zinc-900 lg:aspect-[5/4]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
