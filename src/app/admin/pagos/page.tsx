"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { AdminAsyncState } from "@/components/admin/admin-async-state";
import { formatCOP } from "@/lib/pricing";

type Provider = { id: string; displayName: string; isStub: boolean };
type PaymentRow = {
  id: string;
  reservation_code: string;
  amount: number;
  amount_paid: number;
  status: string;
  provider: string;
  balance?: { total: number; paid: number; due: number };
};

export default function AdminPagosPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [defaultProvider, setDefault] = useState("stub");
  const [amount, setAmount] = useState(100000);
  const [code, setCode] = useState("LH-DEMO01");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payments");
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((d as { error?: string }).error ?? `Error ${res.status}`);
        return;
      }
      setProviders(d.providers ?? []);
      setDefault(d.default_provider ?? "stub");
      setPayments(d.payments ?? []);
    } catch {
      setError("No se pudo cargar pagos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createIntent(provider: string) {
    const res = await fetch("/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        amount,
        reservation_code: code.trim().toUpperCase() || "LH-DEMO01",
      }),
    });
    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
    await load();
  }

  async function markPaid(reservationCode: string) {
    await fetch("/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mark_paid: true,
        reservation_code: reservationCode,
      }),
    });
    await load();
  }

  return (
    <AdminShell>
      <div>
        <h1 className="font-display text-3xl tracking-wide">PAGOS</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Abstracción PaymentProvider. Default: {defaultProvider}. Secretos solo
          en servidor (.env) — nunca en el frontend.
        </p>
      </div>

      <AdminCard
        title="Saldos por reserva"
        subtitle="Payments pending creados al booking (stub local)"
      >
        <AdminAsyncState
          loading={loading}
          error={error}
          empty={!loading && !error && payments.length === 0}
          emptyMessage="Sin pagos locales. Crea una reserva o importa desde Canales."
          onRetry={() => void load()}
        >
          <ul className="space-y-2">
            {payments.map((p) => {
              const due = p.balance?.due ?? p.amount - p.amount_paid;
              const guestKey = encodeURIComponent(p.reservation_code);
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10"
                >
                  <div>
                    <p className="font-mono font-semibold">
                      {p.reservation_code}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {p.status} · {p.provider} · total {formatCOP(p.amount)} ·
                      saldo {formatCOP(due)}
                    </p>
                  </div>
                  <span className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/folio/${guestKey}`}
                      className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold"
                    >
                      Folio
                    </Link>
                    <Link
                      href={`/confirmacion/${guestKey}`}
                      className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold"
                    >
                      Ver pública
                    </Link>
                    {p.status !== "paid" ? (
                      <button
                        type="button"
                        onClick={() => void markPaid(p.reservation_code)}
                        className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900"
                      >
                        Marcar pagado
                      </button>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </AdminAsyncState>
      </AdminCard>

      <AdminCard title="Crear intent (stub)" subtitle="Sin cobro real">
        <label className="text-xs">
          Código reserva{" "}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="ml-2 rounded border border-zinc-300 px-2 py-1 font-mono"
          />
        </label>
        <label className="ml-4 text-xs">
          Monto COP{" "}
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="ml-2 rounded border border-zinc-300 px-2 py-1"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {providers.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => void createIntent(p.id)}
              className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold"
            >
              {p.displayName}
              {p.isStub ? " (stub)" : ""}
            </button>
          ))}
        </div>
        {result ? (
          <pre className="mt-4 max-h-64 overflow-auto text-xs">{result}</pre>
        ) : null}
      </AdminCard>
    </AdminShell>
  );
}
