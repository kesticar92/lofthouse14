"use client";

import { useEffect, useState } from "react";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";

export default function AdminCrmPage() {
  const [guests, setGuests] = useState<unknown[]>([]);
  const [templates, setTemplates] = useState<unknown[]>([]);
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    void (async () => {
      const [g, t] = await Promise.all([
        fetch("/api/admin/crm/guests").then((r) => r.json()),
        fetch("/api/admin/crm/templates").then((r) => r.json()),
      ]);
      setGuests(g.guests ?? []);
      setTemplates(t.templates ?? []);
    })();
  }, []);

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
        <pre className="max-h-48 overflow-auto text-xs">
          {JSON.stringify(guests, null, 2)}
        </pre>
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
        <ul className="mt-3 list-disc pl-5 text-xs text-zinc-600">
          {(templates as { code?: string; name?: string }[]).map((t, i) => (
            <li key={t.code ?? i}>
              {t.name} ({t.code})
            </li>
          ))}
        </ul>
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
