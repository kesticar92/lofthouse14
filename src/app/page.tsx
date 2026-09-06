import { Header } from "@/components/layout/header";
import { ShareBar } from "@/components/layout/share-bar";
import { Hero } from "@/components/sections/hero";
import { Lofts } from "@/components/sections/lofts";
import { Location } from "@/components/sections/location";
import { SiteFooter } from "@/components/sections/site-footer";
import TestimonialsUsage from "@/components/sections/testimonialUsage";
import { FaqSection } from "@/components/sections/faq";
import { Gallery } from "@/components/sections/gallery";
import { SocialWall } from "@/components/sections/socialWall";
import { Audiences } from "@/components/sections/audiences";
import { ValueProps } from "@/components/sections/value-props";
import { StickyBookingBar } from "@/components/layout/booking-bar";
import { GuidedReservation } from "@/components/sections/guided-reservation";
import { aggregateReviews, homeExtraJsonLd } from "@/lib/seo";
import { JsonLdGraph } from "@/components/layout/json-ld";

export default function Home() {
  const reviews = aggregateReviews();
  return (
    <>
      <JsonLdGraph items={homeExtraJsonLd()} />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[length:40px_40px] bg-grid-fade opacity-[0.35] dark:bg-grid-fade-dark dark:opacity-20" />
      <Header />
      <main>
        <Hero
          ratingValue={reviews.ratingValue}
          reviewCount={reviews.reviewCount}
        />
        {/* Un solo buscador: visible en el hero y sticky al bajar */}
        <StickyBookingBar />
        <Audiences />
        <ValueProps />
        <Lofts />
        <TestimonialsUsage variant="home" />
        <GuidedReservation />
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
