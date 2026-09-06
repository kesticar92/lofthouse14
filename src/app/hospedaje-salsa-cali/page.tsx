import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { WaLink } from "@/components/layout/wa-link";
import { site } from "@/lib/site";
import { formatCOP } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Loft para bailarines de salsa en Cali · Miraflores",
  description:
    "Hospedaje cerca de academias y rumba de salsa en Cali. Lofts en Miraflores junto al Parque del Perro, con A/C, ducha y check-in autónomo. Reserva directo.",
  alternates: { canonical: "/hospedaje-salsa-cali" },
};

export default function SalsaLandingPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-44 md:px-8">
        <Breadcrumbs
          items={[
            { href: "/", label: "Inicio" },
            { href: "/hospedaje-salsa-cali", label: "Salsa" },
          ]}
        />
        <h1 className="mt-4 font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-5xl">
          Loft para bailarines de salsa en Cali — Miraflores
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
          Si vienes a Cali por salsa, necesitas un loft silencioso para dormir de
          día, ducha caliente y aire acondicionado cerca del Parque del Perro.
          Lofthouse 14 está en Miraflores: academias, bares y rumba a distancia
          caminable, sin hostel compartido.
        </p>
        <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
          Cada loft es privado (ideal 2 personas, hasta 5). WiFi para clases
          virtuales, cocina para comer a deshoras y check-in autónomo cuando tu
          vuelo no coincide con recepción. Desde {formatCOP(site.priceFromCop)}
          /noche en temporada baja. Parejas de baile y teams pueden tomar lofts
          contiguos en el mismo edificio.
        </p>
        <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
          No operamos fiestas dentro del inmueble: el loft es tu base para
          ensayar y descansar; la salsa vive en la calle y en las academias del
          barrio. Dirección: {site.addressLine}, Miraflores, Cali. WhatsApp{" "}
          {site.phoneDisplay}.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/reservas"
            className="rounded-full bg-amber-600 px-6 py-3 text-sm font-bold text-white"
          >
            Ver disponibilidad
          </Link>
          <WaLink
            placement="landing-salsa"
            message="Hola, vengo a Cali por salsa y quiero reservar un loft en Lofthouse 14."
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-bold dark:border-zinc-600"
          >
            WhatsApp
          </WaLink>
          <Link
            href="/lofts"
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-bold dark:border-zinc-600"
          >
            Ver lofts
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
