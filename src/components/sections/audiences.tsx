"use client";

import { motion } from "framer-motion";
import { site } from "@/lib/site";

export function Audiences() {
  return (
    <section
      id="audiencias"
      className="scroll-mt-28 border-y border-black/5 bg-zinc-50/90 px-4 py-14 dark:border-white/5 dark:bg-zinc-950/50 md:px-20 md:py-16"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mb-8 text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800 dark:text-amber-500">
            Pensado para ti
          </p>
          <h2 className="mt-2 font-display text-3xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-4xl">
            ¿Para quién es LOFTHOUSE 14?
          </h2>
        </motion.div>
        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
          {site.audiences.map((label, i) => (
            <motion.span
              key={label}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03, duration: 0.35 }}
              className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-xs font-semibold text-zinc-800 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-100 sm:text-sm"
            >
              {label}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
