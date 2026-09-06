import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="relative z-20 border-t border-black/10 bg-zinc-950 pb-28 pr-4 text-zinc-200 max-md:pr-[5rem] dark:border-white/10 md:pb-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 md:flex-row md:justify-between">
        <div className="max-w-md space-y-4">
          <p className="font-display text-3xl tracking-wide text-[#f2f0eb]">
            LOFTHOUSE 14
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            {site.brandLine.toUpperCase()}
          </p>
          <p className="text-sm leading-relaxed text-zinc-400">
            {site.addressLine} · {site.neighborhood} · {site.city}
          </p>
          <p className="text-sm text-zinc-400">
            <a
              className="font-medium text-[#f2f0eb] hover:underline"
              href={`tel:${site.phoneTel}`}
            >
              {site.phoneDisplay}
            </a>
          </p>
        </div>
        <div className="grid flex-1 gap-8 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Políticas
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <span className="font-semibold text-[#f2f0eb]">Check-in:</span>{" "}
                {site.checkIn}
              </li>
              <li>
                <span className="font-semibold text-[#f2f0eb]">Check-out:</span>{" "}
                {site.checkOut}
              </li>
              <li>
                <Link
                  href="/politicas"
                  className="text-amber-400 hover:underline"
                >
                  Ver todas las políticas →
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Contacto
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/#reservas"
                  className="text-amber-400 hover:underline"
                >
                  Configurar estadía
                </Link>
              </li>
              <li>
                <Link
                  href="/#galeria"
                  className="relative inline-block py-1 text-amber-400 hover:underline"
                >
                  Galería y redes
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="text-amber-400 hover:underline"
                >
                  {site.email}
                </a>
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
