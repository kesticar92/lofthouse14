import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/layout/public-shell";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/layout/json-ld";
import { BLOG_POSTS, getPost } from "@/data/blog-posts";
import { breadcrumbJsonLd } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-url";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Artículo" };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const url = getSiteUrl();

  return (
    <PublicShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          datePublished: post.date,
          description: post.description,
          url: `${url}/blog/${post.slug}`,
          author: { "@type": "Organization", name: "Lofthouse 14" },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />
      <article className="mx-auto max-w-3xl px-4 pb-20 pt-28 md:px-8">
        <Breadcrumbs
          items={[
            { href: "/", label: "Inicio" },
            { href: "/blog", label: "Blog" },
            { href: `/blog/${post.slug}`, label: post.title },
          ]}
        />
        <h1 className="mt-4 font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb]">
          {post.title}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">{post.date}</p>
        <div className="mt-8 space-y-4 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
          {post.body.map((p) => (
            <p key={p.slice(0, 32)}>{p}</p>
          ))}
        </div>
      </article>
    </PublicShell>
  );
}
