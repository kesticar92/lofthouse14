"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass-panel";

const steps = [
  {
    step: "01",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="currentColor"
        aria-hidden
      >
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.38 1.26 4.8L2.05 22l5.43-1.43c1.37.73 2.94 1.15 4.56 1.15 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm-2.46 5.84c-.18 0-.47.07-.71.33-.24.27-.93.91-.93 2.22 0 1.3.95 2.56 1.08 2.74.13.17 1.85 2.98 4.57 4.06.64.27 1.14.44 1.53.56.64.2 1.23.17 1.69.1.52-.07 1.59-.65 1.81-1.28.23-.63.23-1.17.16-1.28-.06-.1-.22-.16-.47-.28-.25-.12-1.49-.73-1.72-.82-.23-.08-.4-.12-.56.12-.17.24-.64.82-.79.99-.14.16-.29.18-.54.06-.25-.12-1.06-.39-2.02-1.25-.75-.67-1.25-1.49-1.4-1.74-.14-.25-.01-.39.11-.51.11-.11.25-.29.38-.44.12-.14.16-.24.24-.4.08-.17.04-.31-.02-.44-.06-.12-.56-1.36-.77-1.86-.2-.49-.41-.42-.56-.42z" />
      </svg>
    ),
    title: "Escríbenos por WhatsApp",
    body: "Cuéntanos tus fechas, cuántos huéspedes y qué tipo de estadía buscas.",
  },
  {
    step: "02",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="m9 16 2 2 4-4" />
      </svg>
    ),
    title: "Confirmamos disponibilidad",
    body: "Validamos fechas y capacidad para tu grupo. Te confirmamos el loft disponible.",
  },
  {
    step: "03",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
    title: "Pago de la reserva",
    body: "Realizas el pago para bloquear las fechas. Rápido y seguro.",
  },
  {
    step: "04",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        <circle cx="12" cy="16" r="1" fill="currentColor" />
      </svg>
    ),
    title: "Verificación y acceso",
    body: "Verificamos tu identidad y activamos tu ingreso autónomo al alojamiento.",
  },
];

export function BookingSteps() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 1, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <h2 className="font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] sm:text-5xl">
            ASÍ DE FÁCIL
          </h2>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300 sm:text-base">
            Todo por WhatsApp, sin formularios complicados.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 1, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
            >
              <GlassPanel className="h-full space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-[0.3em] text-amber-800 dark:text-amber-400">
                    {s.step}
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-500">
                    {s.icon}
                  </span>
                </div>
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

        <motion.div
          initial={{ opacity: 1, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <Link
            href="#reservas"
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-zinc-800 dark:bg-[#f2f0eb] dark:text-zinc-900 dark:hover:bg-white"
          >
            Iniciar reserva
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
