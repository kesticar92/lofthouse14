import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Gallery } from "@/components/sections/gallery";
import { SocialWall } from "@/components/sections/socialWall";

export const metadata: Metadata = {
  title: "Galería de lofts en Cali Miraflores",
  description:
    "Fotos de los lofts Lofthouse 14 en Miraflores, Cali: fachada, cocina, habitaciones y zona del Parque del Perro.",
  alternates: { canonical: "/galeria" },
};

export default function GaleriaPage() {
  return (
    <PublicShell>
      <div className="pt-40">
        <div className="px-4 pb-6 text-center md:px-20">
          <Link
            href="/reservas"
            className="text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400"
          >
            ← Ver disponibilidad y reservar
          </Link>
        </div>
        <Gallery />
        <SocialWall />
      </div>
    </PublicShell>
  );
}
