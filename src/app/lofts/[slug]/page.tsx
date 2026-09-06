import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { TrackLoftView } from "@/components/analytics/track-loft-view";
import { LOFTS, getLoftBySlug } from "@/data/lofts";
import {
  SEO,
  absoluteUrl,
  breadcrumbJsonLd,
  hotelRoomJsonLd,
} from "@/lib/seo";
import { waLink } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return LOFTS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const loft = getLoftBySlug(slug);
  if (!loft) return {};
  const title = `${loft.name} | Reserva directa`;
  const description = loft.description.slice(0, 155);
  return {
    title,
    description,
    alternates: { canonical: `/lofts/${loft.slug}` },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/lofts/${loft.slug}`),
      images: [{ url: loft.images[0], alt: loft.name }],
    },
  };
}

export default async function LoftDetailPage({ params }: Props) {
  const { slug } = await params;
  const loft = getLoftBySlug(slug);
  if (!loft) notFound();

  return (
    <MarketingShell>
      <TrackLoftView id={loft.slug} name={loft.name} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Lofts", path: "/lofts" },
          { name: loft.shortName, path: `/lofts/${loft.slug}` },
        ])}
      />
      <JsonLd data={hotelRoomJsonLd(loft)} />
      <article className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-500">
          Loft en Miraflores · Cali
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-5xl">
          {loft.name}
        </h1>
        <p className="mt-2 text-sm font-semibold text-zinc-500">
          {loft.highlight} · Hasta {loft.maxGuests} huéspedes · Desde $
          {loft.priceFromCop.toLocaleString("es-CO")}/noche
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {loft.images.map((src) => (
            <div
              key={src}
              className="relative aspect-[4/3] overflow-hidden rounded-2xl"
            >
              <Image
                src={src}
                alt={`${loft.name} — loft Miraflores Cali`}
                fill
                className="object-cover"
                sizes="(max-width:768px) 100vw, 33vw"
              />
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
          {loft.description}
        </p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {loft.amenities.map((a) => (
            <li
              key={a}
              className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              {a}
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={waLink(
              `Hola, quiero reservar el ${loft.shortName} en Lofthouse 14. Fechas ____.`,
            )}
            className="inline-flex rounded-full bg-zinc-900 px-8 py-4 text-sm font-bold uppercase tracking-wide text-white dark:bg-amber-600"
          >
            Reservar este loft
          </a>
          <Link
            href="/#reservas"
            className="inline-flex rounded-full border border-zinc-400 px-6 py-4 text-sm font-bold uppercase tracking-wide text-zinc-800 dark:border-zinc-600 dark:text-zinc-200"
          >
            Configurar estadía
          </Link>
        </div>
      </article>
    </MarketingShell>
  );
}
