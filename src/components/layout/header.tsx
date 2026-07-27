"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={cn(
      "fixed inset-x-0 top-0 z-50 transition-all duration-300 px-4 md:px-20 py-2",
      scrolled
        ? "bg-[#f2f0eb]/85 dark:bg-zinc-950/85 backdrop-blur-md shadow-lg border-b border-black/5 dark:border-white/5"
        : "bg-transparent shadow-none"
    )}>
      <div className="items-center grid grid-cols-[auto_1fr_auto] gap-2 md:gap-4 px-3 py-2.5">
        <div className="flex items-center justify-start gap-2.5">
          <p className={cn(
            "hidden lg:block text-xs font-semibold uppercase tracking-wider transition-colors duration-300",
            scrolled ? "text-zinc-600 dark:text-zinc-400" : "text-[#f2f0eb]/80"
          )}>
            Vive Cali desde el lugar correcto
          </p>
          <div className={cn(
            "hidden lg:block h-5 w-px transition-colors duration-300",
            scrolled ? "bg-zinc-300 dark:bg-zinc-800" : "bg-white/20"
          )}></div>
          <button
            id="menu_desplegable"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              "flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-full border text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm",
              scrolled
                ? "border-zinc-300 text-zinc-700 hover:bg-zinc-200/50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900/50"
                : "border-white/30 text-white hover:bg-white/10"
            )}
          >
            {isMenuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
            <span>menú</span>
          </button>
        </div>

        <Link
          href="/"
          className="justify-self-center"
        >
          <div className={cn(
            "border-l-0 border-t-2 border-r-0 border-b-2 px-3 py-1.5 transition-all duration-300",
            scrolled
              ? "border-zinc-900 text-zinc-900 dark:border-[#f2f0eb]/90 dark:text-[#f2f0eb]/90"
              : "border-white text-[#f2f0eb]/90"
          )}>
            <p className="text-base md:text-2xl lg:text-3xl font-extrabold uppercase tracking-[0.18em] font-display">
              LOFTHOUSE14
            </p>
          </div>
        </Link>

        <div className="flex items-center justify-end justify-self-end gap-2 md:gap-4">
          <Link href="#reservas">
            <button className={cn(
              "hidden lg:block rounded-xl px-5 py-2.5 text-center text-xs font-semibold uppercase tracking-wider transition duration-300 border",
              scrolled
                ? "bg-transparent text-zinc-800 border-zinc-300 hover:bg-zinc-200/50 dark:text-zinc-200 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
                : "bg-transparent text-white border-white/20 hover:bg-white/10"
            )}>
              contactanos
            </button>
          </Link>
          <Link href="#reservas">
            <button className={cn(
              "hidden sm:block rounded-xl px-5 py-2.5 text-center text-xs font-bold uppercase tracking-wider transition border shadow-sm",
              scrolled
                ? "bg-amber-600 text-white border-amber-600 hover:bg-amber-700 shadow-amber-600/10"
                : "bg-amber-500 text-white border-amber-500 hover:bg-amber-600 shadow-amber-500/20"
            )}>
              Reservar loft
            </button>
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Menú Desplegable con Glassmorphism */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute left-4 right-4 md:left-20 md:right-20 top-[calc(100%+8px)] rounded-3xl border border-black/5 dark:border-white/10 bg-[#f2f0eb]/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-2xl p-8 z-40 transition-all duration-300"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Columna 1: Navegación Principal */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Navegación
                </h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="#inicio"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-base font-bold text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
                    >
                      Inicio
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#lofts"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-base font-bold text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
                    >
                      Nuestros Lofts
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#experiencias"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-base font-bold text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
                    >
                      Experiencias
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#ubicacion"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-base font-bold text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
                    >
                      Ubicación
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Columna 2: Detalles y Servicios */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Información
                </h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="#propuesta"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-base font-bold text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
                    >
                      ¿Por qué nosotros?
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#proceso"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-base font-bold text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
                    >
                      Cómo reservar
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#testimonios"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-base font-bold text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
                    >
                      Testimonios
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#reservas"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-base font-bold text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
                    >
                      Reservas
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Columna 3: Contacto */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Contacto
                </h4>
                <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <p>
                    <strong className="text-zinc-800 dark:text-zinc-200">WhatsApp:</strong><br />
                    +57 318 827-2273
                  </p>
                  <p>
                    <strong className="text-zinc-800 dark:text-zinc-200">Dirección:</strong><br />
                    Calle 14 Oeste # 24B-10,<br />
                    Miraflores, Cali, Colombia
                  </p>
                </div>
              </div>

              {/* Columna 4: Mini Promo / Info Box */}
              <div className="p-6 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2 font-display">
                    LoftHouse14
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Vive Cali desde el lugar correcto. Diseñado para tu comodidad, privacidad y total seguridad.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-amber-500/10 flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-500 tracking-wider">
                    Reserva directa
                  </span>
                  <Link
                    href="#reservas"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-xs font-bold text-zinc-900 dark:text-white underline hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
                  >
                    Reservar ahora
                  </Link>
                  <Link
                    href="/admin/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-full border border-black/15 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-700 hover:bg-black/5 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
                  >
                    Acceso administrador
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

