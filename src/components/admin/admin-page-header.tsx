"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "@/components/admin/admin-shell";

export type AdminCrumb = { label: string; href?: string };

function resolveCrumbs(pathname: string): {
  title: string;
  crumbs: AdminCrumb[];
  desc?: string;
} {
  const p = pathname.replace(/\/$/, "") || "/";
  const crumbs: AdminCrumb[] = [{ label: "Admin", href: "/admin" }];

  if (p === "/admin") {
    return {
      title: "Inicio",
      crumbs,
      desc: "Resumen general del panel",
    };
  }

  const match = ADMIN_NAV.filter((n) => n.href !== "/admin")
    .sort((a, b) => b.href.length - a.href.length)
    .find((n) => p === n.href || p.startsWith(`${n.href}/`));

  if (match) {
    crumbs.push({ label: match.label, href: match.href });
    const rest = p.slice(match.href.length).replace(/^\//, "");
    if (rest) {
      crumbs.push({ label: decodeURIComponent(rest) });
      return {
        title: `${match.label} · ${decodeURIComponent(rest)}`,
        crumbs,
        desc: match.desc,
      };
    }
    return { title: match.label, crumbs, desc: match.desc };
  }

  const segment = p.split("/").filter(Boolean).pop() ?? "Panel";
  crumbs.push({ label: segment });
  return { title: segment, crumbs };
}

/**
 * Breadcrumbs + título consistentes derivados de ADMIN_NAV.
 * Las páginas pueden seguir mostrando su propio h1; este bloque
 * unifica la jerarquía superior del shell.
 */
export function AdminBreadcrumbs({
  extra,
}: {
  extra?: AdminCrumb[];
} = {}) {
  const pathname = usePathname() ?? "/admin";
  const { crumbs } = resolveCrumbs(pathname);
  const all = extra?.length ? [...crumbs, ...extra] : crumbs;

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400"
    >
      {all.map((c, i) => {
        const last = i === all.length - 1;
        return (
          <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
            {i > 0 ? <span aria-hidden className="text-zinc-400">/</span> : null}
            {c.href && !last ? (
              <Link
                href={c.href}
                className="transition hover:text-amber-900 dark:hover:text-amber-300"
              >
                {c.label}
              </Link>
            ) : (
              <span className={last ? "text-zinc-800 dark:text-zinc-200" : ""}>
                {c.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/admin";
  const resolved = resolveCrumbs(pathname);
  const heading = title ?? resolved.title;
  const sub = subtitle ?? resolved.desc;

  return (
    <header className="space-y-1">
      <AdminBreadcrumbs />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide sm:text-4xl">
            {heading}
          </h1>
          {sub ? (
            <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
              {sub}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
