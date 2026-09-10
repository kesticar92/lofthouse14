"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { site } from "@/lib/site";
import { cn } from "@/lib/cn";
import type { InstagramFeedPost } from "@/lib/instagram/types";
import { INSTAGRAM_POSTS_SEED } from "@/data/instagram-posts";

function TikTokMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-5 shrink-0", className)}
      aria-hidden
    >
      <path
        fill="#25F4EE"
        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.3 0 .59.04.87.13V9.01a6.27 6.27 0 0 0-.87-.06A6.34 6.34 0 0 0 3.15 15.3 6.34 6.34 0 0 0 9.49 21.6a6.34 6.34 0 0 0 6.34-6.34V8.77a8.18 8.18 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15Z"
        transform="translate(0.4 0.3)"
        opacity="0.9"
      />
      <path
        fill="#FE2C55"
        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.3 0 .59.04.87.13V9.01a6.27 6.27 0 0 0-.87-.06A6.34 6.34 0 0 0 3.15 15.3 6.34 6.34 0 0 0 9.49 21.6a6.34 6.34 0 0 0 6.34-6.34V8.77a8.18 8.18 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15Z"
        transform="translate(-0.4 -0.3)"
        opacity="0.9"
      />
      <path
        fill="currentColor"
        className="text-zinc-900 dark:text-white"
        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.3 0 .59.04.87.13V9.01a6.27 6.27 0 0 0-.87-.06A6.34 6.34 0 0 0 3.15 15.3 6.34 6.34 0 0 0 9.49 21.6a6.34 6.34 0 0 0 6.34-6.34V8.77a8.18 8.18 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15Z"
      />
    </svg>
  );
}

function SocialProfileButton({
  href,
  handle,
  children,
}: {
  href: string;
  handle: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-3 rounded-xl border border-zinc-300/90 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:border-white/25 dark:hover:bg-zinc-800"
    >
      {children}
      <span className="text-zinc-700 dark:text-zinc-200">{handle}</span>
    </a>
  );
}

function isRemoteThumb(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}

export function SocialWall() {
  const [posts, setPosts] = useState<InstagramFeedPost[]>(
    () => INSTAGRAM_POSTS_SEED as InstagramFeedPost[],
  );
  const [count, setCount] = useState(INSTAGRAM_POSTS_SEED.length);
  const [source, setSource] = useState<string>("seed");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/instagram/feed", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as {
          posts?: InstagramFeedPost[];
          count?: number;
          source?: string;
        };
        if (cancelled) return;
        if (Array.isArray(json.posts) && json.posts.length > 0) {
          setPosts(json.posts);
          setCount(json.count ?? json.posts.length);
          setSource(json.source ?? "store");
        }
      } catch {
        /* keep seed */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="social-wall"
      className="w-full bg-zinc-50 px-4 py-12 dark:bg-zinc-950 md:px-20 md:py-20"
    >
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="font-display text-4xl tracking-tight text-zinc-900 dark:text-[#f2f0eb] md:text-5xl">
          Instagram y TikTok
        </h2>
        <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
          Todas las publicaciones de @lofthouse.14 en un solo muro. Entra al
          perfil o escríbenos por WhatsApp si quieres reservar.
        </p>

        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <SocialProfileButton href={site.instagramUrl} handle="@lofthouse.14">
            <Image
              src="/logos/instagram-wordmark.svg"
              alt="Instagram"
              width={132}
              height={40}
              className="h-[18px] w-auto dark:invert"
            />
          </SocialProfileButton>
          <SocialProfileButton href={site.tiktokUrl} handle="@lofthouse.14">
            <span className="inline-flex items-center gap-2 text-zinc-900 dark:text-white">
              <TikTokMark />
              <span className="text-[15px] font-bold tracking-tight">
                TikTok
              </span>
            </span>
          </SocialProfileButton>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-4">
        {posts.map((post) => (
          <a
            key={post.id}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block aspect-square overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-800"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- thumbs locales + CDN Instagram */}
            <img
              src={post.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover transition group-hover:brightness-90"
              loading="lazy"
              referrerPolicy={
                isRemoteThumb(post.thumbnailUrl) ? "no-referrer" : undefined
              }
            />

            {post.isVideo ? (
              <div className="absolute right-3 top-3 rounded-full bg-black/55 p-1.5">
                <Play className="size-3 fill-white text-white" aria-hidden />
              </div>
            ) : null}

            <div className="absolute left-3 top-3 rounded-md bg-white/95 p-1 shadow-sm dark:bg-zinc-950/90">
              <Image
                src="/logos/instagram-glyph.svg"
                alt="Instagram"
                width={32}
                height={32}
                className="size-4"
              />
            </div>

            {post.caption ? (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 pt-10 opacity-0 transition group-hover:opacity-100">
                <p className="line-clamp-3 text-left text-xs leading-snug text-white">
                  {post.caption}
                </p>
              </div>
            ) : null}
          </a>
        ))}
      </div>

      <div className="mx-auto mt-8 flex max-w-7xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {count} publicación{count === 1 ? "" : "es"}
          {source === "graph" ? " · actualizado desde Instagram" : null}
        </p>
        <a
          href={site.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-[#f2f0eb]"
        >
          Ver todas en Instagram →
        </a>
      </div>
    </section>
  );
}
