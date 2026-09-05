"use client";

import {
  CalendarCheck,
  Users,
  CheckSquare,
  CreditCard,
  IdentificationCard,
  Clock,
} from "@phosphor-icons/react";
import RadialOrbitalTimeline from "../ui/orbital_timeline/RadialOrbitalTimeline";
import { motion } from "framer-motion";

const timelineData = [
  {
    id: 1,
    title: "Fechas",
    date: "Paso 01",
    content: "Selecciona tus fechas de entrada y salida en segundos.",
    category: "Reserva",
    icon: CalendarCheck,
    relatedIds: [2],
    status: "completed" as const,
    duration: "1 min",
  },
  {
    id: 2,
    title: "Huéspedes",
    date: "Paso 02",
    content: "Confirma el número de personas para tu estancia.",
    category: "Reserva",
    icon: Users,
    relatedIds: [1, 3],
    status: "completed" as const,
    duration: "1 min",
  },
  {
    id: 3,
    title: "Capacidad",
    date: "Paso 03",
    content:
      "Nuestro sistema valida la mejor opción para tu grupo al instante.",
    category: "Reserva",
    icon: CheckSquare,
    relatedIds: [2, 4],
    status: "in-progress" as const,
    duration: "2 min",
  },
  {
    id: 4,
    title: "Pago",
    date: "Paso 04",
    content: "Coordina el pago de forma segura y rápida.",
    category: "Reserva",
    icon: CreditCard,
    relatedIds: [3, 5],
    status: "pending" as const,
    duration: "5 min",
  },
  {
    id: 5,
    title: "Identidad",
    date: "Paso 05",
    content: "Verificación digital ágil para habilitar tu ingreso autónomo.",
    category: "Acceso",
    icon: IdentificationCard,
    relatedIds: [4],
    status: "pending" as const,
    duration: "3 min",
  },
];

export function RadialOrbitalTimelineDemo() {
  return (
    <section
      id="proceso"
      className="py-12 px-4 md:py-20 md:px-20 relative overflow-hidden bg-white dark:bg-[#0a0a0a]"
    >
      {/* Background decoration to match site */}
      <div className="absolute inset-0 -z-10 bg-[length:40px_40px] [background-image:linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)]" />

      <div className="max-w-6xl mx-auto px-4 mb-12 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-[0.2em] mb-6 border border-amber-500/20"
        >
          <Clock size={14} weight="fill" />
          Proceso de Reserva
        </motion.div>

        <h2 className="font-display text-4xl md:text-6xl tracking-tight text-zinc-900 dark:text-[#f2f0eb]">
          CÓMO{" "}
          <span className="text-amber-600 dark:text-amber-500">RESERVAR</span>
        </h2>
        <p className="mt-6 text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
          Sigue estos sencillos pasos para asegurar tu estancia en LoftHouse. Un
          proceso diseñado para tu comodidad y seguridad.
        </p>
      </div>

      <div className="h-auto lg:h-[650px] w-full relative">
        <RadialOrbitalTimeline timelineData={timelineData} />
      </div>
    </section>
  );
}
