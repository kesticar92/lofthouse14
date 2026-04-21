"use client";

import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass-panel";

const steps = [
  {
    step: "01",
    title: "Escríbenos",
    body: "WhatsApp con fechas, número de personas y tipo de viaje.",
  },
  {
    step: "02",
    title: "Confirma disponibilidad",
    body: "Te respondemos con opciones de loft y tarifa según temporada.",
  },
  {
    step: "03",
    title: "Asegura tu estadía",
    body: "Coordinamos ingreso autónomo y detalles sin comisiones de OTAs.",
  },
];

export function BookingSteps() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <h2 className="font-serif text-3xl font-semibold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Proceso de reserva
          </h2>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300 sm:text-base">
            Tres pasos simples para llegar a Cali con la mente tranquila.
          </p>
        </motion.div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
            >
              <GlassPanel className="h-full space-y-3">
                <p className="text-xs font-bold tracking-[0.3em] text-amber-600 dark:text-amber-400">
                  {s.step}
                </p>
                <h3 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {s.body}
                </p>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
