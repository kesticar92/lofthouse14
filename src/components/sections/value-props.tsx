"use client";

import { motion } from "framer-motion";
import { site } from "@/lib/site";
import { UserFocusIcon, MapPinIcon, BookOpenIcon } from "@phosphor-icons/react";
import { GlassPanel } from "../ui/glass-panel";
/*
<div className="grid gap-6 md:grid-cols-3">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 1, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
            >
              <SpotlightCard className="h-full space-y-4">
                <div className="text-2xl">{item.icon}</div>
                <h3 className="font-display text-2xl tracking-wide text-[#f2f0eb] ">
                  {item.title.toUpperCase()}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-300">
                  {item.body}
                </p>

              </SpotlightCard>
            </motion.div>
          ))}
        </div>

*/
const items = [
  {
    title: "Flexibilidad única",
    body: "¿Un viaje de negocios en solitario o una delegación entera? Tenemos la capacidad de hospedar desde 1 hasta 60 personas en lofts independientes. Mantén a todo tu grupo en el mismo lugar sin sacrificar la privacidad de nadie.",
    tagline: "Tu espacio, tu ritmo, tu grupo. (pensar bien esto)",
    icon: <MapPinIcon size={32} color="#FFFFFF" weight="duotone" />,
  },
  {
    title: "El corazón de Cali, a tus pies",
    body: "Olvídate de los largos trayectos. Estás en San Fernando, a pasos del Parque del Perro. La mejor gastronomía, el ritmo de la salsa y los centros deportivos de la ciudad suceden justo fuera de tu puerta.",
    tagline:
      "Vive Cali como un local, con la comodidad de un hogar.(**pensar bien esto)",
    icon: <UserFocusIcon size={40} color="#FFFFFF" weight="duotone" />,
  },
  {
    title: "Tu refugio después del caos urbano",
    body: "Ambientes modernos, impecables y totalmente equipados. Disfruta de camas premium para un descanso real, cocinas listas para usar y espacios optimizados tanto para relajarte como para trabajar en remoto sin interrupciones.",
    tagline: "Tu oasis privado en el corazón de la ciudad.(**pensar bien esto)",
    icon: <BookOpenIcon size={32} color="#FFFFFF" weight="duotone" />,
  },
];

export function ValueProps() {
  return (
    <section
      id="propuesta"
      className="relative min-h-screen overflow-hidden py-12 px-4 md:py-20 md:px-20"
    >
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{
          backgroundImage: "url('/gallery/lofthouse_afuera.webp')",
        }}
        aria-hidden
      />
      {/* Velo: más oscuro donde va el titular (izquierda) sin tapar del todo la foto */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/55 to-black/75 md:bg-gradient-to-r md:from-black/85 md:via-black/60 md:to-black/40"
        aria-hidden
      />

      <div className="relative z-10 grid grid-cols-1 items-start gap-12 text-[#f2f0eb] lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 1, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-7xl px-4 text-center md:text-left lg:sticky lg:top-40"
        >
          <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-6 backdrop-blur-md md:border-transparent md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
            <h2 className="font-display text-4xl tracking-wide text-[#f2f0eb] drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)] md:text-5xl">
              ¿POR QUÉ SOMOS
            </h2>
            <h2 className="font-display text-4xl tracking-wide text-amber-400 drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)] md:text-5xl">
              LA MEJOR OPCIÓN?
            </h2>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#f2f0eb]/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]">
              {site.brandLine.toUpperCase()}
            </p>
            <p className="mt-4 text-base font-medium leading-relaxed text-[#f2f0eb] drop-shadow-[0_1px_10px_rgba(0,0,0,0.9)] sm:text-lg">
              Diseñamos cada loft pensando en tu comodidad, privacidad y
              conexión con la ciudad. Ya sea que viajes solo o con 60 personas,
              aquí tienes tu espacio.
            </p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 1, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mt-8 flex flex-col gap-4 text-zinc-900 dark:text-[#f2f0eb]"
        >
          {items.map((item) => (
            <GlassPanel
              key={item.title}
              className="px-6 items-center transition duration-500 ease-in-out hover:scale-[1.02] "
            >
              <span className="text-xl font-bold m-2 flex-1 ">
                <h3 className=" border-orange-500 border-b-4">{item.title}</h3>
              </span>
              <span className="text-base m-1 flex-1">
                <p>{item.body}</p>
              </span>
              <span className="text-base m-1  flex-1">
                <p>{item.tagline}</p>
              </span>
            </GlassPanel>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
