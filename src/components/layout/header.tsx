"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Menu, Users, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeToggle } from "./theme-toggle";
import { site, waLink } from "@/lib/site";
import { cn } from "@/lib/cn";
import { trackBeginCheckout } from "@/lib/analytics";
import { saveStayDraft } from "@/lib/stay-draft";

/** Navegación del embudo: solo lo esencial hacia la reserva. */
const PAGE_NAV = [
  { href: "#reservas", label: "Configurar estadía" },
  { href: "#lofts", label: "Lofts" },
  { href: "#testimonios", label: "Reseñas" },
  { href: "#ubicacion", label: "Ubicación" },
  { href: "#preguntas-frecuentes", label: "Ayuda" },
  { href: "#galeria", label: "Galería y redes" },
] as const;

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Una sola barra fija:
 * Menú | marca | fechas+huéspedes+Reservar (solo escritorio) | Ayuda + día/noche.
 * Menú: izquierda → derecha en web; arriba → abajo en móvil.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [error, setError] = useState("");

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

  const onReserve = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!checkIn || !checkOut) {
      setError("Elige entrada y salida.");
      return;
    }
    if (checkOut <= checkIn) {
      setError("La salida debe ser después de la entrada.");
      return;
    }
    const guestCount = Math.min(63, Math.max(1, Number(guests) || 2));
    trackBeginCheckout({ guests: guestCount });
    saveStayDraft({
      checkIn,
      checkOut,
      guests: guestCount,
      step: 1,
    });
    document.getElementById("reservas")?.scrollIntoView({ behavior: "smooth" });
  };

  const chrome = scrolled
    ? "border-zinc-300 text-zinc-800 hover:bg-zinc-200/50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
    : "border-white/35 text-white hover:bg-white/10";

  const inputClass = scrolled
    ? "rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-[#f2f0eb]"
    : "rounded-lg border border-white/30 bg-white/15 px-2 py-1.5 text-xs text-white placeholder:text-white/70 backdrop-blur-sm [color-scheme:dark]";

  const labelClass = scrolled
    ? "text-[9px] font-bold uppercase tracking-wider text-zinc-500"
    : "text-[9px] font-bold uppercase tracking-wider text-white/75";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-black/5 bg-[#f2f0eb]/95 shadow-md backdrop-blur-md dark:border-white/5 dark:bg-zinc-950/95"
          : "border-b border-transparent bg-black/25 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex h-14 max-w-[90rem] items-center gap-2 px-3 md:h-[4.25rem] md:gap-3 md:px-5 lg:px-6">
        <button
          type="button"
          id="menu_desplegable"
          aria-expanded={isMenuOpen}
          aria-controls="site-menu"
          onClick={() => setIsMenuOpen((v) => !v)}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition md:px-3.5 md:text-xs",
            chrome,
          )}
        >
          {isMenuOpen ? (
            <X className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Menu className="h-3.5 w-3.5" aria-hidden />
          )}
          Menú
        </button>

        <Link href="/" className="shrink-0" aria-label={site.name}>
          <span
            className={cn(
              "border-y-2 px-1.5 py-0.5 font-display text-xs font-extrabold uppercase tracking-[0.14em] transition sm:px-2 sm:text-sm md:text-base lg:text-lg",
              scrolled
                ? "border-zinc-900 text-zinc-900 dark:border-[#f2f0eb] dark:text-[#f2f0eb]"
                : "border-white text-white",
            )}
          >
            LOFTHOUSE14
          </span>
        </Link>

        {/* Reserva integrada — solo escritorio, misma barra */}
        <form
          onSubmit={onReserve}
          className="relative ml-1 hidden min-w-0 flex-1 items-end gap-2 md:flex"
        >
          <label className={cn("flex min-w-0 flex-1 flex-col gap-0.5", labelClass)}>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" /> Entrada
            </span>
            <input
              type="date"
              value={checkIn}
              min={todayISO()}
              onChange={(e) => {
                setCheckIn(e.target.value);
                setError("");
              }}
              className={cn("w-full min-w-0", inputClass)}
            />
          </label>
          <label className={cn("flex min-w-0 flex-1 flex-col gap-0.5", labelClass)}>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" /> Salida
            </span>
            <input
              type="date"
              value={checkOut}
              min={checkIn || todayISO()}
              onChange={(e) => {
                setCheckOut(e.target.value);
                setError("");
              }}
              className={cn("w-full min-w-0", inputClass)}
            />
          </label>
          <label className={cn("flex w-[4.5rem] shrink-0 flex-col gap-0.5", labelClass)}>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" /> Huéspedes
            </span>
            <input
              type="number"
              min={1}
              max={63}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className={cn("w-full", inputClass)}
            />
          </label>
          <button
            type="submit"
            className={cn(
              "mb-px shrink-0 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-wide transition",
              scrolled
                ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-amber-600 dark:hover:bg-amber-500"
                : "bg-white text-zinc-900 hover:bg-zinc-100",
            )}
          >
            Reservar
          </button>
          {error ? (
            <p
              className="absolute -bottom-4 left-0 text-[10px] font-medium text-red-500"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 md:gap-2">
          <Link
            href="#preguntas-frecuentes"
            className={cn(
              "rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider transition md:px-4 md:text-xs",
              chrome,
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
                "inset-x-3 top-[calc(100%+6px)] rounded-2xl",
                "md:inset-x-auto md:left-0 md:top-full md:h-[calc(100dvh-4.25rem)] md:max-h-none md:w-[min(22rem,90vw)] md:rounded-none md:rounded-br-2xl md:border-l-0 md:p-8",
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
