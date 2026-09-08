"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { fetchAdminSession, logoutAdmin } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AdminNotificationBell } from "@/components/admin/admin-notification-bell";
import { OrgSwitcher } from "@/components/admin/org-switcher";
import { AdminBreadcrumbs } from "@/components/admin/admin-page-header";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  desc: string;
};

export const ADMIN_NAV: NavItem[] = [
  {
    href: "/admin",
    label: "Inicio",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M6.5 10.5V20h11V10.5" />
      </svg>
    ),
    desc: "Resumen general del panel",
  },
  {
    href: "/admin/cotizaciones",
    label: "Cotizaciones",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M12 3v18" />
        <path d="M17 7.5c0-1.9-2.2-3.5-5-3.5s-5 1.6-5 3.5 2.2 3.5 5 3.5 5 1.6 5 3.5-2.2 3.5-5 3.5-5-1.6-5-3.5" />
      </svg>
    ),
    desc: "Calcula y guarda cotizaciones",
  },
  {
    href: "/admin/inventario",
    label: "Inventario",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="m8 12 2.5 2.5L16 9" />
      </svg>
    ),
    desc: "Revisión de artículos por loft",
  },
  {
    href: "/admin/reservas",
    label: "Reservas",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 3v4M16 3v4" />
      </svg>
    ),
    desc: "Ocupación, iCal Airbnb y exportación",
  },
  {
    href: "/admin/gastos",
    label: "Gastos",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 7h16v10H4z" />
        <path d="M8 11h8M8 15h5" />
        <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
    ),
    desc: "Facturas, fotos y backup en Drive",
  },
  {
    href: "/admin/aseos",
    label: "Aseos del día",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3 6.3 17.7" />
      </svg>
    ),
    desc: "Limpieza y preparación desde reservas",
  },
  {
    href: "/admin/catalogo",
    label: "Catálogo",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 6h16M4 12h16M4 18h10" />
        <path d="M18 16v4M16 18h4" />
      </svg>
    ),
    desc: "Property, tipos Vista/Atrio/Cielo y rooms",
  },
  {
    href: "/admin/canales",
    label: "Canales",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 12h4l3-8 4 16 3-8h4" />
      </svg>
    ),
    desc: "Channel manager stubs + simulador",
  },
  {
    href: "/admin/crm",
    label: "CRM",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="9" cy="8" r="3" />
        <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" />
        <path d="M16 11h5M18.5 8.5v5" />
      </svg>
    ),
    desc: "Huéspedes, templates y automations",
  },
  {
    href: "/admin/pagos",
    label: "Pagos",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18" />
      </svg>
    ),
    desc: "Pasarelas stub (Wompi/MP/Stripe/PayU)",
  },
  {
    href: "/admin/folio",
    label: "Folios",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M6 4h9l3 3v13H6z" />
        <path d="M14 4v4h4M8 12h8M8 16h6" />
      </svg>
    ),
    desc: "Cuenta huésped: cargos, pagos, saldo",
  },
  {
    href: "/admin/promociones",
    label: "Promociones",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 9h16v10H4z" />
        <path d="M8 9V7a4 4 0 0 1 8 0v2" />
        <path d="M9 14h6" />
      </svg>
    ),
    desc: "Cupones seed + CRUD local",
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 19V5M8 19v-6M12 19V9M16 19v-3M20 19V7" />
      </svg>
    ),
    desc: "Reportes, revenue tips y AI assistant",
  },
  {
    href: "/admin/saas",
    label: "SaaS",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 7h16v10H4z" />
        <path d="M8 7V5h8v2M9 12h6" />
      </svg>
    ),
    desc: "module_flags / plan seed (read-only)",
  },
  {
    href: "/admin/reportes",
    label: "Reportes",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M5 4h10l4 4v12H5z" />
        <path d="M14 4v5h5M8 13h8M8 17h5" />
      </svg>
    ),
    desc: "Ocupación / revenue / canal CSV",
  },
  {
    href: "/admin/reviews",
    label: "Reviews",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="m12 3 2.2 4.5 5 .7-3.6 3.5.9 5L12 14.8 7.5 16.7l.9-5L4.8 8.2l5-.7L12 3z" />
      </svg>
    ),
    desc: "Reseñas + sentiment stub",
  },
  {
    href: "/admin/mantenimiento",
    label: "Mantenimiento",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.1 2.1-1.9-1.9 2-2.1z" />
      </svg>
    ),
    desc: "Tickets y OUT_OF_SERVICE",
  },
  {
    href: "/admin/usuarios",
    label: "Usuarios",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 19c.8-3 2.8-4.5 5.5-4.5S13.7 16 14.5 19" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M15 19c.4-2 1.6-3.2 3.5-3.2 1.2 0 2.2.5 2.9 1.4" />
      </svg>
    ),
    desc: "Staff y módulos",
  },
  {
    href: "/admin/registro",
    label: "Registro",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
    desc: "Alta de cuentas staff",
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
              style={{ width: "auto" }}
            />
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-900 dark:text-amber-400 sm:inline">
              Panel administrador
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <OrgSwitcher />
            <span className="hidden max-w-[220px] truncate rounded-full border border-black/10 bg-white/60 px-3 py-1.5 text-xs text-zinc-700 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-200 md:inline">
              <strong className="font-semibold">{user}</strong>
              {role ? (
                <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  · {role.replaceAll("_", " ")}
                </span>
              ) : null}
            </span>
            <AdminNotificationBell />
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

        <main className="min-w-0 flex-1 space-y-6">
          <AdminBreadcrumbs />
          {children}
        </main>
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
