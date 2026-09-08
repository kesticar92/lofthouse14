import Link from "next/link";
import { site, waLink } from "@/lib/site";
import { GuestBottomNav } from "@/components/guest/guest-bottom-nav";

export default function AyudaPage() {
  return (
    <>
      <main className="mx-auto min-h-[70vh] max-w-lg px-4 py-16 pb-28 md:pb-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {site.name}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Ayuda</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
          Respuestas rápidas y contacto humano por WhatsApp.
        </p>

        <ul className="mt-8 space-y-3 text-sm">
          <li className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
            <p className="font-semibold">Check-in / check-out</p>
            <p className="mt-1 text-zinc-600 dark:text-zinc-300">
              {site.checkIn}. {site.checkOut}.
            </p>
          </li>
          <li className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
            <p className="font-semibold">Mi reserva</p>
            <p className="mt-1 text-zinc-600 dark:text-zinc-300">
              Consulta estado y haz check-in digital con tu código LH-…
            </p>
            <Link
              href="/mi-reserva"
              className="mt-2 inline-block text-xs font-semibold text-amber-900 underline dark:text-amber-300"
            >
              Ir a Mi reserva
            </Link>
          </li>
          <li className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
            <p className="font-semibold">Ubicación</p>
            <p className="mt-1 text-zinc-600 dark:text-zinc-300">
              {site.addressLine} · {site.neighborhood}
            </p>
          </li>
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={waLink(
              `Hola ${site.name}, necesito ayuda con mi estadía / reserva.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            WhatsApp
          </a>
          <Link
            href="/#preguntas-frecuentes"
            className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-semibold dark:border-zinc-600"
          >
            FAQ del sitio
          </Link>
          <Link
            href="/politicas"
            className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-semibold dark:border-zinc-600"
          >
            Políticas
          </Link>
        </div>
      </main>
      <GuestBottomNav />
    </>
  );
}
