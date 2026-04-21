"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { site, waLink } from "@/lib/site";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative isolate flex min-h-[100svh] items-end overflow-hidden pb-24 pt-32 md:items-center md:pb-28 md:pt-36"
    >
      <div className="absolute inset-0 -z-20">
        <Image
          src="/gallery/loft-01.jpg"
          alt={`Interior de loft en ${site.neighborhood}`}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25 dark:from-black dark:via-black/70 dark:to-black/35" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl space-y-5 text-white"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-200/90">
            Miraflores · {site.city}
          </p>
          <h1 className="font-serif text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            {site.name}
          </h1>
          <p className="font-serif text-2xl text-white/90 sm:text-3xl">
            {site.tagline}
          </p>
          <p className="max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            Ubicado en el corazón de Miraflores, a pasos del Parque del Perro,{" "}
            {site.name} te conecta con lo mejor de la ciudad: gastronomía,
            cultura, vida nocturna y comodidad en un solo lugar.
          </p>
          <p className="text-sm font-medium text-white/80 sm:text-base">
            Perfecto para trabajar, descansar o vivir Cali como un local.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <Link
            href={waLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-amber-500 px-7 py-3.5 text-center text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-900/30 transition hover:bg-amber-400"
          >
            Reservar por WhatsApp
          </Link>
          <Link
            href="#reservas"
            className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-7 py-3.5 text-center text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
          >
            Ver disponibilidad
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-xs font-medium uppercase tracking-widest text-white/70"
        >
          Ingreso autónomo · WiFi rápido · Ubicación estratégica
        </motion.p>
      </div>
    </section>
  );
}
