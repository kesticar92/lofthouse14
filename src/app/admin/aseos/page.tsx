"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { useToast } from "@/components/ui";
import { fetchAdminSession } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import type {
  CleaningPricing,
  CleaningStaff,
  CleaningSummary,
  CleaningTask,
} from "@/features/aseos/types";
import { TasksTab } from "@/features/aseos/components/tasks-tab";
import { SummaryTab } from "@/features/aseos/components/summary-tab";
import { PricingTab } from "@/features/aseos/components/pricing-tab";
import { useRequireAdminModule } from "@/hooks/useRequireAdminModule";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const TAB = ["lista", "resumen", "tarifas"] as const;
type Tab = (typeof TAB)[number];

export default function AseosPage() {
  const { ready } = useRequireAdminModule();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("lista");
  const [fecha, setFecha] = useState("");
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [summary, setSummary] = useState<CleaningSummary | null>(null);
  const [staff, setStaff] = useState<CleaningStaff[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [pricing, setPricing] = useState<CleaningPricing | null>(null);
  const [loading, setLoading] = useState(true);

  const [manualPid, setManualPid] = useState("");
  const [manualDate, setManualDate] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [manualGuests, setManualGuests] = useState("2");
  const [myRole, setMyRole] = useState("");

  useEffect(() => {
    void (async () => {
      const s = await fetchAdminSession();
      setMyRole(s?.role ?? "");
    })();
  }, []);

  const isSupervisor = myRole === "admin" || myRole === "super_admin";

  const loadTasks = useCallback(async (date: string) => {
    const res = await fetch(
      `/api/admin/cleaning-tasks?date=${encodeURIComponent(date)}`,
      { credentials: "include" },
    );
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? res.statusText);
    setTasks(j.tasks ?? []);
  }, []);

  const loadSummary = useCallback(async (date: string) => {
    const month = date.slice(0, 7);
    const res = await fetch(
      `/api/admin/cleaning-summary?date=${encodeURIComponent(date)}&month=${encodeURIComponent(month)}`,
      { credentials: "include" },
    );
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? res.statusText);
    setSummary(j);
  }, []);

  const loadPricing = useCallback(async () => {
    const res = await fetch("/api/admin/app-settings/cleaning", {
      credentials: "include",
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? res.statusText);
    setPricing(j.pricing);
  }, []);

  const refreshAll = useCallback(async () => {
    const d = fecha || todayISO();
    setLoading(true);
    try {
      await Promise.all([loadTasks(d), loadSummary(d), loadPricing()]);
      const [rs, rp] = await Promise.all([
        fetch("/api/admin/staff-directory", { credentials: "include" }),
        fetch("/api/admin/pms/properties", { credentials: "include" }),
      ]);
      const sj = await rs.json();
      const pj = await rp.json();
      if (rs.ok) setStaff(sj.staff ?? []);
      if (rp.ok) setProperties(pj.properties ?? []);
    } catch (e) {
      toast.error("No se pudo cargar la información", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  }, [fecha, loadTasks, loadSummary, loadPricing, toast]);

  useEffect(() => {
    const d = todayISO();
    setFecha(d);
    setManualDate(d);
  }, []);

  useEffect(() => {
    if (!fecha) return;
    void refreshAll();
  }, [fecha, refreshAll]);

  async function patchTask(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/admin/cleaning-tasks/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const j = await res.json();
    if (!res.ok) {
      toast.error("No se pudo actualizar la tarea", {
        description: j.error ?? res.statusText,
      });
      return;
    }
    toast.success("Tarea actualizada.");
    await refreshAll();
  }

  async function savePricing() {
    if (!pricing) return;
    const res = await fetch("/api/admin/app-settings/cleaning", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pricing),
    });
    const j = await res.json();
    if (!res.ok) {
      toast.error("No se pudieron guardar las tarifas", {
        description: j.error ?? res.statusText,
      });
      return;
    }
    setPricing(j.pricing);
    toast.success("Tarifas guardadas.", {
      description: "Las nuevas reservas usarán estos valores.",
    });
    await refreshAll();
  }

  async function addManual() {
    const res = await fetch("/api/admin/cleaning-tasks", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        property_id: manualPid,
        task_date: manualDate,
        notes: manualNotes,
        guests: Number(manualGuests) || 1,
      }),
    });
    const j = await res.json();
    if (!res.ok) {
      toast.error("No se pudo crear la tarea manual", {
        description: j.error ?? res.statusText,
      });
      return;
    }
    setManualNotes("");
    toast.success("Tarea manual creada.");
    await refreshAll();
  }

  if (!ready) {
    return (
      <AdminShell>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Cargando…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-wide sm:text-4xl">
              Operación de aseo
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
              Tareas generadas desde <strong>reservas confirmadas</strong>:
              limpieza el día del check-out y preparación el día del check-in.{" "}
              <Link
                href="/admin/reservas"
                className="font-semibold text-amber-900 underline dark:text-amber-400"
              >
                Ver calendario central
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {TAB.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition",
                tab === t
                  ? "bg-zinc-900 text-white dark:bg-amber-500 dark:text-zinc-900"
                  : "border border-black/10 bg-white/70 dark:border-white/10 dark:bg-zinc-900/60",
              )}
            >
              {t === "lista"
                ? "Tareas del día"
                : t === "resumen"
                  ? "Resumen"
                  : "Tarifas aseo"}
            </button>
          ))}
        </div>

        {tab === "lista" && (
          <TasksTab
            fecha={fecha}
            onFechaChange={setFecha}
            summary={summary}
            loading={loading}
            tasks={tasks}
            properties={properties}
            staff={staff}
            isSupervisor={isSupervisor}
            pricing={pricing}
            manualPid={manualPid}
            setManualPid={setManualPid}
            manualDate={manualDate}
            setManualDate={setManualDate}
            manualGuests={manualGuests}
            setManualGuests={setManualGuests}
            manualNotes={manualNotes}
            setManualNotes={setManualNotes}
            onAddManual={() => void addManual()}
            onPatchTask={(id, patch) => void patchTask(id, patch)}
          />
        )}

        {tab === "resumen" && (
          <SummaryTab
            fecha={fecha}
            onFechaChange={setFecha}
            loading={loading}
            summary={summary}
          />
        )}

        {tab === "tarifas" && (
          <PricingTab
            pricing={pricing}
            isSupervisor={isSupervisor}
            onChange={setPricing}
            onSubmit={() => void savePricing()}
          />
        )}
      </div>
    </AdminShell>
  );
}
