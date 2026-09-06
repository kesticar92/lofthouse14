"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { HelpCircle, Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { BookingBar } from "./booking-bar";
import { site, waLink } from "@/lib/site";
import { AnimatePresence, motion } from "framer-motion";

/** Navegación pública: hashes de home y páginas indexables. */
const PAGE_NAV = [
  { href: "/reservas", label: "Reservar" },
  { href: "/lofts", label: "Lofts" },
  { href: "/resenas", label: "Reseñas" },
  { href: "/ubicacion-miraflores-cali", label: "Ubicación" },
  { href: "/#preguntas-frecuentes", label: "Ayuda" },
  { href: "/galeria", label: "Galería" },
  { href: "/blog", label: "Blog" },
] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 p-2 sm:p-3">
      <div
        className={cn(
          "pointer-events-auto mx-auto flex h-12 max-w-6xl items-center gap-1 rounded-full border px-1.5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 sm:h-14 sm:gap-2 sm:px-2",
          scrolled
            ? "border-black/10 bg-[#f7f5f1]/92 dark:border-white/10 dark:bg-zinc-950/90"
            : "border-white/25 bg-white/85 dark:border-white/10 dark:bg-zinc-950/75",
        )}
      >
        {/* Menú */}
        <button
          id="menu_desplegable"
          type="button"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setIsMenuOpen((v) => !v)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-800 transition hover:bg-black/5 dark:text-zinc-100 dark:hover:bg-white/10 sm:h-10 sm:w-10"
        >
          {isMenuOpen ? (
            <X className="size-4 sm:size-5" />
          ) : (
            <Menu className="size-4 sm:size-5" />
          )}
        </button>

        {/* Logo compacto */}
        <Link
          href="/"
          className="shrink-0 rounded-full px-1.5 py-1 transition hover:bg-black/5 dark:hover:bg-white/10 sm:px-2"
          aria-label="Lofthouse 14 — inicio"
        >
          <span className="block font-[family-name:var(--font-display)] text-[11px] font-extrabold uppercase tracking-[0.14em] text-zinc-900 dark:text-[#f2f0eb] sm:text-sm sm:tracking-[0.16em] md:text-base">
            Lofthouse<span className="text-amber-600">14</span>
          </span>
        </Link>

        <div
          className="mx-0.5 hidden h-6 w-px shrink-0 bg-black/10 dark:bg-white/10 sm:block"
          aria-hidden
        />

        {/* Reserva inline — el corazón del banner */}
        <BookingBar variant="banner" className="min-w-0" />

        {/* Ayuda: solo desktop; en móvil vive dentro del menú */}
        <Link
          href="/#preguntas-frecuentes"
          aria-label="Ayuda"
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-700 transition hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10 sm:inline-flex sm:h-10 sm:w-10"
        >
          <HelpCircle className="size-4" />
          <span className="sr-only">Ayuda</span>
        </Link>

        {/* Tema */}
        <div className="shrink-0">
          <ThemeToggle />
        </div>
      </div>

      {/* Menú desplegable */}
      <AnimatePresence>
        {isMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-auto absolute inset-x-2 top-[calc(100%+6px)] z-40 mx-auto max-w-6xl overflow-hidden rounded-3xl border border-black/5 bg-[#f2f0eb]/96 p-5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/96 sm:inset-x-3 sm:p-7"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              <div className="space-y-3 md:col-span-2 lg:col-span-2">
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Explorar
                </h4>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {PAGE_NAV.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="text-sm font-bold text-zinc-700 transition-colors hover:text-amber-600 dark:text-zinc-300 dark:hover:text-amber-400 sm:text-base"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-sm">
                  <Link
                    href="/politicas"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-zinc-500 hover:underline dark:text-zinc-400"
                  >
                    Políticas
                  </Link>
                  <Link
                    href="/alojamiento-grupos-cali"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-zinc-500 hover:underline dark:text-zinc-400"
                  >
                    Grupos en Cali
                  </Link>
                  <Link
                    href="/en"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-zinc-500 hover:underline dark:text-zinc-400"
                  >
                    English
                  </Link>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Contacto
                </h4>
                <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <p>
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      WhatsApp
                    </strong>
                    <br />
                    <a
                      href={waLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-amber-600 dark:hover:text-amber-400"
                    >
                      {site.phoneDisplay}
                    </a>
                  </p>
                  <p>
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      Dirección
                    </strong>
                    <br />
                    {site.addressLine}
                    <br />
                    {site.neighborhood}, {site.city}
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 dark:bg-amber-950/20">
                <div>
                  <h4 className="mb-1 font-display text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Lofthouse 14
                  </h4>
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Vive Cali desde el lugar correcto. Privacidad, comodidad y
                    check-in autónomo.
                  </p>
                </div>
                <Link
                  href="/admin/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="mt-4 flex w-full items-center justify-center rounded-full border border-black/15 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700 hover:bg-black/5 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
                >
                  Acceso administrador
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
