"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { AdminAsyncState } from "@/components/admin/admin-async-state";

export default function AdminCrmPage() {
  const [guests, setGuests] = useState<unknown[]>([]);
  const [templates, setTemplates] = useState<unknown[]>([]);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [gRes, tRes] = await Promise.all([
        fetch("/api/admin/crm/guests"),
        fetch("/api/admin/crm/templates"),
      ]);
      const g = await gRes.json().catch(() => ({}));
      const t = await tRes.json().catch(() => ({}));
      if (!gRes.ok && !tRes.ok) {
        setError(
          (g as { error?: string }).error ??
            (t as { error?: string }).error ??
            "Error al cargar CRM",
        );
        return;
      }
      setGuests(g.guests ?? []);
      setTemplates(t.templates ?? []);
    } catch {
      setError("No se pudo cargar CRM.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function previewTemplate() {
    const res = await fetch("/api/admin/crm/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: "booking_confirmation",
        variables: {
          guest_name: "Ana",
          reservation_code: "LH-TEST01",
          check_in: "2026-10-01",
          check_out: "2026-10-03",
          total: "$270.000",
        },
      }),
    });
    const data = await res.json();
    setPreview(data.rendered ?? "");
  }

  async function fireAutomation() {
    await fetch("/api/admin/crm/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "booking_confirmed",
        payload: { demo: true },
      }),
    });
    alert("Automation stub registrado (sin envío real)");
  }

  return (
    <AdminShell>
      <div>
        <h1 className="font-display text-3xl tracking-wide">CRM</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Perfiles, templates con variables y automations stub.
        </p>
      </div>
      <AdminCard title="Huéspedes" subtitle="Historial / perfiles">
        <AdminAsyncState
          loading={loading}
          error={error}
          empty={!loading && !error && guests.length === 0}
          emptyMessage="Sin huéspedes todavía (aparecen al crear reservas con email)."
          onRetry={() => void load()}
        >
          <pre className="max-h-48 overflow-auto text-xs">
            {JSON.stringify(guests, null, 2)}
          </pre>
        </AdminAsyncState>
      </AdminCard>
      <AdminCard title="Templates" subtitle="Preview variables">
        <button
          type="button"
          onClick={() => void previewTemplate()}
          className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold"
        >
          Preview confirmación
        </button>
        {preview ? (
          <p className="mt-3 whitespace-pre-wrap text-sm">{preview}</p>
        ) : null}
        <AdminAsyncState
          loading={loading}
          empty={!loading && templates.length === 0}
          emptyMessage="Sin templates en DB — el preview usa seed en memoria."
        >
          <ul className="mt-3 list-disc pl-5 text-xs text-zinc-600">
            {(templates as { code?: string; name?: string }[]).map((t, i) => (
              <li key={t.code ?? i}>
                {t.name} ({t.code})
              </li>
            ))}
          </ul>
        </AdminAsyncState>
      </AdminCard>
      <AdminCard title="Automations" subtitle="Event stubs">
        <button
          type="button"
          onClick={() => void fireAutomation()}
          className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900"
        >
          Disparar stub booking_confirmed
        </button>
      </AdminCard>
    </AdminShell>
  );
}
