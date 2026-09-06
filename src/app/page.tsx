import { Header } from "@/components/layout/header";
import { ShareBar } from "@/components/layout/share-bar";
import { StickyBookingBar } from "@/components/layout/sticky-booking-bar";
import { Hero } from "@/components/sections/hero";
import { Lofts } from "@/components/sections/lofts";
import { Location } from "@/components/sections/location";
import { SiteFooter } from "@/components/sections/site-footer";
import { GuidedReservation } from "@/components/sections/guided-reservation";
import TestimonialsUsage from "@/components/sections/testimonialUsage";
import { FaqSection } from "@/components/sections/faq";
import { Gallery } from "@/components/sections/gallery";
import { SocialWall } from "@/components/sections/socialWall";

/**
 * Embudo auditado: hero → galería → lofts → reseñas → reserva → ubicación → FAQ.
 */
export default function Home() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[length:40px_40px] bg-grid-fade opacity-[0.35] dark:bg-grid-fade-dark dark:opacity-20" />
      <Header />
      <StickyBookingBar />
      <main>
        <Hero />
        <Gallery />
        <Lofts />
        <TestimonialsUsage />
        <GuidedReservation />
        <Location />
        <FaqSection />
        <SocialWall />
      </main>
      <SiteFooter />
      <ShareBar />
    </>
  );
}
