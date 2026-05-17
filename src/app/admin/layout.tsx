import type { Metadata } from "next";
import { QueryProvider } from "@/components/providers/query-provider";
import { ConfirmProvider, ToastProvider } from "@/components/ui";

export const metadata: Metadata = {
  title: "Panel administrador",
  description:
    "Área privada de LOFTHOUSE 14: cotizaciones, inventario y registro de aseos diarios.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <ToastProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </ToastProvider>
    </QueryProvider>
  );
}
