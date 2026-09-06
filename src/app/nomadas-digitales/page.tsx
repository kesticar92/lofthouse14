import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { getLandingBySlug } from "@/data/landings";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { waLink } from "@/lib/site";

const SLUG = "nomadas";
const landing = getLandingBySlug(SLUG);

export const metadata: Metadata = landing
  ? {
      title: landing.title,
      description: landing.description,
      alternates: { canonical: landing.path },
      openGraph: {
        title: landing.title,
        description: landing.description,
        url: absoluteUrl(landing.path),
      },
    }
  : {};

export default function LandingPage() {
  if (!landing) notFound();
  return (
    <MarketingShell>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: landing.h1, path: landing.path },
        ])}
      />
      <section className="mx-auto max-w-4xl px-4 py-16 md:py-24">
        <h1 className="font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-5xl">
          {landing.h1}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-zinc-700 dark:text-zinc-300 md:text-lg">
          {landing.intro}
        </p>
        <ul className="mt-8 space-y-3">
          {landing.bullets.map((b) => (
            <li key={b} className="flex gap-3 text-sm text-zinc-700 dark:text-zinc-300">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-600" />
              {b}
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={waLink(landing.waMessage)}
            className="inline-flex rounded-full bg-zinc-900 px-8 py-4 text-sm font-bold uppercase tracking-wide text-white dark:bg-amber-600"
          >
            {landing.ctaLabel}
          </a>
          <Link
            href="/#reservas"
            className="inline-flex rounded-full border border-zinc-400 px-6 py-4 text-sm font-bold uppercase tracking-wide"
          >
            Configurar estadía
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
