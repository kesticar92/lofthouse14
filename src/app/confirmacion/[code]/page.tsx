"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { site, waLink } from "@/lib/site";
import { formatCOP } from "@/lib/pricing";

type Reservation = {
  reservation_code?: string;
  guest_name?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  price?: number | null;
  status?: string;
  payment_status?: string;
};

function ConfirmacionInner() {
  const params = useParams<{ code: string }>();
  const search = useSearchParams();
  const code = decodeURIComponent(params.code ?? "").toUpperCase();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/public/booking/${encodeURIComponent(code)}`,
        );
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "No encontrada");
          return;
        }
        setReservation(data.reservation);
        setMode(data.mode ?? "");
        if (search.get("wa") === "1" && data.reservation) {
          const r = data.reservation as Reservation;
          const lines = [
            `Hola ${site.name}, confirmo mi reserva ${r.reservation_code}:`,
            `Nombre: ${r.guest_name ?? ""}`,
            `Fechas: ${r.check_in} → ${r.check_out}`,
            `Huéspedes: ${r.guests ?? ""}`,
            r.price != null ? `Total estimado: ${formatCOP(r.price)}` : "",
          ].filter(Boolean);
          window.open(waLink(lines.join("\n")), "_blank", "noopener");
        }
      } catch {
        if (!cancelled) setError("Error de red");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, search]);

  return (
    <main className="mx-auto min-h-[70vh] max-w-lg px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {site.name}
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight text-zinc-900 dark:text-zinc-100">
        Confirmación
      </h1>
      {error ? (
        <p className="mt-6 text-sm text-red-700">{error}</p>
      ) : !reservation ? (
        <p className="mt-6 text-sm text-zinc-600">Cargando reserva…</p>
      ) : (
        <div className="mt-8 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
          <p>
            Código:{" "}
            <strong className="font-mono text-lg text-zinc-900 dark:text-white">
              {reservation.reservation_code}
            </strong>
          </p>
          <p>Huésped: {reservation.guest_name}</p>
          <p>
            Fechas: {reservation.check_in} → {reservation.check_out}
          </p>
          <p>Huéspedes: {reservation.guests}</p>
          <p>Estado: {reservation.status}</p>
          <p>Pago: {reservation.payment_status}</p>
          {reservation.price != null ? (
            <p>Total estimado: {formatCOP(reservation.price)}</p>
          ) : null}
          {mode === "local" ? (
            <p className="rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Modo local/mock — la reserva vive en memoria del servidor hasta
              aplicar migraciones Supabase 021–022.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3 pt-4">
            <Link
              href="/mi-reserva"
              className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold"
            >
              Consultar otra reserva
            </Link>
            <Link
              href="/"
              className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-4 py-16 text-sm">Cargando…</main>
      }
    >
      <ConfirmacionInner />
    </Suspense>
  );
}
