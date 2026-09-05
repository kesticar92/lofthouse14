import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/public-shell";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/layout/json-ld";
import { Location } from "@/components/sections/location";
import { breadcrumbJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Ubicación en Miraflores, Cali — Parque del Perro",
  description: `Lofthouse 14 está en ${site.addressLine}, Miraflores, Cali, a pasos del Parque del Perro y San Fernando. Mapa, gastronomía y cómo llegar.`,
  alternates: { canonical: "/ubicacion-miraflores-cali" },
};

export default function UbicacionPage() {
  return (
    <PublicShell>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Ubicación", path: "/ubicacion-miraflores-cali" },
        ])}
      />
      <div className="mx-auto max-w-4xl px-4 pt-28 md:px-8">
        <Breadcrumbs
          items={[
            { href: "/", label: "Inicio" },
            { href: "/ubicacion-miraflores-cali", label: "Ubicación" },
          ]}
        />
        <h1 className="mt-4 font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-5xl">
          Ubicación — Barrio Miraflores, Cali
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
          {site.addressLine}, Miraflores — Parque del Perro, Cali, Valle del
          Cauca, Colombia. Lofts a distancia caminable de restaurantes, salsa,
          farmacias y clínicas de San Fernando. Ideal si buscas hospedaje cerca
          del Parque del Perro sin un hotel genérico.
        </p>
      </div>
      <Location />
    </PublicShell>
  );
}
