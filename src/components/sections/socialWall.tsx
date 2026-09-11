"use client";

import { useEffect, useMemo, useState } from "react";
import { Play, X } from "lucide-react";
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

/** Permalink de reel/post → URL de embed oficial de Instagram. */
function instagramEmbedUrl(permalink: string): string | null {
  try {
    const u = new URL(permalink);
    if (!u.hostname.includes("instagram.com")) return null;
    const path = u.pathname.replace(/\/+$/, "");
    if (!path) return null;
    return `https://www.instagram.com${path}/embed`;
  } catch {
    return null;
  }
}

function isReelPost(post: InstagramFeedPost): boolean {
  if (!post.isVideo) return false;
  return /\/(reel|reels|tv)\//i.test(post.url) || post.isVideo;
}

export function SocialWall() {
  const [posts, setPosts] = useState<InstagramFeedPost[]>(
    () => INSTAGRAM_POSTS_SEED as InstagramFeedPost[],
  );
  const [source, setSource] = useState<string>("seed");
  const [activeReel, setActiveReel] = useState<InstagramFeedPost | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/instagram/feed", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as {
          posts?: InstagramFeedPost[];
          source?: string;
        };
        if (cancelled) return;
        if (Array.isArray(json.posts) && json.posts.length > 0) {
          setPosts(json.posts);
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

  useEffect(() => {
    if (!activeReel) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveReel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [activeReel]);

  const reels = useMemo(() => posts.filter(isReelPost), [posts]);
  const embedSrc = activeReel ? instagramEmbedUrl(activeReel.url) : null;

  return (
    <section
      id="social-wall"
      className="w-full bg-zinc-50 px-4 py-12 dark:bg-zinc-950 md:px-20 md:py-20"
    >
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="font-display text-4xl tracking-tight text-zinc-900 dark:text-[#f2f0eb] md:text-5xl">
          Reels de Instagram
        </h2>
        <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
          Solo reels de @lofthouse.14. Tócalos para verlos aquí mismo, sin salir
          de la página.
        </p>

        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <SocialProfileButton href={site.instagramUrl} handle="@lofthouse.14">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
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

      {reels.length === 0 ? (
        <p className="mx-auto max-w-lg text-center text-sm text-zinc-500">
          No hay reels disponibles por ahora.{" "}
          <a
            href={site.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            Ver perfil en Instagram
          </a>
        </p>
      ) : (
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
          {reels.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setActiveReel(post)}
              className="group relative block aspect-[9/16] overflow-hidden rounded-xl bg-zinc-200 text-left dark:bg-zinc-800"
              aria-label={`Ver reel: ${post.caption || "Instagram"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover transition group-hover:brightness-90"
                loading="lazy"
                referrerPolicy={
                  isRemoteThumb(post.thumbnailUrl) ? "no-referrer" : undefined
                }
              />

              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-90 transition group-hover:bg-black/35">
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-black/55 text-white shadow-lg">
                  <Play className="size-5 fill-white" aria-hidden />
                </span>
              </div>

              <div className="absolute left-3 top-3 rounded-md bg-white/95 p-1 shadow-sm dark:bg-zinc-950/90">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logos/instagram-glyph.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="size-4"
                />
              </div>

              {post.caption ? (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10">
                  <p className="line-clamp-2 text-left text-xs leading-snug text-white">
                    {post.caption}
                  </p>
                </div>
              ) : null}
            </button>
          ))}
        </div>
      )}

      <div className="mx-auto mt-8 flex max-w-7xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {reels.length === 1 ? "1 reel" : `${reels.length} reels`}
          {source === "graph" ? " · actualizado desde Instagram" : null}
        </p>
        <a
          href={site.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-[#f2f0eb]"
        >
          Ver perfil en Instagram →
        </a>
      </div>

      {activeReel ? (
        <div
          className="fixed inset-0 z-[240] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Reel de Instagram"
          onClick={() => setActiveReel(null)}
        >
          <div
            className="relative flex h-[min(92dvh,820px)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-zinc-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <p className="truncate text-xs font-medium text-white/80">
                {activeReel.caption || "Reel · @lofthouse.14"}
              </p>
              <button
                type="button"
                onClick={() => setActiveReel(null)}
                className="inline-flex size-9 items-center justify-center rounded-full text-white hover:bg-white/10"
                aria-label="Cerrar"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 bg-black">
              {embedSrc ? (
                <iframe
                  title="Reel de Instagram"
                  src={embedSrc}
                  className="h-full w-full border-0"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-white/80">
                  <p>No se pudo incrustar este reel.</p>
                  <a
                    href={activeReel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-zinc-900"
                  >
                    Abrir en Instagram
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
