import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { WaLink } from "@/components/layout/wa-link";
import { site } from "@/lib/site";
import { formatCOP } from "@/lib/pricing";
import { aggregateReviews } from "@/lib/seo";

const agg = aggregateReviews();

export const metadata: Metadata = {
  title: "Lofts in Cali, Colombia — Miraflores / Parque del Perro",
  description:
    "Modern lofts in Cali, Miraflores neighborhood. Steps from Parque del Perro. Kitchen, AC, WiFi from $20 USD/night. Self check-in. Book directly!",
  alternates: { canonical: "/en", languages: { "es-CO": "/", en: "/en" } },
  openGraph: { locale: "en_US" },
};

export default function EnglishPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-28 md:px-8">
        <p className="text-sm text-zinc-500">
          <Link href="/" className="underline">
            Español
          </Link>
        </p>
        <h1 className="mt-4 font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-5xl">
          Lofts in Cali, Colombia — Miraflores by Parque del Perro
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
          14 private lofts with WiFi, air conditioning and a kitchen. From{" "}
          {formatCOP(site.priceFromCop)} (~USD 20) per night for two guests in
          low season. Self check-in after ID verification. {agg.reviewCount}{" "}
          verified reviews ({agg.ratingValue}/5) on Google, Booking and Airbnb.
        </p>
        <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
          Address: {site.addressLine}, Miraflores, Cali, Valle del Cauca.
          WhatsApp {site.phoneDisplay}. Groups up to {site.maxGuests} guests can
          book multiple lofts in the same building — salsa dancers, digital
          nomads, medical travelers and families included.
        </p>
        <h2 className="mt-10 font-display text-2xl text-zinc-900 dark:text-[#f2f0eb]">
          Why Miraflores
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-base text-zinc-600 dark:text-zinc-300">
          <li>Walkable restaurants and nightlife around Parque del Perro</li>
          <li>Close to San Fernando clinics and Pascual Guerrero stadium</li>
          <li>Self check-in — no front desk hours</li>
          <li>Book direct: clearer pricing than OTAs for multi-loft groups</li>
        </ul>
        <h2 className="mt-10 font-display text-2xl text-zinc-900 dark:text-[#f2f0eb]">
          Explore
        </h2>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
          <Link href="/lofts" className="text-amber-700 underline dark:text-amber-400">
            All lofts
          </Link>
          <Link
            href="/ubicacion-miraflores-cali"
            className="text-amber-700 underline dark:text-amber-400"
          >
            Location map
          </Link>
          <Link
            href="/hospedaje-salsa-cali"
            className="text-amber-700 underline dark:text-amber-400"
          >
            Salsa stays
          </Link>
          <Link
            href="/hospedaje-nomadas-digitales-cali"
            className="text-amber-700 underline dark:text-amber-400"
          >
            Digital nomads
          </Link>
          <Link
            href="/hospedaje-medico-cali"
            className="text-amber-700 underline dark:text-amber-400"
          >
            Medical travel
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/reservas"
            className="rounded-full bg-amber-600 px-6 py-3 text-sm font-bold text-white"
          >
            Check availability
          </Link>
          <WaLink
            placement="en-landing"
            message="Hi, I found lofthouse14.com and I want to book a loft in Cali."
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-bold dark:border-zinc-600"
          >
            WhatsApp
          </WaLink>
        </div>
      </div>
    </PublicShell>
  );
}
