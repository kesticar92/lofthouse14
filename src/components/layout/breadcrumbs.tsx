import Link from "next/link";

export type Crumb = { href: string; label: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Migas de pan" className="text-sm text-zinc-500">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1">
              {index > 0 && <span aria-hidden>/</span>}
              {last ? (
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-amber-700">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
