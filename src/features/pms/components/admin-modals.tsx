"use client";

import type { ReactNode } from "react";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-black/10 bg-[#f2f0eb] p-5 shadow-2xl dark:border-white/10 dark:bg-[#1a1814]"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            className="rounded-full px-2 py-1 text-xl leading-none text-zinc-500 hover:bg-black/5 dark:hover:bg-white/10"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
