"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { AdminAsyncState } from "@/components/admin/admin-async-state";
import { formatCOP } from "@/lib/pricing";

type Coupon = {
  id: string;
  code: string;
  name: string;
  description: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  active: boolean;
  min_nights?: number | null;
  max_discount_cop?: number | null;
  valid_from?: string | null;
  valid_to?: string | null;
};

const emptyForm = {
  code: "",
  name: "",
  description: "",
  discount_type: "percent" as const,
  discount_value: 10,
  active: true,
  min_nights: 1,
  max_discount_cop: "" as string | number,
};

export default function AdminPromocionesPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/promotions");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? `Error ${res.status}`);
        return;
      }
      setCoupons(data.coupons ?? []);
    } catch {
      setError("No se pudieron cargar promociones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setMsg(null);
    const res = await fetch("/api/admin/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        max_discount_cop:
          form.max_discount_cop === ""
            ? null
            : Number(form.max_discount_cop),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg((data as { error?: string }).error ?? "Error");
      return;
    }
    setCoupons(data.coupons ?? []);
    setForm(emptyForm);
    setMsg("Guardado");
  }

  async function remove(code: string) {
    const res = await fetch("/api/admin/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, delete: true }),
    });
    const data = await res.json().catch(() => ({}));
    setCoupons(data.coupons ?? []);
  }

  return (
    <AdminShell>
      <div>
        <h1 className="font-display text-3xl tracking-wide">PROMOCIONES</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Cupones seed + CRUD local. Validación pública en booking quote.
        </p>
      </div>

      <AdminCard title="Cupones" subtitle="Activos e inactivos">
        <AdminAsyncState
          loading={loading}
          error={error}
          empty={!loading && !error && coupons.length === 0}
          emptyMessage="Sin cupones."
          onRetry={() => void load()}
        >
          <ul className="space-y-2">
            {coupons.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10"
              >
                <div>
                  <p className="font-mono font-semibold">{c.code}</p>
                  <p className="text-xs text-zinc-500">
                    {c.name} ·{" "}
                    {c.discount_type === "percent"
                      ? `${c.discount_value}%`
                      : formatCOP(c.discount_value)}
                    {c.max_discount_cop
                      ? ` · tope ${formatCOP(c.max_discount_cop)}`
                      : ""}
                    {c.min_nights ? ` · mín ${c.min_nights}n` : ""} ·{" "}
                    {c.active ? "activo" : "inactivo"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void remove(c.code)}
                  className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        </AdminAsyncState>
      </AdminCard>

      <AdminCard title="Nuevo / actualizar" subtitle="Upsert por código">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs">
            Código
            <input
              value={form.code}
              onChange={(e) =>
                setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
              }
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          <label className="text-xs">
            Nombre
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          <label className="text-xs sm:col-span-2">
            Descripción
            <input
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          <label className="text-xs">
            Tipo
            <select
              value={form.discount_type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  discount_type: e.target.value as "percent" | "fixed",
                }))
              }
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            >
              <option value="percent">Porcentaje</option>
              <option value="fixed">Fijo COP</option>
            </select>
          </label>
          <label className="text-xs">
            Valor
            <input
              type="number"
              value={form.discount_value}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  discount_value: Number(e.target.value),
                }))
              }
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          <label className="text-xs">
            Mín. noches
            <input
              type="number"
              value={form.min_nights}
              onChange={(e) =>
                setForm((f) => ({ ...f, min_nights: Number(e.target.value) }))
              }
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          <label className="text-xs">
            Tope COP (percent)
            <input
              value={form.max_discount_cop}
              onChange={(e) =>
                setForm((f) => ({ ...f, max_discount_cop: e.target.value }))
              }
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              placeholder="opcional"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void save()}
            className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900"
          >
            Guardar
          </button>
          {msg ? <span className="text-xs text-zinc-500">{msg}</span> : null}
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Prueba guest: cupón <code className="font-mono">BIENVENIDA10</code> en
          el resumen de /reservar.
        </p>
      </AdminCard>
    </AdminShell>
  );
}
