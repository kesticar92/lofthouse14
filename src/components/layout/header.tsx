"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Users, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeToggle } from "./theme-toggle";
import { site, waLink } from "@/lib/site";
import { cn } from "@/lib/cn";
import { trackBeginCheckout } from "@/lib/analytics";
import {
  mergeStayDraft,
  readStayDraft,
  STAY_DRAFT_EVENT,
  type StayDraft,
} from "@/lib/stay-draft";
import { StayDateRangePicker } from "@/components/ui/stay-date-range-picker";

const PAGE_NAV = [
  { href: "/reservar", label: "Reservar" },
  { href: "/#lofts", label: "Lofts" },
  { href: "/#testimonios", label: "Reseñas" },
  { href: "/#ubicacion", label: "Ubicación" },
  { href: "/#preguntas-frecuentes", label: "Ayuda" },
  { href: "/#galeria", label: "Galería y redes" },
] as const;

const GUEST_OPTIONS = Array.from({ length: site.maxGuests }, (_, i) => i + 1);

/**
 * Barra única con contraste sólido:
 * Menú | marca | fechas+huéspedes+Reservar | Ayuda + tema.
 * En móvil: segunda fila con el selector de fechas/huéspedes.
 */
export function Header() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [error, setError] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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
    const apply = (draft: StayDraft | null) => {
      if (!draft) return;
      if (draft.checkIn) setCheckIn(draft.checkIn);
      if (draft.checkOut) setCheckOut(draft.checkOut);
      if (draft.guests && draft.guests > 0) setGuests(draft.guests);
    };
    apply(readStayDraft());
    const onDraft = (event: Event) => {
      apply((event as CustomEvent<StayDraft>).detail ?? null);
    };
    window.addEventListener(STAY_DRAFT_EVENT, onDraft);
    return () => window.removeEventListener(STAY_DRAFT_EVENT, onDraft);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isMenuOpen]);

  const persistStay = (next: {
    checkIn?: string;
    checkOut?: string;
    guests?: number;
  }) => {
    const nextIn = next.checkIn ?? checkIn;
    const nextOut = next.checkOut ?? checkOut;
    mergeStayDraft({
      checkIn: nextIn || undefined,
      checkOut: nextOut || undefined,
      guests: next.guests ?? guests,
    });
  };

  const panelMotion = isDesktop
    ? {
        initial: { opacity: 0, x: -32 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -32 },
      }
    : {
        initial: { opacity: 0, y: -24 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -24 },
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
    trackBeginCheckout({ guests });
    // step 0 = Tu viaje; el wizard saltará Fechas/Huéspedes si ya están en el draft.
    mergeStayDraft({ checkIn, checkOut, guests, step: 0 });
    router.push("/reservar");
  };

  const bookingFields = (
    <>
      <div className="min-w-0 flex-[1.4]">
        <StayDateRangePicker
          checkIn={checkIn}
          checkOut={checkOut}
          onChange={(inDate, outDate) => {
            setCheckIn(inDate);
            setCheckOut(outDate);
            setError("");
            persistStay({ checkIn: inDate, checkOut: outDate });
          }}
          compact
        />
      </div>
      <label className="flex w-[7.5rem] shrink-0 flex-col gap-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3 w-3" /> Huéspedes
        </span>
        <select
          value={guests}
          onChange={(e) => {
            const next = Number(e.target.value);
            setGuests(next);
            persistStay({ guests: next });
          }}
          className="rounded-xl border border-zinc-300 bg-white px-2 py-1.5 text-xs font-semibold text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
        >
          {GUEST_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="mb-px shrink-0 rounded-full bg-zinc-900 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-zinc-800 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
      >
        Reservar
      </button>
    </>
  );

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
        // Contraste sólido siempre (día y noche)
        "border-zinc-200/80 bg-[#f2f0eb]/97 text-zinc-900 backdrop-blur-md",
        "dark:border-zinc-800 dark:bg-zinc-950/97 dark:text-zinc-50",
        scrolled && "shadow-md",
      )}
    >
      <div className="relative z-[60] mx-auto flex h-14 max-w-[90rem] items-center gap-2 px-3 md:h-16 md:gap-3 md:px-5 lg:px-6">
        <button
          type="button"
          id="menu_desplegable"
          aria-expanded={isMenuOpen}
          aria-controls="site-menu"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsMenuOpen((v) => !v);
          }}
          className="relative z-[70] inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800 md:px-3.5 md:text-xs"
        >
          {isMenuOpen ? (
            <X className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Menu className="h-3.5 w-3.5" aria-hidden />
          )}
          Menú
        </button>

        <Link href="/" className="shrink-0" aria-label={site.name}>
          <span className="border-y-2 border-zinc-900 px-1.5 py-0.5 font-display text-xs font-extrabold uppercase tracking-[0.14em] text-zinc-900 dark:border-zinc-50 dark:text-zinc-50 sm:px-2 sm:text-sm md:text-base">
            LOFTHOUSE14
          </span>
        </Link>

        {/* Banner de reserva centrado — escritorio */}
        <form
          onSubmit={onReserve}
          className="relative mx-auto hidden min-w-0 flex-1 items-center justify-center gap-2 lg:flex"
        >
          <div className="flex w-full max-w-3xl items-end justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            {bookingFields}
          </div>
          {error ? (
            <p
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-medium text-red-600 dark:text-red-400"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 md:gap-2">
          <Link
            href="/#preguntas-frecuentes"
            className="rounded-full border border-zinc-300 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800 md:px-4 md:text-xs"
          >
            Ayuda
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Banner móvil / tablet: fechas y huéspedes bajo la barra */}
      <form
        onSubmit={onReserve}
        className="border-t border-zinc-200/80 px-3 py-2 dark:border-zinc-800 lg:hidden"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-zinc-200 bg-white px-2.5 py-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          {bookingFields}
        </div>
        {error ? (
          <p
            className="mt-1 text-center text-[10px] font-medium text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </form>

      <AnimatePresence>
        {isMenuOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar menú"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[65] bg-black/45 backdrop-blur-[2px]"
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
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "fixed z-[70] overflow-y-auto border border-zinc-200 bg-[#f2f0eb] p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950",
                // Móvil: panel completo de arriba hacia abajo
                "inset-x-0 top-0 max-h-[100dvh] rounded-b-3xl pt-[4.5rem]",
                // Escritorio: panel lateral L→R
                "md:inset-y-0 md:left-0 md:right-auto md:top-0 md:h-full md:max-h-none md:w-[min(22rem,90vw)] md:rounded-none md:rounded-r-2xl md:border-l-0 md:pt-8",
              )}
            >
              <div className="mb-4 flex items-center justify-between md:hidden">
                <span className="font-display text-sm font-extrabold uppercase tracking-widest text-zinc-900 dark:text-zinc-50">
                  Menú
                </span>
                <button
                  type="button"
                  aria-label="Cerrar"
                  onClick={() => setIsMenuOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-6">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    Ir a
                  </h4>
                  <ul className="grid gap-1">
                    {PAGE_NAV.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="block rounded-lg px-2 py-3 text-base font-bold text-zinc-900 transition hover:bg-black/5 hover:text-amber-700 dark:text-zinc-50 dark:hover:bg-white/5 dark:hover:text-amber-400 md:py-2.5 md:text-sm"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    Contacto
                  </h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">
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
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {site.addressLine}
                    <br />
                    {site.neighborhood}, {site.city}
                  </p>
                </div>
                <Link
                  href="/reservar"
                  onClick={() => setIsMenuOpen(false)}
                  className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white dark:bg-amber-500 dark:text-zinc-950"
                >
                  Reservar
                </Link>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
