import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { BLOG_POSTS, getPostBySlug } from "@/data/blog-posts";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { waLink } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: absoluteUrl(`/blog/${post.slug}`),
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <MarketingShell>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />
      <article className="mx-auto max-w-3xl px-4 py-16 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {post.date} · {post.readingMinutes} min de lectura
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-5xl">
          {post.title}
        </h1>
        <div className="mt-8 space-y-5 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
          {post.body.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={waLink("Hola, leí el blog y quiero reservar en Lofthouse 14")}
            className="inline-flex rounded-full bg-zinc-900 px-8 py-4 text-sm font-bold uppercase tracking-wide text-white dark:bg-amber-600"
          >
            Reservar por WhatsApp
          </a>
          <Link href="/blog" className="inline-flex rounded-full border border-zinc-400 px-6 py-4 text-sm font-bold uppercase tracking-wide">
            Más artículos
          </Link>
        </div>
      </article>
    </MarketingShell>
  );
}
