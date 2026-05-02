"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const cards = [
  {
    title: "Vive la salsa",
    body: "Estamos cerca de academias y zonas icónicas para bailar y disfrutar la cultura caleña.",
    image: "/gallery/loft-02.jpg",
  },
  {
    title: "Explora la gastronomía",
    body: "Restaurantes, cafés y bares a pocos pasos para que cada comida sea parte del viaje.",
    image: "/gallery/loft-03.jpg",
  },
  {
    title: "Ubicación para todo",
    body: "Cerca de clínicas, universidades y centros deportivos: menos traslados, más tiempo para ti.",
    image: "/gallery/loft-04.jpg",
  },
  {
    title: "Perfecto para estancias médicas",
    body: "Tranquilidad, privacidad y cercanía para tu recuperación (consulta accesibilidad por escaleras).",
    image: "/gallery/loft-05.jpg",
  },
  {
    title: "Ideal para grupos",
    body: "Capacidad combinada para alojar varias personas — hasta 63 huéspedes — con logística coordinada.",
    image: "/gallery/loft-06.jpg",
  },
  {
    title: "Trabajo remoto sin fricción",
    body: "Ambientes con buena conectividad y ritmo urbano para jornadas productivas y descansos reales.",
    image: "/gallery/loft-07.jpg",
  },
];

export function Experiences() {
  return (
    <section id="experiencias" className="scroll-mt-28 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 1, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <h2 className="font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] sm:text-5xl md:text-6xl">
            MÁS QUE HOSPEDAJE
          </h2>
          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300 sm:text-lg">
            Conecta con lo auténtico de la ciudad sin renunciar al descanso ni a
            la productividad.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 1, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: (i % 3) * 0.06, duration: 0.45 }}
            >
              <article className="h-full overflow-hidden rounded-2xl border border-black/10 bg-[#efe9dc] shadow-lg dark:border-white/10 dark:bg-zinc-900">
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={c.image}
                    alt={c.title}
                    fill
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-500 hover:scale-[1.03]"
                  />
                </div>
                <div className="space-y-3 p-4">
                  <h3 className="font-display text-xl tracking-wide text-zinc-900 dark:text-[#f2f0eb]">
                    {c.title.toUpperCase()}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {c.body}
                  </p>
                </div>
              </article>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
