"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass-panel";
import { site, waLink } from "@/lib/site";

export function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = [
      `Hola ${site.name},`,
      name ? `Soy ${name}.` : "",
      message ||
        "Quiero iniciar una reserva (fechas, número de personas y capacidad).",
      email ? `Correo: ${email}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    window.open(waLink(text), "_blank", "noopener,noreferrer");
  }

  return (
    <section id="reservas" className="scroll-mt-28 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="space-y-5"
          >
            <h2 className="font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] sm:text-5xl md:text-6xl">
              RESERVA FÁCIL
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-lg">
              Escríbenos por WhatsApp: confirmamos{" "}
              <strong className="text-zinc-900 dark:text-[#f2f0eb]">
                fechas, huéspedes y capacidad
              </strong>{" "}
              según el tamaño de tu grupo; luego el pago de la reserva y la{" "}
              <strong className="text-zinc-900 dark:text-[#f2f0eb]">
                verificación de identidad
              </strong>
              . Si todo es correcto, activamos tu{" "}
              <strong className="text-zinc-900 dark:text-[#f2f0eb]">
                acceso autónomo
              </strong>{" "}
              al alojamiento.
            </p>
            <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
              <p>
                <span className="font-semibold text-zinc-900 dark:text-[#f2f0eb]">
                  Dirección:
                </span>{" "}
                {site.addressLine}, {site.neighborhood}, {site.city}
              </p>
              <p>
                <span className="font-semibold text-zinc-900 dark:text-[#f2f0eb]">
                  Teléfono anfitrión:
                </span>{" "}
                <a
                  className="underline decoration-amber-800/50 underline-offset-4 hover:text-amber-900 dark:decoration-amber-400/50 dark:hover:text-amber-300"
                  href={`tel:${site.phoneTel}`}
                >
                  {site.phoneDisplay}
                </a>
              </p>
              <p>
                <span className="font-semibold text-zinc-900 dark:text-[#f2f0eb]">
                  Email:
                </span>{" "}
                <a
                  className="underline decoration-amber-800/50 underline-offset-4 hover:text-amber-900 dark:decoration-amber-400/50 dark:hover:text-amber-300"
                  href={`mailto:${site.email}`}
                >
                  {site.email}
                </a>
              </p>
            </div>
            <Link
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-[#25D366] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/25 transition hover:bg-[#1ebe5b]"
            >
              Hablar por WhatsApp
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
          >
            <GlassPanel>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                    Nombre
                  </label>
                  <input
                    className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-zinc-900 outline-none ring-amber-800/25 placeholder:text-zinc-400 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-50"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-zinc-900 outline-none ring-amber-800/25 placeholder:text-zinc-400 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                    Mensaje
                  </label>
                  <textarea
                    className="min-h-[120px] w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-zinc-900 outline-none ring-amber-800/25 placeholder:text-zinc-400 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-50"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Fechas, número de adultos/ninos, tipo de estadía…"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-zinc-900 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-zinc-800 dark:bg-[#f2f0eb] dark:text-zinc-900 dark:hover:bg-white"
                >
                  Enviar por WhatsApp
                </button>
              </form>
            </GlassPanel>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
