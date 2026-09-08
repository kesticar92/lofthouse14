"use client";

import { useEffect, useState } from "react";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<{
    metrics?: Record<string, number | string>;
    recommendations?: Array<{ title: string; suggestedAction: string }>;
    ai?: { message: string; ok: boolean };
  } | null>(null);

  useEffect(() => {
    void fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide">ANALYTICS</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Reportes, recomendaciones de revenue (sin auto-apply) y AI stub.
          </p>
        </div>
        <a
          href="/api/admin/analytics?format=csv"
          className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold"
        >
          Export CSV
        </a>
      </div>
      <AdminCard title="Métricas" subtitle="Ocupación / ADR / RevPAR">
        <pre className="text-xs">{JSON.stringify(data?.metrics ?? {}, null, 2)}</pre>
      </AdminCard>
      <AdminCard title="Revenue recommendations" subtitle="autoApply=false">
        <ul className="space-y-2 text-sm">
          {(data?.recommendations ?? []).map((r, i) => (
            <li key={i} className="rounded border border-black/10 p-2 dark:border-white/10">
              <strong>{r.title}</strong>
              <p className="text-xs text-zinc-600">{r.suggestedAction}</p>
            </li>
          ))}
        </ul>
      </AdminCard>
      <AdminCard title="AI assistant" subtitle="Requires LLM key">
        <p className="text-sm text-zinc-700">{data?.ai?.message}</p>
      </AdminCard>
    </AdminShell>
  );
}
