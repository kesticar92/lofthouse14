"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { cn } from "@/lib/cn";

type ExpenseFileRow = {
  id: string;
  drive_backup_status: string;
  drive_url: string | null;
  original_filename: string;
  mime_type?: string;
  signed_url?: string | null;
  drive_last_error?: string | null;
};

type ExpenseListRow = {
  id: string;
  amount: number;
  currency: string;
  category: string;
  vendor_name: string;
  description: string;
  expense_date: string;
  notes: string;
  expense_files?: Pick<
    ExpenseFileRow,
    "id" | "drive_backup_status" | "drive_url" | "original_filename"
  >[];
};

function fmtMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: currency || "COP",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function driveStatusLabel(s: string) {
  if (s === "success") return "Drive OK";
  if (s === "failed") return "Drive falló";
  return "Pendiente";
}

function fileQueuePreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

export default function AdminGastosPage() {
  const [expenses, setExpenses] = useState<ExpenseListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [vendorName, setVendorName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailExpense, setDetailExpense] = useState<ExpenseListRow | null>(
    null,
  );
  const [detailFiles, setDetailFiles] = useState<ExpenseFileRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const previewUrls = useMemo(() => {
    const m = new Map<File, string>();
    for (const f of fileQueue) {
      m.set(f, fileQueuePreviewUrl(f));
    }
    return m;
  }, [fileQueue]);

  useEffect(() => {
    return () => {
      for (const u of previewUrls.values()) URL.revokeObjectURL(u);
    };
  }, [previewUrls]);

  const refresh = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/expenses?limit=60", {
        credentials: "include",
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? res.statusText);
      setExpenses(j.expenses ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function openDetail(id: string) {
    setDetailId(id);
    setDetailLoading(true);
    setDetailExpense(null);
    setDetailFiles([]);
    try {
      const res = await fetch(`/api/admin/expenses/${id}`, {
        credentials: "include",
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? res.statusText);
      setDetailExpense(j.expense);
      setDetailFiles(j.files ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setDetailId(null);
    } finally {
      setDetailLoading(false);
    }
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
    const u = previewUrls.get(f);
    if (u) URL.revokeObjectURL(u);
    setFileQueue((q) => q.filter((x) => x !== f));
  }

  async function submitExpense(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    const amt = Number(amount.replace(",", "."));
    if (!Number.isFinite(amt) || amt < 0) {
      setErr("Monto inválido.");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          expense_date: expenseDate,
          vendor_name: vendorName,
          category,
          description,
          notes,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? res.statusText);
      const expenseId = j.expense?.id as string;
      if (!expenseId) throw new Error("Sin id de gasto");

      if (fileQueue.length > 0) {
        const fd = new FormData();
        for (const f of fileQueue) fd.append("files", f);
        const up = await fetch(`/api/admin/expenses/${expenseId}/files`, {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        const uj = await up.json();
        if (!up.ok) throw new Error(uj.error ?? up.statusText);
      }

      setMsg("Gasto registrado.");
      setAmount("");
      setVendorName("");
      setCategory("");
      setDescription("");
      setNotes("");
      setFileQueue([]);
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function retryDrive(fileId: string) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/admin/expenses/files/${fileId}/retry-drive`,
        { method: "POST", credentials: "include" },
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? res.statusText);
      setMsg("Reintento de backup en Drive enviado.");
      if (detailId) await openDetail(detailId);
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function deleteExpense(id: string) {
    if (!confirm("¿Eliminar este gasto y sus archivos en Storage?")) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/expenses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error((j as { error?: string }).error ?? res.statusText);
      setDetailId(null);
      setMsg("Gasto eliminado.");
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Gastos
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-600 dark:text-zinc-300">
            Registra gastos con facturas o fotos. Los archivos se guardan en
            Supabase Storage y se respaldan en Google Drive cuando está
            configurado el service account.
          </p>
        </div>

        {(msg || err) && (
          <div
            className={cn(
              "rounded-xl border px-3 py-2 text-sm",
              err
                ? "border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-100"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
            )}
          >
            {err || msg}
            <button
              type="button"
              className="ml-2 text-xs underline"
              onClick={() => {
                setErr(null);
                setMsg(null);
              }}
            >
              Cerrar
            </button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <AdminCard
            title="Registrar gasto"
            subtitle="Arrastra archivos o usa el botón. Puedes adjuntar varios por gasto."
          >
            <form className="space-y-3" onSubmit={(e) => void submitExpense(e)}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Fecha
                  <input
                    required
                    type="date"
                    className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                  />
                </label>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Monto (COP)
                  <input
                    required
                    inputMode="decimal"
                    className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ej. 125000"
                  />
                </label>
              </div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Proveedor / comercio
                <input
                  className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                />
              </label>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Categoría
                <input
                  className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Servicios, mercancía, mantenimiento…"
                />
              </label>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Descripción
                <input
                  className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Notas internas
                <textarea
                  className="mt-1 min-h-[56px] w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>

              <div>
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Facturas / fotos
                </p>
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files?.length) {
                      addFilesFromList(e.dataTransfer.files);
                    }
                  }}
                  className={cn(
                    "mt-1 flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-3 py-6 text-center text-sm transition",
                    dragOver
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-black/15 bg-black/[0.02] dark:border-white/15 dark:bg-white/[0.03]",
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="text-zinc-600 dark:text-zinc-300">
                    Suelta aquí o haz clic · galería / escritorio
                  </span>
                  <span className="mt-2 text-[11px] text-zinc-500">
                    Imágenes, PDF (máx. 50 MB por archivo según bucket)
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length)
                      addFilesFromList(e.target.files);
                    e.target.value = "";
                  }}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length)
                      addFilesFromList(e.target.files);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  className="mt-2 rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider dark:border-white/10"
                >
                  Cámara (móvil)
                </button>
              </div>

              {fileQueue.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {fileQueue.map((f) => {
                    const url = previewUrls.get(f);
                    const isImg = f.type.startsWith("image/");
                    return (
                      <li
                        key={`${f.name}-${f.size}-${f.lastModified}`}
                        className="relative h-20 w-20 overflow-hidden rounded-lg border border-black/10 dark:border-white/10"
                      >
                        {isImg && url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center p-1 text-center text-[10px] text-zinc-600">
                            {f.name}
                          </div>
                        )}
                        <button
                          type="button"
                          aria-label="Quitar"
                          className="absolute right-0.5 top-0.5 rounded bg-black/60 px-1 text-xs text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeQueuedFile(f);
                          }}
                        >
                          ×
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-zinc-900 py-2.5 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50 dark:bg-amber-500 dark:text-zinc-900"
              >
                Guardar gasto
              </button>
            </form>
          </AdminCard>

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
                          onClick={() => void openDetail(ex.id)}
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
        </div>
      </div>

      {detailId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-black/10 bg-[#f2f0eb] p-5 shadow-2xl dark:border-white/10 dark:bg-[#1a1814]"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Detalle del gasto
              </h2>
              <button
                type="button"
                className="rounded-full px-2 py-1 text-xl text-zinc-500 hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => setDetailId(null)}
              >
                ×
              </button>
            </div>
            {detailLoading ? (
              <p className="text-sm text-zinc-500">Cargando…</p>
            ) : detailExpense ? (
              <div className="space-y-4 text-sm">
                <p>
                  <strong>
                    {fmtMoney(
                      Number(detailExpense.amount),
                      detailExpense.currency,
                    )}
                  </strong>{" "}
                  · {detailExpense.expense_date}
                </p>
                <p className="text-zinc-600 dark:text-zinc-300">
                  {detailExpense.vendor_name || "Sin proveedor"} ·{" "}
                  {detailExpense.category || "Sin categoría"}
                </p>
                {detailExpense.description ? (
                  <p>{detailExpense.description}</p>
                ) : null}
                {detailExpense.notes ? (
                  <p className="text-xs text-zinc-500">{detailExpense.notes}</p>
                ) : null}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-zinc-500">
                    Archivos
                  </p>
                  <ul className="space-y-2">
                    {detailFiles.map((f) => (
                      <li
                        key={f.id}
                        className="rounded-lg border border-black/10 p-2 dark:border-white/10"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">
                            {f.original_filename}
                          </span>
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
                              onClick={() => void retryDrive(f.id)}
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
                  onClick={() => void deleteExpense(detailExpense.id)}
                  className="text-xs font-semibold text-rose-700 underline dark:text-rose-400"
                >
                  Eliminar gasto
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
