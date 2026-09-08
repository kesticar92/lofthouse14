"use client";

import { useEffect, useState } from "react";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";

type Provider = { id: string; displayName: string; isStub: boolean };

export default function AdminPagosPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [defaultProvider, setDefault] = useState("stub");
  const [amount, setAmount] = useState(100000);
  const [result, setResult] = useState<string>("");

  useEffect(() => {
    void fetch("/api/admin/payments")
      .then((r) => r.json())
      .then((d) => {
        setProviders(d.providers ?? []);
        setDefault(d.default_provider ?? "stub");
      });
  }, []);

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
      </AdminCard>
    </AdminShell>
  );
}
