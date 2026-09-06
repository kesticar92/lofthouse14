import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { SEO, absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { site, waLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Lofts in Cali Miraflores | Lofthouse 14",
  description:
    "Modern lofts in Cali, Miraflores neighborhood. Steps from Parque del Perro. Kitchen, AC, WiFi from $20 USD/night. Self check-in. Book directly!",
  alternates: {
    canonical: "/en",
    languages: { "es-CO": "/", en: "/en" },
  },
  openGraph: {
    locale: "en_US",
    title: "Lofts in Cali Miraflores | Lofthouse 14",
    description:
      "Kitchen, AC, WiFi. Self check-in. From ~$20 USD/night. Book direct with Lofthouse 14.",
    url: absoluteUrl("/en"),
    images: [{ url: SEO.ogImage, alt: SEO.ogImageAlt }],
  },
};

export default function EnglishHomePage() {
  return (
    <MarketingShell>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "English", path: "/en" },
        ])}
      />
      <section className="mx-auto max-w-4xl px-4 py-16 md:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-500">
          ★ {SEO.ratingValue} · {SEO.reviewCount} reviews · Miraflores, Cali
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-6xl">
          Lofts in Cali with kitchen — Miraflores / Parque del Perro
        </h1>
        <p className="mt-5 text-base leading-relaxed text-zinc-700 dark:text-zinc-300 md:text-lg">
          Stay at {site.addressLine}, steps from restaurants, culture and
          clinics. Private lofts with kitchen, WiFi, A/C and self check-in. From
          ${site.priceFromCop.toLocaleString("es-CO")} COP/night (~$
          {SEO.priceFromUsdApprox} USD). Book direct via WhatsApp — no
          platform fees.
        </p>
        <ul className="mt-8 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li>• Up to {site.maxGuests} guests across {site.maxLofts} lofts</li>
          <li>• Ideal for digital nomads, medical stays, salsa trips & groups</li>
          <li>• Clear quotes, deposit and autonomous access instructions</li>
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={waLink(
              "Hi! I found Lofthouse 14 online and want to book. Dates ____, guests ____.",
            )}
            className="inline-flex rounded-full bg-zinc-900 px-8 py-4 text-sm font-bold uppercase tracking-wide text-white dark:bg-amber-600"
          >
            Book on WhatsApp
          </a>
          <Link
            href="/lofts"
            className="inline-flex rounded-full border border-zinc-400 px-6 py-4 text-sm font-bold uppercase tracking-wide"
          >
            Browse lofts
          </Link>
          <Link href="/" className="inline-flex px-4 py-4 text-sm font-semibold text-amber-700 dark:text-amber-400">
            Español →
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
