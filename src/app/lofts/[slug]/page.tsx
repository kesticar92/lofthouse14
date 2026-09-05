import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/layout/public-shell";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLdGraph } from "@/components/layout/json-ld";
import { WaLink } from "@/components/layout/wa-link";
import {
  allBookableUnits,
  getLoftBySlug,
  LOFT_AMENITIES,
  loftPath,
} from "@/data/lofts-catalog";
import { breadcrumbJsonLd, hotelRoomJsonLd } from "@/lib/seo";
import { formatCOP } from "@/lib/pricing";
import { site } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allBookableUnits.map((unit) => ({ slug: unit.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const unit = getLoftBySlug(slug);
  if (!unit) return { title: "Loft no encontrado" };
  return {
    title: unit.seoTitle,
    description: unit.metaDescription,
    alternates: { canonical: loftPath(unit) },
    openGraph: {
      title: unit.seoTitle,
      description: unit.metaDescription,
      type: "website",
    },
  };
}

export default async function LoftPage({ params }: Props) {
  const { slug } = await params;
  const unit = getLoftBySlug(slug);
  if (!unit) notFound();

  return (
    <PublicShell>
      <JsonLdGraph
        items={[
          breadcrumbJsonLd([
            { name: "Inicio", path: "/" },
            { name: "Lofts", path: "/lofts" },
            { name: unit.name, path: loftPath(unit) },
          ]),
          hotelRoomJsonLd(unit),
        ]}
      />
      <article className="mx-auto max-w-5xl px-4 pb-20 pt-28 md:px-8">
        <Breadcrumbs
          items={[
            { href: "/", label: "Inicio" },
            { href: "/lofts", label: "Lofts" },
            { href: loftPath(unit), label: unit.name },
          ]}
        />
        <h1 className="mt-4 font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-5xl">
          {unit.name} — {unit.headline}
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-300">
          {unit.shortDescription}
        </p>
        <p className="mt-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Desde {formatCOP(unit.priceFromCop)} / noche · Ideal{" "}
          {unit.guestsIdeal} · Máx. {unit.guestsMax} · {site.addressLine},
          Miraflores, Cali
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {unit.gallery.map((src, index) => (
            <div
              key={src}
              className={`relative overflow-hidden rounded-2xl ${index === 0 ? "sm:col-span-2 aspect-[16/9]" : "aspect-[4/3]"}`}
            >
              <Image
                src={src}
                alt={`${unit.name} en Cali Miraflores — ${index === 0 ? "espacio principal" : `detalle ${index}`}`}
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}
        </div>
        <div className="mt-8 space-y-4 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
          {unit.description.split(/(?<=\.)\s+/).map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}
        </div>
        <ul className="mt-8 grid gap-2 sm:grid-cols-2">
          {LOFT_AMENITIES.map((amenity) => (
            <li
              key={amenity}
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium dark:border-zinc-800"
            >
              {amenity}
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={`/reservas?guests=${unit.guestsIdeal}`}
            className="inline-flex rounded-full bg-amber-600 px-8 py-3 text-sm font-bold uppercase text-white hover:bg-amber-700"
          >
            Ver disponibilidad
          </Link>
          <WaLink
            placement={`loft-${unit.code}`}
            message={`Hola, quiero reservar el ${unit.name} en Lofthouse 14.`}
            className="inline-flex rounded-full border border-zinc-300 px-8 py-3 text-sm font-bold uppercase text-zinc-800 dark:border-zinc-600 dark:text-zinc-100"
          >
            WhatsApp
          </WaLink>
        </div>
      </article>
    </PublicShell>
  );
}
