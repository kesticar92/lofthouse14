"use client";

import { motion } from "framer-motion";
import { site } from "@/lib/site";
import { UserFocusIcon, MapPinIcon, BookOpenIcon } from "@phosphor-icons/react";
import { GlassPanel } from "../ui/glass-panel";

const items = [
  {
    title: "Flexibilidad única",
    body: `Desde una persona hasta ${site.maxGuests} huéspedes en lofts independientes. Tu grupo en el mismo edificio, cada quien con su espacio.`,
    icon: <MapPinIcon size={32} color="#FFFFFF" weight="duotone" />,
  },
  {
    title: "El corazón de Cali, a tus pies",
    body: "Miraflores y el Parque del Perro: gastronomía, salsa y servicios a pocos minutos.",
    icon: <UserFocusIcon size={40} color="#FFFFFF" weight="duotone" />,
  },
  {
    title: "Tu refugio después del día",
    body: "Lofts equipados, camas cómodas y cocina lista para estadías cortas o de varias semanas.",
    icon: <BookOpenIcon size={32} color="#FFFFFF" weight="duotone" />,
  },
];

export function ValueProps() {
  return (
    <section
      id="propuesta"
      className="relative min-h-screen overflow-hidden py-12 px-4 md:py-20 md:px-20"
    >
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{
          backgroundImage: "url('/gallery/lofthouse_afuera.webp')",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/55 to-black/75 md:bg-gradient-to-r md:from-black/85 md:via-black/60 md:to-black/40"
        aria-hidden
      />

      <div className="relative z-10 grid grid-cols-1 items-start gap-12 text-[#f2f0eb] lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 1, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-7xl px-4 text-center md:text-left lg:sticky lg:top-40"
        >
          <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-6 backdrop-blur-md md:border-transparent md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
            <h2 className="font-display text-4xl tracking-wide text-[#f2f0eb] drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)] md:text-5xl">
              ¿Por qué LOFTHOUSE 14?
            </h2>
            <p className="mt-4 text-base font-medium leading-relaxed text-[#f2f0eb] drop-shadow-[0_1px_10px_rgba(0,0,0,0.9)] sm:text-lg">
              {site.brandLine}. Capacidad hasta {site.maxGuests} huéspedes en
              el conjunto, con privacidad por loft.
            </p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 1, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mt-8 flex flex-col gap-4 text-zinc-900 dark:text-[#f2f0eb]"
        >
          {items.map((item) => (
            <GlassPanel
              key={item.title}
              className="space-y-2 px-6 py-5 transition duration-300 hover:scale-[1.01]"
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0">{item.icon}</span>
                <div>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="mt-1 text-base leading-relaxed">{item.body}</p>
                </div>
              </div>
            </GlassPanel>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
