import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { Location } from "@/components/sections/location";
import { absoluteUrl, breadcrumbJsonLd, SEO } from "@/lib/seo";
import { site, waLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Ubicación Miraflores Cali · Parque del Perro",
  description: `Lofthouse 14 en ${site.addressLine}, Miraflores, Cali. A pasos del Parque del Perro. Mapa, cómo llegar y qué hay cerca.`,
  alternates: { canonical: "/ubicacion-miraflores-cali" },
  openGraph: {
    title: "Ubicación | Lofthouse 14 Miraflores",
    description: SEO.description,
    url: absoluteUrl("/ubicacion-miraflores-cali"),
    images: [{ url: SEO.ogImage, alt: SEO.ogImageAlt }],
  },
};

export default function LocationPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Ubicación", path: "/ubicacion-miraflores-cali" },
        ])}
      />
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-16 md:pt-24">
        <h1 className="font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-6xl">
          Ubicación en Miraflores, Cali
        </h1>
        <p className="mt-4 max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
          Estamos en {site.addressLine}, barrio Miraflores, zona Parque del
          Perro. Ideal si buscas gastronomía, clínicas cercanas y vida caleña a
          pie.
        </p>
        <p className="mt-3 text-sm">
          <a
            href={site.google_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-amber-700 hover:underline dark:text-amber-400"
          >
            Abrir en Google Maps →
          </a>
        </p>
      </section>
      <Location />
      <div className="mx-auto flex max-w-6xl flex-wrap gap-3 px-4 pb-16">
        <a
          href={waLink("Hola, ¿me confirman cómo llegar a Lofthouse 14?")}
          className="inline-flex rounded-full bg-zinc-900 px-8 py-4 text-sm font-bold uppercase tracking-wide text-white dark:bg-amber-600"
        >
          Preguntar por WhatsApp
        </a>
        <Link
          href="/lofts"
          className="inline-flex rounded-full border border-zinc-400 px-6 py-4 text-sm font-bold uppercase tracking-wide"
        >
          Ver lofts
        </Link>
      </div>
    </MarketingShell>
  );
}
