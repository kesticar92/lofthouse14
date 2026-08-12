"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { site } from "@/lib/site";

const posts = [
  {
    id: 1,
    url: "https://www.instagram.com/reel/DS7rZ57EUaw/",
    thumbnailUrl: "/gallery/screenshot_2.webp",
    isVideo: true,
    caption: "Entrar, subir y sentir que ya estás en tu lugar.",
  },
  {
    id: 2,
    url: "https://www.instagram.com/reel/DZxlocpsg5n/",
    thumbnailUrl: "/gallery/screenshot_4.webp",
    isVideo: true,
    caption:
      "A veces no hace falta salir de tu ciudad para vivir algo distinto.",
  },
  {
    id: 3,
    url: "https://www.instagram.com/reel/DZdMqSyNjBh/",
    thumbnailUrl: "/gallery/screenshot_3.webp",
    isVideo: true,
    caption: "Vive Cali como un local.",
  },
  {
    id: 4,
    url: "https://www.instagram.com/reel/DS_NhgWEQoS/",
    thumbnailUrl: "/gallery/screenshot_1.webp",
    isVideo: true,
    caption: "Desde Cristo Rey, Cali se ilumina cada noche.",
  },
] as const;

function SocialProfileButton({
  href,
  label,
  logoSrc,
  logoWidth,
  logoHeight,
  logoClassName,
}: {
  href: string;
  label: string;
  logoSrc: string;
  logoWidth: number;
  logoHeight: number;
  logoClassName?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-3 rounded-xl border border-zinc-300/90 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
    >
      <Image
        src={logoSrc}
        alt=""
        width={logoWidth}
        height={logoHeight}
        className={logoClassName}
        aria-hidden
      />
      <span>{label}</span>
    </a>
  );
}

export function SocialWall() {
  return (
    <section
      id="social-wall"
      className="w-full bg-zinc-50 px-4 py-12 dark:bg-zinc-950 md:px-20 md:py-20"
    >
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="font-display text-4xl tracking-tight text-zinc-900 dark:text-[#f2f0eb] md:text-5xl">
          Instagram y TikTok
        </h2>
        <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Publicamos lo del día a día en el loft y en Cali. Entra al perfil que
          uses y escríbenos por WhatsApp si quieres reservar.
        </p>

        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <SocialProfileButton
            href={site.instagramUrl}
            label="@lofthouse.14"
            logoSrc="/logos/instagram-wordmark.svg"
            logoWidth={132}
            logoHeight={40}
            logoClassName="h-[18px] w-auto"
          />
          <SocialProfileButton
            href={site.tiktokUrl}
            label="@lofthouse.14"
            logoSrc="/logos/tiktok-wordmark.svg"
            logoWidth={160}
            logoHeight={40}
            logoClassName="h-[16px] w-auto"
          />
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post) => (
          <a
            key={post.id}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block aspect-square overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-800"
          >
            <img
              src={post.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover transition group-hover:brightness-90"
            />

            {post.isVideo ? (
              <div className="absolute right-3 top-3 rounded-full bg-black/55 p-1.5">
                <Play className="size-3 fill-white text-white" aria-hidden />
              </div>
            ) : null}

            <div className="absolute left-3 top-3 rounded-md bg-white/90 p-1 dark:bg-zinc-900/90">
              <Image
                src="/logos/instagram-glyph.svg"
                alt="Instagram"
                width={32}
                height={32}
                className="size-4"
              />
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 pt-10 opacity-0 transition group-hover:opacity-100">
              <p className="line-clamp-3 text-left text-xs leading-snug text-white">
                {post.caption}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
