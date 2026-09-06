import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { WaLink } from "@/components/layout/wa-link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Alojamiento para grupos en Cali · Hasta 63 personas",
  description:
    "Aloja a tu grupo completo en Cali. Hasta 63 personas en lofts privados en Miraflores. Coordinación incluida, precio por loft. Cotiza por WhatsApp.",
  alternates: { canonical: "/alojamiento-grupos-cali" },
};

export default function GruposPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-28 md:px-8">
        <Breadcrumbs
          items={[
            { href: "/", label: "Inicio" },
            { href: "/alojamiento-grupos-cali", label: "Grupos" },
          ]}
        />
        <h1 className="mt-4 font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-5xl">
          Alojamiento para grupos en Cali — hasta {site.maxGuests} personas
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
          Familias grandes, delegaciones, equipos y recuas de salsa se hospedan
          en varios lofts privados del mismo edificio en Miraflores, a pasos del
          Parque del Perro. Cada unidad tiene baño, cocina y A/C; el grupo
          comparte barrio sin perder privacidad.
        </p>
        <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
          El precio se arma por loft (desde $90.000 COP/noche en temporada baja)
          más aseo y huéspedes extra. Un solo interlocutor por WhatsApp coordina
          fechas, check-in autónomo y verificación de identidad. No operamos
          fiestas en el inmueble.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/lofts/casa-entera-grupos-cali"
            className="rounded-full bg-amber-600 px-6 py-3 text-sm font-bold text-white"
          >
            Ver casa entera
          </Link>
          <WaLink
            placement="landing-grupos"
            message="Hola, viajamos en grupo y queremos cotizar varios lofts en Lofthouse 14."
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-bold dark:border-zinc-600"
          >
            Cotizar por WhatsApp
          </WaLink>
        </div>
      </div>
    </PublicShell>
  );
}
