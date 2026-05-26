// =============================================================================
// src/features/expenses/components/new-expense-form.tsx
// -----------------------------------------------------------------------------
// Formulario para registrar un gasto con archivos (drag&drop + cámara).
// Todo el estado (campos, cola de archivos, previews) es manejado por el
// padre — este componente es presentational + handlers nombrados.
// =============================================================================
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdminCard } from "@/components/admin/admin-shell";
import { cn } from "@/lib/cn";
import { GASTOS_SHEET_CATEGORIES } from "@/lib/expenses/gastos-sheet-constants";

const PAYMENT_METHODS = [
  "Transferencia ACH",
  "Efectivo",
  "Tarjeta débito",
  "Tarjeta crédito",
  "Nequi",
  "Daviplata",
  "PSE",
  "Otro",
] as const;

export type NewExpenseFormProps = {
  amount: string;
  setAmount: (v: string) => void;
  expenseDate: string;
  setExpenseDate: (v: string) => void;
  vendorName: string;
  setVendorName: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  responsible: string;
  setResponsible: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  fileQueue: File[];
  addFiles: (list: FileList | File[]) => void;
  removeFile: (f: File) => void;
  busy: boolean;
  onSubmit: () => void;
};

export function NewExpenseForm(props: NewExpenseFormProps) {
  const {
    amount,
    setAmount,
    expenseDate,
    setExpenseDate,
    vendorName,
    setVendorName,
    category,
    setCategory,
    paymentMethod,
    setPaymentMethod,
    responsible,
    setResponsible,
    description,
    setDescription,
    notes,
    setNotes,
    fileQueue,
    addFiles,
    removeFile,
    busy,
    onSubmit,
  } = props;
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const previewUrls = useMemo(() => {
    const m = new Map<File, string>();
    for (const f of fileQueue) m.set(f, URL.createObjectURL(f));
    return m;
  }, [fileQueue]);

  useEffect(() => {
    return () => {
      for (const u of previewUrls.values()) URL.revokeObjectURL(u);
    };
  }, [previewUrls]);

  return (
    <AdminCard
      title="Registrar gasto"
      subtitle="Los comprobantes van a Drive (carpeta mensual) y se registra una fila en tu hoja GASTOS si está configurada."
    >
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
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
          Categoría (misma lista que GASTOS.xlsx)
          <select
            required
            className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {GASTOS_SHEET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          Método de pago
          <select
            className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          Responsable (columna en Sheets)
          <input
            className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
            value={responsible}
            onChange={(e) => setResponsible(e.target.value)}
            placeholder="LOFTHOUSE"
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
                addFiles(e.dataTransfer.files);
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
              if (e.target.files?.length) addFiles(e.target.files);
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
              if (e.target.files?.length) addFiles(e.target.files);
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
                      removeFile(f);
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
  );
}
