"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { BedDouble, UtensilsCrossed, Wifi, Sparkles, Sofa,Armchair } from "lucide-react";

const features = [
  {
    id: 1,
    title: "Descanso Premium",
    description: "Camas de alta calidad, lencería suave y un ambiente insonorizado diseñado para garantizarte un sueño profundo y verdaderamente reparador.",
    image: "/gallery/cuarto_1_resultado.webp",
    icon: <BedDouble className="size-6 text-white" />,
    className: "md:col-span-2 md:row-span-2",
  },
  {
    id: 2,
    title: "Cocinas Equipadas",
    description: "Prepara tus recetas favoritas con total comodidad y electrodomésticos modernos.",
    image: "/gallery/cocina_1_resultado.webp",
    icon: <UtensilsCrossed className="size-6 text-white" />,
    className: "md:col-span-1 md:row-span-1",
  },
  {
    id: 3,
    title: "Zonas de Estar",
    description: "Espacios acogedores perfectos para relajarte o disfrutar una película.",
    image: "/gallery/sofa_1_resultado.webp",
    icon: <Sofa className="size-6 text-white" />,
    className: "md:col-span-1 md:row-span-1",
  },
  {
    id: 4,
    title: "Teletrabajo Cómodo",
    description: "Internet de alta velocidad y espacios iluminados para mantener tu productividad.",
    image: "/gallery/cuarto_4_resultado.webp",
    icon: <Wifi className="size-6 text-white" />,
    className: "md:col-span-1 md:row-span-5",
  },
  {
    id: 5,
    title: "Detalles que Enamoran",
    description: "Decoración contemporánea, estética cuidada e iluminación cálida que te harán sentir mejor que en casa.",
    image: "/gallery/cuarto_romantico.webp",
    icon: <Sparkles className="size-6 text-white" />,
    className: "md:col-span-1 md:row-span-5",
  },
  {
    id: 6,
    title: "Sofá Cama Versátil",
    description: "Nuestros sofás cama se convierten en cómodas camas adicionales en segundos, perfectos para grupos o familias que necesitan espacio extra sin sacrificar comodidad.",
    image: "/gallery/cama-sofaCama.webp",
    icon: <Armchair className="size-6 text-white" />,
    className: "md:col-span-1 md:row-span-5",
  }
];


export function Experiences() {
  return (
    <section id="experiencias" className="scroll-mt-28 w-full px-4 md:px-12 py-30 lg:py-28 bg-zinc-50 dark:bg-zinc-950 ">
      <div className="mx-auto ">
        <motion.div
          initial={{ opacity: 1, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <h2 className="font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] sm:text-5xl md:text-6xl">
            CONFORT EN CADA RINCÓN
          </h2>
          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300 sm:text-lg">
            Descubre los espacios que hemos diseñado meticulosamente para ofrecerte una estadía inigualable. Cada loft es un oasis urbano equipado con todo lo que necesitas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-3  gap-4 md:gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 1, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={cn(
                "flex group relative overflow-hidden rounded-3xl bg-zinc-200 dark:bg-zinc-800 shadow-lg min-h-[350px] md:min-h-[250px]",
                feature.className
              )}
            >
              <Image
                src={feature.image}
                alt={feature.title}
                fill
                className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-90" />

              <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xl transition-transform duration-500 group-hover:-translate-y-2">
                  {feature.icon}
                </div>
                <h3 className="font-display text-2xl md:text-3xl tracking-wide text-white mb-2 transition-transform duration-500 group-hover:-translate-y-1">
                  {feature.title.toUpperCase()}
                </h3>
                {/* On mobile always show text, on desktop show on hover for smaller cards or always for big cards depending on design, but let's make it appear on hover for a cleaner look */}
                <p className="text-sm text-zinc-200 leading-relaxed max-w-md transform md:opacity-0 md:translate-y-4 transition-all duration-500 md:group-hover:opacity-100 md:group-hover:translate-y-0">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
