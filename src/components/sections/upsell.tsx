"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass-panel";
import { waLink } from "@/lib/site";

const items = [
  {
    title: "Clases de salsa",
    body: "Te conectamos con academias y experiencias cercanas para que lleves Cali en el cuerpo.",
    cta: "Quiero clases de salsa",
  },
  {
    title: "Ruta gastronómica",
    body: "Recomendaciones curadas: desde desayuno caleño hasta la salida nocturna.",
    cta: "Quiero recomendaciones gastronómicas",
  },
  {
    title: "Estancias largas con descuento",
    body: "Ideal para nómadas digitales y rotaciones médicas. Pregunta por tarifas especiales.",
    cta: "Consultar estadía larga",
  },
  {
    title: "Paquetes para grupos",
    body: "Delegaciones, familias numerosas o eventos: coordinamos varias unidades.",
    cta: "Cotizar grupo",
  },
];

export function Upsell() {
  return (
    <section className="pb-24 pt-4 md:pb-32">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-10 max-w-3xl text-center"
        >
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl md:text-5xl">
            Mejora tu experiencia
          </h2>
          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300 sm:text-lg">
            Añade servicios y recomendaciones para un viaje redondo.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
            >
              <GlassPanel className="flex h-full flex-col justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {item.body}
                  </p>
                </div>
                <Link
                  href={waLink(item.cta)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-black/5 dark:border-white/10 dark:text-zinc-50 dark:hover:bg-white/5"
                >
                  Solicitar por WhatsApp
                </Link>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
