"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { AdminAsyncState } from "@/components/admin/admin-async-state";
import { formatCOP } from "@/lib/pricing";

type FolioRow = {
  reservation_code: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  nights: number;
  balance: { charges_total: number; payments_total: number; balance: number };
};

export default function AdminFoliosPage() {
  const [folios, setFolios] = useState<FolioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/folio");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? `Error ${res.status}`);
        return;
      }
      setFolios(data.folios ?? []);
    } catch {
      setError("No se pudieron cargar folios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminShell>
      <div>
        <h1 className="font-display text-3xl tracking-wide">FOLIOS</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Cuenta de huésped por reserva: noches, extras, pagos y saldo (stub
          local — sin facturación electrónica).
        </p>
      </div>

      <AdminCard title="Abrir folio" subtitle="Por código de reserva">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const c = code.trim().toUpperCase();
            if (c) window.location.assign(`/admin/folio/${encodeURIComponent(c)}`);
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="LH-XXXXXX"
            className="rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900"
          >
            Abrir
          </button>
        </form>
      </AdminCard>

      <AdminCard title="Cuentas recientes" subtitle="Store local">
        <AdminAsyncState
          loading={loading}
          error={error}
          empty={!loading && !error && folios.length === 0}
          emptyMessage="Sin folios. Crea una reserva o importa desde Canales."
          onRetry={() => void load()}
        >
          <ul className="space-y-2">
            {folios.map((f) => (
              <li
                key={f.reservation_code}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10"
              >
                <div>
                  <p className="font-mono font-semibold">{f.reservation_code}</p>
                  <p className="text-xs text-zinc-500">
                    {f.guest_name} · {f.check_in} → {f.check_out} · {f.nights}{" "}
                    noche(s) · saldo {formatCOP(f.balance.balance)}
                  </p>
                </div>
                <Link
                  href={`/admin/folio/${encodeURIComponent(f.reservation_code)}`}
                  className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold"
                >
                  Ver folio
                </Link>
              </li>
            ))}
          </ul>
        </AdminAsyncState>
      </AdminCard>
    </AdminShell>
  );
}
