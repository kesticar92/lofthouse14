"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

interface GalleryColumnProps {
  images: string[];
  className?: string;
  duration?: number;
}

export function GalleryColumn({
  images,
  className,
  duration = 48,
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
            {images.map((src, i) => (
              <figure
                key={`${loop}-${src}`}
                className="overflow-hidden rounded-2xl border border-black/10 shadow-lg dark:border-white/10"
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={src}
                    alt={`LOFTHOUSE 14 — foto ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
              </figure>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
