"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { AdminAsyncState } from "@/components/admin/admin-async-state";
import { formatCOP } from "@/lib/pricing";

type Folio = {
  reservation_code: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  nights: number;
  charges: Array<{
    id: string;
    kind: string;
    label: string;
    amount: number;
    quantity: number;
  }>;
  payments: Array<{
    id: string;
    method: string;
    amount: number;
    notes?: string;
    created_at: string;
  }>;
  balance: { charges_total: number; payments_total: number; balance: number };
  deposit?: {
    percent?: number;
    amount?: number;
    paid?: number;
    status?: string;
    due?: number;
    deposit_due?: number;
  } | null;
  draft_invoice?: {
    id: string;
    total: number;
    tax_estimate: number;
    status: string;
    message: string;
  } | null;
};

export default function AdminFolioDetailPage() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code ?? "").toUpperCase();
  const [folio, setFolio] = useState<Folio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chargeLabel, setChargeLabel] = useState("Minibar");
  const [chargeAmount, setChargeAmount] = useState(25000);
  const [payAmount, setPayAmount] = useState(100000);
  const [payMethod, setPayMethod] = useState<"cash" | "transfer">("cash");
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/folio?code=${encodeURIComponent(code)}`,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? `Error ${res.status}`);
        setFolio(null);
        return;
      }
      setFolio(data.folio ?? null);
    } catch {
      setError("No se pudo cargar el folio.");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void load();
  }, [load]);

  async function postAction(body: Record<string, unknown>) {
    setMsg(null);
    const res = await fetch("/api/admin/folio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservation_code: code, ...body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg((data as { error?: string }).error ?? "Error");
      return;
    }
    setFolio(data.folio ?? null);
    setMsg("OK");
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Folio · cuenta huésped
          </p>
          <h1 className="font-display text-3xl tracking-wide font-mono">
            {code}
          </h1>
          {folio ? (
            <p className="mt-1 text-sm text-zinc-600">
              {folio.guest_name} · {folio.check_in} → {folio.check_out} ·{" "}
              {folio.nights} noche(s)
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/folio"
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold"
          >
            ← Folios
          </Link>
          <Link
            href="/admin/pagos"
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold"
          >
            Pagos
          </Link>
        </div>
      </div>

      <AdminAsyncState
        loading={loading}
        error={error}
        empty={!loading && !error && !folio}
        emptyMessage="Folio no encontrado."
        onRetry={() => void load()}
      >
        {folio ? (
          <>
            <AdminCard
              title="Saldo"
              subtitle={`Cargos ${formatCOP(folio.balance.charges_total)} · Pagos ${formatCOP(folio.balance.payments_total)}`}
            >
              <p className="font-display text-4xl">
                {formatCOP(folio.balance.balance)}
              </p>
              {folio.deposit ? (
                <div className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                  <p>
                    Depósito ({folio.deposit.percent ?? 30}%):{" "}
                    <strong>
                      {formatCOP(folio.deposit.amount ?? 0)}
                    </strong>
                    {folio.deposit.status
                      ? ` · ${folio.deposit.status}`
                      : ""}
                  </p>
                  <p>
                    Pagado: {formatCOP(folio.deposit.paid ?? 0)} · Balance due:{" "}
                    {formatCOP(folio.deposit.due ?? folio.balance.balance)}
                  </p>
                </div>
              ) : null}
              {msg ? (
                <p className="mt-2 text-xs text-zinc-500">{msg}</p>
              ) : null}
            </AdminCard>

            <AdminCard title="Cargos" subtitle="Noches, extras y adicionales">
              <ul className="space-y-1 text-sm">
                {folio.charges.map((c) => (
                  <li
                    key={c.id}
                    className="flex justify-between gap-3 border-b border-black/5 py-1.5 dark:border-white/5"
                  >
                    <span>
                      <span className="text-[10px] uppercase text-zinc-400">
                        {c.kind}
                      </span>{" "}
                      {c.label}
                      {c.quantity > 1 ? ` ×${c.quantity}` : ""}
                    </span>
                    <span className="font-medium">
                      {formatCOP(c.amount * c.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </AdminCard>

            <AdminCard title="Pagos" subtitle="Efectivo / transferencia / stub">
              <ul className="mb-4 space-y-1 text-sm">
                {folio.payments.length === 0 ? (
                  <li className="text-zinc-500">Sin pagos registrados.</li>
                ) : (
                  folio.payments.map((p) => (
                    <li
                      key={p.id}
                      className="flex justify-between gap-3 border-b border-black/5 py-1.5 dark:border-white/5"
                    >
                      <span>
                        {p.method}
                        {p.notes ? (
                          <span className="text-xs text-zinc-500">
                            {" "}
                            · {p.notes}
                          </span>
                        ) : null}
                      </span>
                      <span className="font-medium">{formatCOP(p.amount)}</span>
                    </li>
                  ))
                )}
              </ul>
            </AdminCard>

            <AdminCard title="Acciones">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Agregar cargo
                  </p>
                  <input
                    value={chargeLabel}
                    onChange={(e) => setChargeLabel(e.target.value)}
                    className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  />
                  <input
                    type="number"
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(Number(e.target.value))}
                    className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      void postAction({
                        action: "add_charge",
                        label: chargeLabel,
                        amount: chargeAmount,
                        kind: "addon",
                      })
                    }
                    className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900"
                  >
                    Agregar cargo
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Registrar pago
                  </p>
                  <select
                    value={payMethod}
                    onChange={(e) =>
                      setPayMethod(e.target.value as "cash" | "transfer")
                    }
                    className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="transfer">Transferencia</option>
                  </select>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      void postAction({
                        action: "register_payment",
                        amount: payAmount,
                        method: payMethod,
                      })
                    }
                    className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900"
                  >
                    Registrar pago
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Liquidar
                  </p>
                  <p className="text-xs text-zinc-500">
                    Marca saldo en 0 con ajuste administrativo.
                  </p>
                  <button
                    type="button"
                    onClick={() => void postAction({ action: "settle" })}
                    className="rounded-full border border-amber-800/40 bg-amber-900/10 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-300"
                  >
                    Marcar saldo 0
                  </button>
                </div>
                <div className="space-y-2 sm:col-span-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Facturación electrónica (CO)
                  </p>
                  <p className="text-xs text-zinc-500">
                    Genera borrador local desde el folio. DIAN / proveedor
                    autorizado requiere EINVOICE_API_KEY.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      void postAction({ action: "issue_draft_invoice" })
                    }
                    className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold"
                  >
                    Generar factura (borrador)
                  </button>
                  {folio.draft_invoice ? (
                    <p className="text-xs text-zinc-600">
                      Borrador {folio.draft_invoice.status}:{" "}
                      {formatCOP(folio.draft_invoice.total)} (IVA est.{" "}
                      {formatCOP(folio.draft_invoice.tax_estimate)}) —{" "}
                      {folio.draft_invoice.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </AdminCard>
          </>
        ) : null}
      </AdminAsyncState>
    </AdminShell>
  );
}
