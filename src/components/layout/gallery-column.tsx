"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import type { GalleryPhoto } from "@/data/gallery-photos";

interface GalleryColumnProps {
  images: GalleryPhoto[];
  className?: string;
  duration?: number;
  onImageClick?: (photo: GalleryPhoto) => void;
}

export function GalleryColumn({
  images,
  className,
  duration = 48,
  onImageClick,
}: GalleryColumnProps) {
  if (images.length === 0) return null;

  return (
    <div className={cn("testimonial-scroll-column min-w-0 flex-1", className)}>
      <div
        className="testimonial-scroll-track flex flex-col gap-4 pb-4 motion-reduce:animate-none"
        style={{
          animation: `testimonial-scroll ${duration}s linear infinite`,
        }}
      >
        {[0, 1].map((loop) => (
          <React.Fragment key={loop}>
            {images.map((photo, i) => (
              <figure
                key={`${loop}-${photo.src}`}
                className="overflow-hidden rounded-2xl border border-black/10 shadow-lg dark:border-white/10"
              >
                <button
                  type="button"
                  onClick={() => onImageClick?.(photo)}
                  className="group relative block aspect-[4/3] w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                  aria-label={`Abrir ${photo.alt} a pantalla completa`}
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/15" />
                </button>
              </figure>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
