import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/layout/json-ld";
import { allBookableUnits, loftPath } from "@/data/lofts-catalog";
import { breadcrumbJsonLd } from "@/lib/seo";
import { formatCOP } from "@/lib/pricing";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Lofts en Cali Miraflores — catálogo",
  description:
    "14 lofts privados y casa para grupos en Miraflores, Cali, a pasos del Parque del Perro. Desde $90.000/noche. WiFi, A/C y cocina.",
  alternates: { canonical: "/lofts" },
};

export default function LoftsCatalogPage() {
  return (
    <PublicShell>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Lofts", path: "/lofts" },
        ])}
      />
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-44 md:px-8">
        <Breadcrumbs
          items={[
            { href: "/", label: "Inicio" },
            { href: "/lofts", label: "Lofts" },
          ]}
        />
        <h1 className="mt-4 font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-5xl">
          Nuestros lofts en Cali — precios y disponibilidad
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-zinc-600 dark:text-zinc-300">
          Hospedaje en Cali Miraflores, a pasos del Parque del Perro. Cada loft
          es privado, con WiFi, aire acondicionado y cocina equipada. Desde{" "}
          {formatCOP(site.priceFromCop)} por noche para 2 personas en temporada
          baja.
        </p>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {allBookableUnits.map((unit) => (
            <Link
              key={unit.slug}
              href={loftPath(unit)}
              className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={unit.image}
                  alt={`${unit.name} — ${unit.headline}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="space-y-2 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
                  {unit.name}
                </p>
                <h2 className="font-display text-2xl text-zinc-900 dark:text-[#f2f0eb]">
                  {unit.headline}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {unit.shortDescription}
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Desde {formatCOP(unit.priceFromCop)} / noche · Máx.{" "}
                  {unit.guestsMax} personas
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
