"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeToggle } from "./theme-toggle";
import { site, waLink } from "@/lib/site";
import { cn } from "@/lib/cn";

/** Navegación del embudo: solo lo esencial hacia la reserva. */
const PAGE_NAV = [
  { href: "#reservas", label: "Configurar estadía" },
  { href: "#lofts", label: "Lofts" },
  { href: "#testimonios", label: "Reseñas" },
  { href: "#ubicacion", label: "Ubicación" },
  { href: "#preguntas-frecuentes", label: "Ayuda" },
  { href: "#galeria", label: "Galería y redes" },
] as const;

/**
 * Barra fija única: menú a la izquierda, marca al centro, ayuda + día/noche a la derecha.
 * Menú: izquierda → derecha en escritorio; arriba → abajo en móvil.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMenuOpen]);

  const panelMotion = isDesktop
    ? {
        initial: { opacity: 0, x: -28 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -28 },
      }
    : {
        initial: { opacity: 0, y: -16 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -16 },
      };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-black/5 bg-[#f2f0eb]/95 shadow-md backdrop-blur-md dark:border-white/5 dark:bg-zinc-950/95"
          : "border-b border-transparent bg-black/25 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto grid h-14 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 md:h-16 md:px-6">
        <div className="flex items-center justify-start">
          <button
            type="button"
            id="menu_desplegable"
            aria-expanded={isMenuOpen}
            aria-controls="site-menu"
            onClick={() => setIsMenuOpen((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition md:px-4 md:text-xs",
              scrolled
                ? "border-zinc-300 text-zinc-800 hover:bg-zinc-200/50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                : "border-white/35 text-white hover:bg-white/10",
            )}
          >
            {isMenuOpen ? (
              <X className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Menu className="h-3.5 w-3.5" aria-hidden />
            )}
            Menú
          </button>
        </div>

        <Link href="/" className="justify-self-center" aria-label={site.name}>
          <span
            className={cn(
              "border-y-2 px-2 py-0.5 font-display text-sm font-extrabold uppercase tracking-[0.18em] transition md:px-3 md:text-xl",
              scrolled
                ? "border-zinc-900 text-zinc-900 dark:border-[#f2f0eb] dark:text-[#f2f0eb]"
                : "border-white text-white",
            )}
          >
            LOFTHOUSE14
          </span>
        </Link>

        <div className="flex items-center justify-end gap-1.5 md:gap-2">
          <Link
            href="#preguntas-frecuentes"
            className={cn(
              "rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider transition md:px-4 md:text-xs",
              scrolled
                ? "border-zinc-300 text-zinc-800 hover:bg-zinc-200/50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                : "border-white/35 text-white hover:bg-white/10",
            )}
          >
            Ayuda
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar menú"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              id="site-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menú del sitio"
              initial={panelMotion.initial}
              animate={panelMotion.animate}
              exit={panelMotion.exit}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "absolute z-[45] max-h-[min(85vh,640px)] overflow-y-auto border border-black/5 bg-[#f2f0eb]/98 p-5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/98",
                // Móvil: panel bajo el header, de arriba hacia abajo
                "inset-x-3 top-[calc(100%+6px)] rounded-2xl",
                // Escritorio: panel anclado a la izquierda, entra L→R
                "md:inset-x-auto md:left-0 md:top-full md:h-[calc(100dvh-4rem)] md:max-h-none md:w-[min(22rem,90vw)] md:rounded-none md:rounded-br-2xl md:border-l-0 md:p-8",
              )}
            >
              <div className="grid gap-6">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
                    Ir a
                  </h4>
                  <ul className="grid gap-1">
                    {PAGE_NAV.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="block rounded-lg px-2 py-2.5 text-sm font-bold text-zinc-800 transition hover:bg-black/5 hover:text-amber-700 dark:text-zinc-200 dark:hover:bg-white/5 dark:hover:text-amber-400"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
                    Contacto
                  </h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      WhatsApp
                    </span>
                    <br />
                    <a
                      href={waLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-amber-600"
                    >
                      {site.phoneDisplay}
                    </a>
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {site.addressLine}
                    <br />
                    {site.neighborhood}, {site.city}
                  </p>
                </div>
                <div className="flex flex-col justify-between rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 dark:bg-amber-950/20">
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Lofts en Miraflores, cerca del Parque del Perro. Cotiza fechas
                    y confirma por WhatsApp.
                  </p>
                  <Link
                    href="#reservas"
                    onClick={() => setIsMenuOpen(false)}
                    className="mt-4 inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white dark:bg-white dark:text-zinc-900"
                  >
                    Ir a cotizar
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
