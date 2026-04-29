"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { site } from "@/lib/site";

export function Gallery() {
  const gridGallery = Array.from({ length: 9 }, (_, i) => site.gallery[i % site.gallery.length]);

  return (
    <section id="galeria" className="scroll-mt-28 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 1, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <h2 className="font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] sm:text-5xl md:text-6xl">
            ASÍ SE VIVE LOFTHOUSE
          </h2>
          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300 sm:text-lg">
            Espacios reales, cómodos y pensados para tu experiencia.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gridGallery.map((src, i) => (
            <motion.figure
              key={`${src}-${i}`}
              initial={{ opacity: 1, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: (i % 3) * 0.05, duration: 0.45 }}
              className="overflow-hidden rounded-2xl border border-black/10 shadow-lg dark:border-white/10"
            >
              <div className="relative aspect-square w-full">
                <Image
                  src={src}
                  alt={`Galería ${site.name} — imagen ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-500 hover:scale-[1.03]"
                />
              </div>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
