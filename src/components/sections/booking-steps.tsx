"use client";

import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass-panel";

const steps = [
  {
    step: "01",
    title: "Fechas",
    body: "Nos indicas fechas de entrada y salida.",
  },
  {
    step: "02",
    title: "Huéspedes",
    body: "Número de personas que viajan con usted.",
  },
  {
    step: "03",
    title: "Capacidad",
    body: "Confirmamos disponibilidad según el tamaño del grupo y qué loft(s) aplican.",
  },
  {
    step: "04",
    title: "Pago",
    body: "Se coordina el pago de la reserva para bloquear las fechas.",
  },
  {
    step: "05",
    title: "Identidad y acceso",
    body: "Verificación de identidad; si es exitosa, se habilita el ingreso autónomo al alojamiento.",
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
          <h2 className="font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] sm:text-5xl">
            PROCESO DE RESERVA
          </h2>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300 sm:text-base">
            Un flujo sencillo para que sepas exactamente qué sigue en cada
            etapa.
          </p>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
            >
              <GlassPanel className="h-full space-y-3">
                <p className="text-xs font-bold tracking-[0.3em] text-amber-800 dark:text-amber-400">
                  {s.step}
                </p>
                <h3 className="font-display text-xl tracking-wide text-zinc-900 dark:text-[#f2f0eb]">
                  {s.title.toUpperCase()}
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
