"use client";

import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass-panel";
import { site } from "@/lib/site";

const items = [
  {
    title: "Ubicación que lo tiene todo",
    body: "A pocos minutos de restaurantes, bares, clínicas, universidades y escenarios deportivos, entre otros.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 21s-6-5.9-6-11a6 6 0 1 1 12 0c0 5.1-6 11-6 11Z" />
        <circle cx="12" cy="10" r="2.3" />
      </svg>
    ),
  },
  {
    title: "Espacios diseñados para tu ritmo",
    body: "Ya sea que vengas a trabajar, recuperarte o explorar la ciudad, aquí tienes lo que necesitas.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Z" />
        <path d="m18.5 14 1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1 1-2.2Z" />
      </svg>
    ),
  },
  {
    title: "Reservas claras, paso a paso",
    body: "Fechas y huéspedes → disponibilidad confirmada → pago → verificación de identidad → acceso autónomo al edificio.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m5 12 4 4 10-10" />
      </svg>
    ),
  },
];

export function ValueProps() {
  return (
    <section id="propuesta" className="scroll-mt-28 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 1, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <h2 className="font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] sm:text-5xl md:text-6xl">
            ¿POR QUÉ ELEGIR LOFTHOUSE 14?
          </h2>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
            {site.brandLine.toUpperCase()}
          </p>
          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300 sm:text-lg">
            Alojamiento moderno y funcional, con el encanto urbano de Cali.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 1, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
            >
              <GlassPanel className="h-full space-y-4">
                <div className="text-amber-800 dark:text-amber-400">{item.icon}</div>
                <h3 className="font-display text-2xl tracking-wide text-zinc-900 dark:text-[#f2f0eb]">
                  {item.title.toUpperCase()}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {item.body}
                </p>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
