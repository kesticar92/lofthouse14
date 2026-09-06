import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { WaLink } from "@/components/layout/wa-link";

export const metadata: Metadata = {
  title: "Apartamento para nómadas digitales en Cali",
  description:
    "Lofts con WiFi en Miraflores, Cali, cerca del Parque del Perro. Cocina, A/C y check-in autónomo para estadías de trabajo remoto.",
  alternates: { canonical: "/hospedaje-nomadas-digitales-cali" },
};

export default function NomadasPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-44 md:px-8">
        <Breadcrumbs
          items={[
            { href: "/", label: "Inicio" },
            {
              href: "/hospedaje-nomadas-digitales-cali",
              label: "Nómadas digitales",
            },
          ]}
        />
        <h1 className="mt-4 font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-5xl">
          Apartamento para nómadas digitales en Cali
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
          WiFi, cocina, aire acondicionado e ingreso autónomo en Miraflores.
          Trabajas en el loft o en un café a pasos del Parque del Perro y
          vuelves a un espacio privado —no a un hostel. Tarifas semanales se
          cierran por WhatsApp según fechas.
        </p>
        <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
          Un loft suele bastar para una persona o pareja remota. Si cada quien
          necesita silencio total, reserva dos unidades en el mismo Lofthouse
          14. Dirección: Carrera 26 # 2-91, Cali.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/lofts"
            className="rounded-full bg-amber-600 px-6 py-3 text-sm font-bold text-white"
          >
            Ver lofts
          </Link>
          <WaLink
            placement="landing-nomadas"
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-bold dark:border-zinc-600"
          >
            Consultar estadía larga
          </WaLink>
        </div>
      </div>
    </PublicShell>
  );
}
