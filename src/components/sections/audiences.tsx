"use client";

import { motion } from "framer-motion";
import { site } from "@/lib/site";

export function Audiences() {
  return (
    <section className="border-y border-black/5 bg-zinc-50/80 py-12 dark:border-white/5 dark:bg-zinc-950/40">
      <div className="mx-auto max-w-6xl px-4">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Pensado para ti
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {site.audiences.map((label, i) => (
            <motion.span
              key={label}
              initial={{ opacity: 1, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03, duration: 0.35 }}
              className="rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-100 sm:text-sm"
            >
              {label}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
