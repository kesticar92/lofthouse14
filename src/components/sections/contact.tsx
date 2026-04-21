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
      message || "Quiero información de disponibilidad y tarifas.",
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
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl md:text-5xl">
              Reserva fácil, directo y sin comisiones
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-lg">
              Escríbenos por WhatsApp y asegura tu estadía en minutos. También
              puedes ver referencias en Booking y Airbnb — pero la mejor tarifa
              y flexibilidad suele estar al reservar directo.
            </p>
            <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
              <p>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Teléfono:
                </span>{" "}
                <a
                  className="underline decoration-amber-600/60 underline-offset-4 hover:text-amber-700 dark:hover:text-amber-400"
                  href={`tel:${site.phoneDisplay.replace(/\s/g, "")}`}
                >
                  {site.phoneDisplay}
                </a>
              </p>
              <p>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Email:
                </span>{" "}
                <a
                  className="underline decoration-amber-600/60 underline-offset-4 hover:text-amber-700 dark:hover:text-amber-400"
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
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Al enviar el formulario se abre WhatsApp con tu mensaje. Ajusta el
              número real en <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">.env.local</code>.
            </p>
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
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    Nombre
                  </label>
                  <input
                    className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-zinc-900 outline-none ring-amber-500/30 placeholder:text-zinc-400 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-50"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-zinc-900 outline-none ring-amber-500/30 placeholder:text-zinc-400 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    Mensaje
                  </label>
                  <textarea
                    className="min-h-[120px] w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-zinc-900 outline-none ring-amber-500/30 placeholder:text-zinc-400 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-50"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Fechas, número de personas, tipo de estadía…"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
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
