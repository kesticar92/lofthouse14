// =============================================================================
// src/components/ui/confirm-dialog.tsx
// -----------------------------------------------------------------------------
// Reemplazo accesible de `window.confirm()`. Devuelve una promesa que resuelve
// `true` si el usuario confirma o `false` si cancela (o cierra el modal).
//
// Uso:
//
//     const confirm = useConfirm();
//
//     async function handleDelete() {
//       const ok = await confirm({
//         title: "¿Eliminar esta cotización?",
//         description: "Esta acción no se puede deshacer.",
//         confirmLabel: "Eliminar",
//         variant: "danger",
//       });
//       if (!ok) return;
//       await deleteMutation.mutateAsync(id);
//     }
//
// `ConfirmProvider` mantiene la cola (max 1 visible a la vez — confirmaciones
// son modales bloqueantes por definición). Si se llama otra vez antes de
// resolver la anterior, la nueva queda en cola.
// =============================================================================
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "./button";
import { Modal } from "./modal";

export type ConfirmVariant = "default" | "danger";

export type ConfirmOptions = {
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
};

type Pending = {
  options: ConfirmOptions;
  resolve: (ok: boolean) => void;
};

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmCtx = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Pending[]>([]);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  const current = queue[0];

  const ask = useCallback<ConfirmContextValue>((options) => {
    return new Promise<boolean>((resolve) => {
      setQueue((prev) => [...prev, { options, resolve }]);
    });
  }, []);

  const resolveCurrent = useCallback((ok: boolean) => {
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      const [head, ...rest] = prev;
      head.resolve(ok);
      return rest;
    });
  }, []);

  const value = useMemo(() => ask, [ask]);

  return (
    <ConfirmCtx.Provider value={value}>
      {children}
      {current && (
        <Modal
          open
          onClose={() => resolveCurrent(false)}
          size="sm"
          initialFocusRef={confirmBtnRef}
          title={current.options.title}
          description={current.options.description}
        >
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => resolveCurrent(false)}
              size="md"
            >
              {current.options.cancelLabel ?? "Cancelar"}
            </Button>
            <Button
              ref={confirmBtnRef}
              variant={
                current.options.variant === "danger" ? "danger" : "primary"
              }
              onClick={() => resolveCurrent(true)}
              size="md"
              data-autofocus
            >
              {current.options.confirmLabel ?? "Aceptar"}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </ConfirmCtx.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) {
    throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>");
  }
  return ctx;
}
