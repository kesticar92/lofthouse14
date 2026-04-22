"use client";

import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass-panel";

const cards = [
  {
    title: "Vive la salsa",
    body: "Estamos cerca de academias y zonas icónicas para bailar y disfrutar la cultura caleña.",
  },
  {
    title: "Explora la gastronomía",
    body: "Restaurantes, cafés y bares a pocos pasos para que cada comida sea parte del viaje.",
  },
  {
    title: "Ubicación para todo",
    body: "Cerca de clínicas, universidades y centros deportivos: menos traslados, más tiempo para ti.",
  },
  {
    title: "Perfecto para estancias médicas",
    body: "Tranquilidad, privacidad y cercanía para tu recuperación (consulta accesibilidad por escaleras).",
  },
  {
    title: "Ideal para grupos",
    body: "Capacidad combinada para alojar varias personas — hasta 63 huéspedes — con logística coordinada.",
  },
];

export function Experiences() {
  return (
    <section id="experiencias" className="scroll-mt-28 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <h2 className="font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] sm:text-5xl md:text-6xl">
            MÁS QUE HOSPEDAJE
          </h2>
          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300 sm:text-lg">
            Conecta con lo auténtico de la ciudad sin renunciar al descanso ni a
            la productividad.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: (i % 3) * 0.06, duration: 0.45 }}
            >
              <GlassPanel className="h-full space-y-3">
                <h3 className="font-display text-xl tracking-wide text-zinc-900 dark:text-[#f2f0eb]">
                  {c.title.toUpperCase()}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {c.body}
                </p>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
