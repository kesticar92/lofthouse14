import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { REVIEW_HIGHLIGHTS } from "@/data/reviews";
import {
  SEO,
  absoluteUrl,
  breadcrumbJsonLd,
  reviewsJsonLd,
} from "@/lib/seo";
import { waLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Reseñas de huéspedes",
  description: `Lee reseñas de Lofthouse 14: ${SEO.ratingValue}/5 con ${SEO.reviewCount} opiniones. Lofts en Miraflores, Cali.`,
  alternates: { canonical: "/resenas" },
  openGraph: {
    title: "Reseñas | Lofthouse 14",
    description: `Valoración ${SEO.ratingValue} · ${SEO.reviewCount} reseñas`,
    url: absoluteUrl("/resenas"),
    images: [{ url: SEO.ogImage, alt: SEO.ogImageAlt }],
  },
};

export default function ReviewsPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Reseñas", path: "/resenas" },
        ])}
      />
      <JsonLd data={reviewsJsonLd()} />
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-500">
          ★ {SEO.ratingValue} · {SEO.reviewCount} reseñas
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-6xl">
          Lo que dicen nuestros huéspedes
        </h1>
        <p className="mt-4 max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
          Opiniones reales sobre ubicación, limpieza, WiFi y check-in autónomo en
          Miraflores, Cali.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEW_HIGHLIGHTS.map((r) => (
            <blockquote
              key={`${r.author}-${r.date}`}
              className="rounded-2xl border border-black/5 bg-white/70 p-5 dark:border-white/10 dark:bg-zinc-900/50"
            >
              <p className="text-amber-600">{"★".repeat(r.stars)}</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                “{r.text}”
              </p>
              <footer className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {r.author}
                {r.source ? ` · ${r.source}` : ""}
              </footer>
            </blockquote>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-3">
          <a
            href={waLink("Hola, vi las reseñas y quiero reservar en Lofthouse 14")}
            className="inline-flex rounded-full bg-zinc-900 px-8 py-4 text-sm font-bold uppercase tracking-wide text-white dark:bg-amber-600"
          >
            Reservar por WhatsApp
          </a>
          <Link href="/#reservas" className="inline-flex rounded-full border border-zinc-400 px-6 py-4 text-sm font-bold uppercase tracking-wide">
            Configurar estadía
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
