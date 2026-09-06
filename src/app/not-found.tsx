import Link from "next/link";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { waLink } from "@/lib/site";

export default function NotFound() {
  return (
    <MarketingShell showSticky={false}>
      <section className="mx-auto flex max-w-3xl flex-col items-start px-4 py-24">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-500">
          Error 404
        </p>
        <h1 className="mt-3 font-display text-5xl tracking-wide text-zinc-900 dark:text-[#f2f0eb]">
          Página no encontrada
        </h1>
        <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300">
          Esa URL no existe o fue movida. Vuelve al inicio o configura tu
          estadía directamente.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex rounded-full bg-zinc-900 px-8 py-4 text-sm font-bold uppercase tracking-wide text-white dark:bg-amber-600"
          >
            Ir al inicio
          </Link>
          <Link
            href="/lofts"
            className="inline-flex rounded-full border border-zinc-400 px-6 py-4 text-sm font-bold uppercase tracking-wide"
          >
            Ver lofts
          </Link>
          <a
            href={waLink("Hola, llegué a un 404 y quiero reservar")}
            className="inline-flex rounded-full border border-zinc-400 px-6 py-4 text-sm font-bold uppercase tracking-wide"
          >
            WhatsApp
          </a>
        </div>
      </section>
    </MarketingShell>
  );
}
