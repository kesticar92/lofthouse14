"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { AdminAsyncState } from "@/components/admin/admin-async-state";
import { formatCOP } from "@/lib/pricing";

type Guest = {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  notes?: string;
};

type Stay = {
  reservation_code: string;
  check_in: string;
  check_out: string;
  status: string;
  payment_status: string;
  price: number | null;
  source: string;
};

export default function AdminCrmGuestPage() {
  const params = useParams<{ guestId: string }>();
  const guestId = decodeURIComponent(params.guestId ?? "");
  const [guest, setGuest] = useState<Guest | null>(null);
  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/crm/guests/${encodeURIComponent(guestId)}`,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? `Error ${res.status}`);
        return;
      }
      setGuest(data.guest ?? null);
      setStays(data.stays ?? []);
    } catch {
      setError("No se pudo cargar la ficha.");
    } finally {
      setLoading(false);
    }
  }, [guestId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            CRM · Ficha huésped
          </p>
          <h1 className="font-display text-3xl tracking-wide">
            {guest?.full_name || guestId || "Huésped"}
          </h1>
        </div>
        <Link
          href="/admin/crm"
          className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold"
        >
          ← Volver CRM
        </Link>
      </div>

      <AdminAsyncState
        loading={loading}
        error={error}
        empty={!loading && !error && !guest}
        emptyMessage="Huésped no encontrado."
        onRetry={() => void load()}
      >
        <AdminCard title="Perfil">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wider text-zinc-500">
                Email
              </dt>
              <dd>{guest?.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-zinc-500">
                Teléfono
              </dt>
              <dd>{guest?.phone || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wider text-zinc-500">
                Notas
              </dt>
              <dd>{guest?.notes || "Sin notas"}</dd>
            </div>
          </dl>
        </AdminCard>

        <AdminCard title="Historial de reservas" subtitle="Desde store local / CRM">
          {stays.length === 0 ? (
            <p className="text-sm text-zinc-500">Sin estancias vinculadas.</p>
          ) : (
            <ul className="space-y-2">
              {stays.map((s) => (
                <li
                  key={s.reservation_code}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10"
                >
                  <div>
                    <p className="font-mono font-semibold">
                      {s.reservation_code}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {s.check_in} → {s.check_out} · {s.status} · pago{" "}
                      {s.payment_status}
                      {s.price != null ? ` · ${formatCOP(s.price)}` : ""} ·{" "}
                      {s.source}
                    </p>
                  </div>
                  <Link
                    href={`/admin/pagos`}
                    className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold"
                  >
                    Ver saldo
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </AdminAsyncState>
    </AdminShell>
  );
}
