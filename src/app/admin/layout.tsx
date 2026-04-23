import type { Metadata } from "next";

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
  return <>{children}</>;
}
