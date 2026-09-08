"use client";

import { useEffect, useState } from "react";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";

type Adapter = { id: string; displayName: string; isStub: boolean };

export default function AdminCanalesPage() {
  const [adapters, setAdapters] = useState<Adapter[]>([]);
  const [logs, setLogs] = useState<unknown[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/channels");
    const data = await res.json();
    setAdapters(data.adapters ?? []);
    setLogs(data.logs ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function simulate(channel: string) {
    setMsg(null);
    const res = await fetch("/api/admin/channels/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel,
        action: "pull",
        idempotency_key: `ui-${channel}-${Date.now()}`,
      }),
    });
    const data = await res.json();
    setMsg(data.result?.message ?? data.note ?? "OK");
    await load();
  }

  return (
    <AdminShell>
      <div>
        <h1 className="font-display text-3xl tracking-wide">CANALES</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Channel manager — adapters stub. TODO: REAL INTEGRATION REQUIRED para
          OTAs.
        </p>
      </div>
      <AdminCard title="Adapters" subtitle="Simulador admin">
        <ul className="space-y-2">
          {adapters.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10"
            >
              <span>
                {a.displayName}{" "}
                {a.isStub ? (
                  <span className="text-xs text-amber-700">(stub)</span>
                ) : (
                  <span className="text-xs text-emerald-700">(live/local)</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => void simulate(a.id)}
                className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold"
              >
                Simular sync
              </button>
            </li>
          ))}
        </ul>
        {msg ? <p className="mt-3 text-xs text-zinc-600">{msg}</p> : null}
      </AdminCard>
      <AdminCard title="Últimos logs" subtitle="channel_sync_logs">
        <pre className="max-h-64 overflow-auto text-xs">
          {JSON.stringify(logs, null, 2)}
        </pre>
      </AdminCard>
    </AdminShell>
  );
}
