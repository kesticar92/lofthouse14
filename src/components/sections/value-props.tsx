"use client";

import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass-panel";
import { site } from "@/lib/site";

const items = [
  {
    title: "Ubicación que lo tiene todo",
    body: "A pocos minutos de restaurantes, bares, clínicas, universidades y escenarios deportivos, entre otros.",
    icon: "📍",
  },
  {
    title: "Espacios diseñados para tu ritmo",
    body: "Ya sea que vengas a trabajar, recuperarte o explorar la ciudad, aquí tienes lo que necesitas.",
    icon: "✦",
  },
  {
    title: "Reservas claras, paso a paso",
    body: "Nuestro sistema es sencillo: confirmas fechas, número de huéspedes y capacidad disponible; luego el pago de la reserva y la verificación de identidad. Si todo es exitoso, habilitamos tu acceso autónomo al alojamiento.",
    icon: "✓",
  },
];

export function ValueProps() {
  return (
    <section id="propuesta" className="scroll-mt-28 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
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
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
            >
              <GlassPanel className="h-full space-y-4">
                <div className="text-2xl">{item.icon}</div>
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
