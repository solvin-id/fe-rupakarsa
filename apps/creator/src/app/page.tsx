import type { Metadata } from "next";

import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { FinalCta } from "@/components/landing/FinalCta";
import { Hero } from "@/components/landing/Hero";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { Marquee } from "@/components/landing/Marquee";
import { Pricing } from "@/components/landing/Pricing";
import { Showcase } from "@/components/landing/Showcase";
import { Testimonial } from "@/components/landing/Testimonial";
import { Workflow } from "@/components/landing/Workflow";

export const metadata: Metadata = {
  title: "Rupakarsa Creator — Dari karsa menjadi karya",
  description:
    "Ruang produksi visual berbasis AI untuk tim kreator. Kelola folder proyek, susun plan sinematik, eksekusi render, dan pantau token dalam satu workspace.",
};

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Marquee />
      <LandingNav />
      <main>
        <Hero />
        <FeatureGrid />
        <Showcase />
        <Workflow />
        <Pricing />
        <Testimonial />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
