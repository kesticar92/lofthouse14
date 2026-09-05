import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/public-shell";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLdGraph } from "@/components/layout/json-ld";
import TestimonialsUsage from "@/components/sections/testimonialUsage";
import {
  aggregateReviews,
  breadcrumbJsonLd,
  reviewGraphJsonLd,
} from "@/lib/seo";

const agg = aggregateReviews();

export const metadata: Metadata = {
  title: `Reseñas de huéspedes — ${agg.reviewCount} opiniones`,
  description: `Lee ${agg.reviewCount} reseñas verificadas de Lofthouse 14 en Google, Booking y Airbnb. Lofts en Cali Miraflores, puntuación ${agg.ratingValue}/5.`,
  alternates: { canonical: "/resenas" },
};

export default function ResenasPage() {
  return (
    <PublicShell>
      <JsonLdGraph
        items={[
          breadcrumbJsonLd([
            { name: "Inicio", path: "/" },
            { name: "Reseñas", path: "/resenas" },
          ]),
          ...reviewGraphJsonLd(),
        ]}
      />
      <div className="mx-auto max-w-4xl px-4 pt-28 md:px-8">
        <Breadcrumbs
          items={[
            { href: "/", label: "Inicio" },
            { href: "/resenas", label: "Reseñas" },
          ]}
        />
        <h1 className="mt-4 font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-5xl">
          Lo que dicen nuestros huéspedes — {agg.reviewCount} reseñas
          verificadas
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
          Opiniones reales de Google, Booking y Airbnb sobre los lofts en
          Miraflores, Cali. No editamos las puntuaciones: filtra por plataforma,
          mes o unidad.
        </p>
      </div>
      <TestimonialsUsage />
    </PublicShell>
  );
}
