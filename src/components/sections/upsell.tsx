"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass-panel";
import { waLink } from "@/lib/site";

const items = [
  {
    title: "Early Check-in",
    body: "¿Tu vuelo llega temprano o necesitas entrar antes del mediodía? Coordina un ingreso anticipado según disponibilidad. Ideal si tienes pico y placa, vuelo matutino o simplemente quieres instalarte tranquilo.",
    cta: "Solicitar early check-in",
  },
  {
    title: "Late Check-out",
    body: "¿Tu vuelo sale en la tarde o la noche? Extiende tu salida y aprovecha el día sin apuros. Perfecto si tienes restricciones de movilidad, vuelo nocturno o una última reunión en la ciudad.",
    cta: "Solicitar late check-out",
  },
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
    <section
      id="servicios-extra"
      className="scroll-mt-28 bg-[#f2f0eb]/30 px-4 pb-20 pt-8 dark:bg-zinc-950/60 md:px-20 md:pb-28 md:pt-12"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 1, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-10 max-w-3xl text-center"
        >
          <h2 className="font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] sm:text-5xl md:text-6xl">
            MEJORA TU EXPERIENCIA
          </h2>
          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300 sm:text-lg">
            Añade servicios y recomendaciones para un viaje redondo.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 1, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
            >
              <GlassPanel className="flex h-full flex-col justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="font-display text-2xl tracking-wide text-zinc-900 dark:text-[#f2f0eb]">
                    {item.title.toUpperCase()}
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
