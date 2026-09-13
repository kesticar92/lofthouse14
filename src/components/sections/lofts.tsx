"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { mergeStayDraft } from "@/lib/stay-draft";

import { PricingDetailsAccordion } from "@/components/sections/pricing-details-accordion";

const perks = [
  "WiFi",
  "Aire acondicionado",
  "Cocina equipada",
  "Smart TV con ROKU",
];

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

type LoftItem = (typeof lofts)[number];

function LoftHeroImage({
  loft,
  className,
  priority = false,
}: {
  loft: LoftItem;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl shadow-2xl",
        className,
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={loft.image}
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 z-0 h-full w-full"
        >
          <Image
            src={loft.image}
            alt={loft.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            quality={95}
            priority={priority}
            className="object-cover object-center"
          />
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      <div className="absolute bottom-6 left-0 z-20 w-full overflow-hidden md:bottom-12">
        <motion.ul
          initial="hidden"
          whileInView="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="flex flex-wrap justify-center gap-2 px-3 md:gap-3 md:px-4"
        >
          {perks.map((p) => (
            <motion.li
              key={p}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <GlassPanel className="flex items-center justify-center gap-2 border-white/20 px-3 py-1.5 text-white backdrop-blur-md md:px-4 md:py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                <span className="text-xs font-semibold tracking-wide md:text-sm">
                  {p}
                </span>
              </GlassPanel>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </div>
  );
}

export function Lofts() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeLoft = lofts[activeIndex];

  function goToReserve() {
    const loftCount = activeIndex === 3 ? 4 : activeIndex + 1;
    const guestsHint =
      activeIndex === 0
        ? 2
        : activeIndex === 1
          ? 4
          : activeIndex === 2
            ? 6
            : 8;
    mergeStayDraft({
      guests: guestsHint,
      from: "banner",
      step: 1,
    });
    const qs = new URLSearchParams({
      guests: String(guestsHint),
      from: "banner",
      step: "1",
      lofts: String(loftCount),
    });
    window.location.assign(`/reservar?${qs.toString()}`);
  }

  return (
    <section
      id="lofts"
      className="grid w-full grid-cols-1 items-center gap-6 px-4 py-12 md:gap-10 md:px-20 md:py-20 lg:grid-cols-2"
    >
      <div className="flex flex-col items-start justify-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex w-full flex-col items-start justify-center px-2 sm:px-6"
        >
          <h2 className="font-display text-3xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-5xl">
            ¿Cuántos lofts necesitas?
          </h2>

          <div className="mt-6 grid w-full grid-cols-4 gap-3 md:mt-8 md:gap-4">
            {[1, 2, 3, "+4"].map((num, i) => (
              <button
                key={num}
                type="button"
                className={cn(
                  "relative h-16 flex-1 overflow-hidden rounded-xl text-xl font-bold transition-colors md:h-20",
                  activeIndex === i
                    ? "text-white"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700",
                )}
                onClick={() => setActiveIndex(i)}
                aria-pressed={activeIndex === i}
              >
                {activeIndex === i && (
                  <motion.div
                    layoutId="loftIndicator"
                    className="absolute inset-0 bg-zinc-900 dark:bg-amber-600"
                    transition={{
                      type: "spring",
                      bounce: 0.2,
                      duration: 0.6,
                    }}
                  />
                )}
                <span className="relative z-10">{num}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Móvil: la foto del loft gana protagonismo justo tras el selector */}
        <LoftHeroImage
          loft={activeLoft}
          priority
          className="mt-5 aspect-[4/5] max-h-[68vh] w-full lg:hidden"
        />

        <div className="mx-auto w-full max-w-3xl space-y-4 px-2 py-5 sm:px-6 md:space-y-6 md:py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="space-y-4 md:space-y-6"
            >
              <div className="border-l-4 border-amber-600 pl-4 sm:pl-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-800 dark:text-amber-500 md:text-xs">
                  {activeLoft.categoryLabel}
                </p>
                <h3 className="mt-1 font-display text-xl tracking-tight text-zinc-900 dark:text-[#f2f0eb] md:mt-2 md:text-2xl">
                  {activeLoft.name}
                </h3>
              </div>

              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 md:text-base">
                {activeLoft.description}
              </p>

              {/* Precio solo inmediatamente antes de Reservar ahora */}
              <div className="space-y-3 pt-1">
                <PricingDetailsAccordion
                  price={activeLoft.price}
                  priceNote={activeLoft.priceNote}
                  capacity={activeLoft.capacity}
                />

                <button
                  type="button"
                  onClick={goToReserve}
                  className="inline-flex w-full items-center justify-center rounded-full bg-zinc-900 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-zinc-800 dark:bg-[#f2f0eb] dark:text-zinc-900 dark:hover:bg-white sm:w-auto sm:px-10"
                >
                  {activeIndex === 3
                    ? "Ir a reservar (4 o más lofts)"
                    : "Reservar ahora"}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Desktop: galería a la derecha */}
      <LoftHeroImage
        loft={activeLoft}
        className="hidden h-[400px] max-h-[80vh] w-full md:h-[600px] lg:mr-6 lg:block lg:h-[700px]"
      />
    </section>
  );
}
