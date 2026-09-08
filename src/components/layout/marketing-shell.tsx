import { Header } from "@/components/layout/header";
import { SiteFooter } from "@/components/sections/site-footer";
import { ShareBar } from "@/components/layout/share-bar";
import { GuestBottomNav } from "@/components/guest/guest-bottom-nav";

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
      <main className="min-h-[70vh] pt-[7.5rem] pb-20 lg:pt-20 md:pb-0">
        {children}
      </main>
      <SiteFooter />
      <ShareBar />
      <GuestBottomNav />
    </>
  );
}
