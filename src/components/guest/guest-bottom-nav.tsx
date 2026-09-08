"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/reservar", label: "Reservar" },
  { href: "/mi-reserva", label: "Mi reserva" },
  { href: "/ayuda", label: "Ayuda" },
] as const;

/** Bottom nav móvil para journey huésped (no admin). */
export function GuestBottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Navegación huésped"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/80 bg-[#f7f5f0]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-950/95 md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href === "/mi-reserva" &&
              (pathname.startsWith("/confirmacion") ||
                pathname.startsWith("/check-in") ||
                pathname.startsWith("/mi-reserva")));
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 py-3 text-[11px] font-semibold uppercase tracking-wider transition",
                  active
                    ? "text-amber-900 dark:text-amber-300"
                    : "text-zinc-500 dark:text-zinc-400",
                )}
              >
                <span
                  className={cn(
                    "h-1 w-8 rounded-full",
                    active ? "bg-amber-800 dark:bg-amber-400" : "bg-transparent",
                  )}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
