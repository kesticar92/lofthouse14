import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicShell } from "@/components/layout/public-shell";
import { GuidedReservationFromQuery } from "@/components/sections/guided-reservation-from-query";

export const metadata: Metadata = {
  title: "Reservar loft en Cali Miraflores",
  description:
    "Elige fechas y huéspedes para ver disponibilidad de lofts en Lofthouse 14, Miraflores, Cali. Precio estimado y reserva por WhatsApp.",
  alternates: { canonical: "/reservas" },
};

export default function ReservasPage() {
  return (
    <PublicShell>
      <div className="pt-16">
        <Suspense
          fallback={
            <div className="px-4 py-24 text-center text-zinc-500">
              Cargando reservas…
            </div>
          }
        >
          <GuidedReservationFromQuery />
        </Suspense>
      </div>
    </PublicShell>
  );
}
