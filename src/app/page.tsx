import { Header } from "@/components/layout/header";
import { ShareBar } from "@/components/layout/share-bar";
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
 * Embudo → reseñas → ubicación → FAQ → galería y redes al cierre.
 */
export default function Home() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[length:40px_40px] bg-grid-fade opacity-[0.35] dark:bg-grid-fade-dark dark:opacity-20" />
      <Header />
      <main>
        <Hero />
        <GuidedReservation />
        <Lofts />
        <TestimonialsUsage />
        <Location />
        <FaqSection />
        <Gallery />
        <SocialWall />
      </main>
      <SiteFooter />
      <ShareBar />
    </>
  );
}
