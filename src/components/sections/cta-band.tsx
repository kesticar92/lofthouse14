"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { waLink } from "@/lib/site";

type CtaBandProps = {
  id?: string;
  title?: string;
  subtitle?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function CtaBand({
  id = "cta-reserva",
  title = "¿Listo para reservar tu loft?",
  subtitle = "Reserva directa con LOFTHOUSE 14: fechas, huéspedes y cotización clara por WhatsApp, sin intermediarios.",
  primaryHref = "#reservas",
  primaryLabel = "Calcular mi reserva",
  secondaryHref,
  secondaryLabel = "Escribir por WhatsApp",
}: CtaBandProps) {
  const wa = secondaryHref ?? waLink();

  return (
    <section id={id} className="scroll-mt-28 px-4 py-14 md:px-20 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
        className="mx-auto flex max-w-5xl flex-col items-center gap-6 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-[#f2f0eb]/80 to-zinc-100/90 px-6 py-12 text-center shadow-xl dark:from-amber-950/30 dark:via-zinc-900/80 dark:to-zinc-950 md:px-12"
      >
        <h2 className="font-display text-3xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-4xl">
          {title}
        </h2>
        <p className="max-w-xl text-base text-zinc-600 dark:text-zinc-300">
          {subtitle}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={primaryHref}
            className="inline-flex rounded-full bg-zinc-900 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-amber-600 dark:bg-[#f2f0eb] dark:text-zinc-900 dark:hover:bg-white"
          >
            {primaryLabel}
          </Link>
          <Link
            href={wa}
            target={wa.startsWith("http") ? "_blank" : undefined}
            rel={wa.startsWith("http") ? "noopener noreferrer" : undefined}
            className="inline-flex rounded-full border border-zinc-400/80 px-8 py-3.5 text-sm font-bold text-zinc-800 hover:bg-white/80 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            {secondaryLabel}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
