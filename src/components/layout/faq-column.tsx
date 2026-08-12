"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

export type FaqItem = { q: string; a: string };

interface FaqColumnProps {
  className?: string;
  items: FaqItem[];
  duration?: number;
}

export function FaqColumn({ className, items, duration = 30 }: FaqColumnProps) {
  const reduceMotion = useReducedMotion();

  if (items.length === 0) return null;

  const list = (
    <>
      {items.map((item) => (
        <article
          key={item.q}
          className="w-full rounded-3xl border border-zinc-200/80 bg-white/80 p-6 shadow-lg shadow-zinc-900/5 backdrop-blur-sm dark:border-white/10 dark:bg-zinc-900/50 dark:shadow-black/20"
        >
          <h3 className="font-display text-base font-semibold leading-snug tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-lg">
            {item.q}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
            {item.a}
          </p>
        </article>
      ))}
    </>
  );

  if (reduceMotion) {
    return <div className={cn("flex flex-col gap-4", className)}>{list}</div>;
  }

  return (
    <div className={cn("min-w-0 flex-1", className)}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-4 pb-4"
      >
        {[0, 1].map((loop) => (
          <React.Fragment key={loop}>
            {items.map((item) => (
              <article
                key={`${loop}-${item.q}`}
                className="w-full rounded-3xl border border-zinc-200/80 bg-white/80 p-6 shadow-lg shadow-zinc-900/5 backdrop-blur-sm dark:border-white/10 dark:bg-zinc-900/50 dark:shadow-black/20"
              >
                <h3 className="font-display text-base font-semibold leading-snug tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-lg">
                  {item.q}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
                  {item.a}
                </p>
              </article>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}
