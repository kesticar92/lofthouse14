import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { BLOG_POSTS } from "@/data/blog-posts";

export const metadata: Metadata = {
  title: "Blog — turismo y hospedaje en Cali",
  description:
    "Guías locales: Parque del Perro, Miraflores, restaurantes y cómo hospedarte en lofts en Cali.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-28 md:px-8">
        <Breadcrumbs
          items={[
            { href: "/", label: "Inicio" },
            { href: "/blog", label: "Blog" },
          ]}
        />
        <h1 className="mt-4 font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb]">
          Blog de Cali y Miraflores
        </h1>
        <ul className="mt-10 space-y-8">
          {BLOG_POSTS.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="group block">
                <h2 className="font-display text-2xl text-zinc-900 group-hover:text-amber-700 dark:text-[#f2f0eb]">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-zinc-500">{post.date}</p>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  {post.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </PublicShell>
  );
}
