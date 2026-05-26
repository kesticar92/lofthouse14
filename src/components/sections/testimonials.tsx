"use client";

import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass-panel";

const quotes = [
  {
    text: "Excelente ubicación, todo queda cerca. El loft es cómodo, limpio y bien equipado. Sin duda volvería.",
    author: "Camila R. · Turismo",
    stars: 5,
  },
  {
    text: "Perfecto para trabajar y salir a comer o tomar algo. El WiFi funcionó impecable toda la semana.",
    author: "Sebastián M. · Trabajo remoto",
    stars: 5,
  },
  {
    text: "Volvería por la comodidad y la facilidad de todo. El ingreso autónomo es muy práctico, llegué tarde y no hubo problema.",
    author: "Laura G. · Viaje de descanso",
    stars: 5,
  },
  {
    text: "Vine por una cita médica y la cercanía a la clínica fue clave. El espacio es tranquilo y permite recuperarse bien.",
    author: "Jorge P. · Estadía médica",
    stars: 5,
  },
  {
    text: "El barrio es increíble. A pasos del Parque del Perro, restaurantes y todo lo que necesitas. Una experiencia muy caleña.",
    author: "Valentina O. · Turismo cultural",
    stars: 5,
  },
  {
    text: "Vinimos en grupo y coordinaron todo muy bien. Cada uno en su loft y todos cerca. La comunicación con el anfitrión fue excelente.",
    author: "Equipo Comercial · Viaje corporativo",
    stars: 5,
  },
  {
    text: "El apartamento es exactamente como en las fotos, sin sorpresas. Moderno, limpio y con todo lo necesario para una estadía larga.",
    author: "Ricardo F. · Estadía mensual",
    stars: 5,
  },
  {
    text: "Me encantó que pudiera llegar a cualquier hora sin depender de nadie. Acceso autónomo, simple y seguro.",
    author: "Natalia V. · Viaje de negocios",
    stars: 5,
  },
  {
    text: "La cocina equipada hizo la diferencia. Pudimos preparar nuestras cosas y ahorrar bastante. Muy buena relación precio-calidad.",
    author: "Familia Herrera · Vacaciones",
    stars: 5,
  },
];

export function Testimonials() {
  return (
    <section className="border-y border-black/5 bg-zinc-50/80 py-20 dark:border-white/5 dark:bg-zinc-950/40 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 1, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <h2 className="font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] sm:text-5xl md:text-6xl">
            LO QUE VALORAN NUESTROS HUÉSPEDES
          </h2>
          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300 sm:text-lg">
            Reseñas resumidas del estilo de experiencia que buscamos ofrecer
            cada día.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {quotes.map((q, i) => (
            <motion.div
              key={q.text}
              initial={{ opacity: 1, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: (i % 3) * 0.07, duration: 0.45 }}
            >
              <GlassPanel className="h-full space-y-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: q.stars }).map((_, s) => (
                    <svg
                      key={s}
                      viewBox="0 0 16 16"
                      className="h-4 w-4 fill-amber-500"
                      aria-hidden
                    >
                      <path d="M8 1l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 10.8l-3.8 2 .7-4.3-3.1-3 4.3-.6z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
                  &ldquo;{q.text}&rdquo;
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                  {q.author}
                </p>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
