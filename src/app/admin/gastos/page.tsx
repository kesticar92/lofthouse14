"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useConfirm, useToast } from "@/components/ui";
import type { ExpenseFileRow, ExpenseListRow } from "@/features/expenses/types";
import {
  useCreateExpenseMutation,
  useExpenseDetail,
  useExpensesList,
  useRemoveExpenseMutation,
  useRetryExpenseDriveMutation,
} from "@/features/expenses/hooks";
import { NewExpenseForm } from "@/features/expenses/components/new-expense-form";
import { ExpensesTable } from "@/features/expenses/components/expenses-table";
import { ExpenseDetailModal } from "@/features/expenses/components/expense-detail-modal";
import { useRequireAdminModule } from "@/hooks/useRequireAdminModule";

export default function AdminGastosPage() {
  const { ready } = useRequireAdminModule();
  const confirm = useConfirm();
  const toast = useToast();

  const expensesQuery = useExpensesList(60);
  const expenses = expensesQuery.data ?? [];
  const listLoading = expensesQuery.isPending || expensesQuery.isFetching;

  const [detailId, setDetailId] = useState<string | null>(null);
  const detailQuery = useExpenseDetail(detailId);

  const createMut = useCreateExpenseMutation();
  const removeMut = useRemoveExpenseMutation();
  const retryMut = useRetryExpenseDriveMutation();

  const busy = createMut.isPending || removeMut.isPending || retryMut.isPending;

  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [vendorName, setVendorName] = useState("");
  const [category, setCategory] = useState("OTRO");
  const [paymentMethod, setPaymentMethod] = useState("Transferencia ACH");
  const [responsible, setResponsible] = useState("LOFTHOUSE");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [fileQueue, setFileQueue] = useState<File[]>([]);

  useEffect(() => {
    if (!detailId || !detailQuery.isError) return;
    const err = detailQuery.error;
    toast.error("No se pudo cargar el detalle", {
      description: err instanceof Error ? err.message : String(err),
    });
    setDetailId(null);
  }, [detailId, detailQuery.isError, detailQuery.error, toast]);

  function openDetail(id: string) {
    setDetailId(id);
  }

  function addFilesFromList(list: FileList | File[]) {
    const next: File[] = [...fileQueue];
    if (Array.isArray(list)) {
      for (const f of list) next.push(f);
    } else {
      for (let i = 0; i < list.length; i++) {
        const f = list.item(i);
        if (f) next.push(f);
      }
    }
    setFileQueue(next);
  }

  function removeQueuedFile(f: File) {
    setFileQueue((q) => q.filter((x) => x !== f));
  }

  async function submitExpense() {
    const amt = Number(amount.replace(",", "."));
    if (!Number.isFinite(amt) || amt < 0) {
      toast.warning("Monto inválido.");
      return;
    }
    try {
      const { sheet } = await createMut.mutateAsync({
        fields: {
          amount: amt,
          expense_date: expenseDate,
          vendor_name: vendorName,
          category,
          description,
          notes,
          payment_method: paymentMethod,
          responsible,
        },
        files: fileQueue,
      });

      if (sheet.error) {
        toast.warning("Gasto guardado, pero Google Sheets falló", {
          description: sheet.error,
        });
      } else {
        toast.success(
          "Gasto registrado.",
          sheet.appended
            ? {
                description:
                  "Fila añadida en la hoja GASTOS (pestaña AAAA-MM). Comprobantes en Drive.",
              }
            : sheet.skipped === "sheet_not_configured"
              ? {
                  description:
                    "Sin ID de spreadsheet en servidor: solo Supabase + Drive.",
                }
              : undefined,
        );
      }

      setAmount("");
      setVendorName("");
      setCategory("OTRO");
      setPaymentMethod("Transferencia ACH");
      setResponsible("LOFTHOUSE");
      setDescription("");
      setNotes("");
      setFileQueue([]);
    } catch (e) {
      toast.error("No se pudo guardar el gasto", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  }

  async function retryDrive(fileId: string) {
    try {
      await retryMut.mutateAsync(fileId);
      toast.success("Reintento de backup en Drive enviado.");
    } catch (e) {
      toast.error("No se pudo reintentar el backup", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  }

  async function deleteExpense(id: string) {
    const ok = await confirm({
      title: "¿Eliminar este gasto?",
      description:
        "Se borrarán también los archivos cargados en Supabase Storage. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await removeMut.mutateAsync(id);
      setDetailId(null);
      toast.success("Gasto eliminado.");
    } catch (e) {
      toast.error("No se pudo eliminar el gasto", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const detailExpense: ExpenseListRow | null =
    detailQuery.data?.expense ?? null;
  const detailFiles: ExpenseFileRow[] = detailQuery.data?.files ?? [];
  const detailLoading =
    Boolean(detailId) &&
    (detailQuery.isPending || (detailQuery.isFetching && !detailQuery.data));

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
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Gastos
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-600 dark:text-zinc-300">
            Los archivos se guardan en Supabase; copia en{" "}
            <strong>Google Drive</strong> (carpeta &quot;Comprobantes&quot; →
            subcarpeta <code className="text-xs">AAAA-MM</code>) y se añade una
            fila en la hoja <strong>GASTOS</strong> (pestaña del mismo mes) si
            configuraste la API y el ID del spreadsheet.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <NewExpenseForm
            amount={amount}
            setAmount={setAmount}
            expenseDate={expenseDate}
            setExpenseDate={setExpenseDate}
            vendorName={vendorName}
            setVendorName={setVendorName}
            category={category}
            setCategory={setCategory}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            responsible={responsible}
            setResponsible={setResponsible}
            description={description}
            setDescription={setDescription}
            notes={notes}
            setNotes={setNotes}
            fileQueue={fileQueue}
            addFiles={addFilesFromList}
            removeFile={removeQueuedFile}
            busy={busy}
            onSubmit={() => void submitExpense()}
          />
          <ExpensesTable
            expenses={expenses}
            loading={listLoading}
            onOpen={(id) => openDetail(id)}
          />
        </div>
      </div>

      <ExpenseDetailModal
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        expense={detailExpense}
        files={detailFiles}
        loading={detailLoading}
        busy={busy}
        onRetryDrive={(id) => void retryDrive(id)}
        onDelete={(id) => void deleteExpense(id)}
      />
    </AdminShell>
  );
}
