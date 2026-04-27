"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { fetchAdminSession, logoutAdmin } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/layout/theme-toggle";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  desc: string;
};

export const ADMIN_NAV: NavItem[] = [
  {
    href: "/admin",
    label: "Inicio",
    icon: "⌂",
    desc: "Resumen general del panel",
  },
  {
    href: "/admin/cotizaciones",
    label: "Cotizaciones",
    icon: "₲",
    desc: "Calcula y guarda cotizaciones",
  },
  {
    href: "/admin/inventario",
    label: "Inventario",
    icon: "☑",
    desc: "Revisión de artículos por loft",
  },
  {
    href: "/admin/aseos",
    label: "Aseos del día",
    icon: "✻",
    desc: "Programa y marca aseos diarios",
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [openMenu, setOpenMenu] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await fetchAdminSession();
      if (cancelled) return;
      if (!session) {
        router.replace("/admin/login");
        return;
      }
      setUser(session.user);
      setRole(session.role);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f0eb] text-zinc-700 dark:bg-[#141210] dark:text-zinc-200">
        <p className="text-sm">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f0eb] text-zinc-900 dark:bg-[#141210] dark:text-zinc-100">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[length:40px_40px] bg-grid-fade opacity-[0.25] dark:bg-grid-fade-dark dark:opacity-10" />

      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f2f0eb]/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#141210]/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src="/logo-lofthouse.png"
              alt="LOFTHOUSE 14"
              width={120}
              height={40}
              className="h-9 w-auto"
            />
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-900 dark:text-amber-400 sm:inline">
              Panel administrador
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden max-w-[220px] truncate rounded-full border border-black/10 bg-white/60 px-3 py-1.5 text-xs text-zinc-700 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-200 md:inline">
              <strong className="font-semibold">{user}</strong>
              {role ? (
                <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  · {role.replaceAll("_", " ")}
                </span>
              ) : null}
            </span>
            <ThemeToggle />
            <Link
              href="/"
              className="hidden rounded-full border border-black/10 bg-white/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-700 transition hover:bg-white dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-200 sm:inline-flex"
            >
              Ver sitio
            </Link>
            <button
              type="button"
              onClick={async () => {
                await logoutAdmin();
                window.location.assign("/admin/login");
              }}
              className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-zinc-800 dark:bg-[#f2f0eb] dark:text-zinc-900 dark:hover:bg-white"
            >
              Cerrar sesión
            </button>
            <button
              type="button"
              aria-label="Menú"
              onClick={() => setOpenMenu((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-lg dark:border-white/10 lg:hidden"
            >
              {openMenu ? "×" : "≡"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:py-8">
        <aside
          className={cn(
            "fixed inset-x-0 top-[60px] z-30 border-b border-black/10 bg-[#f2f0eb]/95 p-3 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#141210]/95 lg:static lg:block lg:w-64 lg:shrink-0 lg:border-b-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-0 lg:dark:bg-transparent",
            openMenu ? "block" : "hidden lg:block",
          )}
        >
          <nav className="flex flex-col gap-1 lg:sticky lg:top-[88px]">
            {ADMIN_NAV.map((n) => {
              const active =
                pathname === n.href ||
                (n.href !== "/admin" && pathname?.startsWith(n.href));
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpenMenu(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm transition",
                    active
                      ? "border-amber-900/20 bg-amber-900/10 font-semibold text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300"
                      : "text-zinc-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/5",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg",
                      active
                        ? "bg-amber-900/15 text-amber-900 dark:bg-amber-400/15 dark:text-amber-300"
                        : "bg-black/5 text-zinc-700 dark:bg-white/5 dark:text-zinc-200",
                    )}
                  >
                    {n.icon}
                  </span>
                  <span className="flex flex-col">
                    <span className="leading-tight">{n.label}</span>
                    <span className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                      {n.desc}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 space-y-6">{children}</main>
      </div>
    </div>
  );
}

export function AdminCard({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-black/10 bg-white/70 p-5 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.15)] backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/60",
        className,
      )}
    >
      {(title || actions) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          {title && (
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-300">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
