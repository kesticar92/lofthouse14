// =============================================================================
// src/components/ui/modal.tsx
// -----------------------------------------------------------------------------
// Modal accesible con:
//   - role="dialog" + aria-modal
//   - Cierre con tecla ESC
//   - Cierre con click en backdrop (opcional, `dismissOnBackdrop`)
//   - Focus trap básico (Tab/Shift+Tab quedan dentro del modal)
//   - Devuelve foco al elemento que lo abrió cuando se cierra
//   - Bloquea scroll del body mientras está abierto
//
// Se renderiza como portal a `document.body` para no chocar con z-index del
// contenido. SSR-safe (no hace nada hasta montar en cliente).
//
// Uso:
//
//   <Modal
//     open={open}
//     onClose={() => setOpen(false)}
//     title="¿Eliminar reserva?"
//     description="No se puede deshacer."
//   >
//     <Modal.Body>...</Modal.Body>
//     <Modal.Footer>
//       <Button variant="secondary" onClick={() => setOpen(false)}>
//         Cancelar
//       </Button>
//       <Button variant="danger" onClick={confirm}>Eliminar</Button>
//     </Modal.Footer>
//   </Modal>
// =============================================================================
"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

export type ModalSize = "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  size?: ModalSize;
  dismissOnBackdrop?: boolean;
  dismissOnEsc?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  children: ReactNode;
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  dismissOnBackdrop = true,
  dismissOnEsc = true,
  initialFocusRef,
  className,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousActive = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    previousActive.current =
      typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTarget =
      initialFocusRef?.current ??
      dialogRef.current?.querySelector<HTMLElement>(
        "[data-autofocus],button,[href],input,select,textarea,[tabindex]:not([tabindex='-1'])",
      ) ??
      dialogRef.current;
    focusTarget?.focus?.();

    return () => {
      document.body.style.overflow = prevOverflow;
      previousActive.current?.focus?.();
    };
  }, [open, initialFocusRef]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape" && dismissOnEsc) {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [dismissOnEsc, onClose],
  );

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      onKeyDown={handleKeyDown}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => dismissOnBackdrop && onClose()}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl outline-none dark:border-white/10 dark:bg-zinc-900",
          sizeClasses[size],
          className,
        )}
      >
        {(title || description) && (
          <header className="border-b border-black/5 px-5 py-4 dark:border-white/5">
            {title && (
              <h2
                id={titleId}
                className="font-display text-lg tracking-wide text-zinc-900 dark:text-zinc-50"
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                id={descId}
                className="mt-1 text-sm text-zinc-600 dark:text-zinc-300"
              >
                {description}
              </p>
            )}
          </header>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

Modal.Body = function ModalBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "px-5 py-4 text-sm text-zinc-700 dark:text-zinc-200",
        className,
      )}
    >
      {children}
    </div>
  );
};

Modal.Footer = function ModalFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <footer
      className={cn(
        "flex flex-col-reverse gap-2 border-t border-black/5 bg-black/[0.02] px-5 py-3 sm:flex-row sm:justify-end dark:border-white/5 dark:bg-white/[0.02]",
        className,
      )}
    >
      {children}
    </footer>
  );
};
