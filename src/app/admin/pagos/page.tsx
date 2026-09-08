"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { AdminAsyncState } from "@/components/admin/admin-async-state";

type Provider = { id: string; displayName: string; isStub: boolean };

export default function AdminPagosPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [defaultProvider, setDefault] = useState("stub");
  const [amount, setAmount] = useState(100000);
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
        reservation_code: "LH-DEMO01",
      }),
    });
    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
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
      <AdminCard title="Crear intent (stub)" subtitle="Sin cobro real">
        <AdminAsyncState
          loading={loading}
          error={error}
          empty={!loading && !error && providers.length === 0}
          emptyMessage="Sin proveedores disponibles."
          onRetry={() => void load()}
        >
          <label className="text-xs">
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
        </AdminAsyncState>
      </AdminCard>
    </AdminShell>
  );
}
