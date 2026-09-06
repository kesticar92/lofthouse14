import { Header } from "@/components/layout/header";
import { SiteFooter } from "@/components/sections/site-footer";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
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
      <WhatsAppFab />
    </>
  );
}
