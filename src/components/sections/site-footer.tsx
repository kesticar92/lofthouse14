import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-zinc-950 text-zinc-200 dark:border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 md:flex-row md:justify-between">
        <div className="max-w-md space-y-3">
          <p className="font-serif text-xl font-semibold text-white">
            {site.name}
          </p>
          <p className="text-sm leading-relaxed text-zinc-400">
            {site.neighborhood} · {site.city}. Reservas directas, sin comisiones
            de intermediarios.
          </p>
        </div>
        <div className="grid flex-1 gap-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Políticas
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <span className="font-semibold text-white">Check-in:</span>{" "}
                {site.checkIn}
              </li>
              <li>
                <span className="font-semibold text-white">Check-out:</span>{" "}
                {site.checkOut}
              </li>
              <li className="text-zinc-400">
                Consulta condiciones completas al reservar.
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              OTAs (referencia)
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="#otas"
                  className="text-amber-400 hover:underline"
                >
                  Ver enlaces Booking + Airbnb
                </Link>
              </li>
              <li>
                <Link
                  href={site.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline"
                >
                  Booking.com (directo)
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} {site.name}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
