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
      {/* Video background */}
      <div className="absolute inset-0 -z-20">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/gallery/loft-01.jpg"
          className="h-full w-full object-cover"
          aria-hidden="true"
        >
          <source src="/hero.mp4" type="video/mp4" />
          {/* Fallback image for browsers that don't support video */}
          <Image
            src="/gallery/loft-01.jpg"
            alt={`Interior de loft en ${site.neighborhood}`}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25 dark:from-black dark:via-black/70 dark:to-black/35" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
        <h1 className="sr-only">
          {site.name} — {site.tagline}. {site.brandLine}.
        </h1>
        <motion.div
          initial={{ opacity: 1, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl space-y-6 text-white"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f2f0eb]/90">
            {site.neighborhood} · {site.city}
          </p>
          <p className="font-display text-4xl leading-none tracking-wide sm:text-5xl md:text-6xl">
            {site.tagline.toUpperCase()}
          </p>
          <p className="max-w-2xl text-sm font-medium leading-relaxed text-white/90 sm:text-base">
            Ubicado en el corazón de Miraflores, a pasos del Parque del Perro,{" "}
            {site.name} te conecta con lo mejor de la ciudad: gastronomía,
            cultura, vida nocturna y comodidad en un solo lugar.
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/75">
            Perfecto para trabajar, descansar o vivir Cali como un local
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 1, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <Link
            href={waLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-[#f2f0eb] px-7 py-3.5 text-center text-sm font-semibold uppercase tracking-wide text-zinc-900 shadow-lg transition hover:bg-white"
          >
            Reservar por WhatsApp
          </Link>
          <Link
            href="#reservas"
            className="inline-flex items-center justify-center rounded-full border border-white/45 bg-white/10 px-7 py-3.5 text-center text-sm font-semibold uppercase tracking-wide text-white backdrop-blur-md transition hover:bg-white/15"
          >
            Consultar capacidad
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65"
        >
          Ingreso autónomo · WiFi rápido · {site.addressLine}
        </motion.p>
      </div>
    </section>
  );
}
