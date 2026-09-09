"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass-panel";
import { site, waLink } from "@/lib/site";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

import { PricingDetailsAccordion } from "@/components/sections/pricing-details-accordion";

const perks = ["WiFi", "Aire acondicionado", "Cocina equipada", "Smart TV"];

/** Tarifas desde base Loft Cielo ($90.000): 1×, 2×, 3×; 4+ a consultar. */
const CIELO_BASE = 90_000;

const lofts = [
  {
    name: "Tu refugio personal",
    subName: "1 loft",
    categoryLabel: "1 LOFT • LOFT CIELO",
    description:
      "El espacio ideal para ti o para compartir en pareja. Un Loft Cielo privado, moderno y totalmente equipado, diseñado para ser tu base de descanso después de recorrer San Fernando y vivir el ritmo de Cali.",
    capacity: "Ideal 2 personas · Máx. 5",
    price: `Desde $${CIELO_BASE.toLocaleString("es-CO")} por noche`,
    priceNote: "Tarifa base Loft Cielo · 2 personas · temporada baja",
    image: "/gallery/loft-cocina-equipada-miraflores-cali.webp",
  },
  {
    name: "Juntos, pero con espacio",
    subName: "2 lofts",
    categoryLabel: "2 LOFTS • LOFT CIELO",
    description:
      "Dos Lofts Cielo contiguos para familias o grupos pequeños. Disfruten de la ciudad juntos durante el día y descansen con privacidad por la noche, sin sacrificar la cercanía.",
    capacity: "2 a 10 personas",
    price: `Desde $${(CIELO_BASE * 2).toLocaleString("es-CO")} por noche`,
    priceNote: "2 × tarifa base Loft Cielo · temporada baja",
    image: "/gallery/loft-habitacion-miraflores-cali.webp",
  },
  {
    name: "El punto de encuentro",
    subName: "3 lofts",
    categoryLabel: "3 LOFTS • LOFT CIELO",
    description:
      "Tres Lofts Cielo en el mismo edificio para familias grandes que quieren compartir la experiencia caleña. Espacios independientes con el mismo nivel de confort.",
    capacity: "3 a 15 personas",
    price: `Desde $${(CIELO_BASE * 3).toLocaleString("es-CO")} por noche`,
    priceNote: "3 × tarifa base Loft Cielo · temporada baja",
    image: "/gallery/loft-sala-sofa-miraflores-cali.webp",
  },
  {
    name: "Experiencia para grandes grupos",
    subName: "+4 lofts",
    categoryLabel: "4 O + • LOFTS CIELO",
    description:
      "¿Viajas con una delegación, equipo o gran familia? Cotizamos múltiples Lofts Cielo según fechas y capacidad. Todo el grupo en el mismo lugar, con ubicación estratégica.",
    capacity: "4 a 63 personas",
    price: "Precio a consultar",
    priceNote: "Cotización personalizada · Lofts Cielo según fechas",
    image: "/gallery/loft-dormitorio-entrepiso-miraflores-cali.webp",
  },
];

export function Lofts() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeLoft = lofts[activeIndex];

  return (
    <section
      id="lofts"
      className="grid grid-cols-1 lg:grid-cols-2 w-full items-center gap-10 py-12 px-4 md:py-20 md:px-20"
    >
      <div className="flex flex-col items-start justify-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full flex justify-center items-start flex-col px-6"
        >
          <h2 className="font-display text-4xl md:text-5xl tracking-wide text-zinc-900 dark:text-[#f2f0eb]">
            ¿Cuántos lofts necesitas?
          </h2>

          {/* Selector de Lofts con estilo elegante */}
          <div className="w-full grid grid-cols-4 gap-4 mt-8">
            {[1, 2, 3, "+4"].map((num, i) => (
              <button
                key={num}
                className={cn(
                  "relative flex-1 h-20 rounded-xl text-xl font-bold transition-colors overflow-hidden",
                  activeIndex === i
                    ? "text-white"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700",
                )}
                onClick={() => setActiveIndex(i)}
              >
                {activeIndex === i && (
                  <motion.div
                    layoutId="loftIndicator"
                    className="absolute inset-0 bg-zinc-900 dark:bg-amber-600"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{num}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <div className="mx-auto w-full max-w-3xl space-y-6 px-6 py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-l-4 border-amber-600 pl-6">
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800 dark:text-amber-500">
                    {activeLoft.categoryLabel}
                  </p>
                  <h3 className="mt-2 font-display text-2xl tracking-tight text-zinc-900 dark:text-[#f2f0eb]">
                    {activeLoft.name}
                  </h3>
                </div>
              </div>

              <PricingDetailsAccordion
                price={activeLoft.price}
                priceNote={activeLoft.priceNote}
                capacity={activeLoft.capacity}
              />

              <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                {activeLoft.description}
              </p>

              <div className="pt-2">
                <Link
                  href={waLink(
                    activeIndex === 3
                      ? "Hola, quiero cotizar 4 o más Lofts Cielo en LOFTHOUSE 14 (precio a consultar)."
                      : `Hola, quiero consultar disponibilidad para ${activeLoft.subName} · Loft Cielo en LOFTHOUSE 14.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-full bg-zinc-900 py-4 text-sm font-bold text-white transition hover:bg-zinc-800 dark:bg-[#f2f0eb] dark:text-zinc-900 dark:hover:bg-white sm:w-auto sm:px-10 shadow-lg"
                >
                  {activeIndex === 3
                    ? "Consultar precio por WhatsApp"
                    : "Consultar capacidad por WhatsApp"}
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Galería con Glassmorphism */}
      <div className="w-full h-[400px] md:h-[600px] lg:h-[700px] max-h-[80vh] rounded-3xl overflow-hidden relative group shadow-2xl lg:mr-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeLoft.image}
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 h-full w-full z-0"
          >
            <Image
              src={activeLoft.image}
              alt={activeLoft.name}
              width={1200}
              height={1500}
              quality={95}
              className="h-full w-full object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-10" />

        <div className="absolute bottom-12 left-0 w-full z-20 overflow-hidden">
          <motion.ul
            initial="hidden"
            whileInView="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
            }}
            className="flex flex-wrap gap-3 justify-center px-4"
          >
            {perks.map((p) => (
              <motion.li
                key={p}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <GlassPanel className="flex items-center justify-center gap-2 px-4 py-2 border-white/20 text-white backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                  <span className="text-sm font-semibold tracking-wide">
                    {p}
                  </span>
                </GlassPanel>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
