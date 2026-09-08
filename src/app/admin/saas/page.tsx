"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { AdminAsyncState } from "@/components/admin/admin-async-state";

type Flags = Record<string, boolean>;

export default function AdminSaasPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flags, setFlags] = useState<Flags>({});
  const [meta, setMeta] = useState<{
    organization_name?: string;
    source?: string;
    note?: string;
    plans?: Array<{ plan_id: string; label: string }>;
  }>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/saas/flags");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? `Error ${res.status}`);
        return;
      }
      setFlags(data.module_flags ?? {});
      setMeta({
        organization_name: data.organization_name,
        source: data.source,
        note: data.note,
        plans: data.plans,
      });
    } catch {
      setError("No se pudieron cargar module_flags.");
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
        <h1 className="font-display text-3xl tracking-wide">SAAS / FLAGS</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Module flags read-only · {meta.organization_name ?? "org"} · source{" "}
          {meta.source ?? "—"}
        </p>
      </div>
      <AdminCard title="module_flags" subtitle="Solo lectura — ver ONBOARDING-SAAS">
        <AdminAsyncState
          loading={loading}
          error={error}
          empty={!loading && !error && Object.keys(flags).length === 0}
          emptyMessage="Sin flags."
          onRetry={() => void load()}
        >
          <ul className="space-y-2 text-sm">
            {Object.entries(flags).map(([k, v]) => (
              <li
                key={k}
                className="flex items-center justify-between rounded border border-black/10 px-3 py-2 dark:border-white/10"
              >
                <span className="font-mono text-xs">{k}</span>
                <span
                  className={
                    v
                      ? "text-xs font-semibold text-emerald-700"
                      : "text-xs font-semibold text-zinc-500"
                  }
                >
                  {v ? "ON" : "OFF"}
                </span>
              </li>
            ))}
          </ul>
          {meta.note ? (
            <p className="mt-3 text-xs text-zinc-500">{meta.note}</p>
          ) : null}
        </AdminAsyncState>
      </AdminCard>
      <AdminCard title="Planes seed" subtitle="starter / ops / growth">
        <ul className="space-y-1 text-sm">
          {(meta.plans ?? []).map((p) => (
            <li key={p.plan_id} className="font-mono text-xs">
              {p.plan_id} — {p.label}
            </li>
          ))}
        </ul>
      </AdminCard>
    </AdminShell>
  );
}
