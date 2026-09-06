import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { WaLink } from "@/components/layout/wa-link";

export const metadata: Metadata = {
  title: "Hospedaje médico en Cali cerca de clínicas",
  description:
    "Lofts en Miraflores y San Fernando para pacientes y acompañantes. Cocina, nevera, WiFi y check-in autónomo cerca de clínicas en Cali.",
  alternates: { canonical: "/hospedaje-medico-cali" },
};

export default function MedicoPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-44 md:px-8">
        <Breadcrumbs
          items={[
            { href: "/", label: "Inicio" },
            { href: "/hospedaje-medico-cali", label: "Turismo médico" },
          ]}
        />
        <h1 className="mt-4 font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-5xl">
          Hospedaje médico en Cali, cerca de clínicas de San Fernando
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
          Un loft privado es más práctico que un hotel cuando hay citas,
          acompañantes y la necesidad de nevera o cocina. Estamos en Miraflores,
          a un trayecto corto de clínicas y consultorios de San Fernando, con
          farmacias y supermercados en el barrio.
        </p>
        <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
          Check-in autónomo para llegar a la hora de tu vuelo o tu consulta.
          Estadías de varias noches o semanas se cotizan por WhatsApp. Si viene
          familia extra, asignamos lofts adicionales en el mismo edificio.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/reservas"
            className="rounded-full bg-amber-600 px-6 py-3 text-sm font-bold text-white"
          >
            Ver disponibilidad
          </Link>
          <WaLink
            placement="landing-medico"
            message="Hola, necesito hospedaje cerca de clínicas en Cali."
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-bold dark:border-zinc-600"
          >
            Escribir por WhatsApp
          </WaLink>
        </div>
      </div>
    </PublicShell>
  );
}
