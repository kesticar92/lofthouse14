// =============================================================================
// src/features/expenses/components/expenses-table.tsx
// -----------------------------------------------------------------------------
// Tabla con los últimos gastos. Una fila por gasto. Click → abre el detalle.
// =============================================================================
"use client";

import { AdminCard } from "@/components/admin/admin-shell";
import type { ExpenseListRow } from "../types";
import { fmtMoney } from "../format";

export type ExpensesTableProps = {
  expenses: ExpenseListRow[];
  loading: boolean;
  onOpen: (id: string) => void;
};

export function ExpensesTable({
  expenses,
  loading,
  onOpen,
}: ExpensesTableProps) {
  return (
    <AdminCard
      title="Últimos gastos"
      subtitle="Clic en una fila para ver archivos y Drive."
    >
      {loading ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : expenses.length === 0 ? (
        <p className="text-sm text-zinc-500">Aún no hay gastos.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-xs uppercase text-zinc-500 dark:border-white/10">
                <th className="py-2 pr-2">Fecha</th>
                <th className="py-2 pr-2">Monto</th>
                <th className="py-2 pr-2">Proveedor</th>
                <th className="py-2">Archivos</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((ex) => {
                const files = ex.expense_files ?? [];
                const anyFail = files.some(
                  (f) => f.drive_backup_status === "failed",
                );
                return (
                  <tr
                    key={ex.id}
                    className="cursor-pointer border-b border-black/5 hover:bg-black/[0.03] dark:border-white/5 dark:hover:bg-white/[0.04]"
                    onClick={() => onOpen(ex.id)}
                  >
                    <td className="py-2 pr-2">{ex.expense_date}</td>
                    <td className="py-2 pr-2 font-medium">
                      {fmtMoney(Number(ex.amount), ex.currency)}
                    </td>
                    <td className="py-2 pr-2">
                      {ex.vendor_name || "—"}
                      {anyFail ? (
                        <span
                          className="ml-1 text-rose-600"
                          title="Backup Drive"
                        >
                          ⚠
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 text-zinc-500">{files.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminCard>
  );
}
