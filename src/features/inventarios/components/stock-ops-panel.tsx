"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminCard } from "@/components/admin/admin-shell";

type StockItem = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  qty_on_hand: number;
  reorder_point: number;
};

type PurchaseOrder = {
  id: string;
  code: string;
  status: string;
  supplier: string;
  lines: Array<{ sku: string; name: string; qty: number }>;
};

type Movement = {
  id: string;
  item_id: string;
  delta: number;
  reason: string;
  created_at: string;
};

export function StockOpsPanel() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [low, setLow] = useState<StockItem[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deltaById, setDeltaById] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/admin/inventory/stock", {
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((json as { error?: string }).error ?? `Error ${res.status}`);
        return;
      }
      setItems((json as { items: StockItem[] }).items ?? []);
      setLow((json as { low_stock: StockItem[] }).low_stock ?? []);
      setPos((json as { purchase_orders: PurchaseOrder[] }).purchase_orders ?? []);
      setMovements((json as { movements: Movement[] }).movements ?? []);
    } catch {
      setErr("No se pudo cargar stock.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function move(itemId: string) {
    setBusy(true);
    setMsg(null);
    setErr(null);
    const delta = Number(deltaById[itemId] ?? "-1");
    try {
      const res = await fetch("/api/admin/inventory/stock", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "move",
          item_id: itemId,
          delta,
          reason: "ajuste UI",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((json as { error?: string }).error ?? "Error");
        return;
      }
      setMsg(
        (json as { low_stock_alert?: boolean }).low_stock_alert
          ? "Movimiento OK · alerta low stock enviada"
          : "Movimiento OK",
      );
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function createPo() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/inventory/stock", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_po" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((json as { error?: string }).error ?? "Error");
        return;
      }
      setMsg(
        `PO ${(json as { purchase_order?: { code?: string } }).purchase_order?.code ?? ""} creada (draft)`,
      );
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminCard
      title="Stock & compras"
      subtitle="Movimientos locales · low stock → notification · PO mínima"
      actions={
        <button
          type="button"
          disabled={busy}
          onClick={() => void createPo()}
          className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider disabled:opacity-50 dark:border-white/10"
        >
          Nueva PO draft
        </button>
      }
    >
      {msg ? (
        <p className="mb-2 text-xs text-emerald-800 dark:text-emerald-200">{msg}</p>
      ) : null}
      {err ? (
        <p className="mb-2 text-xs text-red-700">{err}</p>
      ) : null}
      {low.length > 0 ? (
        <p className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
          Low stock: {low.map((i) => i.sku).join(", ")}
        </p>
      ) : (
        <p className="mb-3 text-xs text-zinc-500">Sin alertas low stock.</p>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="py-2 pr-3">SKU</th>
              <th className="py-2 pr-3">Ítem</th>
              <th className="py-2 pr-3">Qty</th>
              <th className="py-2 pr-3">Reorder</th>
              <th className="py-2">Ajuste</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr
                key={i.id}
                className="border-b border-zinc-100 dark:border-zinc-800"
              >
                <td className="py-2 pr-3 font-mono">{i.sku}</td>
                <td className="py-2 pr-3">{i.name}</td>
                <td className="py-2 pr-3">
                  {i.qty_on_hand} {i.unit}
                </td>
                <td className="py-2 pr-3">{i.reorder_point}</td>
                <td className="py-2">
                  <div className="flex items-center gap-1">
                    <input
                      className="w-16 rounded border border-zinc-300 px-1 py-0.5 dark:border-zinc-600 dark:bg-zinc-950"
                      value={deltaById[i.id] ?? "-1"}
                      onChange={(e) =>
                        setDeltaById((m) => ({ ...m, [i.id]: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void move(i.id)}
                      className="rounded-full bg-zinc-900 px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
                    >
                      OK
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            POs
          </p>
          <ul className="mt-1 space-y-1 text-xs">
            {pos.map((p) => (
              <li key={p.id}>
                <strong>{p.code}</strong> · {p.status} · {p.supplier} ·{" "}
                {p.lines.length} línea(s)
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Movimientos recientes
          </p>
          <ul className="mt-1 space-y-1 text-xs">
            {movements.slice(0, 6).map((m) => (
              <li key={m.id}>
                {m.delta > 0 ? "+" : ""}
                {m.delta} · {m.reason} · {m.created_at.slice(0, 16)}
              </li>
            ))}
            {movements.length === 0 ? (
              <li className="text-zinc-500">Sin movimientos aún.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </AdminCard>
  );
}
