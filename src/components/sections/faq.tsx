"use client";

import { motion } from "framer-motion";
import { waLink } from "@/lib/site";
import Link from "next/link";
import { FaqColumn } from "@/components/layout/faq-column";
import { getFaqItems } from "@/data/faq";

const faqItems = getFaqItems();

const firstColumn = faqItems.filter((_, i) => i % 3 === 0);
const secondColumn = faqItems.filter((_, i) => i % 3 === 1);
const thirdColumn = faqItems.filter((_, i) => i % 3 === 2);

export function FaqSection() {
  return (
    <section
      id="preguntas-frecuentes"
      className="scroll-mt-28 relative w-full overflow-hidden border-t border-zinc-200 bg-[#f2f0eb]/40 py-16 dark:border-zinc-800 dark:bg-zinc-950 md:py-24"
    >
      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-4 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800 dark:text-amber-500">
            Preguntas frecuentes
          </p>
          <h2 className="mt-2 font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-5xl">
            Preguntas frecuentes sobre hospedaje en Cali
          </h2>
          <p className="mt-3 text-base text-zinc-600 dark:text-zinc-300">
            Tarifas, reservas, ingreso autónomo, pagos y normas de convivencia.
          </p>
        </motion.div>

        <div className="mt-12 flex w-full gap-4 sm:gap-5 md:gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_8%,black_92%,transparent)] max-h-[min(78vh,820px)] overflow-hidden">
          <FaqColumn items={[...firstColumn]} duration={26} />
          <FaqColumn
            items={[...secondColumn]}
            duration={34}
            className="hidden sm:block"
          />
          <FaqColumn
            items={[...thirdColumn]}
            duration={30}
            className="hidden lg:block"
          />
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={waLink("Hola, tengo una pregunta sobre LOFTHOUSE 14")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full bg-zinc-900 px-8 py-3 text-sm font-bold text-white hover:bg-zinc-800 dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            Preguntar por WhatsApp
          </Link>
          <Link
            href="/politicas"
            className="inline-flex rounded-full border border-zinc-300 px-8 py-3 text-sm font-bold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Ver políticas completas
          </Link>
        </div>
      </div>
    </section>
  );
}
