"use client";

import React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import {
  galleryPhotoLabel,
  type GalleryPhoto,
} from "@/data/gallery-photos";

interface GalleryColumnProps {
  images: GalleryPhoto[];
  className?: string;
  /** Segundos por recorrer el bloque duplicado (mismo patrón que reseñas/FAQ). */
  duration?: number;
  onImageClick?: (photo: GalleryPhoto) => void;
}

function GalleryPhotoCard({
  photo,
  onImageClick,
}: {
  photo: GalleryPhoto;
  onImageClick?: (photo: GalleryPhoto) => void;
}) {
  return (
    <figure className="box-border w-full min-w-0 max-w-full overflow-hidden rounded-3xl border border-zinc-200/90 shadow-lg shadow-zinc-900/5 dark:border-white/10 dark:shadow-black/30">
      <button
        type="button"
        onClick={() => onImageClick?.(photo)}
        className="group relative block aspect-[4/3] w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
        aria-label={`Abrir ${galleryPhotoLabel(photo)} a pantalla completa`}
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(max-width: 640px) 100vw, 20rem"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <span className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/15" />
        {(photo.caption || photo.moment) && (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 text-left text-xs font-medium tracking-wide text-white opacity-0 transition group-hover:opacity-100 sm:text-sm">
            {galleryPhotoLabel(photo)}
          </span>
        )}
      </button>
    </figure>
  );
}

export function GalleryColumn({
  images,
  className,
  duration,
  onImageClick,
}: GalleryColumnProps) {
  const reduceMotion = useReducedMotion();

  if (images.length === 0) return null;

  const durationSec =
    duration ?? Math.max(40, Math.round(images.length * 3.4));

  const cards = images.map((photo) => (
    <GalleryPhotoCard
      key={photo.src}
      photo={photo}
      onImageClick={onImageClick}
    />
  ));

  if (reduceMotion) {
    return (
      <div className={cn("flex min-w-0 flex-1 flex-col gap-5", className)}>
        {cards}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "testimonial-scroll-column min-w-0 flex-1 max-w-xs",
        className,
      )}
    >
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration: durationSec,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-5 pb-5"
      >
        {[0, 1].map((loop) => (
          <React.Fragment key={loop}>
            {images.map((photo) => (
              <GalleryPhotoCard
                key={`${loop}-${photo.src}`}
                photo={photo}
                onImageClick={onImageClick}
              />
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}
