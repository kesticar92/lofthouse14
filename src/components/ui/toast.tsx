// =============================================================================
// src/components/ui/toast.tsx
// -----------------------------------------------------------------------------
// Sistema de toasts (notificaciones temporales) inspirado en sonner / react-hot.
//
// Uso:
//
//     // Envuelve el árbol (una vez):
//     <ToastProvider>{children}</ToastProvider>
//
//     // En cualquier componente cliente:
//     const toast = useToast();
//     toast.success("Cotización guardada");
//     toast.error("No se pudo guardar", { description: err.message });
//     toast.info("Sincronizando…");
//     toast.warning("Calendario sin actualizar hace 2 días");
//
//     // Toast persistente hasta que el usuario lo cierre:
//     toast.error("Falló subida", { duration: Infinity });
//
//     // Toast con acción inline:
//     toast.success("Inventario guardado", {
//       action: { label: "Ver", onClick: () => router.push("/admin/inventario") },
//     });
//
// El provider es responsable de renderizar la cola en una región aria-live.
// =============================================================================
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

export type ToastVariant = "success" | "error" | "info" | "warning";

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastOptions = {
  description?: string;
  duration?: number;
  action?: ToastAction;
};

export type ToastItem = {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration: number;
  action?: ToastAction;
  createdAt: number;
};

type ToastContextValue = {
  show: (variant: ToastVariant, title: string, opts?: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  success: (title: string, opts?: ToastOptions) => string;
  error: (title: string, opts?: ToastOptions) => string;
  info: (title: string, opts?: ToastOptions) => string;
  warning: (title: string, opts?: ToastOptions) => string;
};

const ToastCtx = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 4500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const dismiss = useCallback((id: string) => {
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const show = useCallback(
    (variant: ToastVariant, title: string, opts?: ToastOptions): string => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const duration = opts?.duration ?? DEFAULT_DURATION_MS;
      const item: ToastItem = {
        id,
        variant,
        title,
        description: opts?.description,
        duration,
        action: opts?.action,
        createdAt: Date.now(),
      };
      setItems((prev) => [...prev, item]);
      if (Number.isFinite(duration) && duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timersRef.current.set(id, timer);
      }
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      dismiss,
      dismissAll: () => {
        timersRef.current.forEach((t) => clearTimeout(t));
        timersRef.current.clear();
        setItems([]);
      },
      success: (title, opts) => show("success", title, opts),
      error: (title, opts) => show("error", title, opts),
      info: (title, opts) => show("info", title, opts),
      warning: (title, opts) => show("warning", title, opts),
    }),
    [show, dismiss],
  );

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastCtx.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de <ToastProvider>");
  }
  return ctx;
}

function ToastViewport({
  items,
  onDismiss,
}: {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:bottom-4 sm:right-4 sm:left-auto sm:items-end"
    >
      {items.map((t) => (
        <ToastRow key={t.id} item={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

const variantClasses: Record<ToastVariant, { container: string; icon: string }> = {
  success: {
    container: "border-emerald-500/30 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-950/80 dark:text-emerald-100",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  error: {
    container: "border-red-500/30 bg-red-50 text-red-900 dark:border-red-400/30 dark:bg-red-950/80 dark:text-red-100",
    icon: "text-red-600 dark:text-red-400",
  },
  info: {
    container: "border-sky-500/30 bg-sky-50 text-sky-900 dark:border-sky-400/30 dark:bg-sky-950/80 dark:text-sky-100",
    icon: "text-sky-600 dark:text-sky-400",
  },
  warning: {
    container: "border-amber-500/30 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/80 dark:text-amber-100",
    icon: "text-amber-600 dark:text-amber-400",
  },
};

const variantIcon: Record<ToastVariant, string> = {
  success: "✓",
  error: "!",
  info: "i",
  warning: "▲",
};

function ToastRow({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const classes = variantClasses[item.variant];
  return (
    <div
      role={item.variant === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur",
        classes.container,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/40 font-bold dark:bg-black/30",
          classes.icon,
        )}
      >
        {variantIcon[item.variant]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">{item.title}</p>
        {item.description && (
          <p className="mt-1 text-xs opacity-90">{item.description}</p>
        )}
        {item.action && (
          <button
            type="button"
            onClick={() => {
              item.action?.onClick();
              onDismiss(item.id);
            }}
            className="mt-2 text-xs font-semibold uppercase tracking-wider underline underline-offset-2 hover:opacity-80"
          >
            {item.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={() => onDismiss(item.id)}
        className="ml-1 shrink-0 rounded-full p-1 text-current opacity-60 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <path
            d="M3 3l8 8M11 3l-8 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
