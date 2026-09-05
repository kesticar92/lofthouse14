import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";

export default function NotFound() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-xl px-4 py-32 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
          Error 404
        </p>
        <h1 className="mt-3 font-display text-4xl text-zinc-900 dark:text-[#f2f0eb]">
          Esta página no existe
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          El enlace puede haber cambiado. Vuelve a los lofts en Cali Miraflores
          o reserva por WhatsApp.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-bold text-white dark:bg-[#f2f0eb] dark:text-zinc-900"
          >
            Ir al inicio
          </Link>
          <Link
            href="/lofts"
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-bold dark:border-zinc-600"
          >
            Ver lofts
          </Link>
          <Link
            href="/reservas"
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-bold dark:border-zinc-600"
          >
            Reservar
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
