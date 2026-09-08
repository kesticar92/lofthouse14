"use client";

import { cn } from "@/lib/cn";

/** Estados async reutilizables en páginas admin nuevas (loading / empty / error). */
export function AdminAsyncState({
  loading,
  error,
  empty,
  emptyMessage = "Sin datos todavía.",
  loadingMessage = "Cargando…",
  onRetry,
  children,
  className,
}: {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
  className?: string;
}) {
  if (loading) {
    return (
      <p
        className={cn(
          "animate-pulse text-sm text-zinc-500 dark:text-zinc-400",
          className,
        )}
      >
        {loadingMessage}
      </p>
    );
  }
  if (error) {
    return (
      <div
        className={cn(
          "rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-900 dark:text-red-100",
          className,
        )}
      >
        <p>{error}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 text-xs font-semibold underline"
          >
            Reintentar
          </button>
        ) : null}
      </div>
    );
  }
  if (empty) {
    return (
      <p
        className={cn(
          "text-sm text-zinc-500 dark:text-zinc-400",
          className,
        )}
      >
        {emptyMessage}
      </p>
    );
  }
  return <>{children}</>;
}
