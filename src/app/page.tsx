import { Header } from "@/components/layout/header";
import { ShareBar } from "@/components/layout/share-bar";
import { Hero } from "@/components/sections/hero";
import { ValueProps } from "@/components/sections/value-props";

import { Lofts } from "@/components/sections/lofts";
import { Experiences } from "@/components/sections/experiences";

import { Location } from "@/components/sections/location";

import { Contact } from "@/components/sections/contact";

import { SiteFooter } from "@/components/sections/site-footer";
import { RadialOrbitalTimelineDemo } from "../components/sections/radialTimeline";
import TestimonialsUsage from "../components/sections/testimonialUsage";
import { SocialWall } from "../components/sections/socialWall";
import { FaqSection } from "@/components/sections/faq";

export default function Home() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[length:40px_40px] bg-grid-fade opacity-[0.35] dark:bg-grid-fade-dark dark:opacity-20" />
      <Header />
      <main>
        <Hero />
        <Lofts />
        <Experiences />
        <ValueProps />
        <RadialOrbitalTimelineDemo />
        <TestimonialsUsage />
        <SocialWall />
        <Location />
        <FaqSection />
        <Contact />
      </main>
      <SiteFooter />
      <ShareBar />
    </>
  );
}
