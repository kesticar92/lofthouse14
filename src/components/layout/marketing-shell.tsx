import { Header } from "@/components/layout/header";
import { SiteFooter } from "@/components/sections/site-footer";
import { ShareBar } from "@/components/layout/share-bar";

export function MarketingShell({
  children,
}: {
  children: React.ReactNode;
  /** @deprecated La reserva vive en el header único de escritorio. */
  showSticky?: boolean;
}) {
  return (
    <>
      <Header />
      <main className="min-h-[70vh]">{children}</main>
      <SiteFooter />
      <ShareBar />
    </>
  );
}
