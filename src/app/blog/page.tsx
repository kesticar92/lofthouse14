import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { BLOG_POSTS } from "@/data/blog-posts";
import { SEO, absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Blog · Cali y Miraflores",
  description:
    "Guías locales sobre el Parque del Perro, nómadas digitales y estadías en Cali desde Lofthouse 14.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog | Lofthouse 14",
    description: SEO.description,
    url: absoluteUrl("/blog"),
    images: [{ url: SEO.ogImage, alt: SEO.ogImageAlt }],
  },
};

export default function BlogIndexPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Blog", path: "/blog" },
        ])}
      />
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <h1 className="font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-6xl">
          Blog Lofthouse 14
        </h1>
        <p className="mt-4 max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
          Ideas para vivir Cali desde Miraflores: planes cerca del Parque del
          Perro, trabajo remoto y estadías médicas.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.slug}
              className="rounded-2xl border border-black/5 p-6 dark:border-white/10"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {post.date} · {post.readingMinutes} min
              </p>
              <h2 className="mt-2 font-display text-2xl text-zinc-900 dark:text-[#f2f0eb]">
                <Link href={`/blog/${post.slug}`} className="hover:underline">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {post.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
