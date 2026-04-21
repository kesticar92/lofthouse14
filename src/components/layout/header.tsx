"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { site, waLink } from "@/lib/site";
import { cn } from "@/lib/cn";

const nav = [
  { href: "#propuesta", label: "Propuesta" },
  { href: "#lofts", label: "Lofts" },
  { href: "#experiencias", label: "Experiencias" },
  { href: "#galeria", label: "Galería" },
  { href: "#ubicacion", label: "Ubicación" },
  { href: "#reservas", label: "Reservas" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <div
          className={cn(
            "flex items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white/55 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/50",
          )}
        >
          <Link
            href="#inicio"
            className="font-serif text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-xl"
          >
            {site.name}
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-700 dark:text-zinc-200 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-amber-700 dark:hover:text-amber-400"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 sm:inline-flex"
            >
              WhatsApp
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-zinc-900 dark:border-white/10 dark:text-white md:hidden"
              aria-expanded={open}
              aria-label="Abrir menú"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="text-lg">{open ? "×" : "≡"}</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-2 rounded-2xl border border-black/10 bg-white/90 p-4 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90 md:hidden"
            >
              <div className="flex flex-col gap-3 text-sm font-medium">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-2 py-2 text-zinc-800 hover:bg-black/5 dark:text-zinc-100 dark:hover:bg-white/5"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href={waLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-zinc-900 px-4 py-3 text-center text-white dark:bg-white dark:text-zinc-900"
                  onClick={() => setOpen(false)}
                >
                  Reservar por WhatsApp
                </Link>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
