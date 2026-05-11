import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
import { Hero } from "@/components/sections/hero";
import { ValueProps } from "@/components/sections/value-props";
import { Audiences } from "@/components/sections/audiences";
import { Lofts } from "@/components/sections/lofts";
import { Experiences } from "@/components/sections/experiences";
import { BookingSteps } from "@/components/sections/booking-steps";
import { Gallery } from "@/components/sections/gallery";
import { Location } from "@/components/sections/location";
import { Testimonials } from "@/components/sections/testimonials";
import { Contact } from "@/components/sections/contact";
import { Upsell } from "@/components/sections/upsell";
import { SiteFooter } from "@/components/sections/site-footer";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[length:40px_40px] bg-grid-fade opacity-[0.35] dark:bg-grid-fade-dark dark:opacity-20" />
      <Header />
      <main>
        <Hero />
        <Audiences />
        <ValueProps />
        <Lofts />
        <Experiences />
        <BookingSteps />
        <Gallery />
        <Location />
        <Testimonials />
        <Contact />
        <Upsell />
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}
