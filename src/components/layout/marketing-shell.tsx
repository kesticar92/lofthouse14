import { Header } from "@/components/layout/header";
import { SiteFooter } from "@/components/sections/site-footer";
import { ShareBar } from "@/components/layout/share-bar";
import { StickyBookingBar } from "@/components/layout/sticky-booking-bar";

export function MarketingShell({
  children,
  showSticky = true,
}: {
  children: React.ReactNode;
  showSticky?: boolean;
}) {
  return (
    <>
      <Header />
      {showSticky ? <StickyBookingBar /> : null}
      <main className="min-h-[70vh]">{children}</main>
      <SiteFooter />
      <ShareBar />
    </>
  );
}
