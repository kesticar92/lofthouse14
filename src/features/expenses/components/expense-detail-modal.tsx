// =============================================================================
// src/features/expenses/components/expense-detail-modal.tsx
// -----------------------------------------------------------------------------
// Modal con el detalle de un gasto (campos + archivos + status Drive).
// Usa el componente `Modal` del UI kit por accesibilidad (ESC, focus trap).
// =============================================================================
"use client";

import { Modal } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ExpenseFileRow, ExpenseListRow } from "../types";
import { driveStatusLabel, fmtMoney } from "../format";

export type ExpenseDetailModalProps = {
  open: boolean;
  onClose: () => void;
  expense: ExpenseListRow | null;
  files: ExpenseFileRow[];
  loading: boolean;
  busy: boolean;
  onRetryDrive: (fileId: string) => void;
  onDelete: (id: string) => void;
};

export function ExpenseDetailModal({
  open,
  onClose,
  expense,
  files,
  loading,
  busy,
  onRetryDrive,
  onDelete,
}: ExpenseDetailModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Detalle del gasto" size="lg">
      <Modal.Body>
        {loading ? (
          <p className="text-sm text-zinc-500">Cargando…</p>
        ) : expense ? (
          <div className="space-y-4 text-sm">
            <p>
              <strong>
                {fmtMoney(Number(expense.amount), expense.currency)}
              </strong>{" "}
              · {expense.expense_date}
            </p>
            <p className="text-zinc-600 dark:text-zinc-300">
              {expense.vendor_name || "Sin proveedor"} ·{" "}
              {expense.category || "Sin categoría"}
            </p>
            {expense.description ? <p>{expense.description}</p> : null}
            {expense.notes ? (
              <p className="text-xs text-zinc-500">{expense.notes}</p>
            ) : null}
            {expense.gastos_sheet_last_error ? (
              <p className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-900 dark:text-amber-200">
                <strong>Sheets:</strong> {expense.gastos_sheet_last_error}
              </p>
            ) : null}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-zinc-500">
                Archivos
              </p>
              <ul className="space-y-2">
                {files.map((f) => (
                  <li
                    key={f.id}
                    className="rounded-lg border border-black/10 p-2 dark:border-white/10"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{f.original_filename}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                          f.drive_backup_status === "success" &&
                            "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
                          f.drive_backup_status === "failed" &&
                            "bg-rose-500/15 text-rose-800 dark:text-rose-200",
                          f.drive_backup_status === "pending" &&
                            "bg-amber-500/15 text-amber-900 dark:text-amber-200",
                        )}
                      >
                        {driveStatusLabel(f.drive_backup_status)}
                      </span>
                    </div>
                    {f.drive_last_error ? (
                      <p className="mt-1 text-[11px] text-rose-700 dark:text-rose-300">
                        {f.drive_last_error}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {f.signed_url && f.mime_type?.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.signed_url}
                          alt=""
                          className="max-h-40 rounded-md border border-black/10 object-contain dark:border-white/10"
                        />
                      ) : f.signed_url ? (
                        <a
                          href={f.signed_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-amber-800 underline dark:text-amber-400"
                        >
                          Descargar / ver (firma temporal)
                        </a>
                      ) : null}
                      {f.drive_url ? (
                        <a
                          href={f.drive_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-black/10 px-2 py-1 text-[10px] font-semibold uppercase dark:border-white/10"
                        >
                          Ver en Drive
                        </a>
                      ) : null}
                      {f.drive_backup_status === "failed" ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onRetryDrive(f.id)}
                          className="rounded-full bg-zinc-900 px-2 py-1 text-[10px] font-semibold uppercase text-white disabled:opacity-50 dark:bg-amber-500 dark:text-zinc-900"
                        >
                          Reenviar a Drive
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={() => onDelete(expense.id)}
              className="text-xs font-semibold text-rose-700 underline dark:text-rose-400"
            >
              Eliminar gasto
            </button>
          </div>
        ) : null}
      </Modal.Body>
    </Modal>
  );
}
