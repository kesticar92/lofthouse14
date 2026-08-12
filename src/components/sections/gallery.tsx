"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { site } from "@/lib/site";
import {
  GalleryColumn,
} from "@/components/layout/gallery-column";
import Image from "next/image";

export function Gallery() {
  const reduceMotion = useReducedMotion();

  const { first, second, third } = useMemo(() => {
    const imgs = site.gallery;
    return {
      first: imgs.filter((_, i) => i % 3 === 0),
      second: imgs.filter((_, i) => i % 3 === 1),
      third: imgs.filter((_, i) => i % 3 === 2),
    };
  }, []);

  return (
    <section
      id="galeria"
      className="scroll-mt-28 bg-white px-4 py-16 dark:bg-zinc-950 md:px-20 md:py-24"
    >
      <div className="mx-auto max-w-[1600px]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <h2 className="font-display text-4xl tracking-tight text-zinc-900 dark:text-[#f2f0eb] sm:text-5xl md:text-6xl">
            Así se vive LOFTHOUSE
          </h2>
        </motion.div>

        {reduceMotion ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {site.gallery.map((src, i) => (
              <figure
                key={src}
                className="overflow-hidden rounded-2xl border border-black/10 shadow-lg dark:border-white/10"
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={src}
                    alt={`LOFTHOUSE 14 — foto ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
              </figure>
            ))}
          </div>
        ) : (
          <div className="testimonial-scroll-column flex w-full gap-4 sm:gap-5 md:gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_6%,black_94%,transparent)] max-h-[min(78vh,820px)] overflow-hidden">
            <GalleryColumn images={first} duration={44} />
            <GalleryColumn
              images={second}
              duration={56}
              className="hidden sm:block"
            />
            <GalleryColumn
              images={third}
              duration={50}
              className="hidden lg:block"
            />
          </div>
        )}
      </div>
    </section>
  );
}
