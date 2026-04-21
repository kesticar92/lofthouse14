"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass-panel";
import { site, waLink } from "@/lib/site";

const perks = [
  "WiFi de alta velocidad",
  "Aire acondicionado",
  "Cocina equipada",
  "Smart TV",
  "Espacio de trabajo",
];

export function Lofts() {
  const formatted = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(site.priceFromCop);

  return (
    <section id="lofts" className="scroll-mt-28 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl md:text-5xl">
            Opciones pensadas para diferentes formas de viajar
          </h2>
          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300 sm:text-lg">
            Desde estadías cortas hasta largas, tenemos el espacio ideal para ti.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <GlassPanel className="mx-auto max-w-3xl space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
                  Loft funcional
                </p>
                <h3 className="mt-2 font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  Cómodo, bien ubicado y con lo esencial
                </h3>
              </div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                Desde{" "}
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatted}
                </span>{" "}
                por noche
                <span className="block text-xs font-normal text-zinc-500">
                  (según temporada y disponibilidad)
                </span>
              </p>
            </div>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              Cada unidad combina autonomía tipo Airbnb con la tranquilidad de un
              edificio horizontal organizado: ideal para turismo, trabajo remoto,
              estancias médicas, rotaciones y grupos con logística coordinada.
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {perks.map((p) => (
                <li
                  key={p}
                  className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {p}
                </li>
              ))}
            </ul>
            <Link
              href={waLink(
                "Hola, quiero consultar disponibilidad y tarifas para LOFTHOUSE 14.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 sm:w-auto sm:px-8"
            >
              Consultar disponibilidad por WhatsApp
            </Link>
          </GlassPanel>
        </motion.div>
      </div>
    </section>
  );
}
