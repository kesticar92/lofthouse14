"use client";

import { useCallback, useEffect, useState } from "react";

type OrgRow = {
  id: string;
  slug: string;
  name: string;
  role?: string;
  status?: string;
};

/**
 * Switcher de organización (cookie `lh_active_org`).
 * Solo se muestra si hay más de una org o para dejar claro el tenant activo.
 */
export function OrgSwitcher() {
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/organizations", {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        active_organization_id?: string | null;
        organizations?: OrgRow[];
      };
      setOrgs(data.organizations ?? []);
      setActiveId(data.active_organization_id ?? "");
    } catch {
      /* silencioso: admin sigue usable */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (orgs.length === 0) return null;

  async function onChange(nextId: string) {
    if (!nextId || nextId === activeId) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_id: nextId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        setErr(body?.error?.message ?? "No se pudo cambiar de organización");
        return;
      }
      setActiveId(nextId);
      window.location.reload();
    } catch {
      setErr("Error de red al cambiar organización");
    } finally {
      setBusy(false);
    }
  }

  const active = orgs.find((o) => o.id === activeId) ?? orgs[0];

  return (
    <div className="hidden items-center gap-1.5 sm:flex">
      <label className="sr-only" htmlFor="org-switcher">
        Organización activa
      </label>
      {orgs.length === 1 ? (
        <span
          title={active?.slug}
          className="max-w-[140px] truncate rounded-full border border-black/10 bg-white/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300"
        >
          {active?.name ?? "Org"}
        </span>
      ) : (
        <select
          id="org-switcher"
          disabled={busy}
          value={activeId || orgs[0]!.id}
          onChange={(e) => void onChange(e.target.value)}
          className="max-w-[160px] rounded-full border border-black/10 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-zinc-800 dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-100"
        >
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      )}
      {err ? (
        <span className="max-w-[120px] truncate text-[10px] text-red-700 dark:text-red-400">
          {err}
        </span>
      ) : null}
    </div>
  );
}
