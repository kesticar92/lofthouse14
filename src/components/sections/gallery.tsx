"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { GALLERY_PHOTOS, type GalleryPhoto } from "@/data/gallery-photos";
import { GalleryColumn } from "@/components/layout/gallery-column";
import { ImmersiveGallery } from "@/components/layout/immersive-gallery";
import Image from "next/image";

function splitIntoColumns(
  items: readonly GalleryPhoto[],
  columnCount: number,
): GalleryPhoto[][] {
  const n = Math.max(1, columnCount);
  const cols: GalleryPhoto[][] = Array.from({ length: n }, () => []);
  items.forEach((item, index) => {
    cols[index % n]!.push(item);
  });
  return cols;
}

function durationForCount(count: number): number {
  // Similar ritmo al carrusel de reseñas: más fotos → scroll más largo
  return Math.max(36, Math.min(90, 28 + count * 3.2));
}

export function Gallery() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);
  const photos = GALLERY_PHOTOS;

  const cols = useMemo(() => {
    return {
      mobile: splitIntoColumns(photos, 1),
      tablet: splitIntoColumns(photos, 2),
      desktop: splitIntoColumns(photos, 3),
    };
  }, [photos]);

  const openPhoto = (photo: GalleryPhoto) => {
    const idx = photos.findIndex((p) => p.src === photo.src);
    if (idx >= 0) setActive(idx);
  };

  return (
    <section
      id="galeria"
      className="relative scroll-mt-28 overflow-x-hidden overflow-hidden px-4 py-12 md:px-20 md:py-20"
    >
      <div className="absolute inset-0 -z-10 bg-zinc-50 dark:bg-black/20" />

      <div className="container z-10 mx-auto px-4">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mx-auto mb-10 flex max-w-[840px] flex-col items-center text-center"
        >
          <h2 className="font-display text-3xl tracking-tight text-zinc-900 dark:text-[#f2f0eb] sm:text-4xl md:text-5xl">
            Así se vive{" "}
            <span className="text-amber-600">LOFTHOUSE</span>
          </h2>
          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300 sm:text-lg">
            Toca cualquier foto para verla a pantalla completa, con navegación
            cinematográfica entre los espacios.
          </p>
        </motion.div>

        {reduceMotion ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, i) => (
              <button
                key={photo.src}
                type="button"
                onClick={() => setActive(i)}
                className="overflow-hidden rounded-2xl border border-black/10 shadow-lg dark:border-white/10"
                aria-label={`Abrir ${photo.alt} a pantalla completa`}
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="mx-auto flex w-full min-w-0 justify-center gap-4 sm:hidden [mask-image:linear-gradient(to_bottom,transparent,black_8%,black_92%,transparent)] max-h-[min(78vh,820px)] overflow-hidden">
              <GalleryColumn
                images={cols.mobile[0] ?? []}
                duration={durationForCount(photos.length)}
                onImageClick={openPhoto}
              />
            </div>
            <div className="mx-auto hidden w-full min-w-0 justify-center gap-4 sm:flex md:hidden [mask-image:linear-gradient(to_bottom,transparent,black_8%,black_92%,transparent)] max-h-[min(78vh,820px)] overflow-hidden">
              {cols.tablet.map((col, i) => (
                <GalleryColumn
                  key={`t-${i}`}
                  images={col}
                  duration={durationForCount(col.length)}
                  onImageClick={openPhoto}
                />
              ))}
            </div>
            <div className="mx-auto hidden w-full min-w-0 justify-center gap-4 md:flex sm:gap-5 md:gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_8%,black_92%,transparent)] max-h-[min(78vh,820px)] overflow-hidden">
              {cols.desktop.map((col, i) => (
                <GalleryColumn
                  key={`d-${i}`}
                  images={col}
                  duration={durationForCount(col.length)}
                  onImageClick={openPhoto}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <ImmersiveGallery
        photos={photos}
        index={active}
        onClose={() => setActive(null)}
        onChange={setActive}
      />
    </section>
  );
}
