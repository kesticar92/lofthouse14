import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { LOFTS } from "@/data/lofts";
import { SEO, absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { site, waLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Lofts en Cali Miraflores",
  description:
    "Explora los lofts de Lofthouse 14 en Miraflores, Cali. Cocina, WiFi, A/C y check-in autónomo. Desde $80.000/noche.",
  alternates: { canonical: "/lofts" },
  openGraph: {
    title: "Lofts en Cali Miraflores | Lofthouse 14",
    description: SEO.description,
    url: absoluteUrl("/lofts"),
    images: [{ url: SEO.ogImage, alt: SEO.ogImageAlt }],
  },
};

export default function LoftsIndexPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Lofts", path: "/lofts" },
        ])}
      />
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-500">
          {site.maxLofts} unidades · Miraflores
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-6xl">
          Lofts en Cali Miraflores
        </h1>
        <p className="mt-4 max-w-2xl text-base text-zinc-600 dark:text-zinc-300 md:text-lg">
          Cada loft es privado, con cocina y baño. Ideal para parejas, nómadas,
          estadías médicas y grupos que reservan varias unidades en el mismo
          edificio cerca del Parque del Perro.
        </p>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {LOFTS.map((loft) => (
            <article key={loft.slug} className="group">
              <Link href={`/lofts/${loft.slug}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                  <Image
                    src={loft.images[0]}
                    alt={`${loft.name} — loft en Miraflores Cali`}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width:768px) 100vw, 33vw"
                  />
                </div>
                <h2 className="mt-4 font-display text-2xl text-zinc-900 dark:text-[#f2f0eb]">
                  {loft.shortName}
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {loft.highlight}
                </p>
                <p className="mt-2 text-sm font-semibold text-amber-800 dark:text-amber-400">
                  Desde ${loft.priceFromCop.toLocaleString("es-CO")}/noche
                </p>
              </Link>
            </article>
          ))}
        </div>
        <div className="mt-12">
          <a
            href={waLink(
              "Hola, quiero ver disponibilidad de lofts en Lofthouse 14",
            )}
            className="inline-flex rounded-full bg-zinc-900 px-8 py-4 text-sm font-bold uppercase tracking-wide text-white dark:bg-amber-600"
          >
            Consultar por WhatsApp
          </a>
        </div>
      </section>
    </MarketingShell>
  );
}
