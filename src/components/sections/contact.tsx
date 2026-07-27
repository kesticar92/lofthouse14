"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { site, waLink } from "@/lib/site";
import { InstagramLogo } from "@phosphor-icons/react";

export function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dates, setDates] = useState("");
  const [guests, setGuests] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const text = [
      `Hola ${site.name}, quiero solicitar disponibilidad para Lofthouse 14:`,
      name ? `👤 *Nombre:* ${name}` : "",
      email ? `✉️ *Email:* ${email}` : "",
      dates ? `📅 *Fechas:* ${dates}` : "",
      guests ? `👥 *Huéspedes:* ${guests}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(waLink(text), "_blank", "noopener,noreferrer");
  }

  return (
    <section id="reservas" className="grid grid-cols-1 lg:grid-cols-2 w-full items-center gap-10 py-12 px-4 md:py-20 md:px-20 min-h-screen">
      
      {/* COLUMNA IZQUIERDA: Imagen */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="w-full h-[400px] md:h-[600px] lg:h-[700px] max-h-[80vh] rounded-3xl overflow-hidden relative shadow-2xl lg:mr-6"
      >
        <img
          src="/gallery/fondo_seccion_form.webp"
          alt="Lofthouse"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </motion.div>

      {/* COLUMNA DERECHA: Información y Formulario */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full  mx-auto lg:mx-0 flex flex-col space-y-10"
      >
        {/* Título y Descripción */}
        <div className="space-y-4">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-zinc-900 dark:text-white">
            Solicita <span className="text-amber-600">Disponibilidad</span>
          </h2>
          <p className="text-base text-zinc-600 dark:text-zinc-300">
            Reserva a tu ritmo. Envía tu solicitud para confirmar disponibilidad.
            Una vez verificados tus datos y el pago, activaremos tu llave digital para un acceso 100% autónomo a tu espacio.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Input Nombre */}
          <div className="relative">
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-white mb-2">
              Nombre
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-0 border-b-2 border-zinc-200 dark:border-zinc-700 bg-transparent px-0 py-2 text-lg text-zinc-900 dark:text-white focus:ring-0 focus:border-amber-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Input Email */}
          <div className="relative">
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-white mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-0 border-b-2 border-zinc-200 dark:border-zinc-700 bg-transparent px-0 py-2 text-lg text-zinc-900 dark:text-white focus:ring-0 focus:border-amber-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Input Fechas */}
          <div className="relative">
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-white mb-2">
              Fechas (DD/MM/AAAA - DD/MM/AAAA)
            </label>
            <input
              type="text"
              required
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              className="w-full border-0 border-b-2 border-zinc-200 dark:border-zinc-700 bg-transparent px-0 py-2 text-lg text-zinc-900 dark:text-white focus:ring-0 focus:border-amber-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Input Huéspedes */}
          <div className="relative">
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-white mb-2">
              Número de huéspedes
            </label>
            <input
              type="number"
              required
              min="1"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full border-0 border-b-2 border-zinc-200 dark:border-zinc-700 bg-transparent px-0 py-2 text-lg text-zinc-900 dark:text-white focus:ring-0 focus:border-amber-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Botón Submit */}
          <div className="pt-4">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-zinc-900 py-4 text-sm font-bold text-white transition hover:bg-amber-600 dark:bg-white dark:text-zinc-900 dark:hover:bg-amber-600 dark:hover:text-white sm:w-auto sm:px-10 shadow-lg"
            >
              Enviar solicitud
            </button>
          </div>
        </form>

        {/* Bloque de Información Adicional (Redes, Teléfono, etc.) */}
        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">WhatsApp</p>
            <a className="hover:text-amber-600 transition-colors text-zinc-900 dark:text-white font-bold" href={waLink("") } target="_blank" rel="noopener noreferrer">
              {site.phoneDisplay || "+57 310 123 4567"}
            </a>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Dirección</p>
            <a className="hover:text-amber-600 transition-colors text-zinc-900 dark:text-white font-bold uppercase" href={site.google_url} target="_blank" rel="noopener noreferrer">
              {site.addressLine || "Calle 14"}, Cali, Colombia
            </a>
          </div>
          <div className="sm:col-span-2 flex gap-4 pt-2">
            <a href="#" className="flex items-center gap-2 text-zinc-900 dark:text-white text-xs font-bold uppercase tracking-widest hover:text-amber-600 transition-colors">
              <svg viewBox="0 0 32 32" fill="currentColor" className="w-5 h-5">
                <path d="M16 1.5c-4.4 0-8 3.6-8 8 0 4.1 3 7.6 7 8.3v5.7c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5v-5.7c4-.7 7-4.2 7-8.3 0-4.4-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z"></path>
              </svg>
              <span className="underline underline-offset-4 decoration-2">Airbnb</span>
            </a>
          </div>
        </div>

      </motion.div>

    </section>
  );
}
