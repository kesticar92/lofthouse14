// =============================================================================
// src/components/ui/index.ts
// -----------------------------------------------------------------------------
// Barrel para el UI kit del admin. Importa desde aquí para evitar paths
// frágiles:
//
//   import { Button, Modal, useToast, useConfirm } from "@/components/ui";
// =============================================================================
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from "./button";
export { Modal, type ModalProps, type ModalSize } from "./modal";
export {
  ToastProvider,
  useToast,
  type ToastVariant,
  type ToastOptions,
  type ToastAction,
} from "./toast";
export {
  ConfirmProvider,
  useConfirm,
  type ConfirmOptions,
  type ConfirmVariant,
} from "./confirm-dialog";
