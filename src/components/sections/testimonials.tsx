"use client";

import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass-panel";

const quotes = [
  {
    text: "Excelente ubicación, todo queda cerca. Muy cómodo.",
    author: "Huésped verificado",
  },
  {
    text: "Perfecto para trabajar y salir a comer o tomar algo.",
    author: "Huésped verificado",
  },
  {
    text: "Volvería por la comodidad y la facilidad de todo.",
    author: "Huésped verificado",
  },
];

export function Testimonials() {
  return (
    <section className="border-y border-black/5 bg-zinc-50/80 py-20 dark:border-white/5 dark:bg-zinc-950/40 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <h2 className="font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] sm:text-5xl md:text-6xl">
            LO QUE VALORAN NUESTROS HUÉSPEDES
          </h2>
          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300 sm:text-lg">
            Reseñas resumidas del estilo de experiencia que buscamos ofrecer
            cada día.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {quotes.map((q, i) => (
            <motion.div
              key={q.text}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
            >
              <GlassPanel className="h-full space-y-4">
                <p className="text-lg font-medium leading-snug text-zinc-900 dark:text-zinc-50">
                  “{q.text}”
                </p>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  {q.author}
                </p>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
