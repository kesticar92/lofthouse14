"use client";

import { useState } from "react";
import { ArrowRight, Play } from "lucide-react";
import { site } from "@/lib/site";
import { FacebookLogo, InstagramLogo } from "@phosphor-icons/react";

// Estructura de posts con thumbnail y metadata manual
// Reemplaza thumbnailUrl con la imagen real de cada post (puedes obtenerla
// de Instagram, o usar next/image con una imagen local)
const posts = [
  {
    id: 1,
    network: "instagram" as const,
    url: "https://www.instagram.com/reel/DS7rZ57EUaw/",
    thumbnailUrl: "/gallery/screenshot_2.webp",
    isVideo: true,
    caption: "Entrar, subir… y sentir que ya estás en tu lugar ✨",
  },
  {
    id: 2,
    network: "instagram" as const,
    url: "https://www.instagram.com/reel/DZxlocpsg5n/",
    thumbnailUrl: "/gallery/screenshot_4.webp",
    isVideo: true,
    caption: "A veces no hace falta salir de tu ciudad para vivir una experiencia diferente.",
  },
  {
    id: 3,
    network: "instagram" as const,
    url: "https://www.instagram.com/reel/DZdMqSyNjBh/",
    thumbnailUrl: "/gallery/screenshot_3.webp",
    isVideo: true,
    caption: "Veni a vivir Cali como un local 😎",
  },
  {
    id: 4,
    network: "instagram" as const,
    url: "https://www.instagram.com/reel/DS_NhgWEQoS/",
    thumbnailUrl: "/gallery/screenshot_1.webp",
    isVideo: true,
    caption: "Desde Cristo Rey, Cali se ilumina cada noche.",
  },
];

type Network = "all"

export function SocialWall() {
  const [activeFilter, setActiveFilter] = useState<Network>("all");

  const filtered = activeFilter === "all"
    ? posts
    : posts.filter((p) => p.network === activeFilter);

  return (
    <section id="social-wall" className="w-full py-12 px-4 md:py-20 md:px-20 bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="text-center mb-10">

        <p className="text-sm font-medium tracking-[0.2em] uppercase text-zinc-500 dark:text-zinc-400 mb-4">
          Síguenos
        </p>
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-zinc-900 dark:text-white">
          Social Media<span className="text-amber-600"> Wall</span>
        </h2>


        <p className="text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto text-base leading-relaxed mb-8">
          Desde el descanso en nuestras habitaciones hasta los rincones más
          especiales — sigue las{" "}
          <strong className="font-semibold text-zinc-900 dark:text-zinc-200">historias</strong> de
          LoftHouse 14 en redes sociales.
        </p>

        {/* CTA */}
        <a
          href={site.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-zinc-400 text-zinc-700 dark:text-zinc-300 text-sm tracking-wide hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 transition-all duration-300"
        >
          <InstagramLogo size={20} weight="bold" />
          <span className="underline underline-offset-4 decoration-2">Ver perfil completo</span>
        </a>
      </div>

      {/* Grid de posts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-7xl mx-auto">
        {filtered.map((post) => (
          <a
            key={post.id}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden rounded-2xl bg-zinc-200 dark:bg-zinc-800 block"
          >
            {/* Thumbnail */}
            <img
              src={post.thumbnailUrl}
              alt={post.caption}
              className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
            />

            {/* Icono de video */}
            {post.isVideo && (
              <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full p-1.5">
                <Play className="size-3 text-white fill-white" />
              </div>
            )}

            {/* Icono de red social */}
            <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm rounded-full p-1.5">
              {post.network === "instagram" ? (
                <InstagramLogo size={14} />
              ) : (
                <FacebookLogo size={14} />
              )}
            </div>

            {/* Overlay con caption al hacer hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex items-end p-4">
              <p className="text-white text-xs leading-relaxed line-clamp-3">
                {post.caption}
              </p>
            </div>
          </a>
        ))}
      </div>

      {/* Badge de Instagram al pie — detalle fiel al original */}
      <div className="flex justify-end max-w-7xl mx-auto mt-4 pr-1">
        <a
          href="https://www.instagram.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <InstagramLogo size={18} />
        </a>
      </div>
    </section>
  );
}